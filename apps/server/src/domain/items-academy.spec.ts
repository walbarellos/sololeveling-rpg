import { describe, expect, it } from "vitest";
import {
  MASTER_ITEMS,
  RARITY_DROP_POOL
} from "./items.data";
import { LootService } from "./loot.service";
import { AcademyService } from "./academy.service";
import { BossService } from "./boss.service";
import { InventoryService } from "./inventory.service";
import { DEFAULT_CAREER_STATS, DEFAULT_EQUIPMENT, type PlayerEntity } from "./player.repository";
import { BattleSession } from "./battle.session";

describe("LootService & Diablo 7-tier Rarity System", () => {
  it("defines master items across all 8 rarities", () => {
    expect(RARITY_DROP_POOL.COMMON.length).toBeGreaterThan(0);
    expect(RARITY_DROP_POOL.UNCOMMON.length).toBeGreaterThan(0);
    expect(RARITY_DROP_POOL.RARE.length).toBeGreaterThan(0);
    expect(RARITY_DROP_POOL.EPIC.length).toBeGreaterThan(0);
    expect(RARITY_DROP_POOL.LEGENDARY.length).toBeGreaterThan(0);
    expect(RARITY_DROP_POOL.IMMORTAL.length).toBeGreaterThan(0);
    expect(RARITY_DROP_POOL.COSMIC.length).toBeGreaterThan(0);
    expect(RARITY_DROP_POOL.DIVINE.length).toBeGreaterThan(0);
  });

  it("adds items to inventory and updates career stats", () => {
    const loot = new LootService();
    const inventory = loot.createStartingInventory();
    expect(inventory.length).toBe(2);

    const career = { ...DEFAULT_CAREER_STATS };
    const sword = MASTER_ITEMS.weapon_goblin_slayer; // LEGENDARY

    loot.addItemToInventory(inventory, sword);
    loot.recordItemDrop(career, sword);

    expect(inventory.length).toBe(3);
    expect(career.totalItemsDropped).toBe(1);
    expect(career.highestRarityDropped).toBe("LEGENDARY");
    expect(career.bestItemDroppedName).toBe(sword.name);
  });
});

describe("AcademyService (Hunter Academy Promotion Exam)", () => {
  const makePlayer = (): PlayerEntity => ({
    id: "p1",
    name: "Recruta",
    rank: "E",
    hunterClass: "WARRIOR",
    level: 7,
    exp: 0,
    position: { x: 2, y: 2 },
    hp: 200,
    maxHp: 200,
    mp: 50,
    maxMp: 50,
    stamina: 50,
    maxStamina: 50,
    attributes: { str: 10, agi: 10, vit: 10, int: 10 },
    unallocatedStatPoints: 15,
    inBattle: false,
    sequence: 1,
    lastStepAt: 0,
    lastAttackAt: 0,
    inventory: [],
    equipment: { ...DEFAULT_EQUIPMENT },
    careerStats: { ...DEFAULT_CAREER_STATS }
  });

  it("fails promotion if level is below 8", () => {
    const academy = new AcademyService();
    const p = makePlayer();
    p.level = 7;
    const res = academy.evaluatePromotion(p, "D");
    expect(res.success).toBe(false);
    expect(res.message).toContain("Nível insuficiente");
  });

  it("fails promotion if player has not allocated at least 15 attribute points", () => {
    const academy = new AcademyService();
    const p = makePlayer();
    p.level = 8;
    // Sem atributos alocados (10, 10, 10, 10)
    const res = academy.evaluatePromotion(p, "D");
    expect(res.success).toBe(false);
    expect(res.message).toContain("Treinamento incompleto");
  });

  it("fails promotion if trophy is missing from inventory", () => {
    const academy = new AcademyService();
    const p = makePlayer();
    p.level = 8;
    p.attributes = { str: 20, agi: 15, vit: 10, int: 10 }; // 15 pontos alocados
    const res = academy.evaluatePromotion(p, "D");
    expect(res.success).toBe(false);
    expect(res.message).toContain("Troféu ausente");
  });

  it("promotes player to Rank D when level 8+, 15+ stats, and boss trophy present", () => {
    const academy = new AcademyService();
    const p = makePlayer();
    p.level = 8;
    p.attributes = { str: 20, agi: 15, vit: 10, int: 10 };
    p.inventory = [
      {
        slotIndex: 0,
        item: MASTER_ITEMS.trophy_goblin_boss_core,
        quantity: 1
      }
    ];

    const res = academy.evaluatePromotion(p, "D");
    expect(res.success).toBe(true);
    expect(res.newRank).toBe("D");
    expect(p.rank).toBe("D");
    expect(res.unlockedLevelCap).toBe(25);
    expect(res.rewardStatPoints).toBe(10);
  });
});

describe("BossService & Persistent World Boss HP", () => {
  it("initializes bosses and preserves boss HP when damaged", () => {
    const bosses = new BossService();
    const boss = bosses.getBoss("boss-1");
    expect(boss).toBeDefined();
    expect(boss?.maxHp).toBe(850);
    expect(boss?.currentHp).toBe(850);

    // Caçador causa 300 de dano e morre
    bosses.updateBossHp("boss-1", 550);
    expect(bosses.getBoss("boss-1")?.currentHp).toBe(550);
    expect(bosses.getBoss("boss-1")?.alive).toBe(true);

    // Outro caçador vem e finaliza
    const finish = bosses.updateBossHp("boss-1", 0);
    expect(finish.defeated).toBe(true);
    expect(finish.announcement).toBeDefined();
    expect(finish.announcement?.bossName).toContain("Chefe Goblin");
    expect(finish.announcement?.newPortalUnlocked).toBe(true);
    expect(bosses.getBoss("boss-1")?.alive).toBe(false);
  });
});

describe("InventoryService & Equip / Potion Usage", () => {
  it("equips weapon and armor and updates player max stats", () => {
    const loot = new LootService();
    const invService = new InventoryService(loot);

    const player: PlayerEntity = {
      id: "p1",
      name: "Hunter",
      rank: "E",
      hunterClass: "WARRIOR",
      level: 8,
      exp: 0,
      position: { x: 2, y: 2 },
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      stamina: 50,
      maxStamina: 50,
      attributes: { str: 10, agi: 10, vit: 10, int: 10 },
      unallocatedStatPoints: 0,
      inBattle: false,
      sequence: 1,
      lastStepAt: 0,
      lastAttackAt: 0,
      inventory: [
        { slotIndex: 0, item: MASTER_ITEMS.weapon_goblin_slayer, quantity: 1 },
        { slotIndex: 1, item: MASTER_ITEMS.potion_hp_minor, quantity: 2 }
      ],
      equipment: { ...DEFAULT_EQUIPMENT },
      careerStats: { ...DEFAULT_CAREER_STATS }
    };

    const initialMaxHp = player.maxHp;
    const res = invService.equipItem(player, 0);
    expect(res.success).toBe(true);
    expect(player.equipment?.weapon?.id).toBe("weapon_goblin_slayer");
    expect(player.maxHp).toBeGreaterThan(initialMaxHp);

    // Consumir poção fora de combate
    player.hp = 50;
    const useRes = invService.useItem(player, 1);
    expect(useRes.success).toBe(true);
    expect(player.hp).toBe(110); // 50 + 60
  });

  it("uses consumable in battle arena respecting 2-charge limit", () => {
    const player: PlayerEntity = {
      id: "p1",
      name: "Hunter",
      rank: "E",
      hunterClass: "WARRIOR",
      level: 5,
      exp: 0,
      position: { x: 2, y: 2 },
      hp: 80,
      maxHp: 150,
      mp: 40,
      maxMp: 60,
      stamina: 50,
      maxStamina: 50,
      attributes: { str: 10, agi: 10, vit: 10, int: 10 },
      unallocatedStatPoints: 0,
      inBattle: true,
      sequence: 1,
      lastStepAt: 0,
      lastAttackAt: 0,
      inventory: [
        { slotIndex: 0, item: MASTER_ITEMS.potion_hp_minor, quantity: 3 }
      ],
      equipment: { ...DEFAULT_EQUIPMENT },
      careerStats: { ...DEFAULT_CAREER_STATS }
    };

    const session = new BattleSession("b-1", player, {
      id: "m-1",
      name: "Goblin",
      rank: "E",
      level: 3,
      hp: 100,
      maxHp: 100,
      mp: 10,
      maxMp: 10,
      position: { x: 3, y: 2 },
      alive: true
    });

    const loot = new LootService();
    const invService = new InventoryService(loot);

    // Carga 1
    const use1 = invService.useCombatConsumable(player, session, "potion_hp_minor");
    expect(use1.success).toBe(true);
    expect(session.consumablesRemaining).toBe(1);

    // Carga 2
    const use2 = invService.useCombatConsumable(player, session, "potion_hp_minor");
    expect(use2.success).toBe(true);
    expect(session.consumablesRemaining).toBe(0);

    // Carga 3 deve ser bloqueada
    const use3 = invService.useCombatConsumable(player, session, "potion_hp_minor");
    expect(use3.success).toBe(false);
    expect(use3.error).toBe("CONSUMABLE_CHARGES_EXHAUSTED");
  });
});
