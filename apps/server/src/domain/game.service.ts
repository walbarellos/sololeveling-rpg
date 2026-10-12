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
  GATE_D_OBSTACLES,
  GATE_D_SPAWN,
  GATE_D_WORLD
} from "./worlds";

export const GRID_WIDTH = 48;
export const GRID_HEIGHT = 28;
export const TILE_SIZE = 48;
export const STEP_COOLDOWN_MS = 200;
export const ATTACK_COOLDOWN_MS = 600;
export const PLAYER_ATTACK_DAMAGE = 30;
/** Respawn lazy: o monstro volta a ficar vivo na próxima leitura do mundo após este intervalo. */
export const ENEMY_RESPAWN_MS = 18_000;

export interface MobTemplate {
  name: string;
  rank: HunterRank;
  baseHp: number;
  baseMp: number;
  /** Tema visual do bioma: nature | larva | space | hell | swamp | crypt | frost */
  theme: string;
}

/** Valores de demonstração (apenas fora de NODE_ENV=test): nível suficiente para encarar o chefe. */
const DEMO_LEVEL = 9;
const DEMO_EXP = 500;
const DEMO_STAT_POINTS = 40;

/** Amostra de itens de todas as raridades (armas e armaduras) + 1 amuleto e 1 anel, para inspeção visual. */
const DEMO_SHOWCASE_ITEMS: readonly ItemDefinition[] = [
  ...Object.values(MASTER_ITEMS).filter((i) => i.type === "WEAPON" || i.type === "ARMOR"),
  MASTER_ITEMS.amulet_solar_core,
  MASTER_ITEMS.ring_infinite_stars
];

export const MOB_TEMPLATES: Record<string, MobTemplate> = {
  slime: { name: "Dungeon Slime", rank: "E", baseHp: 60, baseMp: 10, theme: "swamp" },
  larva: { name: "Cave Larva", rank: "E", baseHp: 48, baseMp: 6, theme: "larva" },
  goblin: { name: "Gate Goblin", rank: "E", baseHp: 68, baseMp: 14, theme: "crypt" },
  sprout: { name: "Thorn Sprout", rank: "E", baseHp: 52, baseMp: 18, theme: "nature" },
  wolf: { name: "Shadow Wolf", rank: "D", baseHp: 83, baseMp: 21, theme: "crypt" },
  ember: { name: "Ember Imp", rank: "D", baseHp: 72, baseMp: 30, theme: "hell" },
  voidling: { name: "Voidling", rank: "D", baseHp: 78, baseMp: 35, theme: "space" },
  frostbat: { name: "Frost Bat", rank: "D", baseHp: 70, baseMp: 22, theme: "frost" },
  hellhound: { name: "Hell Hound", rank: "C", baseHp: 115, baseMp: 28, theme: "hell" },
  starspawn: { name: "Starspawn", rank: "C", baseHp: 105, baseMp: 42, theme: "space" },
  boss: { name: "Chefe Goblin do Gate", rank: "C", baseHp: 220, baseMp: 50, theme: "crypt" },
  ashguard: { name: "Guarda de Cinzas", rank: "D", baseHp: 120, baseMp: 24, theme: "crimson" },
  brasshound: { name: "Cão de Latão", rank: "D", baseHp: 140, baseMp: 18, theme: "brass" },
  runeblade: { name: "Lâmina Rúnica", rank: "D", baseHp: 128, baseMp: 40, theme: "rune" }
};

export function createEnemyInstance(
  id: string,
  templateKey: keyof typeof MOB_TEMPLATES,
  level: number,
  position: TileCoord,
  worldId: WorldId = "GATE_E"
): EnemySnapshot {
  const template = MOB_TEMPLATES[templateKey];
  const mult = statMult(level);
  const hp = Math.round(template.baseHp * mult);
  const mp = Math.round(template.baseMp * mult);
  return {
    id,
    name: template.name,
    rank: template.rank,
    level,
    position,
    hp,
    maxHp: hp,
    mp,
    maxMp: mp,
    alive: true,
    worldId
  };
}

export const DEFAULT_OBSTACLES: readonly TileCoord[] = [
  // --- SALA 1: Santuário do Gate (0..15, 0..13) ---
  // Pilares interiores (preserva teste no pilar (5, 3))
  { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 },
  { x: 9, y: 2 }, { x: 10, y: 2 },
  { x: 9, y: 9 }, { x: 10, y: 9 },
  // Muralha leste dividindo Sala 1 e Sala 2 (passagem aberta em y=5,6,7)
  { x: 15, y: 0 }, { x: 15, y: 1 }, { x: 15, y: 2 }, { x: 15, y: 3 }, { x: 15, y: 4 },
  { x: 15, y: 8 }, { x: 15, y: 9 }, { x: 15, y: 10 }, { x: 15, y: 11 }, { x: 15, y: 12 }, { x: 15, y: 13 },
  // Muralha sul dividindo Sala 1 e Sala 3 (passagem aberta em x=6,7,8)
  { x: 0, y: 13 }, { x: 1, y: 13 }, { x: 2, y: 13 }, { x: 3, y: 13 }, { x: 4, y: 13 }, { x: 5, y: 13 },
  { x: 9, y: 13 }, { x: 10, y: 13 }, { x: 11, y: 13 }, { x: 12, y: 13 }, { x: 13, y: 13 }, { x: 14, y: 13 },

  // --- SALA 2: Catacumbas Esquecidas (16..31, 0..13) ---
  // Pilares de pedra das catacumbas
  { x: 20, y: 3 }, { x: 21, y: 3 }, { x: 26, y: 3 }, { x: 27, y: 3 },
  { x: 20, y: 9 }, { x: 21, y: 9 }, { x: 26, y: 9 }, { x: 27, y: 9 },
  // Muralha sul dividindo Sala 2 e Sala 4 (passagem aberta em x=23,24,25)
  { x: 16, y: 13 }, { x: 17, y: 13 }, { x: 18, y: 13 }, { x: 19, y: 13 }, { x: 20, y: 13 }, { x: 21, y: 13 }, { x: 22, y: 13 },
  { x: 26, y: 13 }, { x: 27, y: 13 }, { x: 28, y: 13 }, { x: 29, y: 13 }, { x: 30, y: 13 }, { x: 31, y: 13 },
  // Muralha leste dividindo Sala 2 e Sala 5 (A Sala Final) (passagem aberta em y=5,6,7)
  { x: 31, y: 0 }, { x: 31, y: 1 }, { x: 31, y: 2 }, { x: 31, y: 3 }, { x: 31, y: 4 },
  { x: 31, y: 8 }, { x: 31, y: 9 }, { x: 31, y: 10 }, { x: 31, y: 11 }, { x: 31, y: 12 },

  // --- SALA 3: Fenda Vulcânica / Covil das Feras (0..15, 14..27) ---
  // Formações rochosas vulcânicas
  { x: 4, y: 18 }, { x: 5, y: 18 },
  { x: 10, y: 23 }, { x: 11, y: 23 },
  // Muralha leste dividindo Sala 3 e Sala 4 (passagem aberta em y=20,21,22)
  { x: 15, y: 14 }, { x: 15, y: 15 }, { x: 15, y: 16 }, { x: 15, y: 17 }, { x: 15, y: 18 }, { x: 15, y: 19 },
  { x: 15, y: 23 }, { x: 15, y: 24 }, { x: 15, y: 25 }, { x: 15, y: 26 }, { x: 15, y: 27 },

  // --- SALA 4: Abismo Dimensional / Câmara Cósmica (16..31, 14..27) ---
  // Monolitos arcanos
  { x: 21, y: 17 }, { x: 22, y: 17 }, { x: 27, y: 17 }, { x: 28, y: 17 },
  { x: 21, y: 23 }, { x: 22, y: 23 }, { x: 27, y: 23 }, { x: 28, y: 23 },
  // Muralha leste dividindo Sala 4 e Sala 5 (passagem aberta em y=20,21,22)
  { x: 31, y: 14 }, { x: 31, y: 15 }, { x: 31, y: 16 }, { x: 31, y: 17 }, { x: 31, y: 18 }, { x: 31, y: 19 },
  { x: 31, y: 23 }, { x: 31, y: 24 }, { x: 31, y: 25 }, { x: 31, y: 26 }, { x: 31, y: 27 },

  // --- SALA 5: A Sala Final / Câmara do Chefe do Gate (32..47, 0..27) ---
  // Pilares colossais da sala do trono do chefe
  { x: 36, y: 7 }, { x: 37, y: 7 }, { x: 36, y: 8 }, { x: 37, y: 8 },
  { x: 36, y: 19 }, { x: 37, y: 19 }, { x: 36, y: 20 }, { x: 37, y: 20 },
  { x: 43, y: 7 }, { x: 44, y: 7 }, { x: 43, y: 8 }, { x: 44, y: 8 },
  { x: 43, y: 19 }, { x: 44, y: 19 }, { x: 43, y: 20 }, { x: 44, y: 20 }
];

export type StepResult =
  | { success: true; player: PlayerSnapshot }
  | { success: false; error: ServerErrorCode };

export type AttackResult =
  | { success: true; log: CombatLog; player: PlayerSnapshot }
  | { success: false; error: ServerErrorCode };

@Injectable()
export class GameService {
  private readonly obstacleSet = new Set<string>();
  private readonly enemies = new Map<string, EnemySnapshot>([
    // SALA 1: Santuário do Gate (Entrada & Treinamento Rank E, Lv 1–3)
    ["slime-1", createEnemyInstance("slime-1", "slime", 1, { x: 7, y: 4 })],
    ["slime-2", createEnemyInstance("slime-2", "slime", 1, { x: 10, y: 3 })],
    ["larva-1", createEnemyInstance("larva-1", "larva", 1, { x: 3, y: 8 })],
    ["sprout-1", createEnemyInstance("sprout-1", "sprout", 2, { x: 12, y: 10 })],

    // SALA 2: Catacumbas Esquecidas (Rank E/D, Lv 3–5)
    ["goblin-1", createEnemyInstance("goblin-1", "goblin", 3, { x: 22, y: 5 })],
    ["goblin-2", createEnemyInstance("goblin-2", "goblin", 3, { x: 28, y: 6 })],
    ["larva-2", createEnemyInstance("larva-2", "larva", 2, { x: 18, y: 10 })],
    ["frostbat-1", createEnemyInstance("frostbat-1", "frostbat", 4, { x: 25, y: 11 })],

    // SALA 3: Fenda Vulcânica / Covil das Feras (Rank D, Lv 5–7)
    ["wolf-1", createEnemyInstance("wolf-1", "wolf", 5, { x: 6, y: 20 })],
    ["ember-1", createEnemyInstance("ember-1", "ember", 5, { x: 12, y: 22 })],
    ["wolf-2", createEnemyInstance("wolf-2", "wolf", 6, { x: 4, y: 25 })],

    // SALA 4: Abismo Dimensional / Câmara Cósmica (Rank D/C, Lv 7–9)
    ["voidling-1", createEnemyInstance("voidling-1", "voidling", 6, { x: 22, y: 19 })],
    ["hellhound-1", createEnemyInstance("hellhound-1", "hellhound", 8, { x: 26, y: 23 })],
    ["starspawn-1", createEnemyInstance("starspawn-1", "starspawn", 9, { x: 29, y: 17 })],

    // SALA 5: A Sala Final / Câmara do Chefe do Gate (Rank C, Lv 10 Boss gerenciado pelo BossService)
    ["hellhound-2", createEnemyInstance("hellhound-2", "hellhound", 8, { x: 38, y: 11 })],
    ["starspawn-2", createEnemyInstance("starspawn-2", "starspawn", 9, { x: 38, y: 16 })],

    // GATE D — Cidadela Carmesim (mapa próprio, níveis 12–15, superior ao chefe lv 10 do Gate E)
    ["ash-1", createEnemyInstance("ash-1", "ashguard", 12, { x: 15, y: 9 }, "GATE_D")],
    ["ash-2", createEnemyInstance("ash-2", "ashguard", 13, { x: 16, y: 13 }, "GATE_D")],
    ["brass-1", createEnemyInstance("brass-1", "brasshound", 14, { x: 19, y: 8 }, "GATE_D")],
    ["rune-1", createEnemyInstance("rune-1", "runeblade", 14, { x: 25, y: 9 }, "GATE_D")],
    ["rune-2", createEnemyInstance("rune-2", "runeblade", 15, { x: 27, y: 13 }, "GATE_D")]
  ]);
  private readonly activeBattles = new Map<string, BattleSession>();
  private readonly online = new Set<string>();
  private readonly diedAt = new Map<string, number>();
  private sequence = 0;
  private battleCounter = 0;

  private readonly lootService = new LootService();
  private readonly academyService = new AcademyService();
  public readonly bossService = new BossService();
  private readonly missionsService: MissionsService;
  private readonly inventoryService: InventoryService;
  private readonly worlds: Record<
    WorldId,
    {
      id: WorldId;
      style: WorldStyle;
      width: number;
      height: number;
      spawn: TileCoord;
      obstacles: readonly TileCoord[];
      obstacleSet: Set<string>;
    }
  >;

  constructor(
    @Optional() @Inject(CLOCK) private readonly clock: Clock = new SystemClock(),
    @Optional()
    @Inject(PLAYER_REPOSITORY)
    private readonly playerRepository: PlayerRepository = new InMemoryPlayerRepository()
  ) {
    this.missionsService = new MissionsService(this.lootService);
    this.inventoryService = new InventoryService(this.lootService);
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
      GATE_D: pack("GATE_D", GATE_D_WORLD.style, GATE_D_WORLD.width, GATE_D_WORLD.height, GATE_D_SPAWN, GATE_D_OBSTACLES)
    };
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
        this.activeBattles.delete(existing.activeBattleId);
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
      rank: "E",
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
      gold: isTest ? 0 : 250,
      unclaimedTrophies: []
    };

    this.playerRepository.save(newPlayer);
    return this.toSnapshot(newPlayer);
  }

  disconnect(id: string) {
    this.online.delete(id);
    const player = this.playerRepository.findById(id) as PlayerEntity | null;
    if (player && player.activeBattleId) {
      this.activeBattles.delete(player.activeBattleId);
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
      if (!player.activeBattleId || !this.activeBattles.has(player.activeBattleId)) {
        player.inBattle = false;
        player.activeBattleId = undefined;
        this.playerRepository.save(player);
      } else {
        const session = this.activeBattles.get(player.activeBattleId);
        if (session && session.finished) {
          player.inBattle = false;
          player.activeBattleId = undefined;
          this.activeBattles.delete(session.battleId);
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
    if (!player || !player.inBattle || !player.activeBattleId) return null;
    const session = this.activeBattles.get(player.activeBattleId);
    if (!session || session.finished) return null;
    return session.toSnapshot();
  }

  startBattle(
    playerId: string,
    targetEnemyId: string
  ): { success: boolean; battle?: BattleSnapshot; error?: ServerErrorCode } {
    this.reviveEnemies();
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    let enemy = this.enemies.get(targetEnemyId);

    if (!enemy) {
      const boss = this.bossService.getBoss(targetEnemyId);
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
      this.playerRepository.save(player);
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
    player.sequence = ++this.sequence;
    this.playerRepository.save(player);

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
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
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
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    const session = this.activeBattles.get(battleId);

    if (!player || !session || session.player.id !== playerId) {
      return { success: false, error: "BATTLE_NOT_FOUND" };
    }

    const result = this.inventoryService.useCombatConsumable(player, session, itemId);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    if (session.finished) {
      this.resolveBattleEnd(player, session);
    } else {
      this.playerRepository.save(player);
    }

    return {
      success: true,
      snapshot: session.toSnapshot(),
      inventoryState: this.inventoryService.getInventoryState(player)
    };
  }

  fleeBattle(
    playerId: string,
    battleId: string
  ): { success: boolean; battle?: BattleSnapshot; error?: ServerErrorCode } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    const session = this.activeBattles.get(battleId);

    if (!player || !session || session.player.id !== playerId) {
      return { success: false, error: "BATTLE_NOT_FOUND" };
    }

    session.flee();
    this.resolveBattleEnd(player, session);

    return { success: true, battle: session.toSnapshot() };
  }

  private resolveBattleEnd(
    player: PlayerEntity,
    session: BattleSession
  ): { announcement?: GateClearAnnouncement } {
    player.inBattle = false;
    player.activeBattleId = undefined;
    let announcement: GateClearAnnouncement | undefined;

    const kill = (): void => {
      const enemy = this.enemies.get(session.enemy.id);
      if (enemy) this.killEnemy(enemy);
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
      if (this.lootService.addItemToInventory(player.inventory, item)) {
        this.lootService.recordItemDrop(player.careerStats, item);
        droppedItems.push(item);
      }
    };

    if (session.result === "VICTORY") {
      if (this.bossService.isBoss(session.enemy.id)) {
        const bossRes = this.bossService.updateBossHp(session.enemy.id, 0);
        if (bossRes.defeated && bossRes.announcement) {
          announcement = {
            ...bossRes.announcement,
            slayerName: player.name
          };
        }
        player.careerStats.gateBossesSlain += 1;

        if (player.inventory) {
          let bossTrophy = MASTER_ITEMS.trophy_goblin_boss_core;
          if (session.enemy.id === "boss_shadow_wolf") {
            bossTrophy = MASTER_ITEMS.trophy_shadow_wolf_fang;
          } else if (session.enemy.id === "boss-1") {
            bossTrophy = MASTER_ITEMS.trophy_fire_gate_core;
          } else if (session.enemy.id === "boss_crimson_sentinel") {
            bossTrophy = MASTER_ITEMS.trophy_crimson_heart;
          }

          if (this.lootService.addItemToInventory(player.inventory, bossTrophy)) {
            this.lootService.recordItemDrop(player.careerStats, bossTrophy);
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

          const bossLoot = this.lootService.rollMonsterDrop(session.enemy.level, true);
          if (bossLoot) giveItem(bossLoot);
        }
      } else {
        kill();
        player.careerStats.regularMonstersSlain += 1;

        if (player.inventory) {
          const mobLoot = this.lootService.rollMonsterDrop(session.enemy.level, false);
          if (mobLoot) giveItem(mobLoot);
        }
      }
      player.hp = Math.max(1, session.player.hp);
      player.mp = Math.max(0, session.player.mp);
    } else if (session.result === "DEFEAT") {
      if (this.bossService.isBoss(session.enemy.id)) {
        this.bossService.updateBossHp(session.enemy.id, session.enemy.hp);
      }
      player.position = { ...this.spawnOf(player) };
      player.hp = player.maxHp;
      player.mp = player.maxMp;
    } else if (session.result === "DRAW") {
      if (session.drawReason === "TURN_LIMIT" || (session.player.hp > 0 && session.enemy.hp > 0)) {
        if (this.bossService.isBoss(session.enemy.id)) {
          this.bossService.updateBossHp(session.enemy.id, session.enemy.hp);
        } else {
          const enemy = this.enemies.get(session.enemy.id);
          if (enemy) enemy.hp = Math.max(1, session.enemy.hp);
        }
        player.hp = Math.max(1, session.player.hp);
        player.mp = Math.max(0, session.player.mp);
      } else {
        if (this.bossService.isBoss(session.enemy.id)) {
          this.bossService.updateBossHp(session.enemy.id, 0);
        } else {
          kill();
        }
        player.position = { ...this.spawnOf(player) };
        player.hp = Math.floor(player.maxHp * 0.5);
        player.mp = Math.floor(player.maxMp * 0.5);
      }
    } else if (session.result === "FLED") {
      if (this.bossService.isBoss(session.enemy.id)) {
        this.bossService.updateBossHp(session.enemy.id, session.enemy.hp);
      }
      player.hp = Math.max(1, session.player.hp);
      player.mp = Math.max(0, session.player.mp);
    }

    if (session.rewardExp > 0) {
      this.grantExp(player, session);
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

    player.sequence = ++this.sequence;
    this.playerRepository.save(player);
    this.activeBattles.delete(session.battleId);

    return { announcement };
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
    slot: "weapon" | "armor" | "amulet" | "ring"
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
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return { success: false, error: "TARGET_UNAVAILABLE" };
    if (player.inBattle) return { success: false, error: "ALREADY_IN_BATTLE" };

    if (zoneId === "ENTER_GATE_D") {
      if (!isRankAllowed(player.rank, "D")) {
        return { success: false, error: "ZONE_LOCKED" };
      }
      player.worldId = "GATE_D";
      player.position = { ...GATE_D_SPAWN };
      player.lastStepAt = this.clock.nowMs();
      player.sequence = ++this.sequence;
      this.playerRepository.save(player);
      return { success: true, player: this.toSnapshot(player) };
    }

    if (zoneId === "RETURN_GATE_E") {
      player.worldId = "GATE_E";
      player.position = { x: 2, y: 2 };
      player.lastStepAt = this.clock.nowMs();
      player.sequence = ++this.sequence;
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
    player.sequence = ++this.sequence;
    this.playerRepository.save(player);

    return { success: true, player: this.toSnapshot(player) };
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

    let finalTrophyId: string = trophyId ?? "";
    if (!finalTrophyId || !MASTER_ITEMS[finalTrophyId]) {
      const nextRank = getNextHunterRank(player.rank);
      const req = nextRank ? RANK_EXAM_REQUIREMENTS[nextRank] : null;
      finalTrophyId = req?.requiredTrophyItemId ?? "trophy_goblin_boss_core";
    }

    const trophyDef = MASTER_ITEMS[finalTrophyId];
    if (!trophyDef || trophyDef.type !== "TROPHY") return { success: false, error: "ITEM_NOT_FOUND" };

    if (!player.inventory) player.inventory = [];
    const alreadyHas = player.inventory.some((s) => s.item.id === finalTrophyId);
    if (alreadyHas) {
      return {
        success: true,
        state: this.inventoryService.getInventoryState(player),
        player: this.toSnapshot(player),
        message: `Você já possui o troféu oficial [${trophyDef.name}] em seu inventário!`
      };
    }

    const canClaim =
      (player.careerStats && player.careerStats.gateBossesSlain > 0) ||
      (player.unclaimedTrophies && player.unclaimedTrophies.length > 0) ||
      player.level >= 8;

    if (!canClaim) {
      return { success: false, error: "ACADEMY_REQUIREMENTS_UNMET" };
    }

    const added = this.lootService.addItemToInventory(player.inventory, trophyDef);
    if (!added) return { success: false, error: "CANNOT_EQUIP" };

    if (player.unclaimedTrophies) {
      player.unclaimedTrophies = player.unclaimedTrophies.filter((id) => id !== finalTrophyId);
    }

    player.sequence = ++this.sequence;
    this.playerRepository.save(player);

    return {
      success: true,
      state: this.inventoryService.getInventoryState(player),
      player: this.toSnapshot(player),
      message: `Troféu militar oficial [${trophyDef.name}] recuperado com sucesso pelo Inspetor Baek!`
    };
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
