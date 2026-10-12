import { Inject, Injectable, Optional } from "@nestjs/common";
import {
  DEFAULT_PLAYER_ATTRIBUTES,
  MISSIONS,
  RANK_CAP,
  STARTING_STAT_POINTS,
  STAT_POINTS_PER_LEVEL,
  applyExp,
  expToNext,
  isRankAllowed,
  mobExp,
  statMult,
  type AllocateStatsRequest,
  type BattleRewards,
  type BattleSnapshot,
  type CombatLog,
  type Direction,
  type EnemySnapshot,
  type HunterClass,
  type HunterRank,
  type InventoryState,
  type MissionClaimResult,
  type MissionsState,
  type PlayerSnapshot,
  type RankPromotionResult,
  type ServerErrorCode,
  type TileCoord,
  type WorldId,
  type WorldSnapshot,
  type WorldStyle,
  type ZoneTeleportRequest,
  type ItemDefinition,
  type ItemRarity,
  type EquipmentSlotName,
  type GateClearAnnouncement,
  getNextHunterRank,
  RANK_EXAM_REQUIREMENTS
} from "@rpg/contracts";
import { BattleSession } from "./battle.session";
import { CLOCK, SystemClock, type Clock } from "./clock";
import {
  DEFAULT_CAREER_STATS,
  DEFAULT_EQUIPMENT,
  InMemoryPlayerRepository,
  PLAYER_REPOSITORY,
  type PlayerEntity,
  type PlayerRepository
} from "./player.repository";
import {
  CLASS_STATS,
  calculatePlayerMaxHp,
  calculatePlayerMaxMp,
  calculatePlayerStats
} from "./skills.data";
import { LootService } from "./loot.service";
import { AcademyService } from "./academy.service";
import { BossService } from "./boss.service";
import { MissionsService } from "./missions.service";
import { InventoryService } from "./inventory.service";
import { MASTER_ITEMS } from "./items.data";
import {
  ALL_GATE_WORLDS,
  GATE_D_SPAWN,
  GATE_D_WORLD
} from "./worlds";
import { BattleEngineService } from "./battle-engine.service";
import { TeleportService } from "./teleport.service";
import {
  DEFAULT_OBSTACLES,
  createInitialEnemies
} from "./enemies.data";

export const GRID_WIDTH = 48;
export const GRID_HEIGHT = 28;
export const TILE_SIZE = 48;
export const STEP_COOLDOWN_MS = 200;
export const ATTACK_COOLDOWN_MS = 600;
export const PLAYER_ATTACK_DAMAGE = 30;
/** Respawn lazy: o monstro volta a ficar vivo na próxima leitura do mundo após este intervalo. */
export const ENEMY_RESPAWN_MS = 18_000;

/** Valores de demonstração (apenas fora de NODE_ENV=test): Nível 100 Rank S para teste de lategame! */
const DEMO_LEVEL = 100;
const DEMO_RANK: HunterRank = "S";
const DEMO_EXP = 1000;
const DEMO_STAT_POINTS = 450;
const DEMO_GOLD = 100_000;

/** Amostra de itens épicos, lendários e imortais para teste imediato de lategame. */
const DEMO_SHOWCASE_ITEMS: readonly ItemDefinition[] = [
  MASTER_ITEMS.weapon_dragon_slayer_greatsword,
  MASTER_ITEMS.weapon_kamish_wrath_daggers,
  MASTER_ITEMS.weapon_glacial_scythe,
  MASTER_ITEMS.weapon_frost_dagger,
  MASTER_ITEMS.armor_dragon_scale_armor,
  MASTER_ITEMS.armor_monarch_sanctum_cuirass,
  MASTER_ITEMS.amulet_dragon_heart_gem,
  MASTER_ITEMS.ring_ignis_fury,
  MASTER_ITEMS.potion_red,
  MASTER_ITEMS.potion_blue
].filter(Boolean);

export type StepResult =
  | { success: true; player: PlayerSnapshot }
  | { success: false; error: ServerErrorCode };

export type AttackResult =
  | { success: true; log: CombatLog; player: PlayerSnapshot }
  | { success: false; error: ServerErrorCode };

@Injectable()
export class GameService {
  private readonly obstacleSet = new Set<string>();
  private readonly enemies = new Map<string, EnemySnapshot>(createInitialEnemies());
  private readonly online = new Set<string>();
  private readonly diedAt = new Map<string, number>();
  private sequence = 0;

  private readonly lootService = new LootService();
  private readonly academyService = new AcademyService();
  public readonly bossService = new BossService();
  private readonly missionsService: MissionsService;
  private readonly inventoryService: InventoryService;
  public readonly battleEngineService: BattleEngineService;
  public readonly teleportService: TeleportService;
  private readonly worlds: Record<WorldId, { id: WorldId; style: WorldStyle; width: number; height: number; spawn: TileCoord; obstacles: readonly TileCoord[]; obstacleSet: Set<string> }>;

  constructor(
    @Optional() @Inject(CLOCK) private readonly clock: Clock = new SystemClock(),
    @Optional()
    @Inject(PLAYER_REPOSITORY)
    private readonly playerRepository: PlayerRepository = new InMemoryPlayerRepository()
  ) {
    this.missionsService = new MissionsService(this.lootService);
    this.inventoryService = new InventoryService(this.lootService);
    this.battleEngineService = new BattleEngineService({
      playerRepository: this.playerRepository,
      bossService: this.bossService,
      lootService: this.lootService,
      inventoryService: this.inventoryService,
      enemies: this.enemies,
      killEnemy: (enemy) => this.killEnemy(enemy),
      reviveEnemies: () => this.reviveEnemies(),
      spawnOf: (player) => this.spawnOf(player),
      grantExp: (player, session) => this.grantExp(player, session),
      nextSequence: () => ++this.sequence
    });
    this.teleportService = new TeleportService(
      this.playerRepository,
      this.clock,
      this.bossService,
      (player) => this.toSnapshot(player),
      () => ++this.sequence
    );
    for (const obs of DEFAULT_OBSTACLES) {
      this.obstacleSet.add(`${obs.x},${obs.y}`);
    }
    const pack = (
      id: WorldId,
      style: WorldStyle,
      width: number,
      height: number,
      spawn: TileCoord,
      obstacles: readonly TileCoord[]
    ) => ({
      id,
      style,
      width,
      height,
      spawn,
      obstacles,
      obstacleSet: new Set(obstacles.map((o) => `${o.x},${o.y}`))
    });
    this.worlds = {
      GATE_E: pack("GATE_E", "SANCTUARY", GRID_WIDTH, GRID_HEIGHT, { x: 2, y: 2 }, DEFAULT_OBSTACLES),
      GATE_D: pack("GATE_D", ALL_GATE_WORLDS.GATE_D.style, ALL_GATE_WORLDS.GATE_D.width, ALL_GATE_WORLDS.GATE_D.height, ALL_GATE_WORLDS.GATE_D.spawn, ALL_GATE_WORLDS.GATE_D.obstacles),
      GATE_C: pack("GATE_C", ALL_GATE_WORLDS.GATE_C.style, ALL_GATE_WORLDS.GATE_C.width, ALL_GATE_WORLDS.GATE_C.height, ALL_GATE_WORLDS.GATE_C.spawn, ALL_GATE_WORLDS.GATE_C.obstacles),
      GATE_B: pack("GATE_B", ALL_GATE_WORLDS.GATE_B.style, ALL_GATE_WORLDS.GATE_B.width, ALL_GATE_WORLDS.GATE_B.height, ALL_GATE_WORLDS.GATE_B.spawn, ALL_GATE_WORLDS.GATE_B.obstacles),
      GATE_A: pack("GATE_A", ALL_GATE_WORLDS.GATE_A.style, ALL_GATE_WORLDS.GATE_A.width, ALL_GATE_WORLDS.GATE_A.height, ALL_GATE_WORLDS.GATE_A.spawn, ALL_GATE_WORLDS.GATE_A.obstacles),
      GATE_S: pack("GATE_S", ALL_GATE_WORLDS.GATE_S.style, ALL_GATE_WORLDS.GATE_S.width, ALL_GATE_WORLDS.GATE_S.height, ALL_GATE_WORLDS.GATE_S.spawn, ALL_GATE_WORLDS.GATE_S.obstacles),
      GATE_SS: pack("GATE_SS", ALL_GATE_WORLDS.GATE_SS.style, ALL_GATE_WORLDS.GATE_SS.width, ALL_GATE_WORLDS.GATE_SS.height, ALL_GATE_WORLDS.GATE_SS.spawn, ALL_GATE_WORLDS.GATE_SS.obstacles),
      GATE_SSS: pack("GATE_SSS", ALL_GATE_WORLDS.GATE_SSS.style, ALL_GATE_WORLDS.GATE_SSS.width, ALL_GATE_WORLDS.GATE_SSS.height, ALL_GATE_WORLDS.GATE_SSS.spawn, ALL_GATE_WORLDS.GATE_SSS.obstacles)
    };
  }

  get activeBattles() {
    return this.battleEngineService.activeBattles;
  }

  get dimensions() {
    return this.dimensionsFor("GATE_E");
  }

  dimensionsFor(worldId: WorldId = "GATE_E") {
    const world = this.worlds[worldId] ?? this.worlds.GATE_E;
    return {
      gridWidth: world.width,
      gridHeight: world.height,
      tileSize: TILE_SIZE,
      obstacles: [...world.obstacles],
      worldId: world.id,
      style: world.style
    };
  }

  connect(id: string): PlayerSnapshot {
    const existing = this.playerRepository.findById(id) as PlayerEntity | null;
    const now = this.clock.nowMs();
    this.online.add(id);

    if (existing) {
      // Reconexão (F5, aba nova): batalha em andamento é abandonada, o resto do estado persiste.
      if (existing.activeBattleId) {
        this.battleEngineService.activeBattles.delete(existing.activeBattleId);
        existing.inBattle = false;
        existing.activeBattleId = undefined;
      }
      if (!existing.attributes) {
        existing.attributes = { ...DEFAULT_PLAYER_ATTRIBUTES };
      }
      if (existing.unallocatedStatPoints === undefined) {
        existing.unallocatedStatPoints = STARTING_STAT_POINTS;
      }
      if (!existing.inventory || existing.inventory.length === 0) {
        existing.inventory = this.lootService.createStartingInventory();
      }
      if (!existing.equipment) {
        existing.equipment = { ...DEFAULT_EQUIPMENT };
      }
      if (!existing.careerStats) {
        existing.careerStats = { ...DEFAULT_CAREER_STATS };
      }
      if (existing.gold === undefined) {
        existing.gold = 150;
      }
      if (!existing.unclaimedTrophies) {
        existing.unclaimedTrophies = [];
      }
      if (!existing.worldId) {
        existing.worldId = "GATE_E";
      }

      // Em ambiente interativo (fora de testes unitários), popula para teste do jogador
      if (process.env.NODE_ENV !== "test") {
        if (existing.unallocatedStatPoints < DEMO_STAT_POINTS) {
          existing.unallocatedStatPoints = DEMO_STAT_POINTS;
        }
        if (existing.level < DEMO_LEVEL) {
          existing.level = DEMO_LEVEL;
          existing.exp = DEMO_EXP;
        }
        if (!isRankAllowed(existing.rank, DEMO_RANK)) {
          existing.rank = DEMO_RANK;
        }
        if ((existing.gold ?? 0) < DEMO_GOLD) {
          existing.gold = DEMO_GOLD;
        }
        for (const item of DEMO_SHOWCASE_ITEMS) {
          if (!existing.inventory.some((s) => s.item.id === item.id)) {
            this.lootService.addItemToInventory(existing.inventory, item);
          }
        }
        this.recomputeMaxStats(existing);
        existing.hp = existing.maxHp;
        existing.mp = existing.maxMp;
      }

      existing.lastStepAt = now;
      this.playerRepository.save(existing);
      return this.toSnapshot(existing);
    }

    const defaultClass: HunterClass = "BATTLE_HEALER";
    const isTest = process.env.NODE_ENV === "test";
    const initialLevel = isTest ? 1 : DEMO_LEVEL;
    const initialRank = isTest ? "E" : DEMO_RANK;
    const initialExp = isTest ? 0 : DEMO_EXP;
    const initialPoints = isTest ? STARTING_STAT_POINTS : DEMO_STAT_POINTS;
    const initialHp = calculatePlayerMaxHp(defaultClass, initialLevel, DEFAULT_PLAYER_ATTRIBUTES.vit);
    const initialMp = calculatePlayerMaxMp(defaultClass, initialLevel, DEFAULT_PLAYER_ATTRIBUTES.int);

    const inventory = this.lootService.createStartingInventory();
    if (!isTest) {
      for (const item of DEMO_SHOWCASE_ITEMS) {
        this.lootService.addItemToInventory(inventory, item);
      }
    }

    const newPlayer: PlayerEntity = {
      id,
      name: `Hunter-${id.slice(0, 4)}`,
      rank: initialRank,
      hunterClass: defaultClass,
      level: initialLevel,
      exp: initialExp,
      position: { x: 2, y: 2 },
      worldId: "GATE_E",
      hp: initialHp,
      maxHp: initialHp,
      mp: initialMp,
      maxMp: initialMp,
      stamina: 50,
      maxStamina: 50,
      attributes: { ...DEFAULT_PLAYER_ATTRIBUTES },
      unallocatedStatPoints: initialPoints,
      inBattle: false,
      sequence: ++this.sequence,
      lastStepAt: now,
      lastAttackAt: 0,
      inventory,
      equipment: { ...DEFAULT_EQUIPMENT },
      careerStats: { ...DEFAULT_CAREER_STATS },
      gold: isTest ? 0 : DEMO_GOLD,
      unclaimedTrophies: []
    };

    this.playerRepository.save(newPlayer);
    return this.toSnapshot(newPlayer);
  }

  devSetLevel(playerId: string, targetLevel: number, targetRank?: HunterRank): { success: boolean; player?: PlayerSnapshot } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return { success: false };
    player.level = targetLevel;
    player.rank = targetRank ?? (targetLevel >= 120 ? "SS" : targetLevel >= 80 ? "S" : targetLevel >= 50 ? "B" : targetLevel >= 25 ? "C" : "D");
    player.unallocatedStatPoints = Math.max(player.unallocatedStatPoints, targetLevel * 4);
    this.recomputeMaxStats(player);
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    player.sequence = ++this.sequence;
    this.playerRepository.save(player);
    return { success: true, player: this.toSnapshot(player) };
  }

  disconnect(id: string) {
    this.online.delete(id);
    const player = this.playerRepository.findById(id) as PlayerEntity | null;
    if (player && player.activeBattleId) {
      this.battleEngineService.activeBattles.delete(player.activeBattleId);
      player.inBattle = false;
      player.activeBattleId = undefined;
      this.playerRepository.save(player);
    }
  }

  selectClass(id: string, hunterClass: HunterClass): PlayerSnapshot | null {
    const player = this.playerRepository.findById(id) as PlayerEntity | null;
    if (!player || player.inBattle) return null;

    player.hunterClass = hunterClass;
    this.recomputeMaxStats(player);
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    player.sequence = ++this.sequence;
    this.playerRepository.save(player);

    return this.toSnapshot(player);
  }

  step(id: string, direction: Direction): StepResult {
    const player = this.playerRepository.findById(id) as PlayerEntity | null;
    if (!player) {
      return { success: false, error: "OUT_OF_BOUNDS" };
    }
    this.reviveEnemies();

    if (player.inBattle) {
      if (!player.activeBattleId || !this.battleEngineService.activeBattles.has(player.activeBattleId)) {
        player.inBattle = false;
        player.activeBattleId = undefined;
        this.playerRepository.save(player);
      } else {
        const session = this.battleEngineService.activeBattles.get(player.activeBattleId);
        if (session && session.finished) {
          player.inBattle = false;
          player.activeBattleId = undefined;
          this.battleEngineService.activeBattles.delete(session.battleId);
          this.playerRepository.save(player);
        } else {
          return { success: false, error: "ALREADY_IN_BATTLE" };
        }
      }
    }

    const now = this.clock.nowMs();
    if (now - player.lastStepAt < STEP_COOLDOWN_MS) {
      return { success: false, error: "TOO_FAST" };
    }

    const delta = this.getDirectionDelta(direction);
    const targetX = player.position.x + delta.dx;
    const targetY = player.position.y + delta.dy;
    const worldId = player.worldId ?? "GATE_E";

    if (!this.isInBounds(worldId, targetX, targetY)) {
      return { success: false, error: "OUT_OF_BOUNDS" };
    }

    if (this.isObstacle(worldId, targetX, targetY)) {
      return { success: false, error: "OBSTACLE" };
    }

    // Check if an alive enemy in the same world blocks this tile
    for (const enemy of this.enemies.values()) {
      if ((enemy.worldId ?? "GATE_E") !== worldId) continue;
      if (enemy.alive && enemy.position.x === targetX && enemy.position.y === targetY) {
        return { success: false, error: "OBSTACLE" };
      }
    }

    player.position = { x: targetX, y: targetY };
    player.lastStepAt = now;
    player.sequence = ++this.sequence;
    this.playerRepository.save(player);

    return { success: true, player: this.toSnapshot(player) };
  }

  getActiveBattleForPlayer(playerId: string): BattleSnapshot | null {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return null;
    return this.battleEngineService.getActiveBattle(player);
  }

  startBattle(
    playerId: string,
    targetEnemyId: string
  ): { success: boolean; battle?: BattleSnapshot; error?: ServerErrorCode } {
    return this.battleEngineService.startBattle(playerId, targetEnemyId);
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
    return this.battleEngineService.executeBattleAction(playerId, battleId, actionId);
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
    return this.battleEngineService.useCombatConsumable(playerId, battleId, itemId);
  }

  fleeBattle(
    playerId: string,
    battleId: string
  ): { success: boolean; battle?: BattleSnapshot; error?: ServerErrorCode } {
    return this.battleEngineService.fleeBattle(playerId, battleId);
  }

  private grantExp(player: PlayerEntity, session: BattleSession): void {
    const before = { level: player.level, exp: player.exp };
    const result = applyExp(player, session.rewardExp);
    player.level = result.level;
    player.exp = result.exp;

    if (result.level > before.level) {
      const levelsGained = result.level - before.level;
      player.unallocatedStatPoints =
        (player.unallocatedStatPoints ?? 0) + levelsGained * STAT_POINTS_PER_LEVEL;
      // Level up: stats escalam e HP/MP voltam cheios.
      this.recomputeMaxStats(player);
      player.hp = player.maxHp;
      player.mp = player.maxMp;
    }

    session.rewards = {
      expGained: session.rewardExp,
      levelBefore: before.level,
      levelAfter: result.level,
      expBefore: before.exp,
      expAfter: result.exp,
      capped: result.capped,
      levelCap: RANK_CAP[player.rank]
    };
  }

  private recomputeMaxStats(player: PlayerEntity): void {
    player.maxHp = calculatePlayerMaxHp(
      player.hunterClass,
      player.level,
      player.attributes?.vit ?? 10,
      player.equipment
    );
    player.maxMp = calculatePlayerMaxMp(
      player.hunterClass,
      player.level,
      player.attributes?.int ?? 10,
      player.equipment
    );
  }

  private killEnemy(enemy: EnemySnapshot): void {
    enemy.alive = false;
    this.diedAt.set(enemy.id, this.clock.nowMs());
  }

  /** Respawn lazy (ADR 5): sem timers, avalia o tempo decorrido ao ler o mundo. */
  private reviveEnemies(): void {
    const now = this.clock.nowMs();
    this.bossService.reviveBosses(now);
    const players = this.playerRepository.findAll() as PlayerEntity[];
    for (const enemy of this.enemies.values()) {
      if (enemy.alive) continue;
      const died = this.diedAt.get(enemy.id);
      if (died === undefined || now - died < ENEMY_RESPAWN_MS) continue;
      const occupied = players.some(
        (p) =>
          (p.worldId ?? "GATE_E") === (enemy.worldId ?? "GATE_E") &&
          p.position.x === enemy.position.x &&
          p.position.y === enemy.position.y
      );
      if (occupied) continue; // espera o tile ficar livre
      enemy.alive = true;
      enemy.hp = enemy.maxHp;
      enemy.mp = enemy.maxMp;
      this.diedAt.delete(enemy.id);
    }
  }

  // Backwards-compatible legacy quick attack method
  attack(attackerId: string, targetId: string): AttackResult {
    const player = this.playerRepository.findById(attackerId) as PlayerEntity | null;
    const enemy = this.enemies.get(targetId);

    if (!player || !enemy || !enemy.alive) {
      return { success: false, error: "TARGET_UNAVAILABLE" };
    }
    if ((enemy.worldId ?? "GATE_E") !== (player.worldId ?? "GATE_E")) {
      return { success: false, error: "TARGET_UNAVAILABLE" };
    }

    const dx = Math.abs(player.position.x - enemy.position.x);
    const dy = Math.abs(player.position.y - enemy.position.y);
    if (Math.max(dx, dy) > 1) {
      return { success: false, error: "TOO_FAR" };
    }

    const now = this.clock.nowMs();
    if (now - player.lastAttackAt < ATTACK_COOLDOWN_MS) {
      return { success: false, error: "COOLDOWN" };
    }

    player.lastAttackAt = now;
    enemy.hp = Math.max(0, enemy.hp - PLAYER_ATTACK_DAMAGE);
    enemy.alive = enemy.hp > 0;
    if (!enemy.alive) this.killEnemy(enemy);

    let counterDamage = 0;
    if (enemy.alive) {
      counterDamage = enemy.rank === "D" ? 15 : 10;
      player.hp = Math.max(0, player.hp - counterDamage);
      if (player.hp === 0) {
        player.position = { ...this.spawnOf(player) };
        player.hp = player.maxHp;
      }
    }

    player.sequence = ++this.sequence;
    this.playerRepository.save(player);

    const log: CombatLog = {
      attackerId,
      targetId,
      damage: PLAYER_ATTACK_DAMAGE,
      counterDamage: counterDamage > 0 ? counterDamage : undefined,
      targetHp: enemy.hp,
      attackerHp: player.hp,
      defeated: !enemy.alive,
      sequence: ++this.sequence
    };

    return { success: true, log, player: this.toSnapshot(player) };
  }

  getMissionsState(playerId: string): MissionsState {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    const now = this.clock.nowMs();
    if (!player) {
      return {
        available: [...MISSIONS],
        activeRuns: [],
        activeRun: null,
        maxActiveMissions: 3,
        serverTime: now
      };
    }
    return this.missionsService.getMissionsState(player, now);
  }

  startMission(
    playerId: string,
    missionId: string
  ): { success: boolean; state?: MissionsState; error?: ServerErrorCode } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return { success: false, error: "TARGET_UNAVAILABLE" };

    const res = this.missionsService.startMission(player, missionId, this.clock.nowMs());
    if (res.success) {
      this.playerRepository.save(player);
    }
    return res;
  }

  claimMission(
    playerId: string,
    runId: string
  ): {
    success: boolean;
    result?: MissionClaimResult;
    player?: PlayerSnapshot;
    error?: ServerErrorCode;
  } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return { success: false, error: "TARGET_UNAVAILABLE" };

    const res = this.missionsService.claimMission(player, runId, this.clock.nowMs());
    if (res.success) {
      player.sequence = ++this.sequence;
      this.playerRepository.save(player);
      return { success: true, result: res.result, player: this.toSnapshot(player) };
    }
    return res;
  }

  cancelMission(
    playerId: string,
    runId: string
  ): { success: boolean; state?: MissionsState; error?: ServerErrorCode } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return { success: false, error: "TARGET_UNAVAILABLE" };

    const res = this.missionsService.cancelMission(player, runId, this.clock.nowMs());
    if (res.success) {
      this.playerRepository.save(player);
    }
    return res;
  }

  getInventoryState(playerId: string): InventoryState | null {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return null;
    return this.inventoryService.getInventoryState(player);
  }

  equipItem(
    playerId: string,
    slotIndex: number
  ): { success: boolean; state?: InventoryState; player?: PlayerSnapshot; error?: ServerErrorCode } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return { success: false, error: "TARGET_UNAVAILABLE" };

    const res = this.inventoryService.equipItem(player, slotIndex);
    if (res.success) {
      player.sequence = ++this.sequence;
      this.playerRepository.save(player);
      return { success: true, state: res.state, player: this.toSnapshot(player) };
    }
    return res;
  }

  unequipItem(
    playerId: string,
    slot: EquipmentSlotName
  ): { success: boolean; state?: InventoryState; player?: PlayerSnapshot; error?: ServerErrorCode } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return { success: false, error: "TARGET_UNAVAILABLE" };

    const res = this.inventoryService.unequipItem(player, slot);
    if (res.success) {
      player.sequence = ++this.sequence;
      this.playerRepository.save(player);
      return { success: true, state: res.state, player: this.toSnapshot(player) };
    }
    return res;
  }

  useItem(
    playerId: string,
    slotIndex: number
  ): { success: boolean; state?: InventoryState; player?: PlayerSnapshot; error?: ServerErrorCode } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return { success: false, error: "TARGET_UNAVAILABLE" };

    const res = this.inventoryService.useItem(player, slotIndex);
    if (res.success) {
      player.sequence = ++this.sequence;
      this.playerRepository.save(player);
      return { success: true, state: res.state, player: this.toSnapshot(player) };
    }
    return res;
  }

  promoteRank(
    playerId: string,
    targetRank: HunterRank
  ): { success: boolean; result?: RankPromotionResult; player?: PlayerSnapshot; error?: ServerErrorCode } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return { success: false, error: "TARGET_UNAVAILABLE" };

    const res = this.academyService.evaluatePromotion(player, targetRank);
    if (res.success) {
      this.recomputeMaxStats(player);
      player.sequence = ++this.sequence;
      this.playerRepository.save(player);
      return { success: true, result: res, player: this.toSnapshot(player) };
    }
    return { success: false, result: res };
  }

  sellItem(
    playerId: string,
    slotIndex: number
  ): { success: boolean; state?: InventoryState; player?: PlayerSnapshot; goldEarned?: number; error?: ServerErrorCode } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return { success: false, error: "TARGET_UNAVAILABLE" };

    const res = this.inventoryService.sellItem(player, slotIndex);
    if (res.success) {
      player.sequence = ++this.sequence;
      this.playerRepository.save(player);
      return { success: true, state: res.state, player: this.toSnapshot(player), goldEarned: res.goldEarned };
    }
    return res;
  }

  sellAllJunk(
    playerId: string,
    maxRarity: ItemRarity = "UNCOMMON"
  ): { success: boolean; state?: InventoryState; player?: PlayerSnapshot; goldEarned?: number; itemsSold?: number } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return { success: false, goldEarned: 0, itemsSold: 0, state: { inventory: [], equipment: DEFAULT_EQUIPMENT, careerStats: DEFAULT_CAREER_STATS } };

    const res = this.inventoryService.sellAllJunk(player, maxRarity);
    player.sequence = ++this.sequence;
    this.playerRepository.save(player);
    return { success: true, state: res.state, player: this.toSnapshot(player), goldEarned: res.goldEarned, itemsSold: res.itemsSold };
  }

  teleportPlayerToZone(
    playerId: string,
    zoneId: ZoneTeleportRequest["zoneId"]
  ): { success: boolean; player?: PlayerSnapshot; error?: ServerErrorCode } {
    return this.teleportService.teleportPlayerToZone(playerId, zoneId);
  }

  interactWithShrine(playerId: string): {
    success: boolean;
    message?: string;
    hpRestored?: number;
    mpRestored?: number;
    player?: PlayerSnapshot;
    error?: ServerErrorCode;
  } {
    return this.teleportService.interactWithShrine(playerId);
  }

  resetGate(
    playerId: string
  ): { success: boolean; announcement: string } {
    this.bossService.resetAllBosses();
    for (const enemy of this.enemies.values()) {
      enemy.alive = true;
      enemy.hp = enemy.maxHp;
      enemy.mp = enemy.maxMp;
    }
    this.diedAt.clear();

    const announcement = "A Fenda Dimensional foi resetada pelo Operador Jin! Todos os monstros e chefes renasceram com poder total!";
    return { success: true, announcement };
  }

  buyMerchantItem(
    playerId: string,
    itemId: string,
    quantity = 1
  ): { success: boolean; state?: InventoryState; player?: PlayerSnapshot; error?: ServerErrorCode } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return { success: false, error: "TARGET_UNAVAILABLE" };

    const itemDef = MASTER_ITEMS[itemId];
    if (!itemDef) return { success: false, error: "ITEM_NOT_FOUND" };

    const prices: Record<string, number> = {
      potion_hp_minor: 30,
      potion_mp_minor: 30,
      potion_hp_greater: 100,
      potion_mp_greater: 100,
      weapon_iron_sword: 120,
      armor_leather_vest: 120,
      armor_iron_shield: 160
    };
    const unitPrice = prices[itemId] ?? 50;
    const totalCost = unitPrice * quantity;

    const currentGold = player.gold ?? 0;
    if (currentGold < totalCost) {
      return { success: false, error: "NOT_ENOUGH_GOLD" };
    }

    if (!player.inventory) player.inventory = [];
    const added = this.lootService.addItemToInventory(player.inventory, itemDef, quantity);
    if (!added) return { success: false, error: "CANNOT_EQUIP" }; // Inventory full

    player.gold = currentGold - totalCost;
    player.sequence = ++this.sequence;
    this.playerRepository.save(player);

    return {
      success: true,
      state: this.inventoryService.getInventoryState(player),
      player: this.toSnapshot(player)
    };
  }

  claimLostTrophy(
    playerId: string,
    trophyId?: string
  ): { success: boolean; state?: InventoryState; player?: PlayerSnapshot; message?: string; error?: ServerErrorCode } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return { success: false, error: "TARGET_UNAVAILABLE" };

    return this.academyService.claimLostTrophy(
      player,
      trophyId,
      this.inventoryService,
      this.lootService,
      (p) => this.toSnapshot(p),
      () => ++this.sequence,
      (p) => this.playerRepository.save(p)
    );
  }

  allocateStats(
    playerId: string,
    allocation: AllocateStatsRequest
  ): { success: boolean; player?: PlayerSnapshot; error?: ServerErrorCode } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return { success: false, error: "TARGET_UNAVAILABLE" };

    if (player.inBattle) {
      return { success: false, error: "CANNOT_ALLOCATE_IN_BATTLE" };
    }

    const cost = allocation.str + allocation.agi + allocation.vit + allocation.int;
    if (cost <= 0) {
      return { success: false, error: "INVALID_PAYLOAD" };
    }
    const available = player.unallocatedStatPoints ?? 0;
    if (cost > available) {
      return { success: false, error: "INSUFFICIENT_STAT_POINTS" };
    }

    if (!player.attributes) {
      player.attributes = { ...DEFAULT_PLAYER_ATTRIBUTES };
    }

    const oldMaxHp = player.maxHp;
    const oldMaxMp = player.maxMp;

    player.attributes.str += allocation.str;
    player.attributes.agi += allocation.agi;
    player.attributes.vit += allocation.vit;
    player.attributes.int += allocation.int;
    player.unallocatedStatPoints = available - cost;

    this.recomputeMaxStats(player);

    if (player.maxHp > oldMaxHp) {
      player.hp = Math.min(player.maxHp, player.hp + (player.maxHp - oldMaxHp));
    }
    if (player.maxMp > oldMaxMp) {
      player.mp = Math.min(player.maxMp, player.mp + (player.maxMp - oldMaxMp));
    }

    player.sequence = ++this.sequence;
    this.playerRepository.save(player);

    return { success: true, player: this.toSnapshot(player) };
  }

  getPlayerWorldId(playerId: string): WorldId {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    return (player?.worldId as WorldId) ?? "GATE_E";
  }

  private spawnOf(player: PlayerEntity): TileCoord {
    const world = this.worlds[player.worldId ?? "GATE_E"] ?? this.worlds.GATE_E;
    return world.spawn;
  }

  snapshot(worldId: WorldId = "GATE_E"): WorldSnapshot {
    this.reviveEnemies();
    const world = this.worlds[worldId] ?? this.worlds.GATE_E;
    // Só jogadores online no mundo especificado
    const allPlayers = (this.playerRepository.findAll() as PlayerEntity[])
      .filter((p) => this.online.has(p.id) && (p.worldId ?? "GATE_E") === worldId)
      .map((p) => this.toSnapshot(p));

    const enemiesInWorld = [
      ...Array.from(this.enemies.values()).filter((e) => (e.worldId ?? "GATE_E") === worldId),
      ...this.bossService.toEnemySnapshots().filter((b) => (b.worldId ?? "GATE_E") === worldId)
    ].map((e) => ({
      ...e,
      position: { ...e.position }
    }));

    return {
      players: allPlayers,
      enemies: enemiesInWorld,
      obstacles: [...world.obstacles],
      serverTime: this.clock.nowMs(),
      worldId: world.id,
      style: world.style,
      gridWidth: world.width,
      gridHeight: world.height
    };
  }

  private toSnapshot(p: PlayerEntity): PlayerSnapshot {
    return {
      id: p.id,
      name: p.name,
      rank: p.rank,
      hunterClass: p.hunterClass,
      level: p.level,
      exp: p.exp,
      expToNext: expToNext(p.level),
      levelCap: RANK_CAP[p.rank],
      position: { ...p.position },
      hp: p.hp,
      maxHp: p.maxHp,
      mp: p.mp,
      maxMp: p.maxMp,
      stamina: p.stamina,
      maxStamina: p.maxStamina,
      stats: calculatePlayerStats(p.hunterClass, p.level, p.attributes, p.equipment),
      attributes: p.attributes ? { ...p.attributes } : { ...DEFAULT_PLAYER_ATTRIBUTES },
      unallocatedStatPoints: p.unallocatedStatPoints ?? 0,
      gold: p.gold ?? 0,
      inBattle: p.inBattle,
      activeBattleId: p.activeBattleId,
      sequence: p.sequence,
      worldId: p.worldId ?? "GATE_E"
    };
  }

  private isInBounds(worldId: WorldId, x: number, y: number): boolean {
    const world = this.worlds[worldId] ?? this.worlds.GATE_E;
    return x >= 0 && x < world.width && y >= 0 && y < world.height;
  }

  private isObstacle(worldId: WorldId, x: number, y: number): boolean {
    const world = this.worlds[worldId] ?? this.worlds.GATE_E;
    return world.obstacleSet.has(`${x},${y}`);
  }

  private getDirectionDelta(dir: Direction): { dx: number; dy: number } {
    switch (dir) {
      case "UP":
        return { dx: 0, dy: -1 };
      case "DOWN":
        return { dx: 0, dy: 1 };
      case "LEFT":
        return { dx: -1, dy: 0 };
      case "RIGHT":
        return { dx: 1, dy: 0 };
    }
  }
}
