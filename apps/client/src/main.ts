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
import {
  CLASS_PORTRAIT,
  GUILD_BANNER_URL,
  TEX,
  addVignette,
  buildTextures,
  enemyTextureKey,
  portraitUrl,
  preloadAssets
} from "./assets";
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
  classSelect.blur(); // senão W/A/S/D/E ficam presos no <select>
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
  status.textContent = "Explore o mapa · [E] combate o monstro adjacente · clique num monstro para ir até ele";
  battleResultModal.classList.add("hidden");
  battleScreen.classList.add("hidden");
  socket.emit(ClientEvents.SnapshotRequest);
});

// Teclado global: batalha (1/2/3/F) e mapa (WASD/setas, E/Enter/Espaço = combater, Esc = cancelar)
const MAP_KEYS = new Set(["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", "e", "enter", " ", "escape"]);

window.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  if (currentBattle) {
    if (currentBattle.finished) return;
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
    return;
  }

  // Mapa: não roubar teclas de campos de formulário
  const target = e.target as HTMLElement | null;
  if (target && (target.tagName === "SELECT" || target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

  const k = e.key.toLowerCase();
  if (!MAP_KEYS.has(k)) return;
  e.preventDefault();
  worldScene?.handleKey(k);
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
  worldScene?.cancelPursuit();
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
  worldScene?.onServerError((raw as { code?: string })?.code);
});

function updateClassVisuals(hClass: HunterClass) {
  if (playerAvatarBox) {
    const src = portraitUrl(CLASS_PORTRAIT[hClass] ?? "bruiser");
    if (playerAvatarBox.dataset.cls !== hClass) {
      playerAvatarBox.dataset.cls = hClass;
      playerAvatarBox.innerHTML = `<img class="portrait-img" src="${src}" alt="${hClass}" draggable="false">`;
    }
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
let worldScene: WorldScene | null = null;

const STEP_INTERVAL_MS = 215; // > STEP_COOLDOWN_MS do servidor (200) para não tomar TOO_FAST
const PREFERS_REDUCED_MOTION = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

type Goal = { type: "enemy"; id: string } | { type: "tile"; x: number; y: number };

const DIR_VECTORS: ReadonlyArray<{ dir: Direction; dx: number; dy: number }> = [
  { dir: "UP", dx: 0, dy: -1 },
  { dir: "DOWN", dx: 0, dy: 1 },
  { dir: "LEFT", dx: -1, dy: 0 },
  { dir: "RIGHT", dx: 1, dy: 0 }
];

const chebyshev = (a: TileCoord, b: TileCoord) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const manhattan = (a: TileCoord, b: TileCoord) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

class WorldScene extends Phaser.Scene {
  private playerGraphics = new Map<string, Phaser.GameObjects.Container>();
  private enemyGraphics = new Map<string, Phaser.GameObjects.Container>();
  private terrain: Phaser.GameObjects.GameObject[] = [];
  private terrainKey = "";
  private overlay!: Phaser.GameObjects.Graphics;
  private hint!: Phaser.GameObjects.Text;
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
    worldScene = this;
    buildTextures(this, tileSize);
    this.textures.each((tex: Phaser.Textures.Texture) => {
      if (tex.key.startsWith("token_")) tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }, this);

    const w = gridWidth * tileSize;
    const h = gridHeight * tileSize;

    this.rebuildTerrain();

    // Portal do Gate (ponto de respawn) em (2,2)
    const portal = this.add.image(2 * tileSize + tileSize / 2, 2 * tileSize + tileSize / 2, TEX.portal).setDepth(1).setAlpha(0.9);
    this.add.text(portal.x, portal.y + tileSize * 0.5, "GATE", { fontSize: "9px", color: "#7dd3fc", stroke: "#020617", strokeThickness: 3 }).setOrigin(0.5).setDepth(1);
    if (!PREFERS_REDUCED_MOTION) {
      this.tweens.add({ targets: portal, angle: 360, duration: 9000, repeat: -1 });
      this.tweens.add({ targets: portal, scale: { from: 0.94, to: 1.06 }, yoyo: true, duration: 1400, repeat: -1, ease: "Sine.easeInOut" });
      this.add.particles(0, 0, TEX.mote, {
        x: { min: 0, max: w },
        y: { min: h * 0.4, max: h },
        lifespan: 6000,
        speedY: { min: -14, max: -4 },
        speedX: { min: -6, max: 6 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 0.7, end: 0 },
        frequency: 260,
        quantity: 1
      }).setDepth(800);
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

    addVignette(this, w, h);

    // Mouse / toque
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (currentBattle) return;
      this.handlePointerClick(pointer);
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      const t = { x: Math.floor(pointer.worldX / tileSize), y: Math.floor(pointer.worldY / tileSize) };
      this.hover = this.inBounds(t.x, t.y) ? t : null;
      const overEnemy = this.hover && world.enemies.some((e) => e.alive && e.position.x === t.x && e.position.y === t.y);
      this.input.setDefaultCursor(overEnemy ? "crosshair" : "default");
    });
  }

  // ---------- Terreno ----------
  private rebuildTerrain() {
    const key = JSON.stringify(obstacles);
    if (key === this.terrainKey) return;
    this.terrainKey = key;
    this.terrain.forEach((o) => o.destroy());
    this.terrain = [];
    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        const variant = (x * 7 + y * 13 + ((x * y) % 5)) % 3;
        this.terrain.push(this.add.image(x * tileSize, y * tileSize, TEX.floor(variant)).setOrigin(0).setDepth(0));
      }
    }
    for (const o of obstacles) {
      this.terrain.push(this.add.image(o.x * tileSize, o.y * tileSize, TEX.pillar).setOrigin(0).setDepth(2));
    }
  }

  // ---------- Entrada ----------
  handleKey(k: string) {
    if (k === "escape") {
      this.cancelPursuit();
      status.textContent = "Movimento automático cancelado.";
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

  cancelPursuit() {
    this.goal = null;
    this.awaiting = null;
  }

  onServerError(code?: string) {
    if (code === "TOO_FAST") {
      this.awaiting = null; // tenta de novo no próximo tick
      return;
    }
    if (this.goal) this.cancelPursuit();
  }

  private me() {
    return world.players.find((p) => p.id === myPlayerId);
  }

  private inBounds(x: number, y: number) {
    return x >= 0 && y >= 0 && x < gridWidth && y < gridHeight;
  }

  private sendStep(direction: Direction) {
    const now = Date.now();
    if (now - this.lastInputTime < STEP_INTERVAL_MS) return false;
    this.lastInputTime = now;
    const me = this.me();
    this.awaiting = me ? { sequence: me.sequence, at: now } : null;
    socket.emit(ClientEvents.StepRequest, { direction });
    return true;
  }

  /** Monstros vivos ao alcance (Chebyshev ≤ 1), mais próximos em linha reta primeiro. */
  private adjacentEnemies() {
    const me = this.me();
    if (!me) return [];
    return world.enemies
      .filter((e) => e.alive && chebyshev(me.position, e.position) <= 1)
      .sort((a, b) => manhattan(me.position, a.position) - manhattan(me.position, b.position));
  }

  private startBattleWith(enemy: { id: string; rank: string; name: string }) {
    const now = Date.now();
    if (now - this.lastBattleRequestAt < 500) return; // evita spam enquanto o servidor responde
    this.lastBattleRequestAt = now;
    this.cancelPursuit();
    status.textContent = `⚔️ Iniciando confronto com [${enemy.rank}] ${enemy.name}…`;
    socket.emit(ClientEvents.StartBattleRequest, { targetEnemyId: enemy.id });
  }

  /** Tecla E: combate o monstro adjacente; se não houver, vai até o mais próximo e combate. */
  private interact() {
    const me = this.me();
    if (!me || me.inBattle) return;
    const adjacent = this.adjacentEnemies();
    if (adjacent.length) {
      this.startBattleWith(adjacent[0]);
      return;
    }
    const nearest = world.enemies
      .filter((e) => e.alive)
      .sort((a, b) => manhattan(me.position, a.position) - manhattan(me.position, b.position))[0];
    if (!nearest) {
      status.textContent = "Nenhum monstro vivo no mapa.";
      return;
    }
    this.goal = { type: "enemy", id: nearest.id };
    status.textContent = `🏃 Indo até [${nearest.rank}] ${nearest.name}… (Esc cancela)`;
  }

  private handlePointerClick(pointer: Phaser.Input.Pointer) {
    const tileX = Math.floor(pointer.worldX / tileSize);
    const tileY = Math.floor(pointer.worldY / tileSize);
    if (!this.inBounds(tileX, tileY)) return;
    const me = this.me();
    if (!me || me.inBattle) return;

    const clicked = world.enemies.find((e) => e.alive && e.position.x === tileX && e.position.y === tileY);
    if (clicked) {
      if (chebyshev(me.position, clicked.position) <= 1) {
        this.startBattleWith(clicked);
      } else {
        this.goal = { type: "enemy", id: clicked.id };
        status.textContent = `🏃 Indo até [${clicked.rank}] ${clicked.name}… (Esc cancela)`;
      }
      return;
    }
    if (tileX === me.position.x && tileY === me.position.y) return;
    this.goal = { type: "tile", x: tileX, y: tileY };
  }

  // ---------- Busca de caminho (apenas conveniência do cliente; o servidor valida cada passo) ----------
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
    const me = this.me();
    if (!this.goal || !me || me.inBattle || currentBattle) return;

    if (this.awaiting && (me.sequence !== this.awaiting.sequence || Date.now() - this.awaiting.at > 600)) {
      this.awaiting = null;
    }
    void time;

    const blocked = new Set<string>(obstacles.map((o) => `${o.x},${o.y}`));
    for (const e of world.enemies) if (e.alive) blocked.add(`${e.position.x},${e.position.y}`);

    if (this.goal.type === "enemy") {
      const goalId = this.goal.id;
      const enemy = world.enemies.find((e) => e.id === goalId);
      if (!enemy || !enemy.alive) return this.cancelPursuit();
      if (chebyshev(me.position, enemy.position) <= 1) {
        this.startBattleWith(enemy);
        return;
      }
      if (this.awaiting || Date.now() - this.lastInputTime < STEP_INTERVAL_MS) return;
      const dir = this.nextStepToward(me.position, (x, y) => chebyshev({ x, y }, enemy.position) <= 1, blocked);
      if (!dir) {
        status.textContent = "⚠️ Sem caminho livre até o monstro.";
        return this.cancelPursuit();
      }
      this.sendStep(dir);
    } else {
      const { x: gx, y: gy } = this.goal;
      if (me.position.x === gx && me.position.y === gy) return this.cancelPursuit();
      if (this.awaiting || Date.now() - this.lastInputTime < STEP_INTERVAL_MS) return;
      if (blocked.has(`${gx},${gy}`)) return this.cancelPursuit();
      const dir = this.nextStepToward(me.position, (x, y) => x === gx && y === gy, blocked);
      if (!dir) return this.cancelPursuit();
      this.sendStep(dir);
    }
  }

  // ---------- Loop ----------
  update(time: number) {
    this.rebuildTerrain();
    this.runGoal(time);
    this.syncPlayers();
    this.syncEnemies();
    this.drawOverlay(time);
  }

  private drawOverlay(time: number) {
    const g = this.overlay;
    g.clear();
    const me = this.me();

    if (this.goal?.type === "tile") {
      g.lineStyle(2, 0x38bdf8, 0.9).strokeRect(this.goal.x * tileSize + 6, this.goal.y * tileSize + 6, tileSize - 12, tileSize - 12);
    }
    if (this.hover) {
      g.lineStyle(1, 0x7dd3fc, 0.35).strokeRect(this.hover.x * tileSize + 1, this.hover.y * tileSize + 1, tileSize - 2, tileSize - 2);
    }

    const adjacent = me && !me.inBattle && !currentBattle ? this.adjacentEnemies() : [];
    if (adjacent.length) {
      const target = adjacent[0];
      const pulse = PREFERS_REDUCED_MOTION ? 0.8 : 0.55 + 0.35 * Math.sin(time / 180);
      g.lineStyle(3, 0xf43f5e, pulse).strokeRect(target.position.x * tileSize + 2, target.position.y * tileSize + 2, tileSize - 4, tileSize - 4);
      this.hint
        .setText(`[E] Combater ${target.name}`)
        .setPosition(target.position.x * tileSize + tileSize / 2, target.position.y * tileSize - 4)
        .setVisible(true);
      if (!this.goal) status.textContent = `⚔️ ${target.name} ao alcance — aperte [E] ou clique nele para combater`;
    } else {
      this.hint.setVisible(false);
    }
  }

  private moveTo(object: Phaser.GameObjects.Container, x: number, y: number) {
    if (object.getData("tx") === x && object.getData("ty") === y) return;
    object.setData("tx", x);
    object.setData("ty", y);
    this.tweens.killTweensOf(object);
    if (PREFERS_REDUCED_MOTION) {
      object.setPosition(x, y);
      return;
    }
    this.tweens.add({ targets: object, x, y, duration: 160, ease: "Sine.easeOut" });
  }

  private syncPlayers() {
    const active = new Set(world.players.map((p) => p.id));
    for (const [id, object] of this.playerGraphics) {
      if (!active.has(id)) {
        object.destroy();
        this.playerGraphics.delete(id);
      }
    }

    for (const player of world.players) {
      const px = player.position.x * tileSize + tileSize / 2;
      const py = player.position.y * tileSize + tileSize / 2;
      const isMe = player.id === myPlayerId;
      const tokenKey = TEX.token(CLASS_PORTRAIT[player.hunterClass]);

      let object = this.playerGraphics.get(player.id);
      if (!object) {
        const shadow = this.add.ellipse(0, 16, 30, 10, 0x000000, 0.45);
        const token = this.add.image(0, 0, tokenKey).setDisplaySize(tileSize * 0.8, tileSize * 0.8);
        const ring = this.add.circle(0, 0, tileSize * 0.4).setStrokeStyle(3, isMe ? 0x38bdf8 : 0x818cf8);
        ring.setFillStyle(0x000000, 0);
        const label = this.add
          .text(0, -tileSize * 0.62, isMe ? `[${player.rank}] Você` : `[${player.rank}] ${player.name}`, {
            fontSize: "11px", color: "#f8fafc", stroke: "#0f172a", strokeThickness: 3
          })
          .setOrigin(0.5);
        const hpBg = this.add.rectangle(0, -tileSize * 0.47, 32, 4, 0x1e293b);
        const hpBar = this.add.rectangle(-16, -tileSize * 0.47, 32, 4, 0x4ade80).setOrigin(0, 0.5);
        object = this.add.container(px, py, [shadow, token, ring, hpBg, hpBar, label]).setDepth(10 + player.position.y);
        object.setData("hpBar", hpBar);
        object.setData("token", token);
        object.setData("cls", player.hunterClass);
        object.setData("tx", px);
        object.setData("ty", py);
        this.playerGraphics.set(player.id, object);
        if (isMe && !PREFERS_REDUCED_MOTION) {
          this.tweens.add({ targets: ring, alpha: { from: 1, to: 0.45 }, yoyo: true, duration: 900, repeat: -1 });
        }
      } else {
        const hpBar = object.getData("hpBar") as Phaser.GameObjects.Rectangle;
        hpBar.width = Math.max(0, (32 * player.hp) / player.maxHp);
        if (object.getData("cls") !== player.hunterClass) {
          (object.getData("token") as Phaser.GameObjects.Image).setTexture(tokenKey).setDisplaySize(tileSize * 0.8, tileSize * 0.8);
          object.setData("cls", player.hunterClass);
        }
        object.setDepth(10 + player.position.y);
        this.moveTo(object, px, py);
      }
    }
  }

  private syncEnemies() {
    const active = new Set(world.enemies.map((e) => e.id));
    for (const [id, object] of this.enemyGraphics) {
      if (!active.has(id)) {
        object.destroy();
        this.enemyGraphics.delete(id);
      }
    }

    for (const enemy of world.enemies) {
      const px = enemy.position.x * tileSize + tileSize / 2;
      const py = enemy.position.y * tileSize + tileSize / 2;

      let object = this.enemyGraphics.get(enemy.id);
      if (!object) {
        const sprite = this.add.image(0, 0, enemyTextureKey(enemy.name));
        const label = this.add
          .text(0, -tileSize * 0.62, `[${enemy.rank}] ${enemy.name}`, {
            fontSize: "11px", color: "#e2e8f0", stroke: "#022c22", strokeThickness: 3
          })
          .setOrigin(0.5);
        const barBg = this.add.rectangle(0, -tileSize * 0.47, 34, 4, 0x1e293b);
        const hpBar = this.add.rectangle(-17, -tileSize * 0.47, 34, 4, 0xf43f5e).setOrigin(0, 0.5);
        object = this.add.container(px, py, [sprite, barBg, hpBar, label]).setDepth(10 + enemy.position.y);
        object.setData("hpBar", hpBar);
        object.setData("tx", px);
        object.setData("ty", py);
        this.enemyGraphics.set(enemy.id, object);
        if (!PREFERS_REDUCED_MOTION) {
          this.tweens.add({ targets: sprite, y: -3, yoyo: true, duration: 650 + Math.random() * 400, repeat: -1, ease: "Sine.easeInOut" });
        }
      } else {
        const hpBar = object.getData("hpBar") as Phaser.GameObjects.Rectangle;
        hpBar.width = Math.max(0, (34 * enemy.hp) / enemy.maxHp);
        object.setAlpha(enemy.alive ? 1 : 0);
        this.moveTo(object, px, py);
      }
    }
  }
}

// Fundo do arena de batalha: arte enviada (guilda)
battleScreen.style.setProperty("--battle-banner", `url("${GUILD_BANNER_URL}")`);

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: gridWidth * tileSize,
  height: gridHeight * tileSize,
  backgroundColor: "#05070d",
  render: { antialias: true, pixelArt: false },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [WorldScene],
  fps: { target: 60, forceSetTimeOut: false }
});
