import { describe, expect, it } from "vitest";
import { BossService } from "./boss.service";
import { InventoryService } from "./inventory.service";
import { MASTER_ITEMS } from "./items.data";
import { LootService } from "./loot.service";
import { DEFAULT_CAREER_STATS, DEFAULT_EQUIPMENT, type PlayerEntity } from "./player.repository";

describe("BossService — Chefes de Estágio e World Boss Kamish", () => {
  it("registra todos os chefes de estágio para cada Gate e o World Boss Kamish", () => {
    const bossService = new BossService();
    const bosses = bossService.getAllBosses();

    // Deve conter no mínimo 18 chefes (stage bosses + apex bosses + world boss)
    expect(bosses.length).toBeGreaterThanOrEqual(18);

    // World Boss Supremo Kamish
    const kamish = bossService.getBoss("worldboss_kamish");
    expect(kamish).toBeDefined();
    expect(kamish?.name).toBe("Kamish, o Dragão da Calamidade");
    expect(kamish?.level).toBe(200);
    expect(kamish?.maxHp).toBe(50000);
    expect(kamish?.worldId).toBe("GATE_SSS");

    // Stage bosses
    const warlord = bossService.getBoss("boss_goblin_warlord");
    expect(warlord).toBeDefined();
    expect(warlord?.worldId).toBe("GATE_E");

    const gargoyle = bossService.getBoss("boss_brass_gargoyle");
    expect(gargoyle).toBeDefined();
    expect(gargoyle?.worldId).toBe("GATE_D");

    const frostGiant = bossService.getBoss("boss_frost_giant");
    expect(frostGiant).toBeDefined();
    expect(frostGiant?.worldId).toBe("GATE_C");

    const deathKnight = bossService.getBoss("boss_death_knight");
    expect(deathKnight).toBeDefined();
    expect(deathKnight?.worldId).toBe("GATE_B");

    const behemoth = bossService.getBoss("boss_volcanic_behemoth");
    expect(behemoth).toBeDefined();
    expect(behemoth?.worldId).toBe("GATE_A");

    const highPriest = bossService.getBoss("boss_god_statue_high_priest");
    expect(highPriest).toBeDefined();
    expect(highPriest?.worldId).toBe("GATE_S");

    const astralHerald = bossService.getBoss("boss_astral_herald");
    expect(astralHerald).toBeDefined();
    expect(astralHerald?.worldId).toBe("GATE_SS");

    const igris = bossService.getBoss("boss_igris_red_knight");
    expect(igris).toBeDefined();
    expect(igris?.worldId).toBe("GATE_SSS");
  });

  it("gera troféu único ao abater o World Boss Kamish e chefes de estágio", () => {
    const bossService = new BossService();

    const defeatKamish = bossService.updateBossHp("worldboss_kamish", 0);
    expect(defeatKamish.defeated).toBe(true);
    expect(defeatKamish.announcement?.trophyDropped).toBe("Presa da Calamidade de Kamish");

    const defeatIgris = bossService.updateBossHp("boss_igris_red_knight", 0);
    expect(defeatIgris.defeated).toBe(true);
    expect(defeatIgris.announcement?.trophyDropped).toBe("Lâmina Carmesim de Igris");

    const defeatGargoyle = bossService.updateBossHp("boss_brass_gargoyle", 0);
    expect(defeatGargoyle.defeated).toBe(true);
    expect(defeatGargoyle.announcement?.trophyDropped).toBe("Chifre da Gárgula de Latão");
  });
});

describe("LootService e Itens expandidos até Lv 200", () => {
  it("possui itens Divinos e Cósmicos de nível alto em MASTER_ITEMS", () => {
    // Arma Lv 200
    const godBlade = MASTER_ITEMS.weapon_shadow_sovereign_blade;
    expect(godBlade).toBeDefined();
    expect(godBlade.minLevel).toBe(200);
    expect(godBlade.rarity).toBe("DIVINE");

    // Armadura Lv 200
    const godArmor = MASTER_ITEMS.armor_shadow_monarch_regalia;
    expect(godArmor).toBeDefined();
    expect(godArmor.minLevel).toBe(200);
    expect(godArmor.rarity).toBe("DIVINE");

    // Anel e Amuleto Lv 200
    const godRing = MASTER_ITEMS.ring_death_sovereignty;
    expect(godRing).toBeDefined();
    expect(godRing.minLevel).toBe(200);

    const godAmulet = MASTER_ITEMS.amulet_shadow_monarch_crown;
    expect(godAmulet).toBeDefined();
    expect(godAmulet.minLevel).toBe(200);

    // Elixires de cura supremos
    expect(MASTER_ITEMS.potion_divine_nectar).toBeDefined();
    expect(MASTER_ITEMS.potion_divine_nectar.healAmount).toBe(5000);
    expect(MASTER_ITEMS.potion_divine_nectar.manaAmount).toBe(3000);
  });

  it("LootService escala drops de chefe baseado no nível", () => {
    const lootService = new LootService();

    // Rola drops para Kamish (Lv 200) - deve rolar raridades altas (IMMORTAL, COSMIC, DIVINE)
    const drops = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const drop = lootService.rollMonsterDrop(200, true);
      if (drop) drops.add(drop.rarity);
    }

    // Deve ter pelo menos uma raridade entre IMMORTAL, COSMIC, DIVINE
    const hasHighTier = drops.has("IMMORTAL") || drops.has("COSMIC") || drops.has("DIVINE");
    expect(hasHighTier).toBe(true);
  });
});

describe("Slot dedicado de Escudo (SHIELD) e Escudo Tático Blindado", () => {
  it("Escudo Tático Blindado possui type SHIELD e icon shield_iron", () => {
    const shield = MASTER_ITEMS.armor_iron_shield;
    expect(shield).toBeDefined();
    expect(shield.name).toBe("Escudo Tático Blindado");
    expect(shield.type).toBe("SHIELD");
    expect(shield.icon).toBe("shield_iron");
    expect(shield.stats.bonusBlockChance).toBeGreaterThan(0);
  });

  it("equipa o escudo no slot 'shield' sem sobrescrever ou ocupar o slot 'armor'", () => {
    const lootService = new LootService();
    const invService = new InventoryService(lootService);

    const player: PlayerEntity = {
      id: "p_tank",
      name: "Guardião",
      rank: "E",
      hunterClass: "WARRIOR",
      level: 5,
      exp: 0,
      position: { x: 2, y: 2 },
      hp: 200,
      maxHp: 200,
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
        { slotIndex: 0, item: MASTER_ITEMS.armor_scout_mail, quantity: 1 },
        { slotIndex: 1, item: MASTER_ITEMS.armor_iron_shield, quantity: 1 }
      ],
      equipment: { ...DEFAULT_EQUIPMENT },
      careerStats: { ...DEFAULT_CAREER_STATS }
    };

    // 1. Equipa a Armadura (Cota de Malha)
    const eqArmorRes = invService.equipItem(player, 0);
    expect(eqArmorRes.success).toBe(true);
    expect(player.equipment?.armor?.id).toBe("armor_scout_mail");
    expect(player.equipment?.shield).toBeNull();

    // 2. Equipa o Escudo Tático Blindado
    const eqShieldRes = invService.equipItem(player, 1);
    expect(eqShieldRes.success).toBe(true);
    expect(player.equipment?.shield?.id).toBe("armor_iron_shield");
    // A armadura continua equipada no slot armor!
    expect(player.equipment?.armor?.id).toBe("armor_scout_mail");

    // 3. Desequipa o escudo
    const unequipRes = invService.unequipItem(player, "shield");
    expect(unequipRes.success).toBe(true);
    expect(player.equipment?.shield).toBeNull();
    expect(player.equipment?.armor?.id).toBe("armor_scout_mail");
  });
});
