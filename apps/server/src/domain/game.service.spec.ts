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
    expect(player.level).toBe(1);
    expect(player.hp).toBe(100);
    expect(player.stamina).toBe(50);
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

    // Start at (2, 2)
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

    // Obstacle at (5, 3). Navigate to (4, 3)
    // From (2, 2) -> (3, 2) -> (4, 2) -> (4, 3)
    clock.advance(STEP_COOLDOWN_MS);
    game.step("p1", "RIGHT"); // (3, 2)
    clock.advance(STEP_COOLDOWN_MS);
    game.step("p1", "RIGHT"); // (4, 2)
    clock.advance(STEP_COOLDOWN_MS);
    game.step("p1", "DOWN"); // (4, 3)

    // Attempt to step RIGHT into obstacle (5, 3)
    clock.advance(STEP_COOLDOWN_MS);
    const blocked = game.step("p1", "RIGHT");
    expect(blocked.success).toBe(false);
    if (!blocked.success) {
      expect(blocked.error).toBe("OBSTACLE");
    }
    expect(game.snapshot().players[0].position).toEqual({ x: 4, y: 3 });
  });

  it("prevents out-of-bounds movement", () => {
    const clock = makeClock();
    const repo = new InMemoryPlayerRepository();
    const game = new GameService(clock, repo);
    game.connect("p1");

    // Walk up to y = 0
    clock.advance(STEP_COOLDOWN_MS);
    game.step("p1", "UP"); // (2, 1)
    clock.advance(STEP_COOLDOWN_MS);
    game.step("p1", "UP"); // (2, 0)

    // Attempt to step UP beyond map
    clock.advance(STEP_COOLDOWN_MS);
    const oob = game.step("p1", "UP");
    expect(oob.success).toBe(false);
    if (!oob.success) {
      expect(oob.error).toBe("OUT_OF_BOUNDS");
    }
  });

  it("enforces step rate limit (anti-speedhack)", () => {
    const clock = makeClock();
    const repo = new InMemoryPlayerRepository();
    const game = new GameService(clock, repo);
    game.connect("p1");

    // Advance to allow first step
    clock.advance(STEP_COOLDOWN_MS);
    const step1 = game.step("p1", "RIGHT");
    expect(step1.success).toBe(true);

    // Immediate second step without clock advance must fail
    const stepFast = game.step("p1", "RIGHT");
    expect(stepFast.success).toBe(false);
    if (!stepFast.success) {
      expect(stepFast.error).toBe("TOO_FAST");
    }

    // After cooling down, step succeeds
    clock.advance(STEP_COOLDOWN_MS);
    const stepAllowed = game.step("p1", "RIGHT");
    expect(stepAllowed.success).toBe(true);
  });

  it("rejects attack from out of range (> 1 tile distance)", () => {
    const clock = makeClock();
    const repo = new InMemoryPlayerRepository();
    const game = new GameService(clock, repo);
    const player = game.connect("p1");

    // Player at (2, 2), slime-1 at (7, 4)
    const result = game.attack(player.id, "slime-1");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("TOO_FAR");
    }
  });

  it("resolves adjacent turn-based combat with damage, counter-damage, and cooldown", () => {
    const clock = makeClock();
    const repo = new InMemoryPlayerRepository();
    const game = new GameService(clock, repo);
    game.connect("p1");

    // Navigate to tile (6, 4), adjacent to slime-1 at (7, 4)
    // Path avoiding obstacles (5, 3), (5, 4), (5, 5):
    // From (2, 2) -> (2, 1) -> (3, 1) -> (4, 1) -> (5, 1) -> (6, 1) -> (6, 2) -> (6, 3) -> (6, 4)
    const path: ("UP" | "DOWN" | "LEFT" | "RIGHT")[] = [
      "UP", "RIGHT", "RIGHT", "RIGHT", "RIGHT", "DOWN", "DOWN", "DOWN"
    ];
    for (const dir of path) {
      clock.advance(STEP_COOLDOWN_MS);
      const res = game.step("p1", dir);
      expect(res.success).toBe(true);
    }

    expect(game.snapshot().players[0].position).toEqual({ x: 6, y: 4 });

    // Attack slime-1 (60 HP)
    const turn1 = game.attack("p1", "slime-1");
    expect(turn1.success).toBe(true);
    if (turn1.success) {
      expect(turn1.log.damage).toBe(PLAYER_ATTACK_DAMAGE); // 30
      expect(turn1.log.targetHp).toBe(30); // 60 - 30 = 30
      expect(turn1.log.counterDamage).toBe(10); // Slime retaliated
      expect(turn1.player.hp).toBe(90); // 100 - 10 = 90
      expect(turn1.log.defeated).toBe(false);
    }

    // Immediate second attack blocked by cooldown
    const spammed = game.attack("p1", "slime-1");
    expect(spammed.success).toBe(false);
    if (!spammed.success) {
      expect(spammed.error).toBe("COOLDOWN");
    }

    // Advance clock past attack cooldown
    clock.advance(ATTACK_COOLDOWN_MS);
    const turn2 = game.attack("p1", "slime-1");
    expect(turn2.success).toBe(true);
    if (turn2.success) {
      expect(turn2.log.damage).toBe(PLAYER_ATTACK_DAMAGE);
      expect(turn2.log.targetHp).toBe(0);
      expect(turn2.log.defeated).toBe(true);
    }

    // Slime is now dead; further attack rejected
    clock.advance(ATTACK_COOLDOWN_MS);
    const turnDead = game.attack("p1", "slime-1");
    expect(turnDead.success).toBe(false);
    if (!turnDead.success) {
      expect(turnDead.error).toBe("TARGET_UNAVAILABLE");
    }
  });
});
