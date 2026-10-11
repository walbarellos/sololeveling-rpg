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
import { AVATARS } from "./avatars";
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
let currentHunterClass: HunterClass = "BATTLE_HEALER";

// DOM Elements - Top Bar
const connection = document.querySelector<HTMLSpanElement>("#connection")!;
const status = document.querySelector<HTMLSpanElement>("#status")!;
const classSelect = document.querySelector<HTMLSelectElement>("#class-select")!;
const headerHunterNick = document.querySelector<HTMLSpanElement>("#header-hunter-nick")!;
const headerHunterResources = document.querySelector<HTMLSpanElement>("#header-hunter-resources")!;
const hunterRankBadge = document.querySelector<HTMLSpanElement>("#hunter-rank-badge")!;

// DOM Elements - Battle Arena
const battleScreen = document.querySelector<HTMLDivElement>("#battle-screen")!;
const battleTurnIndicator = document.querySelector<HTMLSpanElement>("#battle-turn-indicator")!;

// Player Card
const playerAvatarBox = document.querySelector<HTMLDivElement>("#player-avatar-box")!;
const battlePlayerName = document.querySelector<HTMLSpanElement>("#battle-player-name")!;
const battlePlayerClassTitle = document.querySelector<HTMLSpanElement>("#battle-player-class-title")!;
const battlePlayerBadge = document.querySelector<HTMLSpanElement>("#battle-player-badge")!;
const battlePlayerHpText = document.querySelector<HTMLSpanElement>("#battle-player-hp-text")!;
const battlePlayerHpBar = document.querySelector<HTMLDivElement>("#battle-player-hp-bar")!;
const battlePlayerMpText = document.querySelector<HTMLSpanElement>("#battle-player-mp-text")!;
const battlePlayerMpBar = document.querySelector<HTMLDivElement>("#battle-player-mp-bar")!;

// Player Attributes (Calculadora NG)
const attrAtkPhys = document.querySelector<HTMLSpanElement>("#attr-atk-phys")!;
const attrAtkMag = document.querySelector<HTMLSpanElement>("#attr-atk-mag")!;
const attrCrit = document.querySelector<HTMLSpanElement>("#attr-crit")!;
const attrDef = document.querySelector<HTMLSpanElement>("#attr-def")!;

// Enemy Card
const enemyAvatarBox = document.querySelector<HTMLDivElement>("#enemy-avatar-box")!;
const battleEnemyName = document.querySelector<HTMLSpanElement>("#battle-enemy-name")!;
const battleEnemyBadge = document.querySelector<HTMLSpanElement>("#battle-enemy-badge")!;
const battleEnemyHpText = document.querySelector<HTMLSpanElement>("#battle-enemy-hp-text")!;
const battleEnemyHpBar = document.querySelector<HTMLDivElement>("#battle-enemy-hp-bar")!;
const battleEnemyMpText = document.querySelector<HTMLSpanElement>("#battle-enemy-mp-text")!;
const battleEnemyMpBar = document.querySelector<HTMLDivElement>("#battle-enemy-mp-bar")!;

// Center Column
const battleLogFeed = document.querySelector<HTMLDivElement>("#battle-log")!;
const skillsDeck = document.querySelector<HTMLDivElement>("#skills-deck")!;
const btnFlee = document.querySelector<HTMLButtonElement>("#btn-flee")!;
const btnCalcToggle = document.querySelector<HTMLButtonElement>("#btn-calc-toggle")!;

// Result Modal
const battleResultModal = document.querySelector<HTMLDivElement>("#battle-result-modal")!;
const resultIcon = document.querySelector<HTMLDivElement>("#result-icon")!;
const resultTitle = document.querySelector<HTMLHeadingElement>("#result-title")!;
const resultDesc = document.querySelector<HTMLDivElement>("#result-desc")!;
const btnReturnMap = document.querySelector<HTMLButtonElement>("#btn-return-map")!;

// Class Selector Handler
classSelect?.addEventListener("change", () => {
  currentHunterClass = classSelect.value as HunterClass;
  socket.emit(ClientEvents.SelectClassRequest, { hunterClass: currentHunterClass });
  updateClassVisuals(currentHunterClass);
});

// Flee Button Handler
btnFlee?.addEventListener("click", () => {
  if (!currentBattle || currentBattle.finished) return;
  socket.emit(ClientEvents.BattleFleeRequest, { battleId: currentBattle.battleId });
});

// Calculator Toggle
btnCalcToggle?.addEventListener("click", () => {
  alert(
    `📊 CALCULADORA TÁTICA (Estilo NG):\n` +
    `• Classe Ativa: ${currentHunterClass}\n` +
    `• Bônus Crítico: Assassino (35%) · Mago (25%) · Healer/Guerreiro (15%)\n` +
    `• Mitigação de Bloqueio: -50% Dano\n` +
    `• Esquiva: Anula 100% do Dano no Turno!`
  );
});

// Return to Map Button Handler
btnReturnMap?.addEventListener("click", () => {
  currentBattle = null;
  battleResultModal.classList.add("hidden");
  battleScreen.classList.add("hidden");
  socket.emit(ClientEvents.SnapshotRequest);
});

// Keyboard Hotkeys in Battle (1, 2, 3, F)
window.addEventListener("keydown", (e: KeyboardEvent) => {
  if (!currentBattle || currentBattle.finished) return;

  if (e.key === "1" || e.key === "2" || e.key === "3") {
    const index = parseInt(e.key, 10) - 1;
    const skill = currentBattle.player.skills[index];
    if (skill && skill.currentCooldown === 0 && currentBattle.player.mp >= skill.mpCost) {
      socket.emit(ClientEvents.BattleActionRequest, {
        battleId: currentBattle.battleId,
        actionId: skill.id
      });
    }
  } else if (e.key === "f" || e.key === "F") {
    socket.emit(ClientEvents.BattleFleeRequest, { battleId: currentBattle.battleId });
  }
});

// Socket Events
socket.on("connect", () => {
  connection.textContent = "● Gate Conectado";
  connection.style.color = "#4ade80";
});

socket.on("disconnect", () => {
  connection.textContent = "○ Desconectado";
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
  if (me) {
    currentHunterClass = me.hunterClass;
    headerHunterNick.textContent = me.name;
    headerHunterResources.textContent = `HP: ${me.hp}/${me.maxHp} · MP: ${me.mp}/${me.maxMp}`;
    hunterRankBadge.textContent = `RANK ${me.rank}`;
    if (classSelect && classSelect.value !== me.hunterClass) {
      classSelect.value = me.hunterClass;
    }
    updateClassVisuals(me.hunterClass);
  }
});

socket.on(ServerEvents.BattleSnapshot, (raw: unknown) => {
  const parsed = BattleSnapshotSchema.safeParse(raw);
  if (!parsed.success) return;
  currentBattle = parsed.data;
  renderBattleArena(currentBattle);
});

socket.on(ServerEvents.BattleEnded, (raw: unknown) => {
  const parsed = BattleSnapshotSchema.safeParse(raw);
  if (!parsed.success) return;
  currentBattle = parsed.data;
  renderBattleArena(currentBattle);
  showBattleOutcome(currentBattle);
});

socket.on(ServerEvents.Error, (raw: unknown) => {
  const error = raw as { message?: string };
  status.textContent = `⚠️ ${error?.message ?? "Ação rejeitada pelo servidor"}`;
});

function updateClassVisuals(hClass: HunterClass) {
  if (playerAvatarBox) {
    playerAvatarBox.innerHTML = AVATARS[hClass] ?? AVATARS.WARRIOR;
  }

  const classTitles: Record<HunterClass, string> = {
    BATTLE_HEALER: "«Curandeiro de Combate Sagrado»",
    ASSASSIN: "«Assassino de Sombras»",
    WARRIOR: "«Guerreiro Guardião de Ferro»",
    MAGE: "«Arquimago Dimensional»"
  };
  if (battlePlayerClassTitle) {
    battlePlayerClassTitle.textContent = classTitles[hClass];
  }

  // Update Attributes based on Class (Calculadora NG)
  if (hClass === "ASSASSIN") {
    attrAtkPhys.textContent = "46";
    attrAtkMag.textContent = "15";
    attrCrit.textContent = "35%";
    attrDef.textContent = "22% / 8%";
  } else if (hClass === "MAGE") {
    attrAtkPhys.textContent = "18";
    attrAtkMag.textContent = "58";
    attrCrit.textContent = "25%";
    attrDef.textContent = "8% / 10%";
  } else if (hClass === "WARRIOR") {
    attrAtkPhys.textContent = "38";
    attrAtkMag.textContent = "12";
    attrCrit.textContent = "15%";
    attrDef.textContent = "8% / 28%";
  } else {
    // Battle Healer
    attrAtkPhys.textContent = "26";
    attrAtkMag.textContent = "38 (Luz)";
    attrCrit.textContent = "15%";
    attrDef.textContent = "10% / 15%";
  }
}

function renderBattleArena(b: BattleSnapshot) {
  battleScreen.classList.remove("hidden");
  battleTurnIndicator.textContent = `TURNO ${b.turn} / ${b.maxTurns}`;

  // 1. Update Player Card
  battlePlayerName.textContent = b.player.name;
  battlePlayerBadge.textContent = `RANK ${b.player.rank}`;
  battlePlayerHpText.textContent = `${b.player.hp} / ${b.player.maxHp}`;
  battlePlayerHpBar.style.width = `${Math.max(0, (100 * b.player.hp) / b.player.maxHp)}%`;
  battlePlayerMpText.textContent = `${b.player.mp} / ${b.player.maxMp}`;
  battlePlayerMpBar.style.width = `${Math.max(0, (100 * b.player.mp) / b.player.maxMp)}%`;
  updateClassVisuals(b.player.hunterClass);

  // 2. Update Enemy Card
  battleEnemyName.textContent = b.enemy.name;
  battleEnemyBadge.textContent = `RANK ${b.enemy.rank}`;
  battleEnemyHpText.textContent = `${b.enemy.hp} / ${b.enemy.maxHp}`;
  battleEnemyHpBar.style.width = `${Math.max(0, (100 * b.enemy.hp) / b.enemy.maxHp)}%`;
  battleEnemyMpText.textContent = `${b.enemy.mp} / ${b.enemy.maxMp}`;
  battleEnemyMpBar.style.width = `${Math.max(0, (100 * b.enemy.mp) / b.enemy.maxMp)}%`;

  if (enemyAvatarBox) {
    if (b.enemy.name.toLowerCase().includes("slime")) {
      enemyAvatarBox.innerHTML = AVATARS.SLIME;
    } else if (b.enemy.name.toLowerCase().includes("goblin")) {
      enemyAvatarBox.innerHTML = AVATARS.GOBLIN;
    } else {
      enemyAvatarBox.innerHTML = AVATARS.WOLF;
    }
  }

  // 3. Render Formatted Battle Log Feed
  battleLogFeed.innerHTML = "";
  for (const entry of b.log) {
    const line = document.createElement("div");
    line.className = "log-line";

    let badgeClass = "badge-normal";
    let badgeText = "AÇÃO";

    if (entry.includes("[CRÍTICO]")) {
      badgeClass = "badge-crit";
      badgeText = "CRÍTICO ⚡";
    } else if (entry.includes("[ESQUIVOU]")) {
      badgeClass = "badge-dodge";
      badgeText = "ESQUIVA 💨";
    } else if (entry.includes("[BLOQUEIO]")) {
      badgeClass = "badge-block";
      badgeText = "BLOQUEIO 🛡️";
    } else if (entry.includes("[CURA]")) {
      badgeClass = "badge-heal";
      badgeText = "CURA 💚";
    } else if (entry.includes("[DANO]")) {
      badgeClass = "badge-damage";
      badgeText = "DANO ⚔️";
    } else if (entry.includes("[VITÓRIA]")) {
      badgeClass = "badge-crit";
      badgeText = "VITÓRIA 🏆";
    } else if (entry.includes("[EMPATE]")) {
      badgeClass = "badge-dodge";
      badgeText = "EMPATE ⚖️";
    }

    const cleanText = entry.replace(/\[.*?\]\s*/g, "");

    line.innerHTML = `
      <span class="log-badge ${badgeClass}">${badgeText}</span>
      <span class="log-text">${cleanText}</span>
    `;
    battleLogFeed.appendChild(line);
  }
  battleLogFeed.scrollTop = battleLogFeed.scrollHeight;

  // 4. Render Action Deck (Skill Slots)
  skillsDeck.innerHTML = "";
  b.player.skills.forEach((skill, idx) => {
    const slot = document.createElement("button");
    slot.className = "skill-card-slot";

    const notEnoughMp = b.player.mp < skill.mpCost;
    const onCooldown = skill.currentCooldown > 0;
    const isLocked = notEnoughMp || onCooldown || b.finished;

    slot.disabled = isLocked;

    let costLabel = `${skill.mpCost} MP`;
    if (onCooldown) {
      costLabel = `⏳ Recarga: ${skill.currentCooldown} t`;
    } else if (notEnoughMp) {
      costLabel = `⚠️ Sem MP (${skill.mpCost})`;
    }

    slot.innerHTML = `
      <div class="skill-slot-header">
        <span class="skill-key-binding">[${idx + 1}]</span>
        <span class="skill-name-txt">${skill.name}</span>
        <span class="skill-mp-tag ${onCooldown ? 'skill-cd-overlay' : ''}">${costLabel}</span>
      </div>
      <div class="skill-desc-txt">${skill.description}</div>
    `;

    slot.addEventListener("click", () => {
      if (b.finished) return;
      socket.emit(ClientEvents.BattleActionRequest, {
        battleId: b.battleId,
        actionId: skill.id
      });
    });

    skillsDeck.appendChild(slot);
  });
}

function showBattleOutcome(b: BattleSnapshot) {
  battleResultModal.classList.remove("hidden");

  if (b.result === "VICTORY") {
    resultIcon.textContent = "🏆";
    resultTitle.textContent = "VITÓRIA GLORIOSA!";
    resultTitle.style.color = "#facc15";
    resultDesc.textContent = `A besta [${b.enemy.rank}] ${b.enemy.name} foi exterminada com sucesso.`;
  } else if (b.result === "DRAW") {
    resultIcon.textContent = "⚖️";
    resultTitle.textContent = "EMPATE EM COMBATE!";
    resultTitle.style.color = "#38bdf8";
    resultDesc.textContent = "Golpe fatal simultâneo! Ambos os combatentes sucumbiram na mesma rodada.";
  } else if (b.result === "DEFEAT") {
    resultIcon.textContent = "💀";
    resultTitle.textContent = "DERROTA NA MASMORRA!";
    resultTitle.style.color = "#ef4444";
    resultDesc.textContent = "Você sofreu ferimentos graves e foi resgatado na entrada do Gate.";
  } else if (b.result === "FLED") {
    resultIcon.textContent = "🏃";
    resultTitle.textContent = "FUGA BEM-SUCEDIDA!";
    resultTitle.style.color = "#a855f7";
    resultDesc.textContent = "Você rompeu o engajamento e recuou para um quadrante seguro do mapa.";
  }
}

// -------------------------------------------------------------
// MAPA 2D (PHASER EXPLORATION SCENE)
// -------------------------------------------------------------
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
      if (currentBattle) return;
      this.handlePointerClick(pointer);
    });

    // Keyboard Arrow / WASD Input
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (currentBattle) return;
      this.handleKeyInput(event.key);
    });
  }

  private drawGrid() {
    this.gridGraphics.clear();

    // Floor background com visual de masmorra escura
    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        const isEven = (x + y) % 2 === 0;
        const color = isEven ? 0x0a0f1d : 0x0e1526;
        this.gridGraphics.fillStyle(color, 1);
        this.gridGraphics.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

        this.gridGraphics.lineStyle(1, 0x1e293b, 0.45);
        this.gridGraphics.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    // Pilares / Obstáculos com runas azuis
    for (const obs of obstacles) {
      const px = obs.x * tileSize;
      const py = obs.y * tileSize;

      this.gridGraphics.fillStyle(0x1e293b, 1);
      this.gridGraphics.fillRoundedRect(px + 4, py + 4, tileSize - 8, tileSize - 8, 6);

      this.gridGraphics.lineStyle(2, 0x475569, 0.8);
      this.gridGraphics.strokeRoundedRect(px + 8, py + 8, tileSize - 16, tileSize - 16, 4);

      this.gridGraphics.fillStyle(0x38bdf8, 0.7);
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

    const clickedEnemy = world.enemies.find(
      (e) => e.alive && e.position.x === tileX && e.position.y === tileY
    );

    if (clickedEnemy) {
      const dx = Math.abs(me.position.x - clickedEnemy.position.x);
      const dy = Math.abs(me.position.y - clickedEnemy.position.y);
      if (Math.max(dx, dy) <= 1) {
        status.textContent = `⚔️ Iniciando confronto com [${clickedEnemy.rank}] ${clickedEnemy.name}…`;
        socket.emit(ClientEvents.StartBattleRequest, { targetEnemyId: clickedEnemy.id });
        return;
      }
    }

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
    // Sincroniza Jogadores no Mapa
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

    // Sincroniza Inimigos no Mapa
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
  backgroundColor: "#05070d",
  render: { antialias: false, pixelArt: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [WorldScene],
  fps: { target: 60, forceSetTimeOut: false }
});
