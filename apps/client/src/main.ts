import Phaser from "phaser";
import { io, type Socket } from "socket.io-client";
import {
  ClientEvents, ServerEvents, WorldSnapshotSchema, WelcomeSchema,
  type WorldSnapshot, type CombatLog, CombatLogSchema
} from "@rpg/contracts";
import "./style.css";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3000";
const socket: Socket = io(SERVER_URL, { transports: ["websocket", "polling"] });

let world: WorldSnapshot = { players: [], enemies: [], serverTime: 0 };
let myPlayerId = "";
let worldWidth = 960;
let worldHeight = 600;
let lastCombatMessage = "";

const connection = document.querySelector<HTMLSpanElement>("#connection")!;
const status = document.querySelector<HTMLSpanElement>("#status")!;

socket.on("connect", () => { connection.textContent = "Conectado"; });
socket.on("disconnect", () => { connection.textContent = "Desconectado"; });
socket.on(ServerEvents.Welcome, (raw: unknown) => {
  const parsed = WelcomeSchema.safeParse(raw);
  if (!parsed.success) return;
  myPlayerId = parsed.data.playerId;
  worldWidth = parsed.data.worldWidth;
  worldHeight = parsed.data.worldHeight;
  socket.emit(ClientEvents.SnapshotRequest);
});
socket.on(ServerEvents.Snapshot, (raw: unknown) => {
  const parsed = WorldSnapshotSchema.safeParse(raw);
  if (parsed.success) world = parsed.data;
});
socket.on(ServerEvents.CombatLog, (raw: unknown) => {
  const parsed = CombatLogSchema.safeParse(raw);
  if (!parsed.success) return;
  const event: CombatLog = parsed.data;
  lastCombatMessage = `${event.damage} de dano${event.defeated ? " · inimigo derrotado" : ""}`;
  status.textContent = lastCombatMessage;
});
socket.on(ServerEvents.Error, (raw: unknown) => {
  const error = raw as { message?: string };
  status.textContent = error?.message ?? "Ação rejeitada pelo servidor";
});

class WorldScene extends Phaser.Scene {
  private playerGraphics = new Map<string, Phaser.GameObjects.Container>();
  private enemyGraphics = new Map<string, Phaser.GameObjects.Container>();
  private floor!: Phaser.GameObjects.Graphics;
  private labels!: Phaser.GameObjects.Container;

  constructor() { super("world"); }

  create() {
    this.floor = this.add.graphics();
    this.labels = this.add.container(0, 0);
    this.drawFloor();
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const x = Phaser.Math.Clamp(pointer.x, 0, worldWidth);
      const y = Phaser.Math.Clamp(pointer.y, 0, worldHeight);
      const enemy = world.enemies.find(e => e.alive && Phaser.Math.Distance.Between(x, y, e.position.x, e.position.y) < 28);
      if (enemy) {
        socket.emit(ClientEvents.AttackRequest, { targetId: enemy.id });
      } else {
        socket.emit(ClientEvents.MoveRequest, { target: { x, y } });
      }
    });
  }

  private drawFloor() {
    this.floor.clear();
    this.floor.fillStyle(0x172b2a, 1);
    this.floor.fillRect(0, 0, worldWidth, worldHeight);
    this.floor.lineStyle(1, 0x284442, 0.55);
    for (let x = 0; x <= worldWidth; x += 48) this.floor.lineBetween(x, 0, x, worldHeight);
    for (let y = 0; y <= worldHeight; y += 48) this.floor.lineBetween(0, y, worldWidth, y);
    this.floor.fillStyle(0x244b3b, 0.85);
    this.floor.fillEllipse(160, 480, 210, 130);
    this.floor.fillEllipse(780, 130, 220, 100);
    this.floor.fillStyle(0x526b47, 0.9);
    for (const [x, y] of [[90, 110], [860, 470], [740, 500], [390, 100], [570, 90]]) {
      this.floor.fillCircle(x, y, 13);
      this.floor.fillCircle(x - 9, y + 6, 8);
      this.floor.fillCircle(x + 8, y + 6, 8);
    }
  }

  update() {
    const activePlayers = new Set(world.players.map(p => p.id));
    for (const [id, object] of this.playerGraphics) {
      if (!activePlayers.has(id)) { object.destroy(); this.playerGraphics.delete(id); }
    }
    for (const player of world.players) {
      let object = this.playerGraphics.get(player.id);
      if (!object) {
        const shadow = this.add.ellipse(0, 10, 27, 12, 0x000000, 0.3);
        const body = this.add.circle(0, 0, 11, player.id === myPlayerId ? 0x60a5fa : 0xc4b5fd);
        body.setStrokeStyle(2, 0xf8fafc);
        const name = this.add.text(0, -28, player.id === myPlayerId ? "Você" : player.name,
          { fontSize: "11px", color: "#f8fafc", stroke: "#0f172a", strokeThickness: 3 }).setOrigin(0.5);
        const hp = this.add.rectangle(0, -18, 26, 3, 0x4ade80);
        object = this.add.container(player.position.x, player.position.y, [shadow, body, hp, name]);
        this.playerGraphics.set(player.id, object);
      }
      this.tweens.add({ targets: object, x: player.position.x, y: player.position.y, duration: 90, ease: "Sine.easeOut", overwrite: true });
    }

    const activeEnemies = new Set(world.enemies.map(e => e.id));
    for (const [id, object] of this.enemyGraphics) {
      if (!activeEnemies.has(id)) { object.destroy(); this.enemyGraphics.delete(id); }
    }
    for (const enemy of world.enemies) {
      let object = this.enemyGraphics.get(enemy.id);
      if (!object) {
        const shadow = this.add.ellipse(0, 9, 28, 10, 0x000000, 0.3);
        const body = this.add.circle(0, 0, 13, 0x34d399).setStrokeStyle(2, 0xa7f3d0);
        const label = this.add.text(0, -29, "Slime", { fontSize: "11px", color: "#d1fae5", stroke: "#064e3b", strokeThickness: 3 }).setOrigin(0.5);
        const barBg = this.add.rectangle(0, -18, 32, 4, 0x1f2937);
        const bar = this.add.rectangle(-16, -18, 32, 4, 0xfb7185).setOrigin(0, 0.5);
        object = this.add.container(enemy.position.x, enemy.position.y, [shadow, body, barBg, bar, label]);
        object.setData("hpBar", bar);
        this.enemyGraphics.set(enemy.id, object);
      }
      const hpBar = object.getData("hpBar") as Phaser.GameObjects.Rectangle;
      hpBar.width = 32 * enemy.hp / enemy.maxHp;
      object.setAlpha(enemy.alive ? 1 : 0.25);
      this.tweens.add({ targets: object, x: enemy.position.x, y: enemy.position.y, duration: 90, ease: "Sine.easeOut", overwrite: true });
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: worldWidth,
  height: worldHeight,
  backgroundColor: "#172b2a",
  render: { antialias: true, pixelArt: false },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [WorldScene],
  fps: { target: 60, forceSetTimeOut: false }
});
