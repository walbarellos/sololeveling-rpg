import Phaser from "phaser";
import { io, type Socket } from "socket.io-client";
import {
  BattleSnapshotSchema,
  ClientEvents,
  ServerEvents,
  WelcomeSchema,
  WorldSnapshotSchema,
  type BattleSnapshot,
  type Direction,
  type HunterClass,
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
let currentBattle: BattleSnapshot | null = null;

// DOM Elements
const connection = document.querySelector<HTMLSpanElement>("#connection")!;
const status = document.querySelector<HTMLSpanElement>("#status")!;
const hunterInfo = document.querySelector<HTMLSpanElement>("#hunter-info")!;
const classSelect = document.querySelector<HTMLSelectElement>("#class-select")!;

// Battle DOM Elements
const battleScreen = document.querySelector<HTMLDivElement>("#battle-screen")!;
const battleTurnIndicator = document.querySelector<HTMLSpanElement>("#battle-turn-indicator")!;
const battlePlayerName = document.querySelector<HTMLSpanElement>("#battle-player-name")!;
const battlePlayerBadge = document.querySelector<HTMLSpanElement>("#battle-player-badge")!;
const battlePlayerHpText = document.querySelector<HTMLSpanElement>("#battle-player-hp-text")!;
const battlePlayerHpBar = document.querySelector<HTMLDivElement>("#battle-player-hp-bar")!;
const battlePlayerMpText = document.querySelector<HTMLSpanElement>("#battle-player-mp-text")!;
const battlePlayerMpBar = document.querySelector<HTMLDivElement>("#battle-player-mp-bar")!;

const battleEnemyName = document.querySelector<HTMLSpanElement>("#battle-enemy-name")!;
const battleEnemyBadge = document.querySelector<HTMLSpanElement>("#battle-enemy-badge")!;
const battleEnemyHpText = document.querySelector<HTMLSpanElement>("#battle-enemy-hp-text")!;
const battleEnemyHpBar = document.querySelector<HTMLDivElement>("#battle-enemy-hp-bar")!;
const battleEnemyMpText = document.querySelector<HTMLSpanElement>("#battle-enemy-mp-text")!;
const battleEnemyMpBar = document.querySelector<HTMLDivElement>("#battle-enemy-mp-bar")!;

const battleLog = document.querySelector<HTMLDivElement>("#battle-log")!;
const skillsDeck = document.querySelector<HTMLDivElement>("#skills-deck")!;
const btnFlee = document.querySelector<HTMLButtonElement>("#btn-flee")!;

const battleResultModal = document.querySelector<HTMLDivElement>("#battle-result-modal")!;
const resultTitle = document.querySelector<HTMLHeadingElement>("#result-title")!;
const resultDesc = document.querySelector<HTMLParagraphElement>("#result-desc")!;
const btnReturnMap = document.querySelector<HTMLButtonElement>("#btn-return-map")!;

// Class Selector Handler
classSelect?.addEventListener("change", () => {
  const chosenClass = classSelect.value as HunterClass;
  socket.emit(ClientEvents.SelectClassRequest, { hunterClass: chosenClass });
});

// Flee Button Handler
btnFlee?.addEventListener("click", () => {
  if (!currentBattle) return;
  socket.emit(ClientEvents.BattleFleeRequest, { battleId: currentBattle.battleId });
});

// Return to Map Button Handler
btnReturnMap?.addEventListener("click", () => {
  currentBattle = null;
  battleResultModal.classList.add("hidden");
  battleScreen.classList.add("hidden");
  socket.emit(ClientEvents.SnapshotRequest);
});

// Socket Events
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
    hunterInfo.textContent = `Rank [${me.rank}] · ${me.hunterClass} · HP: ${me.hp}/${me.maxHp} · MP: ${me.mp}/${me.maxMp}`;
    if (classSelect && classSelect.value !== me.hunterClass) {
      classSelect.value = me.hunterClass;
    }
  }
});

socket.on(ServerEvents.BattleSnapshot, (raw: unknown) => {
  const parsed = BattleSnapshotSchema.safeParse(raw);
  if (!parsed.success) return;
  currentBattle = parsed.data;
  renderBattleScreen(currentBattle);
});

socket.on(ServerEvents.BattleEnded, (raw: unknown) => {
  const parsed = BattleSnapshotSchema.safeParse(raw);
  if (!parsed.success) return;
  currentBattle = parsed.data;
  renderBattleScreen(currentBattle);
  showBattleResult(currentBattle);
});

socket.on(ServerEvents.Error, (raw: unknown) => {
  const error = raw as { message?: string };
  status.textContent = error?.message ?? "Ação rejeitada pelo servidor";
});

function renderBattleScreen(b: BattleSnapshot) {
  battleScreen.classList.remove("hidden");

  battleTurnIndicator.textContent = `Turno ${b.turn} / ${b.maxTurns}`;

  // Update Player Stats
  battlePlayerName.textContent = b.player.name;
  battlePlayerBadge.textContent = `Rank [${b.player.rank}] · ${b.player.hunterClass}`;
  battlePlayerHpText.textContent = `${b.player.hp} / ${b.player.maxHp}`;
  battlePlayerHpBar.style.width = `${Math.max(0, (100 * b.player.hp) / b.player.maxHp)}%`;
  battlePlayerMpText.textContent = `${b.player.mp} / ${b.player.maxMp}`;
  battlePlayerMpBar.style.width = `${Math.max(0, (100 * b.player.mp) / b.player.maxMp)}%`;

  // Update Enemy Stats
  battleEnemyName.textContent = b.enemy.name;
  battleEnemyBadge.textContent = `Rank [${b.enemy.rank}]`;
  battleEnemyHpText.textContent = `${b.enemy.hp} / ${b.enemy.maxHp}`;
  battleEnemyHpBar.style.width = `${Math.max(0, (100 * b.enemy.hp) / b.enemy.maxHp)}%`;
  battleEnemyMpText.textContent = `${b.enemy.mp} / ${b.enemy.maxMp}`;
  battleEnemyMpBar.style.width = `${Math.max(0, (100 * b.enemy.mp) / b.enemy.maxMp)}%`;

  // Render Battle Log
  battleLog.innerHTML = "";
  for (const entry of b.log) {
    const div = document.createElement("div");
    if (entry.includes("Você")) {
      div.className = "log-entry-player";
    } else if (entry.includes("revidou") || entry.includes("derrotado")) {
      div.className = "log-entry-enemy";
    }
    div.textContent = entry;
    battleLog.appendChild(div);
  }
  battleLog.scrollTop = battleLog.scrollHeight;

  // Render Skill Buttons Deck
  skillsDeck.innerHTML = "";
  for (const skill of b.player.skills) {
    const btn = document.createElement("button");
    btn.className = "skill-card-btn";

    const notEnoughMp = b.player.mp < skill.mpCost;
    const onCooldown = skill.currentCooldown > 0;
    const isLocked = notEnoughMp || onCooldown || b.finished;

    btn.disabled = isLocked;

    let badgeText = `${skill.mpCost} MP`;
    if (onCooldown) {
      badgeText = `Recarga: ${skill.currentCooldown} t`;
    } else if (notEnoughMp) {
      badgeText = `Sem MP (${skill.mpCost})`;
    }

    btn.innerHTML = `
      <div class="skill-btn-header">
        <span>${skill.name}</span>
        <span class="skill-cost ${onCooldown ? 'skill-cooldown-badge' : ''}">${badgeText}</span>
      </div>
      <div class="skill-btn-desc">${skill.description}</div>
    `;

    btn.addEventListener("click", () => {
      if (b.finished) return;
      socket.emit(ClientEvents.BattleActionRequest, {
        battleId: b.battleId,
        actionId: skill.id
      });
    });

    skillsDeck.appendChild(btn);
  }
}

function showBattleResult(b: BattleSnapshot) {
  battleResultModal.classList.remove("hidden");

  if (b.result === "VICTORY") {
    resultTitle.textContent = "🏆 VITÓRIA!";
    resultTitle.style.color = "#10b981";
    resultDesc.textContent = `Você aniquilou [${b.enemy.rank}] ${b.enemy.name}! (+${b.rewardExp ?? 40} EXP obtidos)`;
  } else if (b.result === "DRAW") {
    resultTitle.textContent = "⚖️ EMPATE!";
    resultTitle.style.color = "#f59e0b";
    resultDesc.textContent = "Ambos os combatentes sucumbiram ou o tempo de turnos esgotou!";
  } else if (b.result === "DEFEAT") {
    resultTitle.textContent = "💀 DERROTA!";
    resultTitle.style.color = "#ef4444";
    resultDesc.textContent = "Você foi nocauteado e acordou na entrada segura da masmorra.";
  } else if (b.result === "FLED") {
    resultTitle.textContent = "🏃 FUGA!";
    resultTitle.style.color = "#38bdf8";
    resultDesc.textContent = "Você recuou taticamente e voltou à exploração segura da grade.";
  }
}

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

    // Mouse / Touch Click Input
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (currentBattle) return; // Ignore map clicks during active battle
      this.handlePointerClick(pointer);
    });

    // Keyboard Arrow / WASD Input
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (currentBattle) return; // Ignore keyboard walking during active battle
      this.handleKeyInput(event.key);
    });
  }

  private drawGrid() {
    this.gridGraphics.clear();

    // Floor background
    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        const isEven = (x + y) % 2 === 0;
        const color = isEven ? 0x0f172a : 0x131e34;
        this.gridGraphics.fillStyle(color, 1);
        this.gridGraphics.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

        this.gridGraphics.lineStyle(1, 0x1e293b, 0.4);
        this.gridGraphics.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    // Obstacles
    for (const obs of obstacles) {
      const px = obs.x * tileSize;
      const py = obs.y * tileSize;

      this.gridGraphics.fillStyle(0x334155, 1);
      this.gridGraphics.fillRoundedRect(px + 4, py + 4, tileSize - 8, tileSize - 8, 6);

      this.gridGraphics.lineStyle(2, 0x64748b, 0.8);
      this.gridGraphics.strokeRoundedRect(px + 8, py + 8, tileSize - 16, tileSize - 16, 4);

      this.gridGraphics.fillStyle(0x38bdf8, 0.6);
      this.gridGraphics.fillCircle(px + tileSize / 2, py + tileSize / 2, 4);
    }
  }

  private handleKeyInput(key: string) {
    const now = Date.now();
    if (now - this.lastInputTime < 180) return;

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
      const dx = Math.abs(me.position.x - clickedEnemy.position.x);
      const dy = Math.abs(me.position.y - clickedEnemy.position.y);
      if (Math.max(dx, dy) <= 1) {
        // Adjacent: Initiate instanced turn-based battle!
        status.textContent = `Iniciando confronto contra [${clickedEnemy.rank}] ${clickedEnemy.name}…`;
        socket.emit(ClientEvents.StartBattleRequest, { targetEnemyId: clickedEnemy.id });
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

new Phaser.Game({
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
