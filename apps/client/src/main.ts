import Phaser from "phaser";
import {
  BattleSnapshotSchema,
  ClientEvents,
  GateClearAnnouncementSchema,
  InventoryStateSchema,
  MissionClaimResultSchema,
  MissionsStateSchema,
  RankPromotionResultSchema,
  ServerEvents,
  WelcomeSchema,
  WorldSnapshotSchema
} from "@rpg/contracts";
import { battleController } from "./battle/battle.controller";
import { socket } from "./network/game-socket";
import { WorldScene } from "./scenes/world.scene";
import { gameState } from "./state/game-state";
import { academyController } from "./ui/academy.controller";
import { hudController } from "./ui/hud.controller";
import { inventoryController } from "./ui/inventory.controller";
import { missionsController } from "./ui/missions.controller";
import { modalsController } from "./ui/modals.controller";
import { profileController } from "./ui/profile.controller";
import { npcController } from "./ui/npc.controller";
import "./style.css";

let worldScene: WorldScene | null = null;
const getWorldScene = (): WorldScene | null => {
  if (!worldScene && game?.scene) {
    worldScene = game.scene.getScene("world") as WorldScene | null;
  }
  return worldScene;
};

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: 960,
  height: 576,
  backgroundColor: "#030712",
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [WorldScene]
};

const game = new Phaser.Game(config);
game.events.once("ready", () => {
  worldScene = game.scene.getScene("world") as WorldScene;
});

const gateClearBanner = document.querySelector<HTMLDivElement>("#gate-clear-banner");
const gateClearMsg = document.querySelector<HTMLSpanElement>("#gate-clear-message");
let gateClearTimer: ReturnType<typeof setTimeout> | null = null;

function triggerGateClearBanner(bossName: string, slayerName: string) {
  if (gateClearTimer) clearTimeout(gateClearTimer);
  if (gateClearMsg) {
    gateClearMsg.textContent = `${bossName.toUpperCase()} FOI ABATIDO POR ${slayerName.toUpperCase()}! A FENDA FOI PURIFICADA!`;
  }
  gateClearBanner?.classList.remove("hidden");
  gateClearTimer = setTimeout(() => {
    gateClearBanner?.classList.add("hidden");
    gateClearTimer = null;
  }, 6000);
}

socket.on("connect", () => {
  hudController.setConnection("● Gate Conectado", "#4ade80");
  socket.emit(ClientEvents.InventoryRequest);
  socket.emit(ClientEvents.MissionsRequest);
});

socket.on("disconnect", () => {
  hudController.setConnection("○ Desconectado", "#f87171");
});

socket.on(ServerEvents.Welcome, (raw: unknown) => {
  const parsed = WelcomeSchema.safeParse(raw);
  if (!parsed.success) return;
  gameState.myPlayerId = parsed.data.playerId;
  gameState.gridWidth = parsed.data.gridWidth;
  gameState.gridHeight = parsed.data.gridHeight;
  gameState.tileSize = parsed.data.tileSize;
  gameState.obstacles = parsed.data.obstacles;

  getWorldScene()?.updateWorldBounds(gameState.gridWidth, gameState.gridHeight, gameState.tileSize);
  socket.emit(ClientEvents.SnapshotRequest);
  socket.emit(ClientEvents.InventoryRequest);
  socket.emit(ClientEvents.MissionsRequest);
});

socket.on(ServerEvents.Snapshot, (raw: unknown) => {
  const parsed = WorldSnapshotSchema.safeParse(raw);
  if (!parsed.success) return;
  gameState.world = parsed.data;
  gameState.obstacles = parsed.data.obstacles;

  const me = gameState.world.players.find((p) => p.id === gameState.myPlayerId);
  if (me) {
    gameState.lastMe = me;
    if (battleController.pending === 0) {
      hudController.applyHud(me);
    }
  }
  getWorldScene()?.rebuildTerrain();
});

socket.on(ServerEvents.InventoryState, (raw: unknown) => {
  const parsed = InventoryStateSchema.safeParse(raw);
  if (!parsed.success) return;
  gameState.inventory = parsed.data.inventory;
  gameState.equipment = parsed.data.equipment;
  gameState.careerStats = parsed.data.careerStats;

  inventoryController.render();
  if (academyController.isOpen()) {
    academyController.renderExamStatus();
  }
  if (profileController.profileModal && !profileController.profileModal.classList.contains("hidden")) {
    profileController.updateProfileModal();
  }
});

socket.on(ServerEvents.RankPromotionResult, (raw: unknown) => {
  const parsed = RankPromotionResultSchema.safeParse(raw);
  if (!parsed.success) return;
  academyController.renderPromotionResult(parsed.data);
  hudController.setStatus(parsed.data.message);
});

socket.on(ServerEvents.GateClearAnnouncement, (raw: unknown) => {
  const parsed = GateClearAnnouncementSchema.safeParse(raw);
  if (!parsed.success) return;
  gameState.gateClearAnnouncement = parsed.data;
  triggerGateClearBanner(parsed.data.bossName, parsed.data.slayerName);
  hudController.setStatus(`[GATE CLEAR] O Chefe ${parsed.data.bossName} foi purificado por ${parsed.data.slayerName}!`);
});

socket.on(ServerEvents.GateResetAnnouncement, (data: { message?: string }) => {
  const msg = data?.message ?? "A fenda dimensional foi reiniciada pelo Operador Jin!";
  hudController.setStatus(msg);
  triggerGateClearBanner("FENDA REINICIADA", "Operador Jin");
});

socket.on(ServerEvents.MissionsState, (raw: unknown) => {
  const parsed = MissionsStateSchema.safeParse(raw);
  if (!parsed.success) return;
  missionsController.renderMissionsModal(parsed.data);
});

socket.on(ServerEvents.MissionClaimResult, (raw: unknown) => {
  const parsed = MissionClaimResultSchema.safeParse(raw);
  if (!parsed.success) return;
  hudController.setStatus(parsed.data.message);
});

socket.on(ServerEvents.BattleSnapshot, (raw: unknown) => {
  const parsed = BattleSnapshotSchema.safeParse(raw);
  if (!parsed.success) return;
  const prev = gameState.currentBattle;
  const next = parsed.data;
  gameState.currentBattle = next;
  getWorldScene()?.cancelPursuit();
  battleController.enqueue(() =>
    battleController.playTurn(prev && prev.battleId === next.battleId ? prev : null, next)
  );
});

socket.on(ServerEvents.BattleEnded, (raw: unknown) => {
  const parsed = BattleSnapshotSchema.safeParse(raw);
  if (!parsed.success) return;
  const ended = parsed.data;
  gameState.currentBattle = ended;
  battleController.enqueue(() => battleController.finishBattle(ended));
});

socket.on(ServerEvents.SessionReplaced, () => {
  hudController.setConnection("○ Sessão aberta em outra aba", "#fbbf24");
  hudController.setStatus(
    "[AVISO] Este personagem foi aberto em outra aba. Use ?slot=2 na URL para um segundo jogador local."
  );
});

socket.on(ServerEvents.Error, (raw: unknown) => {
  const error = raw as { message?: string; code?: string };
  hudController.setStatus(`[ERRO] ${error?.message ?? "Ação rejeitada pelo servidor"}`);
  getWorldScene()?.onServerError(error?.code);
});

const MAP_KEYS = new Set([
  "arrowup", "arrowdown", "arrowleft", "arrowright",
  "w", "a", "s", "d", "e", "enter", " ", "escape", "i", "c", "m"
]);

window.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  if (gameState.currentBattle) {
    battleController.handleKey(e.key);
    return;
  }

  const target = e.target as HTMLElement | null;
  if (target && (target.tagName === "SELECT" || target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
    return;
  }

  const k = e.key.toLowerCase();
  if (!MAP_KEYS.has(k)) return;

  if (k === "escape") {
    modalsController.closeAllModals();
    getWorldScene()?.cancelPursuit();
    return;
  }

  if (k === "i") {
    e.preventDefault();
    modalsController.menuInventory?.click();
    return;
  }

  if (k === "c") {
    e.preventDefault();
    modalsController.menuStatus?.click();
    return;
  }

  if (k === "m") {
    e.preventDefault();
    modalsController.menuMissions?.click();
    return;
  }

  e.preventDefault();
  getWorldScene()?.handleKey(k);
});

const urlParams = new URLSearchParams(window.location.search);
const initialModal = urlParams.get("modal");
if (initialModal === "inventory") setTimeout(() => modalsController.menuInventory?.click(), 300);
else if (initialModal === "profile" || initialModal === "status") setTimeout(() => modalsController.menuStatus?.click(), 300);
else if (initialModal === "academy") setTimeout(() => modalsController.menuAcademy?.click(), 300);
else if (initialModal === "missions") setTimeout(() => modalsController.menuMissions?.click(), 300);
