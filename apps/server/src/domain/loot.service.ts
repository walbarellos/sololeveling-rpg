import type {
  HunterCareerStats,
  InventorySlot,
  ItemDefinition,
  ItemRarity
} from "@rpg/contracts";
import { MASTER_ITEMS, RARITY_DROP_POOL } from "./items.data";

const RARITY_ORDER: Record<ItemRarity, number> = {
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 3,
  EPIC: 4,
  LEGENDARY: 5,
  IMMORTAL: 6,
  COSMIC: 7,
  DIVINE: 8
};

export class LootService {
  /**
   * Rola uma raridade baseada nas chances ponderadas informadas.
   */
  private pickRandomFromPool(rarity: ItemRarity, enemyLevel?: number): ItemDefinition | null {
    const pool = RARITY_DROP_POOL[rarity];
    if (!pool || pool.length === 0) return null;
    if (enemyLevel !== undefined) {
      // Itens utilizáveis no nível do monstro (margem de +2 para recompensas emocionantes)
      const suitable = pool.filter((i) => i.minLevel <= enemyLevel + 2);
      if (suitable.length > 0) {
        const maxLevel = Math.max(...suitable.map((i) => i.minLevel));
        // Prioriza a faixa superior de nível (evita que monstros Lv 50+ dropem armas de recruta Lv 1)
        const threshold = Math.max(1, Math.floor(maxLevel * 0.65));
        const tierCandidates = suitable.filter((i) => i.minLevel >= threshold);
        const candidates = tierCandidates.length > 0 ? tierCandidates : suitable;
        const idx = Math.floor(Math.random() * candidates.length);
        return candidates[idx];
      }
    }
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }

  /**
   * Rola drop para monstros comuns ou chefes, escalonado pelo nível do inimigo.
   */
  rollMonsterDrop(enemyLevel: number, isBoss: boolean, guaranteed = false): ItemDefinition | null {
    if (isBoss) {
      const roll = Math.random();
      if (enemyLevel >= 180) {
        // Ashborn, Kamish (Lv 185–200)
        if (roll < 0.35) return this.pickRandomFromPool("DIVINE", enemyLevel) ?? this.pickRandomFromPool("COSMIC", enemyLevel);
        if (roll < 0.75) return this.pickRandomFromPool("COSMIC", enemyLevel) ?? this.pickRandomFromPool("IMMORTAL", enemyLevel);
        return this.pickRandomFromPool("IMMORTAL", enemyLevel);
      }
      if (enemyLevel >= 120) {
        // Avatar Cósmico, Igris (Lv 125–165)
        if (roll < 0.15) return this.pickRandomFromPool("DIVINE", enemyLevel) ?? this.pickRandomFromPool("COSMIC", enemyLevel);
        if (roll < 0.50) return this.pickRandomFromPool("COSMIC", enemyLevel) ?? this.pickRandomFromPool("IMMORTAL", enemyLevel);
        if (roll < 0.85) return this.pickRandomFromPool("IMMORTAL", enemyLevel) ?? this.pickRandomFromPool("LEGENDARY", enemyLevel);
        return this.pickRandomFromPool("LEGENDARY", enemyLevel);
      }
      if (enemyLevel >= 70) {
        // Estátua de Deus, Dragão Ignis (Lv 75–110)
        if (roll < 0.15) return this.pickRandomFromPool("COSMIC", enemyLevel) ?? this.pickRandomFromPool("IMMORTAL", enemyLevel);
        if (roll < 0.50) return this.pickRandomFromPool("IMMORTAL", enemyLevel) ?? this.pickRandomFromPool("LEGENDARY", enemyLevel);
        return this.pickRandomFromPool("LEGENDARY", enemyLevel);
      }
      if (enemyLevel >= 35) {
        // Arquilorde Necromante, Behemoth (Lv 42–65)
        if (roll < 0.25) return this.pickRandomFromPool("IMMORTAL", enemyLevel) ?? this.pickRandomFromPool("LEGENDARY", enemyLevel);
        if (roll < 0.70) return this.pickRandomFromPool("LEGENDARY", enemyLevel) ?? this.pickRandomFromPool("EPIC", enemyLevel);
        return this.pickRandomFromPool("EPIC", enemyLevel);
      }
      if (enemyLevel >= 15) {
        // Rainha do Gelo, Sentinela Carmesim (Lv 16–30)
        if (roll < 0.25) return this.pickRandomFromPool("LEGENDARY", enemyLevel) ?? this.pickRandomFromPool("EPIC", enemyLevel);
        if (roll < 0.75) return this.pickRandomFromPool("EPIC", enemyLevel) ?? this.pickRandomFromPool("RARE", enemyLevel);
        return this.pickRandomFromPool("RARE", enemyLevel);
      }
      // Chefes do Gate E (Lv 5–14)
      if (roll < 0.35) return this.pickRandomFromPool("EPIC", enemyLevel) ?? this.pickRandomFromPool("RARE", enemyLevel);
      if (roll < 0.80) return this.pickRandomFromPool("RARE", enemyLevel) ?? this.pickRandomFromPool("UNCOMMON", enemyLevel);
      return this.pickRandomFromPool("UNCOMMON", enemyLevel);
    }

    // Monstros normais: chance de drop ponderada por nível
    const dropRoll = Math.random();
    if (!guaranteed && dropRoll > 0.40) {
      return null;
    }

    const rarityRoll = Math.random();
    if (enemyLevel >= 150) {
      if (rarityRoll < 0.08) return this.pickRandomFromPool("COSMIC", enemyLevel);
      if (rarityRoll < 0.25) return this.pickRandomFromPool("IMMORTAL", enemyLevel);
      if (rarityRoll < 0.60) return this.pickRandomFromPool("LEGENDARY", enemyLevel);
      return this.pickRandomFromPool("EPIC", enemyLevel);
    }
    if (enemyLevel >= 90) {
      if (rarityRoll < 0.12) return this.pickRandomFromPool("IMMORTAL", enemyLevel);
      if (rarityRoll < 0.40) return this.pickRandomFromPool("LEGENDARY", enemyLevel);
      if (rarityRoll < 0.80) return this.pickRandomFromPool("EPIC", enemyLevel);
      return this.pickRandomFromPool("RARE", enemyLevel);
    }
    if (enemyLevel >= 45) {
      if (rarityRoll < 0.15) return this.pickRandomFromPool("LEGENDARY", enemyLevel);
      if (rarityRoll < 0.50) return this.pickRandomFromPool("EPIC", enemyLevel);
      if (rarityRoll < 0.85) return this.pickRandomFromPool("RARE", enemyLevel);
      return this.pickRandomFromPool("UNCOMMON", enemyLevel);
    }
    if (enemyLevel >= 20) {
      if (rarityRoll < 0.20) return this.pickRandomFromPool("EPIC", enemyLevel);
      if (rarityRoll < 0.60) return this.pickRandomFromPool("RARE", enemyLevel);
      return this.pickRandomFromPool("UNCOMMON", enemyLevel);
    }
    if (enemyLevel >= 6) {
      if (rarityRoll < 0.04) return this.pickRandomFromPool("EPIC", enemyLevel);
      if (rarityRoll < 0.20) return this.pickRandomFromPool("RARE", enemyLevel);
      if (rarityRoll < 0.60) return this.pickRandomFromPool("UNCOMMON", enemyLevel);
      return this.pickRandomFromPool("COMMON", enemyLevel);
    }
    // Inimigos de nível baixo (1-5)
    if (rarityRoll < 0.05) return this.pickRandomFromPool("RARE", enemyLevel);
    if (rarityRoll < 0.35) return this.pickRandomFromPool("UNCOMMON", enemyLevel);
    return this.pickRandomFromPool("COMMON", enemyLevel);
  }

  /**
   * Adiciona um item ao inventário do caçador, agrupando se for consumível existente.
   */
  addItemToInventory(
    inventory: InventorySlot[],
    item: ItemDefinition,
    quantity = 1,
    maxSlots = 24
  ): boolean {
    if (item.type === "CONSUMABLE") {
      const existing = inventory.find((s) => s.item.id === item.id);
      if (existing) {
        existing.quantity += quantity;
        return true;
      }
    }

    if (inventory.length >= maxSlots) {
      return false; // Inventário cheio
    }

    // Encontra o menor slotIndex livre
    const usedIndices = new Set(inventory.map((s) => s.slotIndex));
    let nextIdx = 0;
    while (usedIndices.has(nextIdx)) {
      nextIdx++;
    }

    inventory.push({
      slotIndex: nextIdx,
      item,
      quantity
    });
    return true;
  }

  /**
   * Atualiza as estatísticas de carreira quando um item é dropado.
   */
  recordItemDrop(stats: HunterCareerStats, item: ItemDefinition): void {
    stats.totalItemsDropped += 1;

    const currentBestOrder = stats.highestRarityDropped ? RARITY_ORDER[stats.highestRarityDropped] : 0;
    const newOrder = RARITY_ORDER[item.rarity];

    if (newOrder > currentBestOrder) {
      stats.highestRarityDropped = item.rarity;
      stats.bestItemDroppedName = item.name;
    }
  }

  /**
   * Retorna os consumíveis iniciais fornecidos para novos caçadores.
   */
  createStartingInventory(): InventorySlot[] {
    return [
      {
        slotIndex: 0,
        item: MASTER_ITEMS.potion_hp_minor,
        quantity: 2
      },
      {
        slotIndex: 1,
        item: MASTER_ITEMS.potion_mp_minor,
        quantity: 1
      }
    ];
  }
}
