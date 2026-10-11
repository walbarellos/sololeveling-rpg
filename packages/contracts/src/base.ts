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
