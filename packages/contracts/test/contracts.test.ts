import { describe, expect, it } from "vitest";
import {
  ItemRaritySchema,
  ITEM_RARITY_COLORS,
  AttackRequestSchema,
  BattleActionRequestSchema,
  BattleEventSchema,
  BattleRewardsSchema,
  BattleSnapshotSchema,
  DirectionSchema,
  HandshakeAuthSchema,
  MAX_LEVEL,
  MISSIONS,
  MissionDefinitionSchema,
  MissionRunSchema,
  MissionsStateSchema,
  RANK_CAP,
  applyExp,
  expToNext,
  isRankAllowed,
  mobExp,
  statMult,
  StartBattleRequestSchema,
  StepRequestSchema,
  TileCoordSchema,
  WelcomeSchema,
  WorldSnapshotSchema,
  AllocateStatsRequestSchema,
  PlayerAttributesSchema,
  DEFAULT_PLAYER_ATTRIBUTES,
  STARTING_STAT_POINTS,
  STAT_POINTS_PER_LEVEL,
  ItemDefinitionSchema,
  InventoryStateSchema,
  RANK_EXAM_REQUIREMENTS,
  RankPromotionRequestSchema,
  RankPromotionResultSchema
} from "../src/index";

describe("network contracts (tile & turn-based)", () => {
  it("accepts valid directional step intent", () => {
    expect(StepRequestSchema.safeParse({ direction: "UP" }).success).toBe(true);
    expect(StepRequestSchema.safeParse({ direction: "RIGHT" }).success).toBe(true);
  });

  it("rejects invalid directional step intent", () => {
    expect(StepRequestSchema.safeParse({ direction: "DIAGONAL" }).success).toBe(false);
    expect(StepRequestSchema.safeParse({}).success).toBe(false);
  });

  it("validates discrete tile coordinates (integers >= 0)", () => {
    expect(TileCoordSchema.safeParse({ x: 5, y: 10 }).success).toBe(true);
    expect(TileCoordSchema.safeParse({ x: -1, y: 0 }).success).toBe(false);
    expect(TileCoordSchema.safeParse({ x: 1.5, y: 2 }).success).toBe(false);
  });

  it("rejects malformed attack requests", () => {
    expect(AttackRequestSchema.safeParse({ targetId: "" }).success).toBe(false);
    expect(AttackRequestSchema.safeParse({ targetId: "slime-1" }).success).toBe(true);
  });

  it("validates instanced turn-based battle snapshot with skills and MP", () => {
    const validBattle = {
      battleId: "battle-123",
      turn: 1,
      maxTurns: 20,
      player: {
        id: "p1",
        name: "Min Healer",
        rank: "E",
        level: 1,
        hunterClass: "BATTLE_HEALER",
        hp: 120,
        maxHp: 120,
        mp: 60,
        maxMp: 60,
        skills: [
          {
            id: "smite",
            name: "Smite Sagrado",
            description: "Causa dano radiante e cura a si mesmo",
            mpCost: 15,
            cooldownTurns: 2,
            currentCooldown: 0
          }
        ]
      },
      enemy: {
        id: "e1",
        name: "Dungeon Goblin",
        rank: "E",
        level: 3,
        hp: 80,
        maxHp: 80,
        mp: 20,
        maxMp: 20
      },
      log: ["Batalha iniciada contra Dungeon Goblin!"],
      finished: false
    };

    const parsed = BattleSnapshotSchema.safeParse(validBattle);
    expect(parsed.success).toBe(true);
    // snapshots antigos sem eventos continuam válidos (default [])
    expect(parsed.success && parsed.data.events).toEqual([]);
    expect(
      BattleActionRequestSchema.safeParse({
        battleId: "battle-123",
        actionId: "smite"
      }).success
    ).toBe(true);
    expect(
      StartBattleRequestSchema.safeParse({
        targetEnemyId: "e1"
      }).success
    ).toBe(true);
  });

  it("validates world snapshot with hunter ranks and obstacles", () => {
    expect(
      WorldSnapshotSchema.safeParse({
        players: [
          {
            id: "p1",
            name: "Jinwoo",
            rank: "E",
            hunterClass: "ASSASSIN",
            level: 1,
            exp: 0,
            expToNext: 40,
            levelCap: 12,
            position: { x: 2, y: 3 },
            hp: 100,
            maxHp: 100,
            mp: 50,
            maxMp: 50,
            stamina: 50,
            maxStamina: 50,
            stats: {
              physicalAtk: 46,
              magicalAtk: 15,
              critChance: 0.35,
              dodgeChance: 0.22,
              blockChance: 0.08
            },
            inBattle: false,
            sequence: 1
          }
        ],
        enemies: [
          {
            id: "e1",
            name: "Dungeon Goblin",
            rank: "E",
            level: 3,
            position: { x: 5, y: 5 },
            hp: 40,
            maxHp: 40,
            mp: 0,
            maxMp: 0,
            alive: true
          }
        ],
        obstacles: [{ x: 4, y: 4 }],
        serverTime: 1000
      }).success
    ).toBe(true);
  });

  it("validates welcome payload with grid dimensions", () => {
    expect(
      WelcomeSchema.safeParse({
        playerId: "p1",
        gridWidth: 20,
        gridHeight: 12,
        tileSize: 48,
        obstacles: [{ x: 1, y: 1 }]
      }).success
    ).toBe(true);
  });
});

describe("progressão e eventos de combate", () => {
  it("valida evento de combate estruturado", () => {
    const ok = { kind: "DEATH", target: "enemy", amount: 0, targetHpAfter: 0, logIndex: 3 };
    expect(BattleEventSchema.safeParse(ok).success).toBe(true);
    expect(BattleEventSchema.safeParse({ ...ok, kind: "EXPLODE" }).success).toBe(false);
    expect(BattleEventSchema.safeParse({ ...ok, targetHpAfter: -1 }).success).toBe(false);
  });

  it("valida recompensas de batalha", () => {
    const rewards = {
      expGained: 8,
      levelBefore: 1,
      levelAfter: 2,
      expBefore: 35,
      expAfter: 3,
      capped: false,
      levelCap: 12
    };
    expect(BattleRewardsSchema.safeParse(rewards).success).toBe(true);
    expect(BattleRewardsSchema.safeParse({ ...rewards, expGained: -1 }).success).toBe(false);
    expect(BattleRewardsSchema.safeParse({ ...rewards, levelAfter: 0 }).success).toBe(false);
  });

  it("valida a chave de identidade do handshake", () => {
    expect(HandshakeAuthSchema.safeParse({ playerKey: "a1".repeat(16) }).success).toBe(true);
    expect(HandshakeAuthSchema.safeParse({ playerKey: "curta" }).success).toBe(false);
    expect(HandshakeAuthSchema.safeParse({ playerKey: "Z".repeat(32) }).success).toBe(false);
    expect(HandshakeAuthSchema.safeParse({}).success).toBe(false);
  });

  it("curva de EXP: kills por nível ficam na faixa de design", () => {
    const killsPerLevel = (l: number) => expToNext(l) / mobExp(l);
    expect(killsPerLevel(1)).toBeCloseTo(5, 0);
    expect(killsPerLevel(10)).toBeGreaterThan(11);
    expect(killsPerLevel(50)).toBeLessThan(26);
    expect(statMult(1)).toBe(1);
    expect(MAX_LEVEL).toBe(RANK_CAP.S);
  });

  it("applyExp sobe vários níveis de uma vez e carrega o resto", () => {
    const r = applyExp({ level: 1, exp: 0, rank: "E" }, expToNext(1) + expToNext(2) + 7);
    expect(r).toEqual({ level: 3, exp: 7, capped: false });
  });

  it("applyExp trava no cap do rank e retém o EXP", () => {
    const r = applyExp({ level: 12, exp: 0, rank: "E" }, 10_000_000);
    expect(r.level).toBe(12);
    expect(r.capped).toBe(true);
    expect(r.exp).toBe(expToNext(12) - 1);
    // subir de rank libera a progressão de novo
    const next = applyExp({ level: 12, exp: r.exp, rank: "D" }, 1);
    expect(next.level).toBe(13);
  });

  it("applyExp ignora ganho negativo e respeita o nível máximo", () => {
    expect(applyExp({ level: 5, exp: 10, rank: "E" }, -50)).toEqual({ level: 5, exp: 10, capped: false });
    expect(applyExp({ level: 100, exp: 0, rank: "S" }, 1e9).level).toBe(100);
  });
});

describe("missões estilo Naruto Game (contratos)", () => {
  it("valida esquemas de missão e tabela mestre", () => {
    expect(MISSIONS.length).toBe(10);
    for (const m of MISSIONS) {
      expect(MissionDefinitionSchema.safeParse(m).success).toBe(true);
    }
  });

  it("verifica a hierarquia de ranks para missões (isRankAllowed)", () => {
    expect(isRankAllowed("E", "E")).toBe(true);
    expect(isRankAllowed("E", "D")).toBe(false);
    expect(isRankAllowed("D", "E")).toBe(true);
    expect(isRankAllowed("S", "A")).toBe(true);
    expect(isRankAllowed("A", "S")).toBe(false);
  });

  it("valida payload de execução e estado de missões", () => {
    const validRun = {
      runId: "run-1",
      missionId: "patrol_5s",
      name: "Patrulha Relâmpago",
      startedAt: 1000,
      endsAt: 6000,
      durationMs: 5000,
      killsEquiv: 1,
      potentialExp: 8,
      completed: false
    };
    expect(MissionRunSchema.safeParse(validRun).success).toBe(true);
    expect(
      MissionsStateSchema.safeParse({
        available: [...MISSIONS],
        activeRun: validRun,
        serverTime: 2000
      }).success
    ).toBe(true);
  });

  describe("atributos primários e distribuição de pontos (Solo Leveling)", () => {
    it("valida esquema de atributos primários padrão e restrições mínimas", () => {
      expect(PlayerAttributesSchema.safeParse(DEFAULT_PLAYER_ATTRIBUTES).success).toBe(true);
      expect(DEFAULT_PLAYER_ATTRIBUTES).toEqual({ str: 10, agi: 10, vit: 10, int: 10 });
      expect(STARTING_STAT_POINTS).toBe(5);
      expect(STAT_POINTS_PER_LEVEL).toBe(3);

      // Atributos não podem ser menores que 10
      expect(PlayerAttributesSchema.safeParse({ str: 9, agi: 10, vit: 10, int: 10 }).success).toBe(false);
      // Atributos válidos maiores que 10
      expect(PlayerAttributesSchema.safeParse({ str: 15, agi: 12, vit: 20, int: 10 }).success).toBe(true);
    });

    it("valida requisição de alocação de atributos", () => {
      // Válido: alocando 1 ou mais pontos
      expect(AllocateStatsRequestSchema.safeParse({ str: 2, agi: 1 }).success).toBe(true);
      expect(AllocateStatsRequestSchema.safeParse({ vit: 5 }).success).toBe(true);

      // Inválido: zero pontos no total
      expect(AllocateStatsRequestSchema.safeParse({ str: 0, agi: 0, vit: 0, int: 0 }).success).toBe(false);
      expect(AllocateStatsRequestSchema.safeParse({}).success).toBe(false);

      // Inválido: valores negativos
      expect(AllocateStatsRequestSchema.safeParse({ str: -1, agi: 2 }).success).toBe(false);
    });
  });

  describe("sistema de itens, raridades e inventário (Diablo style)", () => {
    it("valida raridades, itens e bônus de atributos", () => {
      const potion = {
        id: "potion_hp_minor",
        name: "Poção de Vitalidade Menor",
        description: "Restaura 60 pontos de vida.",
        type: "CONSUMABLE",
        rarity: "COMMON",
        minLevel: 1,
        stats: {
          bonusHp: 0,
          bonusMp: 0,
          bonusPhysicalAtk: 0,
          bonusMagicalAtk: 0,
          bonusCritChance: 0,
          bonusDodgeChance: 0,
          bonusBlockChance: 0
        },
        healAmount: 60,
        icon: "potion_red"
      };
      expect(ItemDefinitionSchema.safeParse(potion).success).toBe(true);

      const legendarySword = {
        id: "weapon_goblin_slayer",
        name: "Lâmina do Portão Carmesim",
        description: "Forjada nos restos do chefe.",
        type: "WEAPON",
        rarity: "LEGENDARY",
        minLevel: 8,
        stats: {
          bonusHp: 80,
          bonusMp: 20,
          bonusPhysicalAtk: 24,
          bonusMagicalAtk: 10,
          bonusCritChance: 0.12,
          bonusDodgeChance: 0.05,
          bonusBlockChance: 0.04
        },
        icon: "sword_gold"
      };
      expect(ItemDefinitionSchema.safeParse(legendarySword).success).toBe(true);

      const invState = {
        inventory: [{ slotIndex: 0, item: potion, quantity: 3 }],
        equipment: { weapon: legendarySword, armor: null, amulet: null, ring: null },
        careerStats: {
          criticalHitsDealt: 12,
          attacksDodged: 4,
          attacksBlocked: 2,
          regularMonstersSlain: 35,
          gateBossesSlain: 1,
          totalItemsDropped: 18,
          highestRarityDropped: "LEGENDARY",
          bestItemDroppedName: "Lâmina do Portão Carmesim",
          missionsCompleted: 5
        }
      };
      expect(InventoryStateSchema.safeParse(invState).success).toBe(true);
    });

    it("valida contrato de missões simultâneas (até 3 missões)", () => {
      const state = {
        available: [...MISSIONS],
        activeRuns: [
          {
            runId: "run-1",
            missionId: "patrol_5s",
            name: "Patrulha Relâmpago",
            startedAt: 1000,
            endsAt: 6000,
            durationMs: 5000,
            killsEquiv: 1,
            potentialExp: 8,
            completed: false
          },
          {
            runId: "run-2",
            missionId: "recon_1m",
            name: "Coleta de Essência",
            startedAt: 1000,
            endsAt: 61000,
            durationMs: 60000,
            killsEquiv: 3,
            potentialExp: 24,
            completed: false
          }
        ],
        activeRun: null,
        maxActiveMissions: 3,
        serverTime: 2000
      };
      const parsed = MissionsStateSchema.safeParse(state);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.activeRuns.length).toBe(2);
        expect(parsed.data.maxActiveMissions).toBe(3);
      }
    });

    it("valida contrato do exame da Academia de Caçadores (Escola)", () => {
      const req = RANK_EXAM_REQUIREMENTS["D"];
      expect(req).toBeDefined();
      expect(req?.targetRank).toBe("D");
      expect(req?.minLevel).toBe(8);
      expect(req?.requiredTrophyItemId).toBe("trophy_goblin_boss_core");

      expect(RankPromotionRequestSchema.safeParse({ targetRank: "D" }).success).toBe(true);
      expect(
        RankPromotionResultSchema.safeParse({
          success: true,
          newRank: "D",
          message: "Promoção aprovada!",
          unlockedLevelCap: 25,
          rewardStatPoints: 10
        }).success
      ).toBe(true);
    });
  });
});


describe("raridades de item (8 níveis)", () => {
  it("aceita DIVINE e rejeita raridades desconhecidas", () => {
    expect(ItemRaritySchema.safeParse("DIVINE").success).toBe(true);
    expect(ItemRaritySchema.safeParse("MYTHIC").success).toBe(false);
    expect(ItemRaritySchema.options).toHaveLength(8);
  });

  it("define cor/nome para todas as raridades", () => {
    for (const r of ItemRaritySchema.options) {
      expect(ITEM_RARITY_COLORS[r].name.length).toBeGreaterThan(0);
    }
    expect(ITEM_RARITY_COLORS.DIVINE.name).toBe("Divino");
  });
});
