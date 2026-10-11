import { describe, expect, it } from "vitest";
import {
  ATTACK_COOLDOWN_MS,
  GameService,
  GRID_WIDTH,
  PLAYER_ATTACK_DAMAGE,
  STEP_COOLDOWN_MS
} from "./game.service";
import { InMemoryPlayerRepository } from "./player.repository";

describe("GameService tile & turn-based vertical slice", () => {
  const makeClock = (start = 1_000) => {
    let t = start;
    return {
      nowMs: () => t,
      advance: (ms: number) => {
        t += ms;
      }
    };
  };

  it("creates a hunter player with rank E and returns world state", () => {
    const clock = makeClock();
    const repo = new InMemoryPlayerRepository();
    const game = new GameService(clock, repo);

    const player = game.connect("hunter-1");
    expect(player.id).toBe("hunter-1");
    expect(player.rank).toBe("E");
    expect(player.hunterClass).toBe("BATTLE_HEALER");
    expect(player.level).toBe(1);
    expect(player.hp).toBe(120);
    expect(player.mp).toBe(80);
    expect(player.position).toEqual({ x: 2, y: 2 });

    const snap = game.snapshot();
    expect(snap.players).toHaveLength(1);
    expect(snap.enemies.length).toBeGreaterThan(0);
    expect(snap.obstacles.length).toBeGreaterThan(0);
    expect(game.dimensions.gridWidth).toBe(GRID_WIDTH);
  });

  it("validates discrete directional steps", () => {
    const clock = makeClock();
    const repo = new InMemoryPlayerRepository();
    const game = new GameService(clock, repo);
    game.connect("p1");

    clock.advance(STEP_COOLDOWN_MS);
    const stepRight = game.step("p1", "RIGHT");
    expect(stepRight.success).toBe(true);
    if (stepRight.success) {
      expect(stepRight.player.position).toEqual({ x: 3, y: 2 });
    }

    clock.advance(STEP_COOLDOWN_MS);
    const stepDown = game.step("p1", "DOWN");
    expect(stepDown.success).toBe(true);
    if (stepDown.success) {
      expect(stepDown.player.position).toEqual({ x: 3, y: 3 });
    }
  });

  it("prevents stepping into obstacles", () => {
    const clock = makeClock();
    const repo = new InMemoryPlayerRepository();
    const game = new GameService(clock, repo);
    game.connect("p1");

    clock.advance(STEP_COOLDOWN_MS);
    game.step("p1", "RIGHT"); // (3, 2)
    clock.advance(STEP_COOLDOWN_MS);
    game.step("p1", "RIGHT"); // (4, 2)
    clock.advance(STEP_COOLDOWN_MS);
    game.step("p1", "DOWN"); // (4, 3)

    // Obstacle at (5, 3)
    clock.advance(STEP_COOLDOWN_MS);
    const blocked = game.step("p1", "RIGHT");
    expect(blocked.success).toBe(false);
    if (!blocked.success) {
      expect(blocked.error).toBe("OBSTACLE");
    }
    expect(game.snapshot().players[0].position).toEqual({ x: 4, y: 3 });
  });

  it("enforces step rate limit (anti-speedhack)", () => {
    const clock = makeClock();
    const repo = new InMemoryPlayerRepository();
    const game = new GameService(clock, repo);
    game.connect("p1");

    clock.advance(STEP_COOLDOWN_MS);
    const step1 = game.step("p1", "RIGHT");
    expect(step1.success).toBe(true);

    const stepFast = game.step("p1", "RIGHT");
    expect(stepFast.success).toBe(false);
    if (!stepFast.success) {
      expect(stepFast.error).toBe("TOO_FAST");
    }
  });

  it("allows selecting hunter class and adjusts stats", () => {
    const clock = makeClock();
    const repo = new InMemoryPlayerRepository();
    const game = new GameService(clock, repo);
    game.connect("p1");

    const assassin = game.selectClass("p1", "ASSASSIN");
    expect(assassin?.hunterClass).toBe("ASSASSIN");
    expect(assassin?.hp).toBe(100);
    expect(assassin?.mp).toBe(60);

    const mage = game.selectClass("p1", "MAGE");
    expect(mage?.hunterClass).toBe("MAGE");
    expect(mage?.hp).toBe(90);
    expect(mage?.mp).toBe(100);
  });
});

describe("Instanced Turn-Based Battle (Naruto Game style)", () => {
  const makeClock = (start = 1_000) => {
    let t = start;
    return {
      nowMs: () => t,
      advance: (ms: number) => {
        t += ms;
      }
    };
  };

  const navigateToAdjacentSlime = (game: GameService, clock: ReturnType<typeof makeClock>) => {
    // Slime-1 at (7, 4). Navigate to (6, 4)
    const path: ("UP" | "DOWN" | "LEFT" | "RIGHT")[] = [
      "UP", "RIGHT", "RIGHT", "RIGHT", "RIGHT", "DOWN", "DOWN", "DOWN"
    ];
    for (const dir of path) {
      clock.advance(STEP_COOLDOWN_MS);
      game.step("p1", dir);
    }
  };

  it("rejects starting battle if too far from monster", () => {
    const clock = makeClock();
    const repo = new InMemoryPlayerRepository();
    const game = new GameService(clock, repo);
    game.connect("p1"); // at (2, 2)

    const result = game.startBattle("p1", "slime-1"); // slime at (7, 4)
    expect(result.success).toBe(false);
    expect(result.error).toBe("TOO_FAR");
  });

  it("starts instanced battle with Battle Healer against adjacent slime", () => {
    const clock = makeClock();
    const repo = new InMemoryPlayerRepository();
    const game = new GameService(clock, repo);
    game.connect("p1");
    navigateToAdjacentSlime(game, clock);

    const result = game.startBattle("p1", "slime-1");
    expect(result.success).toBe(true);
    expect(result.battle).toBeDefined();

    const battle = result.battle!;
    expect(battle.player.hunterClass).toBe("BATTLE_HEALER");
    expect(battle.player.skills).toHaveLength(3);
    expect(battle.enemy.id).toBe("slime-1");
    expect(battle.turn).toBe(1);
    expect(battle.finished).toBe(false);

    // Player should now be marked inBattle
    expect(game.snapshot().players[0].inBattle).toBe(true);
  });

  it("executes Battle Healer skill (deals holy damage and heals self)", () => {
    const clock = makeClock();
    const repo = new InMemoryPlayerRepository();
    const game = new GameService(clock, repo);
    game.connect("p1");
    navigateToAdjacentSlime(game, clock);

    const start = game.startBattle("p1", "slime-1");
    const battleId = start.battle!.battleId;

    // Use Holy Smite (38 damage, heals 20, costs 20 MP, 2 turn cooldown)
    const turn1 = game.executeBattleAction("p1", battleId, "holy_smite");
    expect(turn1.success).toBe(true);
    const b = turn1.battle!;

    expect(b.enemy.hp).toBe(60 - 38); // Slime had 60 HP -> 22 HP
    expect(b.player.mp).toBe(80 - 20); // 60 MP remaining
    expect(b.turn).toBe(2);

    // Holy Smite should now be on cooldown
    const smiteSkill = b.player.skills.find((s) => s.id === "holy_smite");
    expect(smiteSkill?.currentCooldown).toBeGreaterThan(0);

    // Immediate attempt to use Holy Smite again should fail with SKILL_ON_COOLDOWN
    const turnSpam = game.executeBattleAction("p1", battleId, "holy_smite");
    expect(turnSpam.success).toBe(false);
    expect(turnSpam.error).toBe("SKILL_ON_COOLDOWN");

    // Use basic attack (0 MP, 0 CD) to finish off the slime
    const turn2 = game.executeBattleAction("p1", battleId, "radiant_strike");
    expect(turn2.success).toBe(true);
    const finishedBattle = turn2.battle!;

    expect(finishedBattle.finished).toBe(true);
    expect(finishedBattle.result).toBe("VICTORY");
    expect(finishedBattle.enemy.hp).toBe(0);

    // On victory, enemy on the map should be dead and player exits battle
    expect(game.snapshot().enemies.find((e) => e.id === "slime-1")?.alive).toBe(false);
    expect(game.snapshot().players[0].inBattle).toBe(false);
  });

  it("handles flee action cleanly", () => {
    const clock = makeClock();
    const repo = new InMemoryPlayerRepository();
    const game = new GameService(clock, repo);
    game.connect("p1");
    navigateToAdjacentSlime(game, clock);

    const start = game.startBattle("p1", "slime-1");
    const fleeRes = game.fleeBattle("p1", start.battle!.battleId);

    expect(fleeRes.success).toBe(true);
    expect(fleeRes.battle?.finished).toBe(true);
    expect(fleeRes.battle?.result).toBe("FLED");
    expect(game.snapshot().players[0].inBattle).toBe(false);
  });

  it("calculates critical hits and registers [CRÍTICO] in combat log", () => {
    const clock = makeClock();
    const repo = new InMemoryPlayerRepository();
    const game = new GameService(clock, repo);
    game.connect("p1");
    game.selectClass("p1", "ASSASSIN");
    navigateToAdjacentSlime(game, clock);

    const start = game.startBattle("p1", "slime-1");
    const battleId = start.battle!.battleId;

    const session = (game as any).activeBattles.get(battleId);
    let rolls = [0.5, 0.05, 0.5, 0.5];
    session.setRng(() => rolls.shift() ?? 0.5);

    const res = game.executeBattleAction("p1", battleId, "dagger_slash");
    expect(res.success).toBe(true);
    const hasCritLog = res.battle?.log.some((l) => l.includes("[CRÍTICO]"));
    expect(hasCritLog).toBe(true);
  });

  it("returns authoritative player stats calculated by server for class and level", () => {
    const clock = makeClock();
    const repo = new InMemoryPlayerRepository();
    const game = new GameService(clock, repo);
    const p = game.connect("p1");

    expect(p.stats).toBeDefined();
    expect(p.stats.physicalAtk).toBe(26);
    expect(p.stats.magicalAtk).toBe(38);
    expect(p.stats.critChance).toBe(0.15);
    expect(p.stats.dodgeChance).toBe(0.10);
    expect(p.stats.blockChance).toBe(0.15);

    const assassin = game.selectClass("p1", "ASSASSIN")!;
    expect(assassin.stats.physicalAtk).toBe(46);
    expect(assassin.stats.magicalAtk).toBe(15);
    expect(assassin.stats.critChance).toBe(0.35);
    expect(assassin.stats.dodgeChance).toBe(0.22);
    expect(assassin.stats.blockChance).toBe(0.08);
  });

  it("turn limit results in tactical retreat: enemy survives with remaining HP, player retreats without death penalty", () => {
    const clock = makeClock();
    const repo = new InMemoryPlayerRepository();
    const game = new GameService(clock, repo);
    game.connect("p1");
    navigateToAdjacentSlime(game, clock);

    const start = game.startBattle("p1", "slime-1");
    const battleId = start.battle!.battleId;
    const session = (game as any).activeBattles.get(battleId);

    // Fast-forward session to turn 20
    session.turn = 20;
    // Set high HP so neither dies on turn 20
    session.player.hp = 100;
    session.enemy.hp = 50;

    // Execute radiant strike (22 damage -> slime at 28 HP, player takes ~12 damage -> 88 HP)
    const turn20 = game.executeBattleAction("p1", battleId, "radiant_strike");
    expect(turn20.success).toBe(true);
    const b = turn20.battle!;

    expect(b.finished).toBe(true);
    expect(b.result).toBe("DRAW");
    expect(b.drawReason).toBe("TURN_LIMIT");
    expect(b.rewardExp).toBeUndefined();

    // World snapshot check: slime is alive with remaining HP, player is not at respawn portal
    const world = game.snapshot();
    const slime = world.enemies.find((e) => e.id === "slime-1")!;
    expect(slime.alive).toBe(true);
    expect(slime.hp).toBe(28);

    const me = world.players.find((p) => p.id === "p1")!;
    expect(me.inBattle).toBe(false);
    expect(me.position).toEqual({ x: 6, y: 4 }); // NOT respawned at (2, 2)
    expect(me.hp).toBe(88);
    expect(me.exp).toBe(0); // 0 EXP
  });

  it("mutual knockout results in mutual death draw: enemy defeated, player respawns at entrance with half EXP", () => {
    const clock = makeClock();
    const repo = new InMemoryPlayerRepository();
    const game = new GameService(clock, repo);
    game.connect("p1");
    navigateToAdjacentSlime(game, clock);

    const start = game.startBattle("p1", "slime-1");
    const battleId = start.battle!.battleId;
    const session = (game as any).activeBattles.get(battleId);

    // Set HP such that both die in this turn: player HP 5, slime HP 10
    session.player.hp = 5;
    session.enemy.hp = 10;

    const turnFatal = game.executeBattleAction("p1", battleId, "radiant_strike");
    expect(turnFatal.success).toBe(true);
    const b = turnFatal.battle!;

    expect(b.finished).toBe(true);
    expect(b.result).toBe("DRAW");
    expect(b.drawReason).toBe("MUTUAL_DEATH");
    expect(b.rewardExp).toBe(4); // mobExp(1)/2 = 8/2 = 4

    const world = game.snapshot();
    const slime = world.enemies.find((e) => e.id === "slime-1")!;
    expect(slime.alive).toBe(false);

    const me = world.players.find((p) => p.id === "p1")!;
    expect(me.inBattle).toBe(false);
    expect(me.position).toEqual({ x: 2, y: 2 }); // Respawno at entrance
    expect(me.hp).toBe(Math.floor(me.maxHp * 0.5));
    expect(me.exp).toBe(4);
  });
});
