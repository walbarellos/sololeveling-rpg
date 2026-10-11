/**
 * Progressão — funções puras compartilhadas entre servidor e cliente.
 * Valores iniciais para tuning (ver simulação Monte Carlo antes de fechar números).
 */
import type { HunterRank } from "./base";

export const MAX_LEVEL = 100;

/** Nível máximo por rank. O EXP fica retido no cap até a prova de rank ser concluída. */
export const RANK_CAP: Readonly<Record<HunterRank, number>> = {
  E: 12,
  D: 25,
  C: 40,
  B: 60,
  A: 80,
  S: 100
};

/** EXP necessário para sair do nível `level` para o seguinte. */
export const expToNext = (level: number): number => Math.round(40 * level ** 1.5);

/** EXP concedido por um monstro de nível `mobLevel` (~5 kills/nível no Lv1, ~24 no Lv50). */
export const mobExp = (mobLevel: number): number => Math.round(8 * mobLevel ** 1.1);

/** Multiplicador de stats (HP, MP, dano, cura) por nível. Lv1 = 1.0. */
export const statMult = (level: number): number => 1 + 0.09 * (level - 1);

export interface ExpState {
  level: number;
  exp: number;
  rank: HunterRank;
}

export interface ExpResult {
  level: number;
  exp: number;
  /** true quando o jogador está no cap do rank (EXP retido até a prova). */
  capped: boolean;
}

export function applyExp(state: ExpState, gained: number): ExpResult {
  const cap = Math.min(RANK_CAP[state.rank], MAX_LEVEL);
  let level = Math.min(state.level, cap);
  let exp = Math.max(0, state.exp) + Math.max(0, Math.floor(gained));

  while (level < cap && exp >= expToNext(level)) {
    exp -= expToNext(level);
    level++;
  }

  const capped = level >= cap;
  if (capped) exp = Math.min(exp, expToNext(level) - 1);
  return { level, exp, capped };
}
