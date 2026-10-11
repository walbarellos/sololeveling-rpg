import { z } from "zod";

export const Vec2Schema = z.object({
  x: z.number().finite(),
  y: z.number().finite()
});
export type Vec2 = z.infer<typeof Vec2Schema>;

export const PlayerSnapshotSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(24),
  position: Vec2Schema,
  hp: z.number().int().nonnegative(),
  maxHp: z.number().int().positive(),
  sequence: z.number().int().nonnegative()
});
export type PlayerSnapshot = z.infer<typeof PlayerSnapshotSchema>;

export const EnemySnapshotSchema = z.object({
  id: z.string().min(1),
  position: Vec2Schema,
  hp: z.number().int().nonnegative(),
  maxHp: z.number().int().positive(),
  alive: z.boolean()
});
export type EnemySnapshot = z.infer<typeof EnemySnapshotSchema>;

export const WorldSnapshotSchema = z.object({
  players: z.array(PlayerSnapshotSchema),
  enemies: z.array(EnemySnapshotSchema),
  serverTime: z.number().int().nonnegative()
});
export type WorldSnapshot = z.infer<typeof WorldSnapshotSchema>;

export const MoveRequestSchema = z.object({
  target: Vec2Schema
});
export type MoveRequest = z.infer<typeof MoveRequestSchema>;

export const AttackRequestSchema = z.object({
  targetId: z.string().min(1).max(100)
});
export type AttackRequest = z.infer<typeof AttackRequestSchema>;

export const ServerErrorSchema = z.object({
  code: z.enum(["INVALID_PAYLOAD", "OUT_OF_BOUNDS", "TOO_FAR", "COOLDOWN", "TARGET_UNAVAILABLE"]),
  message: z.string().max(200)
});
export type ServerError = z.infer<typeof ServerErrorSchema>;

/** Stable transport event names. Keep event payloads versioned as the game evolves. */
export const ClientEvents = {
  MoveRequest: "game:move",
  AttackRequest: "game:attack",
  SnapshotRequest: "game:snapshot:request"
} as const;

export const ServerEvents = {
  Welcome: "game:welcome",
  Snapshot: "game:snapshot",
  Error: "game:error",
  CombatLog: "game:combat-log"
} as const;

export const WelcomeSchema = z.object({
  playerId: z.string().min(1),
  worldWidth: z.number().positive(),
  worldHeight: z.number().positive()
});
export type Welcome = z.infer<typeof WelcomeSchema>;

export const CombatLogSchema = z.object({
  attackerId: z.string(),
  targetId: z.string(),
  damage: z.number().int().positive(),
  targetHp: z.number().int().nonnegative(),
  defeated: z.boolean(),
  sequence: z.number().int().nonnegative()
});
export type CombatLog = z.infer<typeof CombatLogSchema>;
