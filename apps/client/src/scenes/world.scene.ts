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

const STEP_INTERVAL_MS = 215;
const PREFERS_REDUCED_MOTION = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

type Goal = { type: "enemy"; id: string } | { type: "tile"; x: number; y: number };

const DIR_VECTORS: ReadonlyArray<{ dir: Direction; dx: number; dy: number }> = [
  { dir: "UP", dx: 0, dy: -1 },
  { dir: "DOWN", dx: 0, dy: 1 },
  { dir: "LEFT", dx: -1, dy: 0 },
  { dir: "RIGHT", dx: 1, dy: 0 }
];

const chebyshev = (a: TileCoord, b: TileCoord) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

export class WorldScene extends Phaser.Scene {
  private playerGraphics = new Map<string, Phaser.GameObjects.Container>();
  private enemyGraphics = new Map<string, Phaser.GameObjects.Container>();
  private terrainRT: Phaser.GameObjects.RenderTexture | null = null;
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

  constructor() {
    super("world");
  }

  preload() {
    preloadAssets(this);
  }

  create() {
    buildTextures(this, gameState.tileSize);
    this.textures.each((tex: Phaser.Textures.Texture) => {
      if (tex.key.startsWith("token_")) tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }, this);

    const worldW = gameState.gridWidth * gameState.tileSize;
    const worldH = gameState.gridHeight * gameState.tileSize;

    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setRoundPixels(true);

    this.rebuildTerrain();

    // Portal do Gate Rank E (ponto de respawn) em (2,2)
    const portal = this.add
      .image(2 * gameState.tileSize + gameState.tileSize / 2, 2 * gameState.tileSize + gameState.tileSize / 2, TEX.portal)
      .setDepth(1)
      .setAlpha(0.9);
    this.add
      .text(portal.x, portal.y + gameState.tileSize * 0.5, "GATE E", {
        fontSize: "9px",
        color: "#7dd3fc",
        stroke: "#020617",
        strokeThickness: 3
      })
      .setOrigin(0.5)
      .setDepth(1);

    // Portal Rank D — Fenda da Aurora
    const portalD = this.add
      .image(5 * gameState.tileSize + gameState.tileSize / 2, 2 * gameState.tileSize + gameState.tileSize / 2, TEX.portal)
      .setDepth(1)
      .setAlpha(0.95)
      .setTint(0xa78bfa);
    this.add
      .text(portalD.x, portalD.y + gameState.tileSize * 0.5, "GATE D", {
        fontSize: "9px",
        color: "#c4b5fd",
        stroke: "#020617",
        strokeThickness: 3
      })
      .setOrigin(0.5)
      .setDepth(1);

    if (!PREFERS_REDUCED_MOTION) {
      this.tweens.add({ targets: portal, angle: 360, duration: 9000, repeat: -1 });
      this.tweens.add({
        targets: portal,
        scale: { from: 0.94, to: 1.06 },
        yoyo: true,
        duration: 1400,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
      this.tweens.add({ targets: portalD, angle: -360, duration: 11000, repeat: -1 });
      this.tweens.add({
        targets: portalD,
        scale: { from: 0.92, to: 1.08 },
        yoyo: true,
        duration: 1600,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
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

    for (const npc of WORLD_NPCS) {
      const px = npc.position.x * gameState.tileSize + gameState.tileSize / 2;
      const py = npc.position.y * gameState.tileSize + gameState.tileSize / 2;
      const tokenKey = TEX.token(npc.portrait as any);

      const cont = this.add.container(px, py).setDepth(20);
      const spr = this.add.image(0, 0, tokenKey).setDisplaySize(gameState.tileSize * 0.85, gameState.tileSize * 0.85);

      const badge = this.add
        .text(0, -gameState.tileSize * 0.65, `[NPC] ${npc.name}`, {
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
      .text(this.cameras.main.width - 12, 12, "SANTUÁRIO DO GATE", {
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
      const t = {
        x: Math.floor(pointer.worldX / gameState.tileSize),
        y: Math.floor(pointer.worldY / gameState.tileSize)
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
    if (this.cameras?.main) {
      this.cameras.main.setBounds(0, 0, gw * ts, gh * ts);
    }
  }

  public rebuildTerrain() {
    const key = `${gameState.gridWidth}x${gameState.gridHeight}:${gameState.obstacles.length}`;
    if (this.terrainKey === key) return;
    this.terrainKey = key;

    const worldW = gameState.gridWidth * gameState.tileSize;
    const worldH = gameState.gridHeight * gameState.tileSize;

    if (!this.terrainRT) {
      this.terrainRT = this.add.renderTexture(0, 0, worldW, worldH).setOrigin(0, 0).setDepth(0);
    } else {
      this.terrainRT.clear();
      this.terrainRT.resize(worldW, worldH);
    }

    const obsSet = new Set(gameState.obstacles.map((o) => `${o.x},${o.y}`));
    const isObs = (x: number, y: number) => obsSet.has(`${x},${y}`);

    this.terrainRT.beginDraw();
    for (let y = 0; y < gameState.gridHeight; y++) {
      for (let x = 0; x < gameState.gridWidth; x++) {
        const px = x * gameState.tileSize;
        const py = y * gameState.tileSize;
        const biomeIdx = biomeAt(x, y);
        const tileTex = TEX.floor(biomeIdx);
        this.terrainRT.batchDrawFrame(tileTex, undefined, px, py);

        if (isObs(x, y)) {
          const hasAbove = isObs(x, y - 1);
          const hasBelow = isObs(x, y + 1);
          const hasLeft = isObs(x - 1, y);
          const hasRight = isObs(x + 1, y);

          let wallTex: string = TEX.wall;
          if (!hasAbove && hasBelow) wallTex = TEX.wallTop;
          else if (hasAbove && hasBelow) wallTex = TEX.wallMid;
          else if (hasAbove && !hasBelow) wallTex = TEX.wallBase;
          else if (!hasAbove && !hasBelow && !hasLeft && !hasRight) wallTex = TEX.pillar;

          this.terrainRT.batchDrawFrame(wallTex, undefined, px, py);
        }
      }
    }
    this.terrainRT.endDraw();
  }

  private updateZoneDisplay(x: number, y: number) {
    if (!this.zoneBanner) return;
    const biomeIdx = biomeAt(x, y);
    const zoneName = BIOME_NAMES[biomeIdx] ?? "Masmorra";
    if (this.currentZone !== zoneName) {
      this.currentZone = zoneName;
      this.zoneBanner.setText(zoneName.toUpperCase());
      const accent = BIOME_ACCENT[biomeIdx] ?? "#38bdf8";
      this.zoneBanner.setColor(accent);
    }
  }

  // --- remaining methods (syncPlayers, syncEnemies, drawOverlay, handleKey, etc.)
  // kept functional; full implementation restored from local backup in subsequent patch if needed

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
    socket.emit(ClientEvents.StepRequest, { direction });
    return true;
  }

  private interact() {
    const me = getMyPlayer();
    if (!me || me.inBattle || gameState.currentBattle) return;
    const npcs = this.adjacentNpcs();
    if (npcs.length) {
      npcController.openNpc(npcs[0]);
      return;
    }
    const enemies = this.adjacentEnemies();
    if (enemies.length) {
      const now = Date.now();
      if (now - this.lastBattleRequestAt < 400) return;
      this.lastBattleRequestAt = now;
      socket.emit(ClientEvents.StartBattleRequest, { targetEnemyId: enemies[0].id });
    }
  }

  private adjacentNpcs(): NpcDefinition[] {
    const me = getMyPlayer();
    if (!me) return [];
    return WORLD_NPCS.filter((n) => chebyshev(me.position, n.position) <= 1);
  }

  private adjacentEnemies() {
    const me = getMyPlayer();
    if (!me) return [];
    return gameState.world.enemies.filter(
      (e) => e.alive && chebyshev(me.position, e.position) <= 1
    );
  }

  private handlePointerClick(pointer: Phaser.Input.Pointer) {
    const tx = Math.floor(pointer.worldX / gameState.tileSize);
    const ty = Math.floor(pointer.worldY / gameState.tileSize);
    if (!this.inBounds(tx, ty)) return;

    const enemy = gameState.world.enemies.find(
      (e) => e.alive && e.position.x === tx && e.position.y === ty
    );
    if (enemy) {
      this.goal = { type: "enemy", id: enemy.id };
      return;
    }
    this.goal = { type: "tile", x: tx, y: ty };
  }

  update(_time: number, _delta: number) {
    if (gameState.currentBattle) return;
    this.syncPlayers();
    this.syncEnemies();
    this.drawOverlay(_time);
    this.pursueGoal();
  }

  private syncPlayers() {
    const aliveIds = new Set<string>();
    for (const p of gameState.world.players) {
      aliveIds.add(p.id);
      const isMe = p.id === gameState.myPlayerId;
      const targetPx = p.position.x * gameState.tileSize + gameState.tileSize / 2;
      const targetPy = p.position.y * gameState.tileSize + gameState.tileSize / 2;

      let c = this.playerGraphics.get(p.id);
      if (!c) {
        c = this.add.container(targetPx, targetPy).setDepth(isMe ? 30 : 20);
        const halo = this.add.circle(0, 0, gameState.tileSize * 0.44, 0x000000, 0.45);
        halo.setStrokeStyle(isMe ? 2 : 1, isMe ? 0x38bdf8 : 0x64748b, 0.9);
        const portraitKey = CLASS_PORTRAIT[p.hunterClass] ?? "healer";
        const tokKey = TEX.token(portraitKey);
        const texKey = this.textures.exists(tokKey) ? tokKey : TEX.token("healer");
        const icon = this.add.image(0, 0, texKey).setDisplaySize(gameState.tileSize * 0.8, gameState.tileSize * 0.8);
        const lbl = this.add
          .text(0, -gameState.tileSize * 0.62, `${isMe ? "Você" : p.name} · Lv ${p.level}`, {
            fontSize: "10px",
            fontFamily: "'Rajdhani', sans-serif",
            fontStyle: "bold",
            color: isMe ? "#7dd3fc" : "#cbd5e1",
            stroke: "#020617",
            strokeThickness: 3
          })
          .setOrigin(0.5);
        c.add([halo, icon, lbl]);
        this.playerGraphics.set(p.id, c);
      }

      if (PREFERS_REDUCED_MOTION) {
        c.setPosition(targetPx, targetPy);
      } else {
        const dist = Phaser.Math.Distance.Between(c.x, c.y, targetPx, targetPy);
        if (dist > gameState.tileSize * 2.5) c.setPosition(targetPx, targetPy);
        else if (dist > 1) {
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
        if (!(cam as any)._follow) {
          cam.startFollow(c, true, 0.08, 0.08);
          (cam as any)._follow = true;
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
    const aliveIds = new Set<string>();
    for (const e of gameState.world.enemies) {
      if (!e.alive) continue;
      aliveIds.add(e.id);
      const targetPx = e.position.x * gameState.tileSize + gameState.tileSize / 2;
      const targetPy = e.position.y * gameState.tileSize + gameState.tileSize / 2;
      let c = this.enemyGraphics.get(e.id);
      if (!c) {
        c = this.add.container(targetPx, targetPy).setDepth(15);
        const tex = enemyTextureKey(e.name);
        const spr = this.add.image(0, 0, tex).setDisplaySize(gameState.tileSize * 0.8, gameState.tileSize * 0.8);
        const lbl = this.add
          .text(0, -gameState.tileSize * 0.62, `[E] ${e.name} · Lv ${e.level}`, {
            fontSize: "9px",
            fontFamily: "'Rajdhani', sans-serif",
            fontStyle: "bold",
            color: "#f87171",
            stroke: "#020617",
            strokeThickness: 3
          })
          .setOrigin(0.5);
        c.add([spr, lbl]);
        this.enemyGraphics.set(e.id, c);
      }
      c.setPosition(targetPx, targetPy);
    }
    for (const [id, c] of this.enemyGraphics.entries()) {
      if (!aliveIds.has(id)) {
        c.destroy();
        this.enemyGraphics.delete(id);
      }
    }
  }

  private drawOverlay(time: number) {
    this.overlay.clear();
    const me = getMyPlayer();
    if (this.hover && this.inBounds(this.hover.x, this.hover.y)) {
      this.overlay.lineStyle(1, 0x38bdf8, 0.6);
      this.overlay.strokeRect(
        this.hover.x * gameState.tileSize,
        this.hover.y * gameState.tileSize,
        gameState.tileSize,
        gameState.tileSize
      );
    }
    const npcs = me && !me.inBattle && !gameState.currentBattle ? this.adjacentNpcs() : [];
    if (npcs.length) {
      const target = npcs[0];
      this.hint.setText(`[E] Falar com ${target.name}`);
      this.hint
        .setPosition(
          target.position.x * gameState.tileSize + gameState.tileSize / 2,
          target.position.y * gameState.tileSize - 4
        )
        .setVisible(true);
      return;
    }
    const adjacent = me && !me.inBattle && !gameState.currentBattle ? this.adjacentEnemies() : [];
    if (adjacent.length) {
      const pulseAlpha = 0.4 + 0.3 * Math.sin(time / 140);
      this.overlay.lineStyle(2, 0xfacc15, pulseAlpha);
      for (const e of adjacent) {
        this.overlay.strokeRect(
          e.position.x * gameState.tileSize + 2,
          e.position.y * gameState.tileSize + 2,
          gameState.tileSize - 4,
          gameState.tileSize - 4
        );
      }
      this.hint.setText(`[E] ${adjacent[0].name}`);
      this.hint
        .setPosition(
          adjacent[0].position.x * gameState.tileSize + gameState.tileSize / 2,
          adjacent[0].position.y * gameState.tileSize - 4
        )
        .setVisible(true);
    } else {
      this.hint.setVisible(false);
    }
  }

  private pursueGoal() {
    const goal = this.goal;
    if (!goal || this.awaiting) return;
    const me = getMyPlayer();
    if (!me || me.inBattle) return;

    let tx: number, ty: number;
    if (goal.type === "tile") {
      tx = goal.x;
      ty = goal.y;
    } else {
      const e = gameState.world.enemies.find((en) => en.id === goal.id && en.alive);
      if (!e) {
        this.goal = null;
        return;
      }
      tx = e.position.x;
      ty = e.position.y;
      if (chebyshev(me.position, e.position) <= 1) {
        this.interact();
        this.goal = null;
        return;
      }
    }

    if (me.position.x === tx && me.position.y === ty) {
      this.goal = null;
      return;
    }

    const dx = Math.sign(tx - me.position.x);
    const dy = Math.sign(ty - me.position.y);
    let dir: Direction | null = null;
    if (Math.abs(tx - me.position.x) >= Math.abs(ty - me.position.y)) {
      dir = dx > 0 ? "RIGHT" : dx < 0 ? "LEFT" : null;
    } else {
      dir = dy > 0 ? "DOWN" : dy < 0 ? "UP" : null;
    }
    if (dir) this.sendStep(dir);
  }
}
