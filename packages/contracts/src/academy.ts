import { z } from "zod";
import { HunterRankSchema, type HunterRank } from "./base";

export const RankExamRequirementSchema = z.object({
  targetRank: HunterRankSchema,
  minLevel: z.number().int().positive(),
  minAllocatedStats: z.number().int().positive(),
  requiredTrophyItemId: z.string(),
  trophyName: z.string(),
  rewardStatPoints: z.number().int().positive(),
  unlockedLevelCap: z.number().int().positive(),
  description: z.string()
});
export type RankExamRequirement = z.infer<typeof RankExamRequirementSchema>;

export function getNextHunterRank(currentRank: HunterRank): HunterRank | null {
  const order: HunterRank[] = ["E", "D", "C", "B", "A", "S"];
  const idx = order.indexOf(currentRank);
  if (idx >= 0 && idx < order.length - 1) {
    return order[idx + 1];
  }
  return null;
}

export const RANK_EXAM_REQUIREMENTS: Readonly<Partial<Record<HunterRank, RankExamRequirement>>> = {
  D: {
    targetRank: "D",
    minLevel: 8,
    minAllocatedStats: 15,
    requiredTrophyItemId: "trophy_goblin_boss_core",
    trophyName: "Núcleo de Mana do Chefe Goblin",
    rewardStatPoints: 10,
    unlockedLevelCap: 25,
    description: "Exame Oficial da Associação: Derrote o Líder Goblin das Ruínas e comprove domínio sobre seus atributos."
  },
  C: {
    targetRank: "C",
    minLevel: 15,
    minAllocatedStats: 30,
    requiredTrophyItemId: "trophy_shadow_wolf_fang",
    trophyName: "Presa da Matriarca das Sombras",
    rewardStatPoints: 15,
    unlockedLevelCap: 45,
    description: "Incursão Avançada: Abata a Matriarca Lobo das Sombras no Covil das Feras para autorização de incursões Classe C."
  },
  B: {
    targetRank: "B",
    minLevel: 25,
    minAllocatedStats: 50,
    requiredTrophyItemId: "trophy_fire_gate_core",
    trophyName: "Coração Ígneo do Portão Vermelho",
    rewardStatPoints: 25,
    unlockedLevelCap: 65,
    description: "Abolição de Ruptura: Destrua o Chefe Supremo do Portão de Fogo e contenha o perigo regional."
  },
  A: {
    targetRank: "A",
    minLevel: 45,
    minAllocatedStats: 75,
    requiredTrophyItemId: "trophy_void_essence",
    trophyName: "Essência do Lorde do Vácuo",
    rewardStatPoints: 35,
    unlockedLevelCap: 85,
    description: "Elite Nacional: Conquiste a matéria cósmica do Abismo Dimensional e lidere incursões de grande porte."
  },
  S: {
    targetRank: "S",
    minLevel: 70,
    minAllocatedStats: 100,
    requiredTrophyItemId: "trophy_monarch_crown",
    trophyName: "Coroa do Monarca Antigo",
    rewardStatPoints: 50,
    unlockedLevelCap: 100,
    description: "Consagração Máxima: Homologação no panteão dos caçadores de nível nacional pela Presidência da Associação."
  }
};

export const RankPromotionRequestSchema = z.object({
  targetRank: HunterRankSchema
});
export type RankPromotionRequest = z.infer<typeof RankPromotionRequestSchema>;

export const RankPromotionResultSchema = z.object({
  success: z.boolean(),
  newRank: HunterRankSchema,
  message: z.string(),
  unlockedLevelCap: z.number().int().positive(),
  rewardStatPoints: z.number().int().nonnegative()
});
export type RankPromotionResult = z.infer<typeof RankPromotionResultSchema>;
