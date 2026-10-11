import Phaser from "phaser";
import { io, type Socket } from "socket.io-client";
import {
  ClientEvents,
  CombatLogSchema,
  ServerEvents,
  WelcomeSchema,
  WorldSnapshotSchema,
  type CombatLog,
  type Direction,
  type TileCoord,
  type WorldSnapshot
} from "@rpg/contracts";
import "./style.css";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3000";
const socket: Socket = io(SERVER_URL, { transports: ["websocket", "polling"] });

let world: WorldSnapshot = { players: [], enemies: [], obstacles: [], serverTime: 0 };
let myPlayerId = "";
let gridWidth = 20;
let gridHeight = 12;
let tileSize = 48;
let obstacles: TileCoord[] = [];

const connection = document.querySelector<HTMLSpanElement>("#connection")!;
const status = document.querySelector<HTMLSpanElement>("#status")!;
const hunterInfo = document.querySelector<HTMLSpanElement>("#hunter-info")!;

socket.on("connect", () => {
  connection.textContent = "Conectado ao Servidor";
  connection.style.color = "#86efac";
});

socket.on("disconnect", () => {
  connection.textContent = "Desconectado";
  connection.style.color = "#f87171";
});

socket.on(ServerEvents.Welcome, (raw: unknown) => {
  const parsed = WelcomeSchema.safeParse(raw);
  if (!parsed.success) return;
  myPlayerId = parsed.data.playerId;
  gridWidth = parsed.data.gridWidth;
  gridHeight = parsed.data.gridHeight;
  tileSize = parsed.data.tileSize;
  obstacles = parsed.data.obstacles;
  socket.emit(ClientEvents.SnapshotRequest);
});

socket.on(ServerEvents.Snapshot, (raw: unknown) => {
  const parsed = WorldSnapshotSchema.safeParse(raw);
  if (!parsed.success) return;
  world = parsed.data;
  obstacles = parsed.data.obstacles;

  const me = world.players.find((p) => p.id === myPlayerId);
  if (me && hunterInfo) {
    hunterInfo.textContent = `Rank [${me.rank}] · Nv. ${me.level} · HP: ${me.hp}/${me.maxHp} · Estamina: ${me.stamina}/${me.maxStamina}`;
  }
});

socket.on(ServerEvents.CombatLog, (raw: unknown) => {
  const parsed = CombatLogSchema.safeParse(raw);
  if (!parsed.success) return;
  const event: CombatLog = parsed.data;

  let msg = `Ataque: causou ${event.damage} de dano`;
  if (event.counterDamage) {
    msg += ` · Inimigo contra-atacou (${event.counterDamage} de dano)`;
  }
  if (event.defeated) {
    msg += " · Inimigo eliminado!";
  }
  status.textContent = msg;

  // Trigger floating combat feedback in the current Phaser scene
  const scene = game.scene.getScene("world") as WorldScene;
  if (scene) {
    scene.onCombatFeedback(event);
  }
});

socket.on(ServerEvents.Error, (raw: unknown) => {
  const error = raw as { message?: string };
  status.textContent = error?.message ?? "Ação rejeitada pelo servidor";
});

class WorldScene extends Phaser.Scene {
  private playerGraphics = new Map<string, Phaser.GameObjects.Container>();
  private enemyGraphics = new Map<string, Phaser.GameObjects.Container>();
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private lastInputTime = 0;

  constructor() {
    super("world");
  }

  create() {
    this.gridGraphics = this.add.graphics();
    this.drawGrid();

    // Mouse / Touch Input
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handlePointerClick(pointer);
    });

    // Keyboard Input
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      this.handleKeyInput(event.key);
    });
  }

  private drawGrid() {
    this.gridGraphics.clear();

    const worldPixelWidth = gridWidth * tileSize;
    const worldPixelHeight = gridHeight * tileSize;

    // Floor background
    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        const isEven = (x + y) % 2 === 0;
        const color = isEven ? 0x0f172a : 0x131e34;
        this.gridGraphics.fillStyle(color, 1);
        this.gridGraphics.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

        // Tile border
        this.gridGraphics.lineStyle(1, 0x1e293b, 0.4);
        this.gridGraphics.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    // Obstacles (dungeon pillars / rocks)
    for (const obs of obstacles) {
      const px = obs.x * tileSize;
      const py = obs.y * tileSize;

      // Obstacle base
      this.gridGraphics.fillStyle(0x334155, 1);
      this.gridGraphics.fillRoundedRect(px + 4, py + 4, tileSize - 8, tileSize - 8, 6);

      // Obstacle inner rune
      this.gridGraphics.lineStyle(2, 0x64748b, 0.8);
      this.gridGraphics.strokeRoundedRect(px + 8, py + 8, tileSize - 16, tileSize - 16, 4);

      // Rune center point
      this.gridGraphics.fillStyle(0x38bdf8, 0.6);
      this.gridGraphics.fillCircle(px + tileSize / 2, py + tileSize / 2, 4);
    }
  }

  private handleKeyInput(key: string) {
    const now = Date.now();
    if (now - this.lastInputTime < 180) return; // Client throttle matching server cooldown

    let direction: Direction | null = null;
    const k = key.toLowerCase();
    if (k === "arrowup" || k === "w") direction = "UP";
    else if (k === "arrowdown" || k === "s") direction = "DOWN";
    else if (k === "arrowleft" || k === "a") direction = "LEFT";
    else if (k === "arrowright" || k === "d") direction = "RIGHT";

    if (direction) {
      this.lastInputTime = now;
      socket.emit(ClientEvents.StepRequest, { direction });
    }
  }

  private handlePointerClick(pointer: Phaser.Input.Pointer) {
    const tileX = Math.floor(pointer.x / tileSize);
    const tileY = Math.floor(pointer.y / tileSize);

    const me = world.players.find((p) => p.id === myPlayerId);
    if (!me) return;

    // Check if clicked an enemy
    const clickedEnemy = world.enemies.find(
      (e) => e.alive && e.position.x === tileX && e.position.y === tileY
    );

    if (clickedEnemy) {
      // Check distance in tiles
      const dx = Math.abs(me.position.x - clickedEnemy.position.x);
      const dy = Math.abs(me.position.y - clickedEnemy.position.y);
      if (Math.max(dx, dy) <= 1) {
        // Adjacent: attack!
        socket.emit(ClientEvents.AttackRequest, { targetId: clickedEnemy.id });
        return;
      }
    }

    // Step towards clicked tile
    const diffX = tileX - me.position.x;
    const diffY = tileY - me.position.y;

    if (diffX === 0 && diffY === 0) return;

    let direction: Direction;
    if (Math.abs(diffX) >= Math.abs(diffY)) {
      direction = diffX > 0 ? "RIGHT" : "LEFT";
    } else {
      direction = diffY > 0 ? "DOWN" : "UP";
    }

    const now = Date.now();
    if (now - this.lastInputTime < 180) return;
    this.lastInputTime = now;
    socket.emit(ClientEvents.StepRequest, { direction });
  }

  onCombatFeedback(log: CombatLog) {
    this.cameras.main.shake(120, 0.005);

    const targetEnemy = world.enemies.find((e) => e.id === log.targetId);
    if (targetEnemy) {
      const tx = targetEnemy.position.x * tileSize + tileSize / 2;
      const ty = targetEnemy.position.y * tileSize + tileSize / 2;

      // Floating damage number on enemy
      const dmgText = this.add.text(tx, ty - 20, `-${log.damage}`, {
        fontSize: "16px",
        fontStyle: "bold",
        color: "#f87171",
        stroke: "#000000",
        strokeThickness: 3
      }).setOrigin(0.5);

      this.tweens.add({
        targets: dmgText,
        y: ty - 45,
        alpha: 0,
        duration: 700,
        ease: "Cubic.easeOut",
        onComplete: () => dmgText.destroy()
      });
    }

    if (log.counterDamage) {
      const me = world.players.find((p) => p.id === log.attackerId);
      if (me) {
        const mx = me.position.x * tileSize + tileSize / 2;
        const my = me.position.y * tileSize + tileSize / 2;

        const counterText = this.add.text(mx, my - 20, `-${log.counterDamage}`, {
          fontSize: "14px",
          fontStyle: "bold",
          color: "#fb923c",
          stroke: "#000000",
          strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
          targets: counterText,
          y: my - 45,
          alpha: 0,
          duration: 700,
          ease: "Cubic.easeOut",
          onComplete: () => counterText.destroy()
        });
      }
    }
  }

  update() {
    // Synchronize Players
    const activePlayers = new Set(world.players.map((p) => p.id));
    for (const [id, object] of this.playerGraphics) {
      if (!activePlayers.has(id)) {
        object.destroy();
        this.playerGraphics.delete(id);
      }
    }

    for (const player of world.players) {
      const targetPx = player.position.x * tileSize + tileSize / 2;
      const targetPy = player.position.y * tileSize + tileSize / 2;

      let object = this.playerGraphics.get(player.id);
      if (!object) {
        const shadow = this.add.ellipse(0, 14, 28, 12, 0x000000, 0.4);
        const isMe = player.id === myPlayerId;
        const bodyColor = isMe ? 0x38bdf8 : 0x818cf8;
        const body = this.add.circle(0, 0, 13, bodyColor).setStrokeStyle(2, 0xf8fafc);

        const nameLabel = this.add.text(
          0,
          -28,
          isMe ? `[${player.rank}] Você` : `[${player.rank}] ${player.name}`,
          { fontSize: "11px", color: "#f8fafc", stroke: "#0f172a", strokeThickness: 3 }
        ).setOrigin(0.5);

        const hpBarBg = this.add.rectangle(0, -18, 30, 4, 0x1e293b);
        const hpBar = this.add.rectangle(-15, -18, 30, 4, 0x4ade80).setOrigin(0, 0.5);

        object = this.add.container(targetPx, targetPy, [shadow, body, hpBarBg, hpBar, nameLabel]);
        object.setData("hpBar", hpBar);
        this.playerGraphics.set(player.id, object);
      } else {
        const hpBar = object.getData("hpBar") as Phaser.GameObjects.Rectangle;
        hpBar.width = Math.max(0, (30 * player.hp) / player.maxHp);

        // Smooth tween transition between tiles
        this.tweens.add({
          targets: object,
          x: targetPx,
          y: targetPy,
          duration: 160,
          ease: "Sine.easeOut",
          overwrite: true
        });
      }
    }

    // Synchronize Enemies
    const activeEnemies = new Set(world.enemies.map((e) => e.id));
    for (const [id, object] of this.enemyGraphics) {
      if (!activeEnemies.has(id)) {
        object.destroy();
        this.enemyGraphics.delete(id);
      }
    }

    for (const enemy of world.enemies) {
      const targetPx = enemy.position.x * tileSize + tileSize / 2;
      const targetPy = enemy.position.y * tileSize + tileSize / 2;

      let object = this.enemyGraphics.get(enemy.id);
      if (!object) {
        const shadow = this.add.ellipse(0, 14, 28, 12, 0x000000, 0.4);
        const enemyColor = enemy.rank === "D" ? 0xa855f7 : 0x10b981;
        const body = this.add.circle(0, 0, 14, enemyColor).setStrokeStyle(2, 0xd1fae5);

        const label = this.add.text(
          0,
          -29,
          `[${enemy.rank}] ${enemy.name}`,
          { fontSize: "11px", color: "#e2e8f0", stroke: "#022c22", strokeThickness: 3 }
        ).setOrigin(0.5);

        const barBg = this.add.rectangle(0, -18, 32, 4, 0x1e293b);
        const hpBar = this.add.rectangle(-16, -18, 32, 4, 0xf43f5e).setOrigin(0, 0.5);

        object = this.add.container(targetPx, targetPy, [shadow, body, barBg, hpBar, label]);
        object.setData("hpBar", hpBar);
        this.enemyGraphics.set(enemy.id, object);
      } else {
        const hpBar = object.getData("hpBar") as Phaser.GameObjects.Rectangle;
        hpBar.width = Math.max(0, (32 * enemy.hp) / enemy.maxHp);
        object.setAlpha(enemy.alive ? 1 : 0.2);

        this.tweens.add({
          targets: object,
          x: targetPx,
          y: targetPy,
          duration: 160,
          ease: "Sine.easeOut",
          overwrite: true
        });
      }
    }
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: gridWidth * tileSize,
  height: gridHeight * tileSize,
  backgroundColor: "#090e17",
  render: { antialias: false, pixelArt: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [WorldScene],
  fps: { target: 60, forceSetTimeOut: false }
});
