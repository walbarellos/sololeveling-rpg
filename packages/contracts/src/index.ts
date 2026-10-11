import { z } from "zod";
import {
  BattleRewardsSchema,
  HunterRankSchema,
  PlayerAttributesSchema,
  DEFAULT_PLAYER_ATTRIBUTES
} from "./base";
export * from "./base";

export const TileCoordSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0)
});
export type TileCoord = z.infer<typeof TileCoordSchema>;

export const DirectionSchema = z.enum(["UP", "DOWN", "LEFT", "RIGHT"]);
export type Direction = z.infer<typeof DirectionSchema>;

export const HunterClassSchema = z.enum([
  "WARRIOR",
  "ASSASSIN",
  "MAGE",
  "BATTLE_HEALER"
]);
export type HunterClass = z.infer<typeof HunterClassSchema>;

export const PlayerStatsSchema = z.object({
  physicalAtk: z.number().int().nonnegative(),
  magicalAtk: z.number().int().nonnegative(),
  critChance: z.number().min(0).max(1),
  dodgeChance: z.number().min(0).max(1),
  blockChance: z.number().min(0).max(1)
});
export type PlayerStats = z.infer<typeof PlayerStatsSchema>;

export const PlayerSnapshotSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(24),
  rank: HunterRankSchema,
  hunterClass: HunterClassSchema,
  level: z.number().int().positive(),
  exp: z.number().int().nonnegative(),
  expToNext: z.number().int().positive(),
  levelCap: z.number().int().positive(),
  position: TileCoordSchema,
  hp: z.number().int().nonnegative(),
  maxHp: z.number().int().positive(),
  mp: z.number().int().nonnegative(),
  maxMp: z.number().int().positive(),
  stamina: z.number().int().nonnegative(),
  maxStamina: z.number().int().positive(),
  stats: PlayerStatsSchema,
  attributes: PlayerAttributesSchema.default(DEFAULT_PLAYER_ATTRIBUTES),
  unallocatedStatPoints: z.number().int().nonnegative().default(0),
  inBattle: z.boolean(),
  activeBattleId: z.string().optional(),
  sequence: z.number().int().nonnegative()
});
export type PlayerSnapshot = z.infer<typeof PlayerSnapshotSchema>;

export const EnemySnapshotSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  rank: HunterRankSchema,
  level: z.number().int().positive(),
  position: TileCoordSchema,
  hp: z.number().int().nonnegative(),
  maxHp: z.number().int().positive(),
  mp: z.number().int().nonnegative(),
  maxMp: z.number().int().nonnegative(),
  alive: z.boolean()
});
export type EnemySnapshot = z.infer<typeof EnemySnapshotSchema>;

export const WorldSnapshotSchema = z.object({
  players: z.array(PlayerSnapshotSchema),
  enemies: z.array(EnemySnapshotSchema),
  obstacles: z.array(TileCoordSchema),
  serverTime: z.number().int().nonnegative()
});
export type WorldSnapshot = z.infer<typeof WorldSnapshotSchema>;

export const StepRequestSchema = z.object({
  direction: DirectionSchema
});
export type StepRequest = z.infer<typeof StepRequestSchema>;

export const SelectClassRequestSchema = z.object({
  hunterClass: HunterClassSchema
});
export type SelectClassRequest = z.infer<typeof SelectClassRequestSchema>;

export const StartBattleRequestSchema = z.object({
  targetEnemyId: z.string().min(1).max(100)
});
export type StartBattleRequest = z.infer<typeof StartBattleRequestSchema>;

export const AllocateStatsRequestSchema = z
  .object({
    str: z.number().int().min(0).default(0),
    agi: z.number().int().min(0).default(0),
    vit: z.number().int().min(0).default(0),
    int: z.number().int().min(0).default(0)
  })
  .refine((d) => d.str + d.agi + d.vit + d.int > 0, {
    message: "Ao menos um ponto deve ser distribuído."
  });
export type AllocateStatsRequest = z.infer<typeof AllocateStatsRequestSchema>;

export const SkillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  mpCost: z.number().int().nonnegative(),
  cooldownTurns: z.number().int().nonnegative(),
  currentCooldown: z.number().int().nonnegative()
});
export type Skill = z.infer<typeof SkillSchema>;

export const BattleParticipantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  rank: HunterRankSchema,
  level: z.number().int().positive(),
  hp: z.number().int().nonnegative(),
  maxHp: z.number().int().positive(),
  mp: z.number().int().nonnegative(),
  maxMp: z.number().int().positive()
});
export type BattleParticipant = z.infer<typeof BattleParticipantSchema>;

export const BattlePlayerParticipantSchema = BattleParticipantSchema.extend({
  hunterClass: HunterClassSchema,
  skills: z.array(SkillSchema),
  stats: PlayerStatsSchema.optional()
});
export type BattlePlayerParticipant = z.infer<typeof BattlePlayerParticipantSchema>;

/**
 * Evento estruturado de combate, na ordem em que aconteceu no turno.
 * O cliente reproduz em sequência (golpe → contragolpe → morte) em vez de pular pro estado final.
 * `logIndex` aponta a linha de `log` que corresponde ao evento.
 */
export const BattleEventSchema = z.object({
  kind: z.enum(["HIT", "CRIT", "BLOCK", "DODGE", "HEAL", "DEATH"]),
  target: z.enum(["player", "enemy"]),
  amount: z.number().int().nonnegative(),
  targetHpAfter: z.number().int().nonnegative(),
  logIndex: z.number().int().nonnegative()
});
export type BattleEvent = z.infer<typeof BattleEventSchema>;

export const BattleSnapshotSchema = z.object({
  battleId: z.string().min(1),
  turn: z.number().int().positive(),
  maxTurns: z.number().int().positive(),
  player: BattlePlayerParticipantSchema,
  enemy: BattleParticipantSchema,
  log: z.array(z.string()),
  finished: z.boolean(),
  result: z.enum(["VICTORY", "DEFEAT", "DRAW", "FLED"]).optional(),
  drawReason: z.enum(["MUTUAL_DEATH", "TURN_LIMIT"]).optional(),
  rewardExp: z.number().int().nonnegative().optional(),
  rewards: BattleRewardsSchema.optional(),
  /** Eventos do último turno resolvido (vazio no snapshot de início de batalha). */
  events: z.array(BattleEventSchema).default([])
});
export type BattleSnapshot = z.infer<typeof BattleSnapshotSchema>;

export const BattleActionRequestSchema = z.object({
  battleId: z.string().min(1),
  actionId: z.string().min(1)
});
export type BattleActionRequest = z.infer<typeof BattleActionRequestSchema>;

export const BattleFleeRequestSchema = z.object({
  battleId: z.string().min(1)
});
export type BattleFleeRequest = z.infer<typeof BattleFleeRequestSchema>;

export const AttackRequestSchema = z.object({
  targetId: z.string().min(1).max(100)
});
export type AttackRequest = z.infer<typeof AttackRequestSchema>;

export const ServerErrorCodeSchema = z.enum([
  "INVALID_PAYLOAD",
  "OUT_OF_BOUNDS",
  "OBSTACLE",
  "TOO_FAST",
  "TARGET_UNAVAILABLE",
  "TOO_FAR",
  "COOLDOWN",
  "NOT_ENOUGH_MP",
  "SKILL_ON_COOLDOWN",
  "BATTLE_NOT_FOUND",
  "ALREADY_IN_BATTLE",
  "NOT_IN_BATTLE",
  "MISSION_NOT_FOUND",
  "MISSION_LOCKED",
  "MISSION_ALREADY_ACTIVE",
  "NO_ACTIVE_MISSION",
  "MISSION_IN_PROGRESS",
  "MISSION_ALREADY_CLAIMED",
  "INSUFFICIENT_STAT_POINTS",
  "CANNOT_ALLOCATE_IN_BATTLE"
]);
export type ServerErrorCode = z.infer<typeof ServerErrorCodeSchema>;

export const ServerErrorSchema = z.object({
  code: ServerErrorCodeSchema,
  message: z.string().max(200)
});
export type ServerError = z.infer<typeof ServerErrorSchema>;

/** Stable transport event names. Keep event payloads versioned as the game evolves. */
export const ClientEvents = {
  StepRequest: "game:step",
  SelectClassRequest: "game:class:select",
  StartBattleRequest: "game:battle:start",
  BattleActionRequest: "game:battle:action",
  BattleFleeRequest: "game:battle:flee",
  AttackRequest: "game:attack",
  SnapshotRequest: "game:snapshot:request",
  StartMissionRequest: "game:mission:start",
  ClaimMissionRequest: "game:mission:claim",
  CancelMissionRequest: "game:mission:cancel",
  MissionsRequest: "game:mission:list",
  AllocateStatsRequest: "game:stats:allocate"
} as const;

export const ServerEvents = {
  Welcome: "game:welcome",
  Snapshot: "game:snapshot",
  BattleSnapshot: "game:battle:snapshot",
  BattleEnded: "game:battle:ended",
  Error: "game:error",
  CombatLog: "game:combat-log",
  SessionReplaced: "game:session:replaced",
  MissionsState: "game:mission:state",
  MissionClaimResult: "game:mission:claim-result"
} as const;

/**
 * Identidade persistente (demo, sem autenticação real): o cliente guarda uma chave aleatória
 * e envia no handshake. O servidor só expõe o hash dela como `playerId`.
 */
export const PlayerKeySchema = z.string().regex(/^[a-f0-9]{32,64}$/);
export const HandshakeAuthSchema = z.object({ playerKey: PlayerKeySchema });
export type HandshakeAuth = z.infer<typeof HandshakeAuthSchema>;

export const WelcomeSchema = z.object({
  playerId: z.string().min(1),
  gridWidth: z.number().int().positive(),
  gridHeight: z.number().int().positive(),
  tileSize: z.number().int().positive(),
  obstacles: z.array(TileCoordSchema)
});
export type Welcome = z.infer<typeof WelcomeSchema>;

export const CombatLogSchema = z.object({
  attackerId: z.string(),
  targetId: z.string(),
  damage: z.number().int().positive(),
  counterDamage: z.number().int().nonnegative().optional(),
  targetHp: z.number().int().nonnegative(),
  attackerHp: z.number().int().nonnegative(),
  defeated: z.boolean(),
  sequence: z.number().int().nonnegative()
});
export type CombatLog = z.infer<typeof CombatLogSchema>;

export * from "./progression";
export * from "./missions";
