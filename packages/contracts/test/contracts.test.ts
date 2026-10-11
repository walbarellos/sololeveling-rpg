import { describe, expect, it } from "vitest";
import {
  AttackRequestSchema,
  BattleActionRequestSchema,
  BattleEventSchema,
  BattleRewardsSchema,
  BattleSnapshotSchema,
  DirectionSchema,
  HandshakeAuthSchema,
  MAX_LEVEL,
  RANK_CAP,
  applyExp,
  expToNext,
  mobExp,
  statMult,
  StartBattleRequestSchema,
  StepRequestSchema,
  TileCoordSchema,
  WelcomeSchema,
  WorldSnapshotSchema
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
