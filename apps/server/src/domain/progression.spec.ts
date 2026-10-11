import { describe, expect, it } from "vitest";
import { RANK_CAP, expToNext, mobExp, statMult } from "@rpg/contracts";
import { BattleSession } from "./battle.session";
import { ENEMY_RESPAWN_MS, GameService, STEP_COOLDOWN_MS } from "./game.service";
import { InMemoryPlayerRepository, type PlayerEntity } from "./player.repository";

const makeClock = (start = 1_000) => {
  let t = start;
  return {
    nowMs: () => t,
    advance: (ms: number) => {
      t += ms;
    }
  };
};

function setup() {
  const clock = makeClock();
  const repo = new InMemoryPlayerRepository();
  const game = new GameService(clock, repo);
  game.connect("p1");
  return { clock, repo, game };
}

/** Leva p1 de (2,2) até (6,4), adjacente ao slime-1 em (7,4). */
function goToSlime(game: GameService, clock: ReturnType<typeof makeClock>) {
  for (const dir of ["UP", "RIGHT", "RIGHT", "RIGHT", "RIGHT", "DOWN", "DOWN", "DOWN"] as const) {
    clock.advance(STEP_COOLDOWN_MS);
    game.step("p1", dir);
  }
}

function patchPlayer(repo: InMemoryPlayerRepository, patch: Partial<PlayerEntity>) {
  const p = repo.findById("p1")!;
  repo.save({ ...p, ...patch });
}

/** Mata o slime (60 HP) com ataque básico do Curandeiro (22 de dano, rng determinístico sem crit). */
function killSlime(game: GameService) {
  const start = game.startBattle("p1", "slime-1");
  expect(start.success).toBe(true);
  const id = start.battle!.battleId;
  let last = start.battle!;
  for (let i = 0; i < 4 && !last.finished; i++) {
    last = game.executeBattleAction("p1", id, i % 2 === 0 ? "radiant_strike" : "holy_smite").battle!;
  }
  expect(last.finished).toBe(true);
  return last;
}

describe("progression formulas", () => {
  it("curva de EXP e multiplicador de stats", () => {
    expect(expToNext(1)).toBe(40);
    expect(expToNext(10)).toBe(1265);
    expect(mobExp(1)).toBe(8);
    expect(statMult(1)).toBe(1);
    expect(statMult(100)).toBeCloseTo(9.91, 2);
    expect(RANK_CAP.E).toBe(12);
  });
});

describe("EXP, level-up e cap de rank", () => {
  it("vitória aplica EXP no servidor e devolve recompensas no snapshot", () => {
    const { clock, game } = setup();
    goToSlime(game, clock);
    const result = killSlime(game);

    expect(result.result).toBe("VICTORY");
    expect(result.rewards).toMatchObject({
      expGained: mobExp(1),
      levelBefore: 1,
      levelAfter: 1,
      expBefore: 0,
      expAfter: mobExp(1),
      capped: false,
      levelCap: 12
    });

    const me = game.snapshot().players[0];
    expect(me.exp).toBe(mobExp(1));
    expect(me.expToNext).toBe(40);
    expect(me.levelCap).toBe(12);
  });

  it("level-up escala HP/MP e restaura os recursos", () => {
    const { clock, repo, game } = setup();
    patchPlayer(repo, { exp: 35 });
    goToSlime(game, clock);
    const result = killSlime(game);

    expect(result.rewards).toMatchObject({ levelBefore: 1, levelAfter: 2, expBefore: 35, expAfter: 3 });
    const me = game.snapshot().players[0];
    expect(me.level).toBe(2);
    expect(me.maxHp).toBe(Math.floor(120 * statMult(2)));
    expect(me.hp).toBe(me.maxHp);
    expect(me.mp).toBe(me.maxMp);
  });

  it("no cap do rank o nível trava e o EXP fica retido", () => {
    const { clock, repo, game } = setup();
    patchPlayer(repo, { level: 12, exp: expToNext(12) - 3 });
    goToSlime(game, clock);
    const result = killSlime(game);

    expect(result.rewards?.capped).toBe(true);
    expect(result.rewards?.levelAfter).toBe(12);
    expect(result.rewards?.expAfter).toBe(expToNext(12) - 1);
    expect(game.snapshot().players[0].level).toBe(12);
  });

  it("fuga e derrota não concedem EXP", () => {
    const { clock, game } = setup();
    goToSlime(game, clock);
    const start = game.startBattle("p1", "slime-1");
    const fled = game.fleeBattle("p1", start.battle!.battleId);
    expect(fled.battle?.rewards).toBeUndefined();
    expect(game.snapshot().players[0].exp).toBe(0);
  });
});

describe("eventos de combate (base da sequência dramática no cliente)", () => {
  it("golpe final: acerto no inimigo e depois DEATH do inimigo, com logIndex válido", () => {
    const { clock, game } = setup();
    goToSlime(game, clock);
    const result = killSlime(game);

    const events = result.events;
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events[0].target).toBe("enemy");
    const last = events[events.length - 1];
    expect(last).toMatchObject({ kind: "DEATH", target: "enemy", targetHpAfter: 0 });
    for (const e of events) expect(e.logIndex).toBeLessThan(result.log.length);
  });

  it("derrota: acerto no inimigo, contragolpe e DEATH do jogador, nessa ordem", () => {
    const { clock, repo, game } = setup();
    patchPlayer(repo, { hp: 5 });
    goToSlime(game, clock);
    const start = game.startBattle("p1", "slime-1");
    const res = game.executeBattleAction("p1", start.battle!.battleId, "radiant_strike").battle!;

    expect(res.result).toBe("DEFEAT");
    expect(res.events.map((e) => `${e.kind}:${e.target}`)).toEqual([
      "HIT:enemy",
      "HIT:player",
      "DEATH:player"
    ]);
    expect(res.rewards).toBeUndefined();
  });
});

describe("escala por nível", () => {
  const goblin = {
    id: "g",
    name: "Gate Goblin",
    rank: "E" as const,
    level: 3,
    position: { x: 0, y: 0 },
    hp: 80,
    maxHp: 80,
    mp: 20,
    maxMp: 20,
    alive: true
  };
  const entity = (level: number): PlayerEntity => ({
    id: "p",
    name: "P",
    rank: "E",
    hunterClass: "BATTLE_HEALER",
    level,
    exp: 0,
    position: { x: 0, y: 0 },
    hp: 1000,
    maxHp: 1000,
    mp: 1000,
    maxMp: 1000,
    stamina: 50,
    maxStamina: 50,
    attributes: { str: 10, agi: 10, vit: 10, int: 10 },
    unallocatedStatPoints: 0,
    inBattle: false,
    sequence: 0,
    lastStepAt: 0,
    lastAttackAt: 0
  });

  it("dano do jogador e do monstro escalam com o nível", () => {
    const s = new BattleSession("b", entity(10), goblin);
    s.executeAction("radiant_strike");
    expect(80 - s.enemy.hp).toBe(Math.floor(22 * statMult(10))); // 39
    expect(1000 - s.player.hp).toBe(Math.round(12 * statMult(3))); // 14
  });
});

describe("respawn lazy e presença online", () => {
  it("monstro morto volta após ENEMY_RESPAWN_MS, sem timer", () => {
    const { clock, game } = setup();
    goToSlime(game, clock);
    killSlime(game);
    expect(game.snapshot().enemies.find((e) => e.id === "slime-1")?.alive).toBe(false);

    clock.advance(ENEMY_RESPAWN_MS - 1);
    expect(game.snapshot().enemies.find((e) => e.id === "slime-1")?.alive).toBe(false);

    clock.advance(1);
    const slime = game.snapshot().enemies.find((e) => e.id === "slime-1")!;
    expect(slime.alive).toBe(true);
    expect(slime.hp).toBe(slime.maxHp);
  });

  it("reconectar com a mesma identidade preserva EXP; offline some do mundo", () => {
    const { clock, game } = setup();
    goToSlime(game, clock);
    killSlime(game);

    game.disconnect("p1");
    expect(game.snapshot().players).toHaveLength(0);

    const again = game.connect("p1");
    expect(again.exp).toBe(mobExp(1));
    expect(again.inBattle).toBe(false);
    expect(game.snapshot().players).toHaveLength(1);
  });

  it("reconectar no meio de uma batalha a abandona sem travar o jogador", () => {
    const { clock, game } = setup();
    goToSlime(game, clock);
    game.startBattle("p1", "slime-1");
    const again = game.connect("p1");
    expect(again.inBattle).toBe(false);
    expect(again.activeBattleId).toBeUndefined();
  });
});
