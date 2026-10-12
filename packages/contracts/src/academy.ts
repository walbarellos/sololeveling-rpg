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
  const order: HunterRank[] = ["E", "D", "C", "B", "A", "S", "SS", "SSS", "SSS+"];
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
    requiredTrophyItemId: "trophy_crimson_heart",
    trophyName: "Coração da Cidadela Carmesim",
    rewardStatPoints: 15,
    unlockedLevelCap: 45,
    description: "Incursão da Cidadela Carmesim: Derrote a Sentinela Carmesim no Gate D para autorização de incursões Classe C."
  },
  B: {
    targetRank: "B",
    minLevel: 25,
    minAllocatedStats: 50,
    requiredTrophyItemId: "trophy_frost_queen_crystal",
    trophyName: "Cristal do Coração da Rainha do Gelo",
    rewardStatPoints: 25,
    unlockedLevelCap: 65,
    description: "Incursão Glacial: Destrua a Rainha do Gelo Frostbite no Gate C (Niflheim) e contenha o congelamento dimensional."
  },
  A: {
    targetRank: "A",
    minLevel: 45,
    minAllocatedStats: 75,
    requiredTrophyItemId: "trophy_shadow_lich_skull",
    trophyName: "Crânio do Arquilorde Necromante",
    rewardStatPoints: 35,
    unlockedLevelCap: 90,
    description: "Purificação da Necrópole: Destrua o Arquilorde Necromante no Gate B e lidere esquadrões de elite."
  },
  S: {
    targetRank: "S",
    minLevel: 65,
    minAllocatedStats: 100,
    requiredTrophyItemId: "trophy_dragon_heart",
    trophyName: "Coração Vulcânico do Dragão Ignis",
    rewardStatPoints: 50,
    unlockedLevelCap: 120,
    description: "Abolição de Cataclismo: Abata o Dragão de Lava Ignis no Gate A para ascender ao Panteão Nacional de Rank S."
  },
  SS: {
    targetRank: "SS",
    minLevel: 95,
    minAllocatedStats: 130,
    requiredTrophyItemId: "trophy_god_statue_fragment",
    trophyName: "Fragmento Sagrado da Estátua de Deus",
    rewardStatPoints: 75,
    unlockedLevelCap: 150,
    description: "Desafio da Divindade Antiga: Sobreviva e destrua a Estátua de Deus no Gate S (Templo Duplo) para alcançar o Rank SS."
  },
  SSS: {
    targetRank: "SSS",
    minLevel: 125,
    minAllocatedStats: 160,
    requiredTrophyItemId: "trophy_cosmic_core",
    trophyName: "Núcleo da Calamidade Cósmica",
    rewardStatPoints: 100,
    unlockedLevelCap: 180,
    description: "Calamidade Cósmica: Aniquile o Avatar da Calamidade no Gate SS e atinja autoridade de Monarca Interdimensional."
  },
  "SSS+": {
    targetRank: "SSS+",
    minLevel: 155,
    minAllocatedStats: 200,
    requiredTrophyItemId: "trophy_shadow_sovereign_crown",
    trophyName: "Coroa do Monarca das Sombras",
    rewardStatPoints: 150,
    unlockedLevelCap: 200,
    description: "Ascensão ao Trono Supremo: Conquiste a Coroa do Monarca no Gate SSS e torne-se o Soberano Supremo das Sombras (Rank SSS+)."
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
