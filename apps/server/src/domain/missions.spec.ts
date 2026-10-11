import { describe, expect, it } from "vitest";
import { MISSIONS, mobExp, statMult } from "@rpg/contracts";
import { GameService } from "./game.service";
import { InMemoryPlayerRepository, type PlayerEntity } from "./player.repository";

const makeClock = (start = 10_000) => {
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
  const p = game.connect("p1");
  return { clock, repo, game, player: p };
}

describe("Naruto Game style Missions (ADR 5 lazy evaluation & ADR 10 idempotency)", () => {
  it("provides all 7 mission tiers in master table", () => {
    expect(MISSIONS).toHaveLength(7);
    const ids = MISSIONS.map((m) => m.id);
    expect(ids).toEqual([
      "patrol_5s",
      "recon_1m",
      "subdue_10m",
      "gate_d_1h",
      "gate_c_3h",
      "tower_b_6h",
      "monarch_a_12h"
    ]);
  });

  it("lists missions state with no active run initially", () => {
    const { game } = setup();
    const state = game.getMissionsState("p1");
    expect(state.available).toHaveLength(7);
    expect(state.activeRun).toBeNull();
    expect(state.serverTime).toBe(10_000);
  });

  it("starts a 5s mission and calculates potential EXP based on level and kills-equivalent", () => {
    const { clock, game } = setup();
    const startRes = game.startMission("p1", "patrol_5s");
    expect(startRes.success).toBe(true);

    const active = startRes.state?.activeRun;
    expect(active).toBeDefined();
    expect(active?.missionId).toBe("patrol_5s");
    expect(active?.startedAt).toBe(10_000);
    expect(active?.endsAt).toBe(15_000);
    expect(active?.durationMs).toBe(5_000);
    expect(active?.killsEquiv).toBe(1);
    expect(active?.potentialExp).toBe(mobExp(1) * 1); // 8 EXP
    expect(active?.completed).toBe(false);
  });

  it("rejects starting a second mission while one is active", () => {
    const { game } = setup();
    game.startMission("p1", "patrol_5s");
    const second = game.startMission("p1", "recon_1m");
    expect(second.success).toBe(false);
    expect(second.error).toBe("MISSION_ALREADY_ACTIVE");
  });

  it("rejects mission when player rank or level requirements are not met", () => {
    const { game } = setup();
    // Player is Rank E, Lv 1. Gate D requires Rank D, Lv 13.
    const lockedRes = game.startMission("p1", "gate_d_1h");
    expect(lockedRes.success).toBe(false);
    expect(lockedRes.error).toBe("MISSION_LOCKED");

    // Recon 1m requires Lv 3
    const lockedLvlRes = game.startMission("p1", "recon_1m");
    expect(lockedLvlRes.success).toBe(false);
    expect(lockedLvlRes.error).toBe("MISSION_LOCKED");
  });

  it("rejects claim before duration has elapsed (ADR 5 lazy evaluation, zero timers)", () => {
    const { clock, game } = setup();
    const startRes = game.startMission("p1", "patrol_5s");
    const runId = startRes.state!.activeRun!.runId;

    // Advance 4,999 ms (1 ms short of 5,000 ms)
    clock.advance(4_999);
    const claimTooEarly = game.claimMission("p1", runId);
    expect(claimTooEarly.success).toBe(false);
    expect(claimTooEarly.error).toBe("MISSION_IN_PROGRESS");

    // Player state unchanged
    expect(game.snapshot().players[0].exp).toBe(0);
  });

  it("claims mission when duration elapsed, granting EXP and clearing active run", () => {
    const { clock, game } = setup();
    const startRes = game.startMission("p1", "patrol_5s");
    const runId = startRes.state!.activeRun!.runId;

    // Advance clock past mission duration
    clock.advance(5_000);

    const claimRes = game.claimMission("p1", runId);
    expect(claimRes.success).toBe(true);
    expect(claimRes.result?.expGained).toBe(mobExp(1) * 1);
    expect(claimRes.result?.rewards?.expAfter).toBe(mobExp(1) * 1);

    // Player received EXP
    const me = game.snapshot().players[0];
    expect(me.exp).toBe(mobExp(1));

    // Active run is cleared
    const state = game.getMissionsState("p1");
    expect(state.activeRun).toBeNull();
  });

  it("enforces idempotency on claim requests (ADR 10)", () => {
    const { clock, game } = setup();
    const startRes = game.startMission("p1", "patrol_5s");
    const runId = startRes.state!.activeRun!.runId;

    clock.advance(5_000);
    const firstClaim = game.claimMission("p1", runId);
    expect(firstClaim.success).toBe(true);

    // Duplicate claim attempt for the same runId
    const duplicateClaim = game.claimMission("p1", runId);
    expect(duplicateClaim.success).toBe(false);
    expect(duplicateClaim.error).toBe("MISSION_ALREADY_CLAIMED");

    // EXP was granted exactly once
    expect(game.snapshot().players[0].exp).toBe(mobExp(1));
  });

  it("allows canceling an in-progress mission cleanly", () => {
    const { game } = setup();
    const startRes = game.startMission("p1", "patrol_5s");
    const runId = startRes.state!.activeRun!.runId;

    const cancelRes = game.cancelMission("p1", runId);
    expect(cancelRes.success).toBe(true);
    expect(cancelRes.state?.activeRun).toBeNull();
    expect(game.snapshot().players[0].exp).toBe(0);
  });
});
