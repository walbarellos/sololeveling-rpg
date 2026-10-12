import {
  getNextHunterRank,
  RANK_EXAM_REQUIREMENTS,
  type HunterRank,
  type InventoryState,
  type PlayerSnapshot,
  type RankPromotionResult,
  type ServerErrorCode
} from "@rpg/contracts";
import type { PlayerEntity } from "./player.repository";
import type { InventoryService } from "./inventory.service";
import type { LootService } from "./loot.service";
import { MASTER_ITEMS } from "./items.data";

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

  /**
   * Permite reaver troféus de chefes abatidos anteriormente caso o jogador os tenha perdido.
   */
  claimLostTrophy(
    player: PlayerEntity,
    trophyId: string | undefined,
    inventoryService: InventoryService,
    lootService: LootService,
    toSnapshot: (p: PlayerEntity) => PlayerSnapshot,
    nextSeq: () => number,
    savePlayer: (p: PlayerEntity) => void
  ): { success: boolean; state?: InventoryState; player?: PlayerSnapshot; message?: string; error?: ServerErrorCode } {
    let finalTrophyId: string = trophyId ?? "";
    if (!finalTrophyId || !MASTER_ITEMS[finalTrophyId]) {
      const nextRank = getNextHunterRank(player.rank);
      const req = nextRank ? RANK_EXAM_REQUIREMENTS[nextRank] : null;
      finalTrophyId = req?.requiredTrophyItemId ?? "trophy_goblin_boss_core";
    }

    const trophyDef = MASTER_ITEMS[finalTrophyId];
    if (!trophyDef || trophyDef.type !== "TROPHY") return { success: false, error: "ITEM_NOT_FOUND" };

    if (!player.inventory) player.inventory = [];
    const alreadyHas = player.inventory.some((s) => s.item.id === finalTrophyId);
    if (alreadyHas) {
      return {
        success: true,
        state: inventoryService.getInventoryState(player),
        player: toSnapshot(player),
        message: `Você já possui o troféu oficial [${trophyDef.name}] em seu inventário!`
      };
    }

    const canClaim =
      (player.careerStats && player.careerStats.gateBossesSlain > 0) ||
      (player.unclaimedTrophies && player.unclaimedTrophies.length > 0) ||
      player.level >= 8;

    if (!canClaim) {
      return { success: false, error: "ACADEMY_REQUIREMENTS_UNMET" };
    }

    const added = lootService.addItemToInventory(player.inventory, trophyDef);
    if (!added) return { success: false, error: "CANNOT_EQUIP" };

    if (player.unclaimedTrophies) {
      player.unclaimedTrophies = player.unclaimedTrophies.filter((id) => id !== finalTrophyId);
    }

    player.sequence = nextSeq();
    savePlayer(player);

    return {
      success: true,
      state: inventoryService.getInventoryState(player),
      player: toSnapshot(player),
      message: `Troféu militar oficial [${trophyDef.name}] recuperado com sucesso pelo Inspetor Baek!`
    };
  }
}
