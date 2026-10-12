import { z } from "zod";

export const ItemRaritySchema = z.enum([
  "COMMON",
  "UNCOMMON",
  "RARE",
  "EPIC",
  "LEGENDARY",
  "IMMORTAL",
  "COSMIC",
  "DIVINE"
]);
export type ItemRarity = z.infer<typeof ItemRaritySchema>;

export const ITEM_RARITY_COLORS: Record<ItemRarity, { hex: string; name: string; glow: string }> = {
  COMMON: { hex: "#94a3b8", name: "Comum", glow: "rgba(148, 163, 184, 0.4)" },
  UNCOMMON: { hex: "#22c55e", name: "Incomum", glow: "rgba(34, 197, 94, 0.5)" },
  RARE: { hex: "#3b82f6", name: "Raro", glow: "rgba(59, 130, 246, 0.6)" },
  EPIC: { hex: "#a855f7", name: "Épico", glow: "rgba(168, 85, 247, 0.7)" },
  LEGENDARY: { hex: "#f59e0b", name: "Lendário", glow: "rgba(245, 158, 11, 0.85)" },
  IMMORTAL: { hex: "#ef4444", name: "Imortal", glow: "rgba(239, 68, 68, 0.95)" },
  COSMIC: { hex: "#ec4899", name: "Cósmico", glow: "rgba(236, 72, 153, 1)" },
  DIVINE: { hex: "#fde047", name: "Divino", glow: "rgba(253, 224, 71, 1)" }
};

export const ItemTypeSchema = z.enum([
  "WEAPON",
  "ARMOR",
  "AMULET",
  "RING",
  "CONSUMABLE",
  "TROPHY"
]);
export type ItemType = z.infer<typeof ItemTypeSchema>;

export const ItemStatBonusesSchema = z.object({
  bonusHp: z.number().int().nonnegative().default(0),
  bonusMp: z.number().int().nonnegative().default(0),
  bonusPhysicalAtk: z.number().int().nonnegative().default(0),
  bonusMagicalAtk: z.number().int().nonnegative().default(0),
  bonusCritChance: z.number().min(0).max(1).default(0),
  bonusDodgeChance: z.number().min(0).max(1).default(0),
  bonusBlockChance: z.number().min(0).max(1).default(0)
});
export type ItemStatBonuses = z.infer<typeof ItemStatBonusesSchema>;

export const ItemDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  type: ItemTypeSchema,
  rarity: ItemRaritySchema,
  minLevel: z.number().int().positive().default(1),
  stats: ItemStatBonusesSchema.default({}),
  healAmount: z.number().int().nonnegative().optional(),
  manaAmount: z.number().int().nonnegative().optional(),
  icon: z.string().default("item")
});
export type ItemDefinition = z.infer<typeof ItemDefinitionSchema>;

export const InventorySlotSchema = z.object({
  slotIndex: z.number().int().min(0).max(31),
  item: ItemDefinitionSchema,
  quantity: z.number().int().positive().default(1)
});
export type InventorySlot = z.infer<typeof InventorySlotSchema>;

export const PlayerEquipmentSchema = z.object({
  weapon: ItemDefinitionSchema.nullable().default(null),
  armor: ItemDefinitionSchema.nullable().default(null),
  amulet: ItemDefinitionSchema.nullable().default(null),
  ring: ItemDefinitionSchema.nullable().default(null)
});
export type PlayerEquipment = z.infer<typeof PlayerEquipmentSchema>;

export const HunterCareerStatsSchema = z.object({
  criticalHitsDealt: z.number().int().nonnegative().default(0),
  attacksDodged: z.number().int().nonnegative().default(0),
  attacksBlocked: z.number().int().nonnegative().default(0),
  regularMonstersSlain: z.number().int().nonnegative().default(0),
  gateBossesSlain: z.number().int().nonnegative().default(0),
  totalItemsDropped: z.number().int().nonnegative().default(0),
  highestRarityDropped: ItemRaritySchema.nullable().default(null),
  bestItemDroppedName: z.string().nullable().default(null),
  missionsCompleted: z.number().int().nonnegative().default(0)
});
export type HunterCareerStats = z.infer<typeof HunterCareerStatsSchema>;

export const InventoryStateSchema = z.object({
  inventory: z.array(InventorySlotSchema),
  equipment: PlayerEquipmentSchema,
  careerStats: HunterCareerStatsSchema
});
export type InventoryState = z.infer<typeof InventoryStateSchema>;

export const EquipItemRequestSchema = z.object({
  slotIndex: z.number().int().min(0).max(31)
});
export type EquipItemRequest = z.infer<typeof EquipItemRequestSchema>;

export const EquipmentSlotNameSchema = z.enum(["weapon", "armor", "amulet", "ring"]);
export type EquipmentSlotName = z.infer<typeof EquipmentSlotNameSchema>;

export const UnequipItemRequestSchema = z.object({
  slot: EquipmentSlotNameSchema
});
export type UnequipItemRequest = z.infer<typeof UnequipItemRequestSchema>;

export const UseItemRequestSchema = z.object({
  slotIndex: z.number().int().min(0).max(31)
});
export type UseItemRequest = z.infer<typeof UseItemRequestSchema>;

export const UseCombatConsumableRequestSchema = z.object({
  battleId: z.string().min(1),
  itemId: z.string().min(1)
});
export type UseCombatConsumableRequest = z.infer<typeof UseCombatConsumableRequestSchema>;

export const SellItemRequestSchema = z.object({
  slotIndex: z.number().int().min(0).max(31)
});
export type SellItemRequest = z.infer<typeof SellItemRequestSchema>;

export const SellAllJunkRequestSchema = z.object({
  maxRarity: ItemRaritySchema.default("UNCOMMON")
});
export type SellAllJunkRequest = z.infer<typeof SellAllJunkRequestSchema>;

export function getItemGoldValue(item: ItemDefinition): number {
  const baseValueByRarity: Record<ItemRarity, number> = {
    COMMON: 25,
    UNCOMMON: 70,
    RARE: 200,
    EPIC: 550,
    LEGENDARY: 1500,
    IMMORTAL: 4000,
    COSMIC: 10000,
    DIVINE: 25000
  };
  const base = baseValueByRarity[item.rarity] ?? 25;
  return base * Math.max(1, Math.floor(item.minLevel / 2));
}

