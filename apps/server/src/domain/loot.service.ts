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
  private pickRandomFromPool(rarity: ItemRarity): ItemDefinition | null {
    const pool = RARITY_DROP_POOL[rarity];
    if (!pool || pool.length === 0) return null;
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }

  /**
   * Rola drop para monstros comuns ou elites.
   */
  rollMonsterDrop(enemyLevel: number, isBoss: boolean, guaranteed = false): ItemDefinition | null {
    if (isBoss) {
      // Chefe do Gate: Drop garantido de equipamento de alto tier
      const roll = Math.random();
      if (roll < 0.001) return this.pickRandomFromPool("DIVINE") ?? this.pickRandomFromPool("COSMIC");
      if (roll < 0.005) return this.pickRandomFromPool("COSMIC") ?? this.pickRandomFromPool("LEGENDARY");
      if (roll < 0.03) return this.pickRandomFromPool("IMMORTAL") ?? this.pickRandomFromPool("LEGENDARY");
      if (roll < 0.15) return this.pickRandomFromPool("LEGENDARY") ?? this.pickRandomFromPool("EPIC");
      if (roll < 0.50) return this.pickRandomFromPool("EPIC") ?? this.pickRandomFromPool("RARE");
      return this.pickRandomFromPool("RARE") ?? this.pickRandomFromPool("UNCOMMON");
    }

    // Monstros normais: chance de drop ponderada por nível
    const dropRoll = Math.random();
    if (!guaranteed && dropRoll > 0.40) {
      return null; // 60% chance de nenhum item
    }

    const rarityRoll = Math.random();
    if (enemyLevel >= 6) {
      if (rarityRoll < 0.02) return this.pickRandomFromPool("EPIC");
      if (rarityRoll < 0.12) return this.pickRandomFromPool("RARE");
      if (rarityRoll < 0.45) return this.pickRandomFromPool("UNCOMMON");
      return this.pickRandomFromPool("COMMON");
    }

    // Inimigos de nível baixo (1-5)
    if (rarityRoll < 0.03) return this.pickRandomFromPool("RARE");
    if (rarityRoll < 0.30) return this.pickRandomFromPool("UNCOMMON");
    return this.pickRandomFromPool("COMMON");
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
