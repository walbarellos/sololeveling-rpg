import type { HunterClass, HunterRank, MissionRun, TileCoord } from "@rpg/contracts";

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
  inBattle: boolean;
  activeBattleId?: string;
  sequence: number;
  lastStepAt: number;
  lastAttackAt: number;
  activeMission?: MissionRun;
  lastClaimedMissionRunId?: string;
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
          activeMission: found.activeMission ? { ...found.activeMission } : undefined
        }
      : null;
  }

  save(player: PlayerEntity): void {
    this.store.set(player.id, {
      ...player,
      position: { ...player.position },
      activeMission: player.activeMission ? { ...player.activeMission } : undefined
    });
  }

  delete(id: string): void {
    this.store.delete(id);
  }

  findAll(): PlayerEntity[] {
    return Array.from(this.store.values()).map((p) => ({
      ...p,
      position: { ...p.position },
      activeMission: p.activeMission ? { ...p.activeMission } : undefined
    }));
  }
}
