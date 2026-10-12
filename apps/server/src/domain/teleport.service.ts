import {
  isRankAllowed,
  type HunterRank,
  type PlayerSnapshot,
  type ServerErrorCode,
  type TileCoord,
  type WorldId,
  type ZoneTeleportRequest
} from "@rpg/contracts";
import type { Clock } from "./clock";
import type { PlayerEntity, PlayerRepository } from "./player.repository";
import type { BossService } from "./boss.service";
import { ALL_GATE_WORLDS } from "./worlds";

export class TeleportService {
  constructor(
    private readonly playerRepository: PlayerRepository,
    private readonly clock: Clock,
    private readonly bossService: BossService,
    private readonly toSnapshot: (player: PlayerEntity) => PlayerSnapshot,
    private readonly nextSequence: () => number
  ) {}

  teleportPlayerToZone(
    playerId: string,
    zoneId: ZoneTeleportRequest["zoneId"]
  ): { success: boolean; player?: PlayerSnapshot; error?: ServerErrorCode } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return { success: false, error: "TARGET_UNAVAILABLE" };
    if (player.inBattle) return { success: false, error: "ALREADY_IN_BATTLE" };

    if (zoneId === "RETURN_GATE_E") {
      player.worldId = "GATE_E";
      player.position = { x: 2, y: 2 };
      player.lastStepAt = this.clock.nowMs();
      player.sequence = this.nextSequence();
      this.playerRepository.save(player);
      return { success: true, player: this.toSnapshot(player) };
    }

    const gateTargetMap: Partial<
      Record<
        ZoneTeleportRequest["zoneId"],
        { worldId: WorldId; minRank: HunterRank; prevBossId?: string; prevTrophyId?: string }
      >
    > = {
      ENTER_GATE_D: { worldId: "GATE_D", minRank: "D", prevBossId: "boss-1", prevTrophyId: "trophy_goblin_boss_core" },
      ENTER_GATE_C: { worldId: "GATE_C", minRank: "C", prevBossId: "boss_crimson_sentinel", prevTrophyId: "trophy_crimson_heart" },
      ENTER_GATE_B: { worldId: "GATE_B", minRank: "B", prevBossId: "boss_frost_queen", prevTrophyId: "trophy_frost_queen_crystal" },
      ENTER_GATE_A: { worldId: "GATE_A", minRank: "A", prevBossId: "boss_shadow_lich", prevTrophyId: "trophy_shadow_lich_skull" },
      ENTER_GATE_S: { worldId: "GATE_S", minRank: "S", prevBossId: "boss_dragon_ignis", prevTrophyId: "trophy_dragon_heart" },
      ENTER_GATE_SS: { worldId: "GATE_SS", minRank: "SS", prevBossId: "boss_god_statue", prevTrophyId: "trophy_god_statue_fragment" },
      ENTER_GATE_SSS: { worldId: "GATE_SSS", minRank: "SSS", prevBossId: "boss_cosmic_avatar", prevTrophyId: "trophy_cosmic_core" }
    };

    const gateTarget = gateTargetMap[zoneId];
    if (gateTarget) {
      const bossDead = gateTarget.prevBossId ? !this.bossService.getBoss(gateTarget.prevBossId)?.alive : false;
      const hasTrophy = gateTarget.prevTrophyId ? player.inventory?.some((s) => s.item.id === gateTarget.prevTrophyId) : false;
      const rankAllowed = isRankAllowed(player.rank, gateTarget.minRank);

      if (!rankAllowed && !bossDead && !hasTrophy) {
        return { success: false, error: "ZONE_LOCKED" };
      }

      const worldGeo = ALL_GATE_WORLDS[gateTarget.worldId];
      player.worldId = gateTarget.worldId;
      player.position = { ...(worldGeo?.spawn ?? { x: 3, y: 9 }) };
      player.lastStepAt = this.clock.nowMs();
      player.sequence = this.nextSequence();
      this.playerRepository.save(player);
      return { success: true, player: this.toSnapshot(player) };
    }

    player.worldId = "GATE_E";
    const zoneMinRank: Record<string, HunterRank> = {
      SANTUARIO: "E",
      CATACUMBAS: "E",
      COVIL: "D",
      ABISMO: "D",
      CHAMBER: "C"
    };

    const minRank = zoneMinRank[zoneId] ?? "E";
    if (!isRankAllowed(player.rank, minRank)) {
      return { success: false, error: "ZONE_LOCKED" };
    }

    const zoneCoords: Record<string, TileCoord> = {
      SANTUARIO: { x: 2, y: 2 },
      CATACUMBAS: { x: 18, y: 5 },
      COVIL: { x: 6, y: 21 },
      ABISMO: { x: 22, y: 20 },
      CHAMBER: { x: 38, y: 13 }
    };

    const targetPos = zoneCoords[zoneId];
    if (!targetPos) return { success: false, error: "ZONE_NOT_FOUND" };

    player.position = { ...targetPos };
    player.lastStepAt = this.clock.nowMs();
    player.sequence = this.nextSequence();
    this.playerRepository.save(player);

    return { success: true, player: this.toSnapshot(player) };
  }

  interactWithShrine(playerId: string): {
    success: boolean;
    message?: string;
    hpRestored?: number;
    mpRestored?: number;
    player?: PlayerSnapshot;
    error?: ServerErrorCode;
  } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return { success: false, error: "TARGET_UNAVAILABLE" };
    if (player.inBattle) return { success: false, error: "ALREADY_IN_BATTLE" };

    const worldId = player.worldId ?? "GATE_E";
    const shrines = ALL_GATE_WORLDS[worldId]?.shrines ?? [];
    const nearby = shrines.find(
      (s) => Math.max(Math.abs(player.position.x - s.x), Math.abs(player.position.y - s.y)) <= 2
    );

    if (!nearby) {
      return { success: false, error: "TOO_FAR" };
    }

    const hpRestored = player.maxHp - player.hp;
    const mpRestored = player.maxMp - player.mp;
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    player.sequence = this.nextSequence();
    this.playerRepository.save(player);

    return {
      success: true,
      message: `✨ Você meditou no [${nearby.name}]. Vitalidade e mana completamente restauradas!`,
      hpRestored,
      mpRestored,
      player: this.toSnapshot(player)
    };
  }
}
