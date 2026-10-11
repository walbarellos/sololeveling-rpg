import { describe, expect, it } from "vitest";
import { GameService } from "./game.service";

describe("GameService vertical slice", () => {
  it("creates a player and returns world state", () => {
    const game = new GameService();
    const player = game.connect("test-player");
    expect(player.hp).toBe(100);
    expect(game.snapshot().players).toHaveLength(1);
    expect(game.snapshot().enemies.length).toBeGreaterThan(0);
  });

  it("rejects out-of-bounds movement", () => {
    const game = new GameService();
    game.connect("test-player");
    expect(game.move("test-player", { x: 9999, y: 50 })).toBeNull();
  });

  it("rejects attack from out of range", () => {
    const game = new GameService();
    const player = game.connect("test-player");
    // Move toward a far corner; movement cap intentionally prevents teleporting.
    const result = game.attack(player.id, "slime-2");
    expect(result.error).toBe("TOO_FAR");
  });
});

describe("movement speed limit", () => {
  const makeClock = (start = 1_000) => {
    let t = start;
    return { nowMs: () => t, advance: (ms: number) => { t += ms; } };
  };

  it("does not let spammed requests exceed PLAYER_SPEED over elapsed time", () => {
    const clock = makeClock();
    const game = new GameService(clock);
    const start = game.connect("p1").position;
    for (let i = 0; i < 500; i++) game.move("p1", { x: 900, y: start.y });
    expect(game.snapshot().players[0].position.x - start.x).toBeLessThan(1);

    clock.advance(200); // 0.2s => at most 44 units at 220 u/s
    game.move("p1", { x: 900, y: start.y });
    expect(game.snapshot().players[0].position.x - start.x).toBeLessThanOrEqual(44.0001);
  });

  it("enforces attack cooldown using the injected clock", () => {
    const clock = makeClock();
    const game = new GameService(clock);
    game.connect("p1");
    const player = game.snapshot().players[0];
    // place the player next to slime-1 by walking in time-limited steps
    for (let i = 0; i < 40; i++) { clock.advance(250); game.move("p1", { x: 470, y: 290 }); }
    expect(game.attack(player.id, "slime-1").log?.damage).toBe(25);
    expect(game.attack(player.id, "slime-1").error).toBe("COOLDOWN");
    clock.advance(700);
    expect(game.attack(player.id, "slime-1").log?.targetHp).toBe(50);
  });
});
