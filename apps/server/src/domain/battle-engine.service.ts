import {
  RANK_CAP,
  type BattleSnapshot,
  type EnemySnapshot,
  type GateClearAnnouncement,
  type InventoryState,
  type ItemDefinition,
  type ServerErrorCode
} from "@rpg/contracts";
import { BattleSession } from "./battle.session";
import type { BossService } from "./boss.service";
import type { InventoryService } from "./inventory.service";
import { MASTER_ITEMS } from "./items.data";
import type { LootService } from "./loot.service";
import {
  DEFAULT_CAREER_STATS,
  type PlayerEntity,
  type PlayerRepository
} from "./player.repository";

export interface BattleEngineDependencies {
  playerRepository: PlayerRepository;
  bossService: BossService;
  lootService: LootService;
  inventoryService: InventoryService;
  enemies: Map<string, EnemySnapshot>;
  killEnemy: (enemy: EnemySnapshot) => void;
  reviveEnemies: () => void;
  spawnOf: (player: PlayerEntity) => { x: number; y: number };
  grantExp: (player: PlayerEntity, session: BattleSession) => void;
  nextSequence: () => number;
}

export class BattleEngineService {
  public readonly activeBattles = new Map<string, BattleSession>();
  private battleCounter = 0;

  constructor(private readonly deps: BattleEngineDependencies) {}

  getActiveBattle(player: PlayerEntity): BattleSnapshot | null {
    if (!player.activeBattleId) return null;
    const session = this.activeBattles.get(player.activeBattleId);
    if (!session || session.finished) return null;
    return session.toSnapshot();
  }

  startBattle(
    playerId: string,
    targetEnemyId: string
  ): { success: boolean; battle?: BattleSnapshot; error?: ServerErrorCode } {
    this.deps.reviveEnemies();
    const player = this.deps.playerRepository.findById(playerId) as PlayerEntity | null;
    let enemy = this.deps.enemies.get(targetEnemyId);

    if (!enemy) {
      const boss = this.deps.bossService.getBoss(targetEnemyId);
      if (boss && boss.alive) {
        enemy = {
          id: boss.id,
          name: boss.name,
          rank: boss.rank,
          level: boss.level,
          position: { ...boss.position },
          hp: boss.currentHp,
          maxHp: boss.maxHp,
          mp: 100,
          maxMp: 100,
          alive: boss.alive,
          worldId: boss.worldId
        };
      }
    }

    if (!player || !enemy || !enemy.alive) {
      return { success: false, error: "TARGET_UNAVAILABLE" };
    }

    if ((enemy.worldId ?? "GATE_E") !== (player.worldId ?? "GATE_E")) {
      return { success: false, error: "TARGET_UNAVAILABLE" };
    }

    if (player.inBattle) {
      if (player.activeBattleId && this.activeBattles.has(player.activeBattleId)) {
        const existingSession = this.activeBattles.get(player.activeBattleId)!;
        if (!existingSession.finished) {
          return { success: true, battle: existingSession.toSnapshot() };
        }
      }
      player.inBattle = false;
      player.activeBattleId = undefined;
      this.deps.playerRepository.save(player);
    }

    // Proximity check: Chebyshev distance <= 1
    const dx = Math.abs(player.position.x - enemy.position.x);
    const dy = Math.abs(player.position.y - enemy.position.y);
    if (Math.max(dx, dy) > 1) {
      return { success: false, error: "TOO_FAR" };
    }

    const battleId = `battle-${++this.battleCounter}`;
    const session = new BattleSession(battleId, player, enemy);
    this.activeBattles.set(battleId, session);

    player.inBattle = true;
    player.activeBattleId = battleId;
    player.sequence = this.deps.nextSequence();
    this.deps.playerRepository.save(player);

    return { success: true, battle: session.toSnapshot() };
  }

  executeBattleAction(
    playerId: string,
    battleId: string,
    actionId: string
  ): {
    success: boolean;
    battle?: BattleSnapshot;
    announcement?: GateClearAnnouncement;
    error?: ServerErrorCode;
  } {
    const player = this.deps.playerRepository.findById(playerId) as PlayerEntity | null;
    const session = this.activeBattles.get(battleId);

    if (!player || !session || session.player.id !== playerId) {
      return { success: false, error: "BATTLE_NOT_FOUND" };
    }

    const result = session.executeAction(actionId);
    if (!result.success) {
      return { success: false, error: result.error as ServerErrorCode };
    }

    let announcement: GateClearAnnouncement | undefined;
    if (session.finished) {
      const endRes = this.resolveBattleEnd(player, session);
      announcement = endRes.announcement;
    }

    return { success: true, battle: session.toSnapshot(), announcement };
  }

  useCombatConsumable(
    playerId: string,
    battleId: string,
    itemId: string
  ): {
    success: boolean;
    snapshot?: BattleSnapshot;
    inventoryState?: InventoryState;
    error?: ServerErrorCode;
  } {
    const player = this.deps.playerRepository.findById(playerId) as PlayerEntity | null;
    const session = this.activeBattles.get(battleId);

    if (!player || !session || session.player.id !== playerId) {
      return { success: false, error: "BATTLE_NOT_FOUND" };
    }

    const result = this.deps.inventoryService.useCombatConsumable(player, session, itemId);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    if (session.finished) {
      this.resolveBattleEnd(player, session);
    } else {
      this.deps.playerRepository.save(player);
    }

    return {
      success: true,
      snapshot: session.toSnapshot(),
      inventoryState: this.deps.inventoryService.getInventoryState(player)
    };
  }

  fleeBattle(
    playerId: string,
    battleId: string
  ): { success: boolean; battle?: BattleSnapshot; error?: ServerErrorCode } {
    const player = this.deps.playerRepository.findById(playerId) as PlayerEntity | null;
    const session = this.activeBattles.get(battleId);

    if (!player || !session || session.player.id !== playerId) {
      return { success: false, error: "BATTLE_NOT_FOUND" };
    }

    session.flee();
    this.resolveBattleEnd(player, session);

    return { success: true, battle: session.toSnapshot() };
  }

  resolveBattleEnd(
    player: PlayerEntity,
    session: BattleSession
  ): { announcement?: GateClearAnnouncement } {
    player.inBattle = false;
    player.activeBattleId = undefined;
    let announcement: GateClearAnnouncement | undefined;

    const kill = (): void => {
      const enemy = this.deps.enemies.get(session.enemy.id);
      if (enemy) this.deps.killEnemy(enemy);
    };

    if (!player.careerStats) {
      player.careerStats = { ...DEFAULT_CAREER_STATS };
    }
    player.careerStats.criticalHitsDealt += session.turnCareerCounters.crits;
    player.careerStats.attacksDodged += session.turnCareerCounters.dodges;
    player.careerStats.attacksBlocked += session.turnCareerCounters.blocks;

    const droppedItems: ItemDefinition[] = [];
    const giveItem = (item: ItemDefinition): void => {
      if (!player.inventory || !player.careerStats) return;
      if (this.deps.lootService.addItemToInventory(player.inventory, item)) {
        this.deps.lootService.recordItemDrop(player.careerStats, item);
        droppedItems.push(item);
      }
    };

    if (session.result === "VICTORY") {
      if (this.deps.bossService.isBoss(session.enemy.id)) {
        const bossRes = this.deps.bossService.updateBossHp(session.enemy.id, 0);
        if (bossRes.defeated && bossRes.announcement) {
          announcement = {
            ...bossRes.announcement,
            slayerName: player.name
          };
        }
        player.careerStats.gateBossesSlain += 1;

        if (player.inventory) {
          let bossTrophy = MASTER_ITEMS.trophy_goblin_boss_core;
          if (session.enemy.id === "boss_goblin_warlord") {
            bossTrophy = MASTER_ITEMS.trophy_orc_warlord;
          } else if (session.enemy.id === "boss_shadow_wolf") {
            bossTrophy = MASTER_ITEMS.trophy_shadow_wolf_fang;
          } else if (session.enemy.id === "boss-1") {
            bossTrophy = MASTER_ITEMS.trophy_fire_gate_core;
          } else if (session.enemy.id === "boss_brass_gargoyle") {
            bossTrophy = MASTER_ITEMS.trophy_brass_gargoyle;
          } else if (session.enemy.id === "boss_crimson_sentinel") {
            bossTrophy = MASTER_ITEMS.trophy_crimson_heart;
          } else if (session.enemy.id === "boss_frost_giant") {
            bossTrophy = MASTER_ITEMS.trophy_frost_giant;
          } else if (session.enemy.id === "boss_frost_queen") {
            bossTrophy = MASTER_ITEMS.trophy_frost_queen_crystal;
          } else if (session.enemy.id === "boss_death_knight") {
            bossTrophy = MASTER_ITEMS.trophy_death_knight;
          } else if (session.enemy.id === "boss_shadow_lich") {
            bossTrophy = MASTER_ITEMS.trophy_shadow_lich_skull;
          } else if (session.enemy.id === "boss_volcanic_behemoth") {
            bossTrophy = MASTER_ITEMS.trophy_volcanic_behemoth;
          } else if (session.enemy.id === "boss_dragon_ignis") {
            bossTrophy = MASTER_ITEMS.trophy_dragon_heart;
          } else if (session.enemy.id === "boss_god_statue_high_priest") {
            bossTrophy = MASTER_ITEMS.trophy_god_statue_high_priest;
          } else if (session.enemy.id === "boss_god_statue") {
            bossTrophy = MASTER_ITEMS.trophy_god_statue_fragment;
          } else if (session.enemy.id === "boss_astral_herald") {
            bossTrophy = MASTER_ITEMS.trophy_astral_herald;
          } else if (session.enemy.id === "boss_cosmic_avatar") {
            bossTrophy = MASTER_ITEMS.trophy_cosmic_core;
          } else if (session.enemy.id === "boss_igris_red_knight") {
            bossTrophy = MASTER_ITEMS.trophy_igris_blade;
          } else if (session.enemy.id === "boss_shadow_monarch") {
            bossTrophy = MASTER_ITEMS.trophy_shadow_sovereign_crown;
          } else if (session.enemy.id === "worldboss_kamish") {
            bossTrophy = MASTER_ITEMS.trophy_kamish_wrath;
          }

          if (this.deps.lootService.addItemToInventory(player.inventory, bossTrophy)) {
            this.deps.lootService.recordItemDrop(player.careerStats, bossTrophy);
            droppedItems.push(bossTrophy);
          } else {
            if (!player.unclaimedTrophies) player.unclaimedTrophies = [];
            player.unclaimedTrophies.push(bossTrophy.id);
            session.log.push(
              `[MOCHILA CHEIA] ${bossTrophy.name} foi retido em custódia com o Inspetor Baek na Associação!`
            );
          }

          if (session.enemy.id === "boss-1" && !player.inventory.some((s) => s.item.id === "trophy_goblin_boss_core")) {
            giveItem(MASTER_ITEMS.trophy_goblin_boss_core);
          }

          const bossLoot = this.deps.lootService.rollMonsterDrop(session.enemy.level, true);
          if (bossLoot) giveItem(bossLoot);
        }
      } else {
        kill();
        player.careerStats.regularMonstersSlain += 1;

        if (player.inventory) {
          const mobLoot = this.deps.lootService.rollMonsterDrop(session.enemy.level, false);
          if (mobLoot) giveItem(mobLoot);
        }
      }
      player.hp = Math.max(1, session.player.hp);
      player.mp = Math.max(0, session.player.mp);
    } else if (session.result === "DEFEAT") {
      if (this.deps.bossService.isBoss(session.enemy.id)) {
        this.deps.bossService.updateBossHp(session.enemy.id, session.enemy.hp);
      }
      player.position = { ...this.deps.spawnOf(player) };
      player.hp = player.maxHp;
      player.mp = player.maxMp;
    } else if (session.result === "DRAW") {
      if (session.drawReason === "TURN_LIMIT" || (session.player.hp > 0 && session.enemy.hp > 0)) {
        if (this.deps.bossService.isBoss(session.enemy.id)) {
          this.deps.bossService.updateBossHp(session.enemy.id, session.enemy.hp);
        } else {
          const enemy = this.deps.enemies.get(session.enemy.id);
          if (enemy) enemy.hp = Math.max(1, session.enemy.hp);
        }
        player.hp = Math.max(1, session.player.hp);
        player.mp = Math.max(0, session.player.mp);
      } else {
        if (this.deps.bossService.isBoss(session.enemy.id)) {
          this.deps.bossService.updateBossHp(session.enemy.id, 0);
        } else {
          kill();
        }
        player.position = { ...this.deps.spawnOf(player) };
        player.hp = Math.floor(player.maxHp * 0.5);
        player.mp = Math.floor(player.maxMp * 0.5);
      }
    } else if (session.result === "FLED") {
      if (this.deps.bossService.isBoss(session.enemy.id)) {
        this.deps.bossService.updateBossHp(session.enemy.id, session.enemy.hp);
      }
      player.hp = Math.max(1, session.player.hp);
      player.mp = Math.max(0, session.player.mp);
    }

    if (session.rewardExp > 0) {
      this.deps.grantExp(player, session);
    } else if (session.result === "VICTORY") {
      session.rewards = {
        expGained: 0,
        levelBefore: player.level,
        levelAfter: player.level,
        expBefore: player.exp,
        expAfter: player.exp,
        capped: true,
        levelCap: RANK_CAP[player.rank]
      };
    }
    if (droppedItems.length > 0 && session.rewards) {
      session.rewards.drops = droppedItems.map((i) => ({ ...i }));
    }

    player.sequence = this.deps.nextSequence();
    this.deps.playerRepository.save(player);
    this.activeBattles.delete(session.battleId);

    return { announcement };
  }
}
