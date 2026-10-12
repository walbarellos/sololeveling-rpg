import type {
  BattleSnapshot,
  GateClearAnnouncement,
  HunterCareerStats,
  HunterClass,
  InventorySlot,
  MissionsState,
  PlayerEquipment,
  PlayerSnapshot,
  TileCoord,
  WorldSnapshot
} from "@rpg/contracts";

export interface GameState {
  world: WorldSnapshot;
  myPlayerId: string;
  lastMe: PlayerSnapshot | null;
  gridWidth: number;
  gridHeight: number;
  tileSize: number;
  obstacles: TileCoord[];
  currentBattle: BattleSnapshot | null;
  currentHunterClass: HunterClass;
  currentMissionsState: MissionsState | null;
  inventory: InventorySlot[];
  equipment: PlayerEquipment;
  careerStats: HunterCareerStats;
  gateClearAnnouncement: GateClearAnnouncement | null;
}

export const gameState: GameState = {
  world: { players: [], enemies: [], obstacles: [], serverTime: 0 },
  myPlayerId: "",
  lastMe: null,
  gridWidth: 48,
  gridHeight: 28,
  tileSize: 48,
  obstacles: [],
  currentBattle: null,
  currentHunterClass: "BATTLE_HEALER",
  currentMissionsState: null,
  inventory: [],
  equipment: { weapon: null, armor: null, amulet: null, ring: null },
  careerStats: {
    criticalHitsDealt: 0,
    attacksDodged: 0,
    attacksBlocked: 0,
    regularMonstersSlain: 0,
    gateBossesSlain: 0,
    totalItemsDropped: 0,
    highestRarityDropped: null,
    bestItemDroppedName: null,
    missionsCompleted: 0
  },
  gateClearAnnouncement: null
};

export const CLASS_TITLES: Record<HunterClass, string> = {
  BATTLE_HEALER: "Curandeiro de Combate (Sagrado)",
  ASSASSIN: "Assassino de Sombras (Físico/Ágil)",
  WARRIOR: "Guerreiro Guardião (Físico/Tanque)",
  MAGE: "Mago Dimensional (Mágico/Arcano)"
};

export function getMyPlayer(): PlayerSnapshot | undefined {
  return gameState.world.players.find((p) => p.id === gameState.myPlayerId);
}
