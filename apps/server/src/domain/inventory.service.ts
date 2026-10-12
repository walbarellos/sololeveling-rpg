import {
  getItemGoldValue,
  type InventorySlot,
  type InventoryState,
  type ItemDefinition,
  type ItemRarity,
  type PlayerEquipment,
  type ServerErrorCode
} from "@rpg/contracts";
import type { BattleSession } from "./battle.session";
import type { LootService } from "./loot.service";
import { DEFAULT_CAREER_STATS, DEFAULT_EQUIPMENT, type PlayerEntity } from "./player.repository";
import { calculatePlayerMaxHp, calculatePlayerMaxMp, calculatePlayerStats } from "./skills.data";

export class InventoryService {
  constructor(private readonly lootService: LootService) {}

  getInventoryState(player: PlayerEntity): InventoryState {
    return {
      inventory: player.inventory ?? [],
      equipment: player.equipment ?? { ...DEFAULT_EQUIPMENT },
      careerStats: player.careerStats ?? { ...DEFAULT_CAREER_STATS }
    };
  }

  equipItem(
    player: PlayerEntity,
    slotIndex: number
  ): { success: boolean; state?: InventoryState; error?: ServerErrorCode } {
    const inv = player.inventory ?? [];
    const invSlot = inv.find((s) => s.slotIndex === slotIndex);
    if (!invSlot) return { success: false, error: "ITEM_NOT_FOUND" };

    const item = invSlot.item;
    if (item.type === "CONSUMABLE" || item.type === "TROPHY") {
      return { success: false, error: "CANNOT_EQUIP" };
    }

    if (player.level < item.minLevel) {
      return { success: false, error: "INSUFFICIENT_LEVEL_FOR_ITEM" };
    }

    const eq = player.equipment ?? { ...DEFAULT_EQUIPMENT };
    let previousItem: ItemDefinition | null = null;

    if (item.type === "WEAPON") {
      previousItem = eq.weapon;
      eq.weapon = item;
    } else if (item.type === "ARMOR") {
      previousItem = eq.armor;
      eq.armor = item;
    } else if (item.type === "AMULET") {
      previousItem = eq.amulet;
      eq.amulet = item;
    } else if (item.type === "RING") {
      previousItem = eq.ring;
      eq.ring = item;
    }

    // Remove do inventário ou troca pelo anterior
    const slotIdx = inv.findIndex((s) => s.slotIndex === slotIndex);
    if (previousItem) {
      inv[slotIdx] = { slotIndex, item: previousItem, quantity: 1 };
    } else {
      inv.splice(slotIdx, 1);
    }

    player.inventory = inv;
    player.equipment = eq;

    // Recalcula atributos máximos com o equipamento
    this.recalculatePlayerStats(player);

    return { success: true, state: this.getInventoryState(player) };
  }

  unequipItem(
    player: PlayerEntity,
    slot: "weapon" | "armor" | "amulet" | "ring"
  ): { success: boolean; state?: InventoryState; error?: ServerErrorCode } {
    const eq = player.equipment ?? { ...DEFAULT_EQUIPMENT };
    const item = eq[slot];
    if (!item) return { success: false, error: "ITEM_NOT_FOUND" };

    const inv = player.inventory ?? [];
    const added = this.lootService.addItemToInventory(inv, item);
    if (!added) return { success: false, error: "CANNOT_EQUIP" }; // Inventário cheio

    eq[slot] = null;
    player.equipment = eq;
    player.inventory = inv;

    this.recalculatePlayerStats(player);

    return { success: true, state: this.getInventoryState(player) };
  }

  useItem(
    player: PlayerEntity,
    slotIndex: number
  ): { success: boolean; state?: InventoryState; error?: ServerErrorCode } {
    const inv = player.inventory ?? [];
    const invSlot = inv.find((s) => s.slotIndex === slotIndex);
    if (!invSlot) return { success: false, error: "ITEM_NOT_FOUND" };

    const item = invSlot.item;
    if (item.type !== "CONSUMABLE") {
      return { success: false, error: "INVALID_PAYLOAD" };
    }

    if (item.healAmount && item.healAmount > 0) {
      player.hp = Math.min(player.maxHp, player.hp + item.healAmount);
    }
    if (item.manaAmount && item.manaAmount > 0) {
      player.mp = Math.min(player.maxMp, player.mp + item.manaAmount);
    }

    invSlot.quantity -= 1;
    if (invSlot.quantity <= 0) {
      const idx = inv.findIndex((s) => s.slotIndex === slotIndex);
      inv.splice(idx, 1);
    }

    player.inventory = inv;
    return { success: true, state: this.getInventoryState(player) };
  }

  useCombatConsumable(
    player: PlayerEntity,
    session: BattleSession,
    itemId: string
  ): { success: boolean; error?: ServerErrorCode } {
    const inv = player.inventory ?? [];
    const invSlot = inv.find((s) => s.item.id === itemId && s.item.type === "CONSUMABLE");
    if (!invSlot) return { success: false, error: "ITEM_NOT_FOUND" };

    const res = session.executeConsumable(invSlot.item);
    if (!res.success) {
      return { success: false, error: res.error as ServerErrorCode };
    }

    // Consome 1 carga do inventário
    invSlot.quantity -= 1;
    if (invSlot.quantity <= 0) {
      const idx = inv.findIndex((s) => s.item.id === itemId);
      inv.splice(idx, 1);
    }

    player.inventory = inv;
    player.hp = session.player.hp;
    player.mp = session.player.mp;

    return { success: true };
  }

  private recalculatePlayerStats(player: PlayerEntity): void {
    player.maxHp = calculatePlayerMaxHp(player.hunterClass, player.level, player.attributes.vit, player.equipment);
    player.maxMp = calculatePlayerMaxMp(player.hunterClass, player.level, player.attributes.int, player.equipment);
    player.hp = Math.min(player.hp, player.maxHp);
    player.mp = Math.min(player.mp, player.maxMp);
  }

  sellItem(
    player: PlayerEntity,
    slotIndex: number
  ): { success: boolean; goldEarned?: number; state?: InventoryState; error?: ServerErrorCode } {
    const inv = player.inventory ?? [];
    const idx = inv.findIndex((s) => s.slotIndex === slotIndex);
    if (idx === -1) return { success: false, error: "ITEM_NOT_FOUND" };

    const invSlot = inv[idx];
    if (invSlot.item.type === "TROPHY") {
      return { success: false, error: "CANNOT_SELL_TROPHY" };
    }

    const goldEarned = getItemGoldValue(invSlot.item) * invSlot.quantity;
    inv.splice(idx, 1);

    player.inventory = inv;
    player.gold = (player.gold ?? 0) + goldEarned;

    return { success: true, goldEarned, state: this.getInventoryState(player) };
  }

  sellAllJunk(
    player: PlayerEntity,
    maxRarity: ItemRarity = "UNCOMMON"
  ): { success: boolean; goldEarned: number; itemsSold: number; state: InventoryState } {
    const inv = player.inventory ?? [];
    const allowedRarities = maxRarity === "COMMON" ? ["COMMON"] : ["COMMON", "UNCOMMON"];

    let totalGold = 0;
    let soldCount = 0;
    const remaining: InventorySlot[] = [];

    for (const slot of inv) {
      if (slot.item.type !== "TROPHY" && allowedRarities.includes(slot.item.rarity)) {
        totalGold += getItemGoldValue(slot.item) * slot.quantity;
        soldCount += slot.quantity;
      } else {
        remaining.push(slot);
      }
    }

    player.inventory = remaining;
    player.gold = (player.gold ?? 0) + totalGold;

    return { success: true, goldEarned: totalGold, itemsSold: soldCount, state: this.getInventoryState(player) };
  }
}
