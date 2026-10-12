import {
  RANK_EXAM_REQUIREMENTS,
  type HunterRank,
  type RankPromotionResult
} from "@rpg/contracts";
import type { PlayerEntity } from "./player.repository";

export class AcademyService {
  /**
   * Avalia a elegibilidade e executa a promoção de rank na Academia de Caçadores.
   */
  evaluatePromotion(player: PlayerEntity, targetRank: HunterRank): RankPromotionResult {
    const requirement = RANK_EXAM_REQUIREMENTS[targetRank];
    if (!requirement) {
      return {
        success: false,
        newRank: player.rank,
        message: `A Associação ainda não liberou exames para o Rank ${targetRank}.`,
        unlockedLevelCap: player.level,
        rewardStatPoints: 0
      };
    }

    // 1. Checagem de Nível Mínimo
    if (player.level < requirement.minLevel) {
      return {
        success: false,
        newRank: player.rank,
        message: `Nível insuficiente. Você precisa ser pelo menos Lv ${requirement.minLevel} para prestar o exame (atual: Lv ${player.level}).`,
        unlockedLevelCap: player.level,
        rewardStatPoints: 0
      };
    }

    // 2. Checagem de Atributos Alocados (treinamento comprovado)
    const totalAllocated =
      (player.attributes.str - 10) +
      (player.attributes.agi - 10) +
      (player.attributes.vit - 10) +
      (player.attributes.int - 10);

    if (totalAllocated < requirement.minAllocatedStats) {
      return {
        success: false,
        newRank: player.rank,
        message: `Treinamento incompleto: Distribua pelo menos ${requirement.minAllocatedStats} pontos de atributo na sua ficha (atualmente alocados: ${totalAllocated}).`,
        unlockedLevelCap: player.level,
        rewardStatPoints: 0
      };
    }

    // 3. Checagem de Troféu do Chefe
    const inv = player.inventory ?? [];
    const trophySlot = inv.find((s) => s.item.id === requirement.requiredTrophyItemId);
    if (!trophySlot) {
      return {
        success: false,
        newRank: player.rank,
        message: `Troféu ausente: Você precisa derrotar o Chefe do Gate e apresentar o item [${requirement.trophyName}] para comprovar a abolição da ameaça.`,
        unlockedLevelCap: player.level,
        rewardStatPoints: 0
      };
    }

    // Sucesso: Aplica a Promoção de Rank!
    player.rank = targetRank;
    player.unallocatedStatPoints += requirement.rewardStatPoints;

    return {
      success: true,
      newRank: targetRank,
      message: `PARABÉNS, CAÇADOR! Sua promoção para RANK ${targetRank} foi homologada pelo Diretor da Academia. Teto de nível expandido para Lv ${requirement.unlockedLevelCap} e +${requirement.rewardStatPoints} pontos de atributos concedidos!`,
      unlockedLevelCap: requirement.unlockedLevelCap,
      rewardStatPoints: requirement.rewardStatPoints
    };
  }
}
