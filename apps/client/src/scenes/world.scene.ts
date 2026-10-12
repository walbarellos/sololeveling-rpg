import Phaser from "phaser";
import {
  ClientEvents,
  WORLD_NPCS,
  type Direction,
  type NpcDefinition,
  type TileCoord
} from "@rpg/contracts";
import {
  TEX,
  CLASS_PORTRAIT,
  addVignette,
  biomeAt,
  BIOME_NAMES,
  BIOME_ACCENT,
  buildTextures,
  enemyTextureKey,
  preloadAssets
} from "../assets";
import { battleController } from "../battle/battle.controller";
import { socket } from "../network/game-socket";
import { gameState, getMyPlayer } from "../state/game-state";
import { hudController } from "../ui/hud.controller";
import { npcController } from "../ui/npc.controller";
import { buildDungeonCanvas } from "../terrain";

const STEP_INTERVAL_MS = 215; // > STEP_COOLDOWN_MS do servidor (200) para não tomar TOO_FAST
const PREFERS_REDUCED_MOTION = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export interface WorldPortal {
  x: number;
  y: number;
  label: string;
  zoneId: "ENTER_GATE_D" | "RETURN_GATE_E";
  minRank?: "E" | "D" | "C" | "B" | "A" | "S";
  color: string;
  tint?: number;
}

type Goal =
  | { type: "enemy"; id: string }
  | { type: "tile"; x: number; y: number }
  | { type: "portal"; portal: WorldPortal };

const DIR_VECTORS: ReadonlyArray<{ dir: Direction; dx: number; dy: number }> = [
  { dir: "UP", dx: 0, dy: -1 },
  { dir: "DOWN", dx: 0, dy: 1 },
  { dir: "LEFT", dx: -1, dy: 0 },
  { dir: "RIGHT", dx: 1, dy: 0 }
];

const chebyshev = (a: TileCoord, b: TileCoord) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const manhattan = (a: TileCoord, b: TileCoord) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export class WorldScene extends Phaser.Scene {
  private playerGraphics = new Map<string, Phaser.GameObjects.Container>();
  private enemyGraphics = new Map<string, Phaser.GameObjects.Container>();
  private terrainImage: Phaser.GameObjects.Image | null = null;
  private terrainKey = "";
  private overlay!: Phaser.GameObjects.Graphics;
  private hint!: Phaser.GameObjects.Text;
  private zoneBanner!: Phaser.GameObjects.Text;
  private currentZone = "";
  private lastInputTime = 0;
  private lastBattleRequestAt = 0;
  private goal: Goal | null = null;
  private awaiting: { sequence: number; at: number } | null = null;
  private hover: TileCoord | null = null;
  private isFollowingPlayer = false;

  private portalObjects: Phaser.GameObjects.GameObject[] = [];
  private npcObjects: Phaser.GameObjects.Container[] = [];
  private currentPortals: WorldPortal[] = [];
  private lastPortalStepAt = 0;

  constructor() {
    super("world");
  }

  preload() {
    preloadAssets(this);
  }

  create() {
    const ts = gameState.tileSize || 48;
    buildTextures(this, ts);
    this.textures.each((tex: Phaser.Textures.Texture) => {
      if (tex.key.startsWith("token_")) tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }, this);

    const worldW = gameState.gridWidth * ts;
    const worldH = gameState.gridHeight * ts;

    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setRoundPixels(true);

    this.rebuildTerrain();
    this.rebuildWorldObjects();

    if (!PREFERS_REDUCED_MOTION) {
      this.add
        .particles(0, 0, TEX.mote, {
          x: { min: 0, max: worldW },
          y: { min: 0, max: worldH },
          lifespan: 6000,
          speedY: { min: -14, max: -4 },
          speedX: { min: -6, max: 6 },
          scale: { start: 0.7, end: 0 },
          alpha: { start: 0.7, end: 0 },
          frequency: 240,
          quantity: 1
        })
        .setDepth(800);
    }

    this.overlay = this.add.graphics().setDepth(700);
    this.hint = this.add
      .text(0, 0, "[E] Combater", {
        fontSize: "12px",
        fontStyle: "bold",
        color: "#fde68a",
        backgroundColor: "#7f1d1dcc",
        padding: { x: 6, y: 3 }
      })
      .setOrigin(0.5, 1)
      .setDepth(950)
      .setVisible(false);

    this.zoneBanner = this.add
      .text(945, 12, "SANTUÁRIO DO GATE", {
        fontSize: "11px",
        fontFamily: "'Rajdhani', sans-serif",
        fontStyle: "bold",
        color: "#38bdf8",
        backgroundColor: "#050b14ea",
        padding: { x: 8, y: 4 }
      })
      .setOrigin(1, 0)
      .setDepth(980)
      .setScrollFactor(0);

    addVignette(this, 960, 576).setScrollFactor(0);

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (gameState.currentBattle) return;
      this.handlePointerClick(pointer);
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      const ts = gameState.tileSize || 48;
      const t = {
        x: Math.floor(pointer.worldX / ts),
        y: Math.floor(pointer.worldY / ts)
      };
      this.hover = this.inBounds(t.x, t.y) ? t : null;
      const overEnemy =
        this.hover && gameState.world.enemies.some((e) => e.alive && e.position.x === t.x && e.position.y === t.y);
      this.input.setDefaultCursor(overEnemy ? "crosshair" : "default");
    });
  }

  public updateWorldBounds(gw: number, gh: number, ts: number) {
    gameState.gridWidth = gw;
    gameState.gridHeight = gh;
    gameState.tileSize = ts;
    this.terrainKey = "";
    this.isFollowingPlayer = false;
    if (this.cameras?.main) {
      this.cameras.main.setBounds(0, 0, gw * ts, gh * ts);
    }
    if (this.sys?.isActive()) {
      this.rebuildTerrain();
      this.rebuildWorldObjects();
    }
  }

  public rebuildTerrain() {
    const ts = gameState.tileSize || 48;
    const key = `${gameState.worldId}:${gameState.gridWidth}x${gameState.gridHeight}:${gameState.obstacles.length}:${ts}`;
    if (this.terrainKey === key) return;
    this.terrainKey = key;

    const texKey = `dungeon_terrain_${gameState.worldId}`;
    const canvas = buildDungeonCanvas(
      gameState.gridWidth,
      gameState.gridHeight,
      ts,
      gameState.obstacles,
      gameState.style
    );

    if (this.textures.exists(texKey)) {
      this.textures.remove(texKey);
    }
    this.textures.addCanvas(texKey, canvas);

    if (!this.terrainImage) {
      this.terrainImage = this.add.image(0, 0, texKey).setOrigin(0, 0).setDepth(0);
    } else {
      this.terrainImage.setTexture(texKey);
    }
  }

  public rebuildWorldObjects() {
    for (const obj of this.portalObjects) obj.destroy();
    this.portalObjects = [];
    for (const cont of this.npcObjects) cont.destroy();
    this.npcObjects = [];

    const ts = gameState.tileSize || 48;
    if (gameState.worldId === "GATE_D") {
      this.currentPortals = [
        { x: 3, y: 4, label: "PORTAL SANTUÁRIO", zoneId: "RETURN_GATE_E", color: "#7dd3fc" },
        { x: 29, y: 10, label: "PORTAL SANTUÁRIO", zoneId: "RETURN_GATE_E", color: "#fb7185", tint: 0xf43f5e }
      ];
    } else {
      this.currentPortals = [
        { x: 2, y: 2, label: "GATE E", zoneId: "RETURN_GATE_E", color: "#7dd3fc" },
        { x: 5, y: 2, label: "GATE D", zoneId: "ENTER_GATE_D", minRank: "D", color: "#c4b5fd", tint: 0xa78bfa },
        { x: 42, y: 12, label: "RETORNO SANTUÁRIO", zoneId: "RETURN_GATE_E", color: "#7dd3fc" }
      ];

      // Spawn dos NPCs no Santuário Seguro do Gate E
      for (const npc of WORLD_NPCS) {
        const px = npc.position.x * ts + ts / 2;
        const py = npc.position.y * ts + ts / 2;
        const tokenKey = TEX.token(npc.portrait as any);

        const cont = this.add.container(px, py).setDepth(20);
        const spr = this.add.image(0, 0, tokenKey).setDisplaySize(ts * 0.85, ts * 0.85);

        const badge = this.add
          .text(0, -ts * 0.65, `[NPC] ${npc.name}`, {
            fontSize: "9px",
            fontFamily: "'Rajdhani', sans-serif",
            fontStyle: "bold",
            color: "#38bdf8",
            backgroundColor: "#030712dd",
            padding: { x: 4, y: 1 }
          })
          .setOrigin(0.5);

        cont.add([spr, badge]);

        if (!PREFERS_REDUCED_MOTION) {
          this.tweens.add({
            targets: spr,
            y: { from: -1, to: 1 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        }
        this.npcObjects.push(cont);
      }
    }

    // Criação dos portais visuais
    for (const portal of this.currentPortals) {
      const px = portal.x * ts + ts / 2;
      const py = portal.y * ts + ts / 2;
      const spr = this.add
        .image(px, py, TEX.portal)
        .setDepth(1)
        .setAlpha(0.95)
        .setDisplaySize(ts, ts);
      if (portal.tint) spr.setTint(portal.tint);

      const label = this.add
        .text(px, py + ts * 0.5, portal.label, {
          fontSize: "9px",
          color: portal.color,
          stroke: "#020617",
          strokeThickness: 3
        })
        .setOrigin(0.5)
        .setDepth(1);

      this.portalObjects.push(spr, label);

      if (!PREFERS_REDUCED_MOTION) {
        this.tweens.add({ targets: spr, angle: 360, duration: 9000, repeat: -1 });
        this.tweens.add({
          targets: spr,
          scale: { from: 0.94, to: 1.06 },
          yoyo: true,
          duration: 1400,
          repeat: -1,
          ease: "Sine.easeInOut"
        });
      }
    }
  }

  public adjacentPortals(): WorldPortal[] {
    const me = getMyPlayer();
    if (!me) return [];
    return this.currentPortals.filter((p) => chebyshev(me.position, p) <= 1);
  }

  public activatePortal(portal: WorldPortal) {
    const me = getMyPlayer();
    if (!me || me.inBattle || gameState.currentBattle) return;
    const now = Date.now();
    if (now - this.lastPortalStepAt < 1000) return;
    this.lastPortalStepAt = now;
    this.cancelPursuit();

    if (portal.minRank && portal.minRank === "D" && me.rank === "E") {
      hudController.setStatus("Acesso negado: Requer Rank D ou superior! Complete o exame com o Inspetor Baek.");
      return;
    }
    hudController.setStatus(`Sintonizando portal dimensional [${portal.label}]…`);
    socket.emit(ClientEvents.ZoneTeleportRequest, { zoneId: portal.zoneId });
  }

  private checkPlayerOnPortal() {
    const me = getMyPlayer();
    if (me && !me.inBattle && !gameState.currentBattle) {
      const standingPortal = this.currentPortals.find(
        (p) => p.x === me.position.x && p.y === me.position.y
      );
      if (standingPortal && Date.now() - this.lastPortalStepAt > 2000) {
        this.activatePortal(standingPortal);
      }
    }
  }

  private updateZoneDisplay(x: number, y: number) {
    if (!this.zoneBanner) return;
    if (gameState.worldId === "GATE_D") {
      const zoneName = x <= 10 ? "Átrio Carmesim" : x <= 22 ? "Galeria de Latão" : "Salão do Trono Carmesim";
      if (this.currentZone !== zoneName) {
        this.currentZone = zoneName;
        this.zoneBanner.setText(`${zoneName.toUpperCase()} · GATE RANK D`);
        this.zoneBanner.setColor("#f43f5e");
      }
      return;
    }
    const biomeIdx = biomeAt(x, y);
    const zoneName = BIOME_NAMES[biomeIdx] ?? "Masmorra";
    if (this.currentZone !== zoneName) {
      this.currentZone = zoneName;
      this.zoneBanner.setText(zoneName.toUpperCase());
      const accent = BIOME_ACCENT[biomeIdx] ?? "#38bdf8";
      this.zoneBanner.setColor(accent);
    }
  }

  private syncPlayers() {
    const ts = gameState.tileSize || 48;
    const aliveIds = new Set<string>();

    for (const p of gameState.world.players) {
      aliveIds.add(p.id);
      const isMe = p.id === gameState.myPlayerId;
      const targetPx = p.position.x * ts + ts / 2;
      const targetPy = p.position.y * ts + ts / 2;

      let c = this.playerGraphics.get(p.id);
      if (!c) {
        c = this.add.container(targetPx, targetPy).setDepth(isMe ? 30 : 20);

        const halo = this.add.circle(0, 0, ts * 0.44, 0x000000, 0.45);
        halo.setStrokeStyle(isMe ? 2 : 1, isMe ? 0x38bdf8 : 0x64748b, 0.9);

        const portraitKey = CLASS_PORTRAIT[p.hunterClass] ?? "healer";
        const tokKey = TEX.token(portraitKey);
        const texKey = this.textures.exists(tokKey) ? tokKey : TEX.token("healer");
        const icon = this.add.image(0, 0, texKey).setDisplaySize(ts * 0.8, ts * 0.8);

        const lbl = this.add
          .text(0, -ts * 0.62, `${isMe ? "Você" : p.name} · Lv ${p.level}`, {
            fontSize: "10px",
            fontFamily: "'Rajdhani', sans-serif",
            fontStyle: "bold",
            color: isMe ? "#7dd3fc" : "#cbd5e1",
            stroke: "#020617",
            strokeThickness: 3
          })
          .setOrigin(0.5);

        const hpBg = this.add.rectangle(0, -ts * 0.44, ts * 0.7, 3, 0x0f172a);
        const hpBar = this.add.rectangle(
          -ts * 0.35,
          -ts * 0.44,
          ts * 0.7,
          3,
          isMe ? 0x22c55e : 0x38bdf8
        );
        hpBar.setOrigin(0, 0.5);

        c.add([halo, icon, lbl, hpBg, hpBar]);
        c.setData("icon", icon);
        c.setData("halo", halo);
        c.setData("hpBar", hpBar);
        c.setData("lbl", lbl);
        c.setData("lastClass", p.hunterClass);
        this.playerGraphics.set(p.id, c);
      }

      if (c.getData("lastClass") !== p.hunterClass) {
        c.setData("lastClass", p.hunterClass);
        const portraitKey = CLASS_PORTRAIT[p.hunterClass] ?? "healer";
        const tokKey = TEX.token(portraitKey);
        const texKey = this.textures.exists(tokKey) ? tokKey : TEX.token("healer");
        (c.getData("icon") as Phaser.GameObjects.Image).setTexture(texKey);
      }

      const hpRatio = p.maxHp > 0 ? Math.max(0, Math.min(1, p.hp / p.maxHp)) : 0;
      const hpW = Math.round(ts * 0.7 * hpRatio);
      if (c.getData("lastHpW") !== hpW) {
        c.setData("lastHpW", hpW);
        (c.getData("hpBar") as Phaser.GameObjects.Rectangle).setSize(hpW, 3);
      }
      const lblText = `${isMe ? "Você" : p.name} · Lv ${p.level}`;
      if (c.getData("lastLblText") !== lblText) {
        c.setData("lastLblText", lblText);
        (c.getData("lbl") as Phaser.GameObjects.Text).setText(lblText);
      }

      if (PREFERS_REDUCED_MOTION) {
        c.setPosition(targetPx, targetPy);
      } else {
        const dist = Phaser.Math.Distance.Between(c.x, c.y, targetPx, targetPy);
        if (dist > ts * 2.5) {
          c.setPosition(targetPx, targetPy);
        } else if (dist > 1) {
          this.tweens.add({
            targets: c,
            x: targetPx,
            y: targetPy,
            duration: 140,
            ease: "Power2",
            overwrite: true
          });
        }
      }

      if (isMe) {
        this.updateZoneDisplay(p.position.x, p.position.y);
        const cam = this.cameras.main;
        if (!this.isFollowingPlayer) {
          cam.centerOn(targetPx, targetPy);
          cam.startFollow(c, true, 0.08, 0.08);
          this.isFollowingPlayer = true;
        }
      }
    }

    for (const [id, c] of this.playerGraphics.entries()) {
      if (!aliveIds.has(id)) {
        c.destroy();
        this.playerGraphics.delete(id);
      }
    }
  }

  private syncEnemies() {
    const ts = gameState.tileSize || 48;
    const aliveIds = new Set<string>();

    for (const e of gameState.world.enemies) {
      if (!e.alive) continue;
      aliveIds.add(e.id);

      const targetPx = e.position.x * ts + ts / 2;
      const targetPy = e.position.y * ts + ts / 2;

      let c = this.enemyGraphics.get(e.id);
      if (!c) {
        c = this.add.container(targetPx, targetPy).setDepth(15);
        const tex = enemyTextureKey(e.name);
        const spr = this.add.image(0, 0, tex).setDisplaySize(ts * 0.8, ts * 0.8);

        const lbl = this.add
          .text(0, -ts * 0.62, `[E] ${e.name} · Lv ${e.level}`, {
            fontSize: "9px",
            fontFamily: "'Rajdhani', sans-serif",
            fontStyle: "bold",
            color: "#f87171",
            stroke: "#020617",
            strokeThickness: 3
          })
          .setOrigin(0.5);

        const hpBg = this.add.rectangle(0, -ts * 0.44, ts * 0.6, 2, 0x0f172a);
        const hpBar = this.add.rectangle(-ts * 0.3, -ts * 0.44, ts * 0.6, 2, 0xef4444);
        hpBar.setOrigin(0, 0.5);

        c.add([spr, lbl, hpBg, hpBar]);
        c.setData("hpBar", hpBar);
        c.setData("spr", spr);

        if (!PREFERS_REDUCED_MOTION) {
          this.tweens.add({
            targets: spr,
            y: { from: -1, to: 1 },
            duration: 800 + Math.random() * 400,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        }

        this.enemyGraphics.set(e.id, c);
      }

      const hpRatio = e.maxHp > 0 ? Math.max(0, Math.min(1, e.hp / e.maxHp)) : 0;
      const hpW = Math.round(ts * 0.6 * hpRatio);
      if (c.getData("lastHpW") !== hpW) {
        c.setData("lastHpW", hpW);
        (c.getData("hpBar") as Phaser.GameObjects.Rectangle).setSize(hpW, 2);
      }
      c.setPosition(targetPx, targetPy);
    }

    for (const [id, c] of this.enemyGraphics.entries()) {
      if (!aliveIds.has(id)) {
        if (!PREFERS_REDUCED_MOTION) {
          this.tweens.add({
            targets: c,
            alpha: 0,
            scale: 0.4,
            duration: 350,
            onComplete: () => c.destroy()
          });
        } else {
          c.destroy();
        }
        this.enemyGraphics.delete(id);
      }
    }
  }

  private drawOverlay(time: number) {
    this.overlay.clear();
    const ts = gameState.tileSize || 48;
    const me = getMyPlayer();

    // Hover na célula
    if (this.hover && this.inBounds(this.hover.x, this.hover.y)) {
      this.overlay.lineStyle(1, 0x38bdf8, 0.6);
      this.overlay.strokeRect(
        this.hover.x * ts,
        this.hover.y * ts,
        ts,
        ts
      );
    }

    // Traçado do caminho até o alvo
    if (this.goal && me) {
      this.overlay.fillStyle(0xf59e0b, 0.2);
      let gx: number | undefined;
      let gy: number | undefined;
      if (this.goal.type === "tile") {
        gx = this.goal.x;
        gy = this.goal.y;
      } else if (this.goal.type === "portal") {
        gx = this.goal.portal.x;
        gy = this.goal.portal.y;
      } else {
        const enemy = gameState.world.enemies.find((e) => e.id === (this.goal as any).id);
        gx = enemy?.position.x;
        gy = enemy?.position.y;
      }
      if (gx !== undefined && gy !== undefined) {
        this.overlay.fillRect(gx * ts, gy * ts, ts, ts);
      }
    }

    // Destaque de NPCs adjacentes
    const npcs = me && !me.inBattle && !gameState.currentBattle ? this.adjacentNpcs() : [];
    if (npcs.length) {
      const target = npcs[0];
      const hintText = `[E] Falar com ${target.name}`;
      if (this.hint.text !== hintText) {
        this.hint.setText(hintText);
      }
      this.hint
        .setPosition(
          target.position.x * ts + ts / 2,
          target.position.y * ts - 4
        )
        .setVisible(true);
      return;
    }

    // Destaque de Portais adjacentes
    const portals = me && !me.inBattle && !gameState.currentBattle ? this.adjacentPortals() : [];
    if (portals.length) {
      const portal = portals[0];
      const hintText = `[E] Entrar em ${portal.label}`;
      if (this.hint.text !== hintText) {
        this.hint.setText(hintText);
      }
      this.hint
        .setPosition(
          portal.x * ts + ts / 2,
          portal.y * ts - 4
        )
        .setVisible(true);
      return;
    }

    // Destaque de monstros adjacentes
    const adjacent = me && !me.inBattle && !gameState.currentBattle ? this.adjacentEnemies() : [];
    if (adjacent.length) {
      const pulseAlpha = 0.4 + 0.3 * Math.sin(time / 140);
      this.overlay.lineStyle(2, 0xfacc15, pulseAlpha);
      for (const e of adjacent) {
        this.overlay.strokeRect(
          e.position.x * ts + 2,
          e.position.y * ts + 2,
          ts - 4,
          ts - 4
        );
      }
      const target = adjacent[0];
      const hintText = `[E] ${target.name}`;
      if (this.hint.text !== hintText) {
        this.hint.setText(hintText);
      }
      this.hint
        .setPosition(
          target.position.x * ts + ts / 2,
          target.position.y * ts - 4
        )
        .setVisible(true);
    } else {
      this.hint.setVisible(false);
    }
  }

  public handleKey(k: string) {
    if (gameState.currentBattle) return;
    if (k === "escape") {
      this.cancelPursuit();
      hudController.setStatus("Movimento automático cancelado.");
      return;
    }
    if (k === "e" || k === "enter" || k === " ") {
      this.interact();
      return;
    }
    const map: Record<string, Direction> = {
      arrowup: "UP", w: "UP", arrowdown: "DOWN", s: "DOWN",
      arrowleft: "LEFT", a: "LEFT", arrowright: "RIGHT", d: "RIGHT"
    };
    const dir = map[k];
    if (dir) {
      this.cancelPursuit();
      this.sendStep(dir);
    }
  }

  public cancelPursuit() {
    this.goal = null;
    this.awaiting = null;
  }

  public onServerError(code?: string) {
    if (code === "TOO_FAST") {
      this.awaiting = null;
      return;
    }
    if (code === "ALREADY_IN_BATTLE") {
      socket.emit(ClientEvents.SnapshotRequest);
    }
    if (this.goal) this.cancelPursuit();
  }

  public inBounds(x: number, y: number) {
    return x >= 0 && y >= 0 && x < gameState.gridWidth && y < gameState.gridHeight;
  }

  private sendStep(direction: Direction) {
    const now = Date.now();
    if (now - this.lastInputTime < STEP_INTERVAL_MS) return false;
    this.lastInputTime = now;
    const me = getMyPlayer();
    this.awaiting = me ? { sequence: me.sequence, at: now } : null;
    socket.emit(ClientEvents.StepRequest, { direction });
    return true;
  }

  public adjacentNpcs(): NpcDefinition[] {
    const me = getMyPlayer();
    if (!me) return [];
    return (WORLD_NPCS as NpcDefinition[])
      .filter((n) => chebyshev(me.position, n.position) <= 1)
      .sort((a, b) => manhattan(me.position, a.position) - manhattan(me.position, b.position));
  }

  public adjacentEnemies() {
    const me = getMyPlayer();
    if (!me) return [];
    return gameState.world.enemies
      .filter((e) => e.alive && chebyshev(me.position, e.position) <= 1)
      .sort((a, b) => manhattan(me.position, a.position) - manhattan(me.position, b.position));
  }

  private startBattleWith(enemy: { id: string; rank: string; name: string }) {
    const now = Date.now();
    if (now - this.lastBattleRequestAt < 500) return;
    this.lastBattleRequestAt = now;
    this.cancelPursuit();
    battleController.battleResultModal.classList.add("hidden");
    hudController.setStatus(`Iniciando confronto com [${enemy.rank}] ${enemy.name}…`);
    socket.emit(ClientEvents.StartBattleRequest, { targetEnemyId: enemy.id });
  }

  private interact() {
    const me = getMyPlayer();
    if (!me || me.inBattle) return;

    const npcs = this.adjacentNpcs();
    if (npcs.length) {
      npcController.openNpc(npcs[0]);
      return;
    }

    const portals = this.adjacentPortals();
    if (portals.length) {
      this.activatePortal(portals[0]);
      return;
    }

    const adjacent = this.adjacentEnemies();
    if (adjacent.length) {
      this.startBattleWith(adjacent[0]);
      return;
    }
    const nearest = gameState.world.enemies
      .filter((e) => e.alive)
      .sort((a, b) => manhattan(me.position, a.position) - manhattan(me.position, b.position))[0];
    if (!nearest) {
      hudController.setStatus("Nenhum monstro vivo no mapa.");
      return;
    }
    this.goal = { type: "enemy", id: nearest.id };
    hudController.setStatus(`Indo até [${nearest.rank}] ${nearest.name}… (Esc cancela)`);
  }

  private handlePointerClick(pointer: Phaser.Input.Pointer) {
    const ts = gameState.tileSize || 48;
    const tileX = Math.floor(pointer.worldX / ts);
    const tileY = Math.floor(pointer.worldY / ts);
    if (!this.inBounds(tileX, tileY)) return;
    const me = getMyPlayer();
    if (!me || me.inBattle) return;

    const clickedNpc = gameState.worldId === "GATE_E" ? WORLD_NPCS.find((n) => n.position.x === tileX && n.position.y === tileY) : null;
    if (clickedNpc) {
      if (chebyshev(me.position, clickedNpc.position) <= 1) {
        npcController.openNpc(clickedNpc);
      } else {
        this.goal = { type: "tile", x: clickedNpc.position.x, y: clickedNpc.position.y };
        hudController.setStatus(`Caminhando até [NPC] ${clickedNpc.name}… (Esc cancela)`);
      }
      return;
    }

    const clickedPortal = this.currentPortals.find((p) => p.x === tileX && p.y === tileY);
    if (clickedPortal) {
      if (chebyshev(me.position, clickedPortal) <= 1) {
        this.activatePortal(clickedPortal);
      } else {
        this.goal = { type: "portal", portal: clickedPortal };
        hudController.setStatus(`Caminhando até o portal [${clickedPortal.label}]… (Esc cancela)`);
      }
      return;
    }

    const clicked = gameState.world.enemies.find((e) => e.alive && e.position.x === tileX && e.position.y === tileY);
    if (clicked) {
      if (chebyshev(me.position, clicked.position) <= 1) {
        this.startBattleWith(clicked);
      } else {
        this.goal = { type: "enemy", id: clicked.id };
        hudController.setStatus(`Indo até [${clicked.rank}] ${clicked.name}… (Esc cancela)`);
      }
      return;
    }
    if (tileX === me.position.x && tileY === me.position.y) return;
    this.goal = { type: "tile", x: tileX, y: tileY };
  }

  private nextStepToward(from: TileCoord, isGoal: (x: number, y: number) => boolean, blocked: Set<string>): Direction | null {
    const key = (x: number, y: number) => `${x},${y}`;
    const queue: Array<{ x: number; y: number; first: Direction | null }> = [{ x: from.x, y: from.y, first: null }];
    const seen = new Set<string>([key(from.x, from.y)]);
    for (let i = 0; i < queue.length; i++) {
      const cur = queue[i];
      if (cur.first && isGoal(cur.x, cur.y)) return cur.first;
      for (const v of DIR_VECTORS) {
        const nx = cur.x + v.dx;
        const ny = cur.y + v.dy;
        if (!this.inBounds(nx, ny) || seen.has(key(nx, ny)) || blocked.has(key(nx, ny))) continue;
        seen.add(key(nx, ny));
        queue.push({ x: nx, y: ny, first: cur.first ?? v.dir });
      }
    }
    return null;
  }

  private runGoal(time: number) {
    const me = getMyPlayer();
    if (!this.goal || !me || me.inBattle || gameState.currentBattle) return;

    if (this.awaiting && (me.sequence !== this.awaiting.sequence || Date.now() - this.awaiting.at > 600)) {
      this.awaiting = null;
    }
    void time;

    const blocked = new Set<string>(gameState.obstacles.map((o) => `${o.x},${o.y}`));
    for (const e of gameState.world.enemies) if (e.alive) blocked.add(`${e.position.x},${e.position.y}`);

    if (this.goal.type === "enemy") {
      const goalId = this.goal.id;
      const enemy = gameState.world.enemies.find((e) => e.id === goalId);
      if (!enemy || !enemy.alive) return this.cancelPursuit();
      if (chebyshev(me.position, enemy.position) <= 1) {
        this.startBattleWith(enemy);
        return;
      }
      if (this.awaiting || Date.now() - this.lastInputTime < STEP_INTERVAL_MS) return;
      const dir = this.nextStepToward(me.position, (x, y) => chebyshev({ x, y }, enemy.position) <= 1, blocked);
      if (!dir) {
        hudController.setStatus("Sem caminho livre até o monstro.");
        return this.cancelPursuit();
      }
      this.sendStep(dir);
    } else if (this.goal.type === "portal") {
      const portal = this.goal.portal;
      if (chebyshev(me.position, portal) <= 1) {
        this.cancelPursuit();
        this.activatePortal(portal);
        return;
      }
      if (this.awaiting || Date.now() - this.lastInputTime < STEP_INTERVAL_MS) return;
      const dir = this.nextStepToward(me.position, (x, y) => chebyshev({ x, y }, portal) <= 1, blocked);
      if (!dir) {
        hudController.setStatus("Sem caminho livre até o portal.");
        return this.cancelPursuit();
      }
      this.sendStep(dir);
    } else {
      const { x: gx, y: gy } = this.goal;
      const targetNpc = WORLD_NPCS.find((n) => n.position.x === gx && n.position.y === gy);
      if (targetNpc && chebyshev(me.position, targetNpc.position) <= 1) {
        this.cancelPursuit();
        npcController.openNpc(targetNpc);
        return;
      }
      if (me.position.x === gx && me.position.y === gy) return this.cancelPursuit();
      if (this.awaiting || Date.now() - this.lastInputTime < STEP_INTERVAL_MS) return;
      if (blocked.has(`${gx},${gy}`) && !targetNpc) return this.cancelPursuit();
      const isTargetGoal = targetNpc
        ? (x: number, y: number) => chebyshev({ x, y }, targetNpc.position) <= 1
        : (x: number, y: number) => x === gx && y === gy;
      const dir = this.nextStepToward(me.position, isTargetGoal, blocked);
      if (!dir) return this.cancelPursuit();
      this.sendStep(dir);
    }
  }

  update(time: number) {
    this.rebuildTerrain();
    this.checkPlayerOnPortal();
    this.runGoal(time);
    this.syncPlayers();
    this.syncEnemies();
    this.drawOverlay(time);
  }
}
