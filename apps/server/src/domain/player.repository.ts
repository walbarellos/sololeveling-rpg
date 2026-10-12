import {
  DEFAULT_PLAYER_ATTRIBUTES,
  STARTING_STAT_POINTS,
  type HunterCareerStats,
  type HunterClass,
  type HunterRank,
  type InventorySlot,
  type MissionRun,
  type PlayerAttributes,
  type PlayerEquipment,
  type TileCoord
} from "@rpg/contracts";

export const DEFAULT_CAREER_STATS: HunterCareerStats = {
  criticalHitsDealt: 0,
  attacksDodged: 0,
  attacksBlocked: 0,
  regularMonstersSlain: 0,
  gateBossesSlain: 0,
  totalItemsDropped: 0,
  highestRarityDropped: null,
  bestItemDroppedName: null,
  missionsCompleted: 0
};

export const DEFAULT_EQUIPMENT: PlayerEquipment = {
  weapon: null,
  armor: null,
  amulet: null,
  ring: null
};

export interface PlayerEntity {
  id: string;
  name: string;
  rank: HunterRank;
  hunterClass: HunterClass;
  level: number;
  /** EXP acumulado dentro do nível atual (0 .. expToNext(level) - 1). */
  exp: number;
  position: TileCoord;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  stamina: number;
  maxStamina: number;
  attributes: PlayerAttributes;
  unallocatedStatPoints: number;
  inBattle: boolean;
  activeBattleId?: string;
  sequence: number;
  lastStepAt: number;
  lastAttackAt: number;
  activeMission?: MissionRun;
  activeRuns?: MissionRun[];
  lastClaimedMissionRunId?: string;
  inventory?: InventorySlot[];
  equipment?: PlayerEquipment;
  careerStats?: HunterCareerStats;
  gold?: number;
  unclaimedTrophies?: string[];
}

export const PLAYER_REPOSITORY = "PLAYER_REPOSITORY";

export interface PlayerRepository {
  findById(id: string): Promise<PlayerEntity | null> | PlayerEntity | null;
  save(player: PlayerEntity): Promise<void> | void;
  delete(id: string): Promise<void> | void;
  findAll(): Promise<PlayerEntity[]> | PlayerEntity[];
}

export class InMemoryPlayerRepository implements PlayerRepository {
  private readonly store = new Map<string, PlayerEntity>();

  findById(id: string): PlayerEntity | null {
    const found = this.store.get(id);
    return found
      ? {
          ...found,
          position: { ...found.position },
          attributes: found.attributes ? { ...found.attributes } : { ...DEFAULT_PLAYER_ATTRIBUTES },
          unallocatedStatPoints: found.unallocatedStatPoints ?? STARTING_STAT_POINTS,
          activeMission: found.activeMission ? { ...found.activeMission } : undefined,
          activeRuns: found.activeRuns ? [...found.activeRuns] : (found.activeMission ? [{ ...found.activeMission }] : []),
          inventory: found.inventory ? found.inventory.map((s) => ({ ...s, item: { ...s.item } })) : [],
          equipment: found.equipment ? { ...found.equipment } : { ...DEFAULT_EQUIPMENT },
          careerStats: found.careerStats ? { ...found.careerStats } : { ...DEFAULT_CAREER_STATS }
        }
      : null;
  }

  save(player: PlayerEntity): void {
    this.store.set(player.id, {
      ...player,
      position: { ...player.position },
      attributes: player.attributes ? { ...player.attributes } : { ...DEFAULT_PLAYER_ATTRIBUTES },
      unallocatedStatPoints: player.unallocatedStatPoints ?? 0,
      activeMission: player.activeMission ? { ...player.activeMission } : undefined,
      activeRuns: player.activeRuns ? [...player.activeRuns] : [],
      inventory: player.inventory ? player.inventory.map((s) => ({ ...s, item: { ...s.item } })) : [],
      equipment: player.equipment ? { ...player.equipment } : { ...DEFAULT_EQUIPMENT },
      careerStats: player.careerStats ? { ...player.careerStats } : { ...DEFAULT_CAREER_STATS }
    });
  }

  delete(id: string): void {
    this.store.delete(id);
  }

  findAll(): PlayerEntity[] {
    return Array.from(this.store.values()).map((p) => ({
      ...p,
      position: { ...p.position },
      attributes: p.attributes ? { ...p.attributes } : { ...DEFAULT_PLAYER_ATTRIBUTES },
      unallocatedStatPoints: p.unallocatedStatPoints ?? 0,
      activeMission: p.activeMission ? { ...p.activeMission } : undefined,
      activeRuns: p.activeRuns ? [...p.activeRuns] : [],
      inventory: p.inventory ? p.inventory.map((s) => ({ ...s, item: { ...s.item } })) : [],
      equipment: p.equipment ? { ...p.equipment } : { ...DEFAULT_EQUIPMENT },
      careerStats: p.careerStats ? { ...p.careerStats } : { ...DEFAULT_CAREER_STATS }
    }));
  }
}
