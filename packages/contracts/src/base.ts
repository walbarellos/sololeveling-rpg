import { z } from "zod";

export const HunterRankSchema = z.enum(["E", "D", "C", "B", "A", "S"]);
export type HunterRank = z.infer<typeof HunterRankSchema>;

export const BattleRewardsSchema = z.object({
  expGained: z.number().int().nonnegative(),
  levelBefore: z.number().int().positive(),
  levelAfter: z.number().int().positive(),
  expBefore: z.number().int().nonnegative(),
  expAfter: z.number().int().nonnegative(),
  /** Nível travado pelo rank: o EXP fica retido até a prova de rank. */
  capped: z.boolean(),
  /** Cap de nível do rank atual (para a mensagem de "prova pendente"). */
  levelCap: z.number().int().positive()
});
export type BattleRewards = z.infer<typeof BattleRewardsSchema>;

export const PlayerAttributesSchema = z.object({
  str: z.number().int().min(10),
  agi: z.number().int().min(10),
  vit: z.number().int().min(10),
  int: z.number().int().min(10)
});
export type PlayerAttributes = z.infer<typeof PlayerAttributesSchema>;

export const DEFAULT_PLAYER_ATTRIBUTES: PlayerAttributes = {
  str: 10,
  agi: 10,
  vit: 10,
  int: 10
};

export const STARTING_STAT_POINTS = 5;
export const STAT_POINTS_PER_LEVEL = 3;
