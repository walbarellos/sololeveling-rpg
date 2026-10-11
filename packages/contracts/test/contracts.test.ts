import { describe, expect, it } from "vitest";
import {
  AttackRequestSchema,
  DirectionSchema,
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

  it("validates world snapshot with hunter ranks and obstacles", () => {
    expect(
      WorldSnapshotSchema.safeParse({
        players: [
          {
            id: "p1",
            name: "Jinwoo",
            rank: "E",
            level: 1,
            position: { x: 2, y: 3 },
            hp: 100,
            maxHp: 100,
            stamina: 50,
            maxStamina: 50,
            sequence: 1
          }
        ],
        enemies: [
          {
            id: "e1",
            name: "Dungeon Goblin",
            rank: "E",
            position: { x: 5, y: 5 },
            hp: 40,
            maxHp: 40,
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
