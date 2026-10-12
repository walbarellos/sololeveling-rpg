import {
  MISSIONS,
  RANK_CAP,
  STAT_POINTS_PER_LEVEL,
  applyExp,
  isRankAllowed,
  mobExp,
  type BattleRewards,
  type MissionClaimResult,
  type MissionRun,
  type MissionsState,
  type ServerErrorCode
} from "@rpg/contracts";
import type { LootService } from "./loot.service";
import type { PlayerEntity } from "./player.repository";
import { calculatePlayerMaxHp, calculatePlayerMaxMp } from "./skills.data";

export class MissionsService {
  private missionCounter = 0;

  constructor(private readonly lootService: LootService) {}

  getMissionsState(player: PlayerEntity, now: number): MissionsState {
    const activeRuns = player.activeRuns ?? [];
    return {
      available: [...MISSIONS],
      activeRuns,
      activeRun: activeRuns[0] ?? null,
      maxActiveMissions: 3,
      serverTime: now
    };
  }

  startMission(
    player: PlayerEntity,
    missionId: string,
    now: number
  ): { success: boolean; state?: MissionsState; error?: ServerErrorCode } {
    const activeRuns = player.activeRuns ?? [];

    if (activeRuns.length >= 3) {
      return { success: false, error: "MAX_ACTIVE_MISSIONS_REACHED" };
    }

    if (activeRuns.some((r) => r.missionId === missionId)) {
      return { success: false, error: "MISSION_ALREADY_ACTIVE" };
    }

    const mission = MISSIONS.find((m) => m.id === missionId);
    if (!mission) {
      return { success: false, error: "MISSION_NOT_FOUND" };
    }

    if (!isRankAllowed(player.rank, mission.minRank) || player.level < mission.minLevel) {
      return { success: false, error: "MISSION_LOCKED" };
    }

    const runId = `mission-${player.id}-${now}-${++this.missionCounter}`;
    const potentialExp = mobExp(player.level) * mission.killsEquiv;

    const newRun: MissionRun = {
      runId,
      missionId: mission.id,
      name: mission.name,
      startedAt: now,
      endsAt: now + mission.durationMs,
      durationMs: mission.durationMs,
      killsEquiv: mission.killsEquiv,
      potentialExp,
      completed: false
    };

    activeRuns.push(newRun);
    player.activeRuns = activeRuns;
    player.activeMission = activeRuns[0];

    return { success: true, state: this.getMissionsState(player, now) };
  }

  claimMission(
    player: PlayerEntity,
    runId: string,
    now: number
  ): {
    success: boolean;
    result?: MissionClaimResult;
    error?: ServerErrorCode;
  } {
    const activeRuns = player.activeRuns ?? [];
    const runIdx = activeRuns.findIndex((r) => r.runId === runId);

    if (runIdx === -1) {
      if (player.lastClaimedMissionRunId === runId) {
        return { success: false, error: "MISSION_ALREADY_CLAIMED" };
      }
      return { success: false, error: "NO_ACTIVE_MISSION" };
    }

    const missionRun = activeRuns[runIdx];

    if (now < missionRun.endsAt) {
      return { success: false, error: "MISSION_IN_PROGRESS" };
    }

    const expGained = missionRun.potentialExp;
    const before = { level: player.level, exp: player.exp };
    const expResult = applyExp(player, expGained);
    player.level = expResult.level;
    player.exp = expResult.exp;

    if (expResult.level > before.level) {
      const levelsGained = expResult.level - before.level;
      player.unallocatedStatPoints =
        (player.unallocatedStatPoints ?? 0) + levelsGained * STAT_POINTS_PER_LEVEL;
      player.maxHp = calculatePlayerMaxHp(player.hunterClass, player.level, player.attributes.vit, player.equipment);
      player.maxMp = calculatePlayerMaxMp(player.hunterClass, player.level, player.attributes.int, player.equipment);
      player.hp = player.maxHp;
      player.mp = player.maxMp;
    }

    const rewards: BattleRewards = {
      expGained,
      levelBefore: before.level,
      levelAfter: expResult.level,
      expBefore: before.exp,
      expAfter: expResult.exp,
      capped: expResult.capped,
      levelCap: RANK_CAP[player.rank]
    };

    // Chance de drop de item na conclusão da missão (30%; quando cai, o item é garantido)
    let dropMsg = "";
    if (Math.random() < 0.30) {
      const drop = this.lootService.rollMonsterDrop(player.level, false, true);
      if (drop && player.inventory) {
        this.lootService.addItemToInventory(player.inventory, drop);
        if (player.careerStats) {
          this.lootService.recordItemDrop(player.careerStats, drop);
        }
        dropMsg = ` Recompensa bônus da Associação: [${drop.name}]!`;
      }
    }

    if (player.careerStats) {
      player.careerStats.missionsCompleted += 1;
    }

    player.lastClaimedMissionRunId = runId;
    activeRuns.splice(runIdx, 1);
    player.activeRuns = activeRuns;
    player.activeMission = activeRuns[0];

    const result: MissionClaimResult = {
      success: true,
      runId,
      missionId: missionRun.missionId,
      expGained,
      rewards,
      message: `Missão "${missionRun.name}" concluída com sucesso! +${expGained} EXP coletados.${dropMsg}`
    };

    return { success: true, result };
  }

  cancelMission(
    player: PlayerEntity,
    runId: string,
    now: number
  ): { success: boolean; state?: MissionsState; error?: ServerErrorCode } {
    const activeRuns = player.activeRuns ?? [];
    const runIdx = activeRuns.findIndex((r) => r.runId === runId);

    if (runIdx === -1) {
      return { success: false, error: "NO_ACTIVE_MISSION" };
    }

    activeRuns.splice(runIdx, 1);
    player.activeRuns = activeRuns;
    player.activeMission = activeRuns[0];

    return { success: true, state: this.getMissionsState(player, now) };
  }
}
