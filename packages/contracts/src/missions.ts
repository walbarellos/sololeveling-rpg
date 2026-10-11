import { z } from "zod";
import { BattleRewardsSchema, HunterRankSchema, type HunterRank } from "./index";

export const RANK_ORDER: Readonly<Record<HunterRank, number>> = {
  E: 0,
  D: 1,
  C: 2,
  B: 3,
  A: 4,
  S: 5
};

export function isRankAllowed(playerRank: HunterRank, minRank: HunterRank): boolean {
  return RANK_ORDER[playerRank] >= RANK_ORDER[minRank];
}

export const MissionDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  durationMs: z.number().int().positive(),
  killsEquiv: z.number().int().positive(),
  minRank: HunterRankSchema,
  minLevel: z.number().int().positive(),
  icon: z.string().default("doc")
});
export type MissionDefinition = z.infer<typeof MissionDefinitionSchema>;

export const MissionRunSchema = z.object({
  runId: z.string().min(1),
  missionId: z.string().min(1),
  name: z.string().min(1),
  startedAt: z.number().int().positive(),
  endsAt: z.number().int().positive(),
  durationMs: z.number().int().positive(),
  killsEquiv: z.number().int().positive(),
  potentialExp: z.number().int().nonnegative(),
  completed: z.boolean()
});
export type MissionRun = z.infer<typeof MissionRunSchema>;

export const StartMissionRequestSchema = z.object({
  missionId: z.string().min(1)
});
export type StartMissionRequest = z.infer<typeof StartMissionRequestSchema>;

export const ClaimMissionRequestSchema = z.object({
  runId: z.string().min(1)
});
export type ClaimMissionRequest = z.infer<typeof ClaimMissionRequestSchema>;

export const CancelMissionRequestSchema = z.object({
  runId: z.string().min(1)
});
export type CancelMissionRequest = z.infer<typeof CancelMissionRequestSchema>;

export const MissionsStateSchema = z.object({
  available: z.array(MissionDefinitionSchema),
  activeRun: MissionRunSchema.nullable(),
  serverTime: z.number().int().positive()
});
export type MissionsState = z.infer<typeof MissionsStateSchema>;

export const MissionClaimResultSchema = z.object({
  success: z.boolean(),
  runId: z.string(),
  missionId: z.string(),
  expGained: z.number().int().nonnegative(),
  rewards: BattleRewardsSchema.optional(),
  message: z.string()
});
export type MissionClaimResult = z.infer<typeof MissionClaimResultSchema>;

/**
 * Tabela mestre de missões estilo Naruto Game com escalamento temporal:
 * 5s (rápida) -> 1min -> 10min -> 1h -> 3h -> 6h -> 12h
 */
export const MISSIONS: readonly MissionDefinition[] = [
  {
    id: "patrol_5s",
    name: "Patrulha Relâmpago",
    description: "Reconhecimento rápido de baixa intensidade nos arredores do distrito.",
    durationMs: 5_000,
    killsEquiv: 1,
    minRank: "E",
    minLevel: 1,
    icon: "patrol"
  },
  {
    id: "recon_1m",
    name: "Coleta de Essência",
    description: "Varredura e extração de cristais de mana em Gates E menores.",
    durationMs: 60_000,
    killsEquiv: 3,
    minRank: "E",
    minLevel: 3,
    icon: "crystal"
  },
  {
    id: "subdue_10m",
    name: "Caçada de Goblins",
    description: "Extermínio tático de criaturas no perímetro do metrô subterrâneo.",
    durationMs: 600_000,
    killsEquiv: 12,
    minRank: "E",
    minLevel: 6,
    icon: "hunt"
  },
  {
    id: "gate_d_1h",
    name: "Incursão Gate D",
    description: "Limpeza completa de masmorra de rank D com esquadrão tático.",
    durationMs: 3_600_000,
    killsEquiv: 30,
    minRank: "D",
    minLevel: 13,
    icon: "dungeon"
  },
  {
    id: "gate_c_3h",
    name: "Expedição Profunda C",
    description: "Exploração de cavernas dimensionais e enfrentamento de chefes locais.",
    durationMs: 10_800_000,
    killsEquiv: 70,
    minRank: "C",
    minLevel: 26,
    icon: "expedition"
  },
  {
    id: "tower_b_6h",
    name: "Ascensão da Torre B",
    description: "Combate contínuo por múltiplos andares da Torre dos Desafios.",
    durationMs: 21_600_000,
    killsEquiv: 130,
    minRank: "B",
    minLevel: 50,
    icon: "tower"
  },
  {
    id: "monarch_a_12h",
    name: "Campanha Nacional A",
    description: "Mobilização de elite da Associação contra ruptura catastrófica de Gate.",
    durationMs: 43_200_000,
    killsEquiv: 220,
    minRank: "A",
    minLevel: 70,
    icon: "monarch"
  }
];
