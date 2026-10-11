import { describe, expect, it } from "vitest";
import { AttackRequestSchema, MoveRequestSchema, WorldSnapshotSchema } from "../src/index";

describe("network contracts", () => {
  it("accepts finite movement intent", () => {
    expect(MoveRequestSchema.safeParse({ target: { x: 20, y: 30 } }).success).toBe(true);
  });

  it("rejects non-finite movement coordinates", () => {
    expect(MoveRequestSchema.safeParse({ target: { x: Infinity, y: 2 } }).success).toBe(false);
  });

  it("rejects malformed attack requests", () => {
    expect(AttackRequestSchema.safeParse({ targetId: "" }).success).toBe(false);
  });

  it("validates snapshots", () => {
    expect(WorldSnapshotSchema.safeParse({
      players: [], enemies: [], serverTime: 1
    }).success).toBe(true);
  });
});
