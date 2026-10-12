import type { ItemDefinition, ItemRarity } from "@rpg/contracts";

export const MASTER_ITEMS: Record<string, ItemDefinition> = {
  // Consumíveis
  potion_hp_minor: {
    id: "potion_hp_minor",
    name: "Poção de Vitalidade Menor",
    description: "Restaura instantaneamente 60 pontos de vida do caçador.",
    type: "CONSUMABLE",
    rarity: "COMMON",
    minLevel: 1,
    stats: { bonusHp: 0, bonusMp: 0, bonusPhysicalAtk: 0, bonusMagicalAtk: 0, bonusCritChance: 0, bonusDodgeChance: 0, bonusBlockChance: 0 },
    healAmount: 60,
    icon: "potion_red"
  },
  potion_hp_greater: {
    id: "potion_hp_greater",
    name: "Poção de Vitalidade Maior",
    description: "Extrato concentrado de ervas do Gate. Restaura 150 pontos de vida.",
    type: "CONSUMABLE",
    rarity: "UNCOMMON",
    minLevel: 4,
    stats: { bonusHp: 0, bonusMp: 0, bonusPhysicalAtk: 0, bonusMagicalAtk: 0, bonusCritChance: 0, bonusDodgeChance: 0, bonusBlockChance: 0 },
    healAmount: 150,
    icon: "potion_red_big"
  },
  potion_mp_minor: {
    id: "potion_mp_minor",
    name: "Elixir de Mana Menor",
    description: "Recupera 40 pontos de mana para uso de habilidades táticas.",
    type: "CONSUMABLE",
    rarity: "COMMON",
    minLevel: 1,
    stats: { bonusHp: 0, bonusMp: 0, bonusPhysicalAtk: 0, bonusMagicalAtk: 0, bonusCritChance: 0, bonusDodgeChance: 0, bonusBlockChance: 0 },
    manaAmount: 40,
    icon: "potion_blue"
  },
  potion_mp_greater: {
    id: "potion_mp_greater",
    name: "Elixir de Mana Maior",
    description: "Cristais líquidos de mana pura. Restaura 100 pontos de mana.",
    type: "CONSUMABLE",
    rarity: "UNCOMMON",
    minLevel: 4,
    stats: { bonusHp: 0, bonusMp: 0, bonusPhysicalAtk: 0, bonusMagicalAtk: 0, bonusCritChance: 0, bonusDodgeChance: 0, bonusBlockChance: 0 },
    manaAmount: 100,
    icon: "potion_blue_big"
  },

  // Troféus de Ascensão de Rank
  trophy_goblin_boss_core: {
    id: "trophy_goblin_boss_core",
    name: "Núcleo de Mana do Chefe Goblin",
    description: "Troféu oficial emitido pela derrota do Chefe do Gate. Exigido no Exame de Rank D.",
    type: "TROPHY",
    rarity: "RARE",
    minLevel: 8,
    stats: { bonusHp: 20, bonusMp: 20, bonusPhysicalAtk: 2, bonusMagicalAtk: 2, bonusCritChance: 0.02, bonusDodgeChance: 0, bonusBlockChance: 0 },
    icon: "trophy_core"
  },
  trophy_shadow_wolf_fang: {
    id: "trophy_shadow_wolf_fang",
    name: "Presa da Matriarca das Sombras",
    description: "Presa afiada da rainha das feras do Gate. Exigida no Exame de Rank C.",
    type: "TROPHY",
    rarity: "RARE",
    minLevel: 10,
    stats: { bonusHp: 35, bonusMp: 25, bonusPhysicalAtk: 4, bonusMagicalAtk: 4, bonusCritChance: 0.03, bonusDodgeChance: 0.02, bonusBlockChance: 0 },
    icon: "trophy_fang"
  },
  trophy_fire_gate_core: {
    id: "trophy_fire_gate_core",
    name: "Coração Ígneo do Portão Vermelho",
    description: "Núcleo pulsante do Chefe Supremo do Gate de Fogo. Exigido no Exame de Rank B.",
    type: "TROPHY",
    rarity: "EPIC",
    minLevel: 15,
    stats: { bonusHp: 60, bonusMp: 40, bonusPhysicalAtk: 8, bonusMagicalAtk: 8, bonusCritChance: 0.05, bonusDodgeChance: 0.03, bonusBlockChance: 0.02 },
    icon: "trophy_core"
  },
  trophy_crimson_heart: {
    id: "trophy_crimson_heart",
    name: "Coração da Cidadela Carmesim",
    description: "Relíquia lendária do Chefe Sentinela Carmesim do Gate Rank D.",
    type: "TROPHY",
    rarity: "EPIC",
    minLevel: 12,
    stats: { bonusHp: 70, bonusMp: 40, bonusPhysicalAtk: 6, bonusMagicalAtk: 6, bonusCritChance: 0.04, bonusDodgeChance: 0.02, bonusBlockChance: 0.03 },
    icon: "trophy_core"
  },
  trophy_void_essence: {
    id: "trophy_void_essence",
    name: "Essência do Lorde do Vácuo",
    description: "Matéria estelar recolhida após selar a fenda do abismo. Exigida no Exame de Rank A.",
    type: "TROPHY",
    rarity: "LEGENDARY",
    minLevel: 25,
    stats: { bonusHp: 100, bonusMp: 70, bonusPhysicalAtk: 15, bonusMagicalAtk: 15, bonusCritChance: 0.08, bonusDodgeChance: 0.05, bonusBlockChance: 0.04 },
    icon: "trophy_core"
  },
  trophy_monarch_crown: {
    id: "trophy_monarch_crown",
    name: "Coroa do Monarca Antigo",
    description: "Relíquia lendária do Soberano que comanda as sombras. Exigida para a consagração em Rank S.",
    type: "TROPHY",
    rarity: "IMMORTAL",
    minLevel: 35,
    stats: { bonusHp: 180, bonusMp: 120, bonusPhysicalAtk: 30, bonusMagicalAtk: 30, bonusCritChance: 0.12, bonusDodgeChance: 0.08, bonusBlockChance: 0.06 },
    icon: "trophy_core"
  },

  // Armas (7 Raridades)
  weapon_iron_sword: {
    id: "weapon_iron_sword",
    name: "Espada de Aço Padrão",
    description: "Equipamento militar fornecido pela Associação aos recrutas de Rank E.",
    type: "WEAPON",
    rarity: "COMMON",
    minLevel: 1,
    stats: { bonusHp: 10, bonusMp: 0, bonusPhysicalAtk: 6, bonusMagicalAtk: 0, bonusCritChance: 0.02, bonusDodgeChance: 0, bonusBlockChance: 0 },
    icon: "sword_iron"
  },
  weapon_reinforced_glaive: {
    id: "weapon_reinforced_glaive",
    name: "Glaive Reforçada de Caçador",
    description: "Lâmina polida com liga de metal de masmorra, garantindo golpes contundentes.",
    type: "WEAPON",
    rarity: "UNCOMMON",
    minLevel: 3,
    stats: { bonusHp: 25, bonusMp: 0, bonusPhysicalAtk: 12, bonusMagicalAtk: 2, bonusCritChance: 0.04, bonusDodgeChance: 0, bonusBlockChance: 0.02 },
    icon: "glaive_green"
  },
  weapon_spectral_blade: {
    id: "weapon_spectral_blade",
    name: "Lâmina Espectral do Abismo",
    description: "Imbuída com essência etérea que atravessa carapaças demoníacas.",
    type: "WEAPON",
    rarity: "RARE",
    minLevel: 5,
    stats: { bonusHp: 40, bonusMp: 15, bonusPhysicalAtk: 18, bonusMagicalAtk: 10, bonusCritChance: 0.07, bonusDodgeChance: 0.03, bonusBlockChance: 0 },
    icon: "blade_blue"
  },
  weapon_shadow_reaper: {
    id: "weapon_shadow_reaper",
    name: "Foice Abissal da Meia-Noite",
    description: "Arma lendária empunhada por caçadores veteranos das profundezas.",
    type: "WEAPON",
    rarity: "EPIC",
    minLevel: 7,
    stats: { bonusHp: 65, bonusMp: 25, bonusPhysicalAtk: 28, bonusMagicalAtk: 16, bonusCritChance: 0.10, bonusDodgeChance: 0.04, bonusBlockChance: 0.03 },
    icon: "scythe_purple"
  },
  weapon_goblin_slayer: {
    id: "weapon_goblin_slayer",
    name: "Lâmina do Portão Carmesim",
    description: "Forjada a partir da armadura colossal do Chefe do Gate de Fogo.",
    type: "WEAPON",
    rarity: "LEGENDARY",
    minLevel: 8,
    stats: { bonusHp: 95, bonusMp: 40, bonusPhysicalAtk: 40, bonusMagicalAtk: 24, bonusCritChance: 0.14, bonusDodgeChance: 0.05, bonusBlockChance: 0.05 },
    icon: "sword_gold"
  },
  weapon_monarch_dagger: {
    id: "weapon_monarch_dagger",
    name: "Adaga do Monarca das Sombras",
    description: "Uma relíquia proibida transbordando de mana sombria soberana.",
    type: "WEAPON",
    rarity: "IMMORTAL",
    minLevel: 10,
    stats: { bonusHp: 140, bonusMp: 60, bonusPhysicalAtk: 58, bonusMagicalAtk: 36, bonusCritChance: 0.20, bonusDodgeChance: 0.08, bonusBlockChance: 0.06 },
    icon: "dagger_red"
  },
  weapon_cosmic_fang: {
    id: "weapon_cosmic_fang",
    name: "Presa do Vácuo Cósmico",
    description: "Lâmina ancestral formada pelo colapso de uma estrela dentro do Gate primordial.",
    type: "WEAPON",
    rarity: "COSMIC",
    minLevel: 10,
    stats: { bonusHp: 200, bonusMp: 90, bonusPhysicalAtk: 80, bonusMagicalAtk: 55, bonusCritChance: 0.25, bonusDodgeChance: 0.10, bonusBlockChance: 0.08 },
    icon: "fang_cosmic"
  },
  weapon_divine_judgment: {
    id: "weapon_divine_judgment",
    name: "Sentença do Trono Divino",
    description: "Lâmina forjada na luz do trono primordial. Poucos caçadores sobrevivem a empunhá-la.",
    type: "WEAPON",
    rarity: "DIVINE",
    minLevel: 12,
    stats: { bonusHp: 300, bonusMp: 140, bonusPhysicalAtk: 110, bonusMagicalAtk: 80, bonusCritChance: 0.30, bonusDodgeChance: 0.12, bonusBlockChance: 0.10 },
    icon: "sword_gold"
  },

  // Armaduras
  armor_leather_vest: {
    id: "armor_leather_vest",
    name: "Colete Tático de Couro",
    description: "Proteção leve acolchoada para mobilidade básica.",
    type: "ARMOR",
    rarity: "COMMON",
    minLevel: 1,
    stats: { bonusHp: 30, bonusMp: 0, bonusPhysicalAtk: 0, bonusMagicalAtk: 0, bonusCritChance: 0, bonusDodgeChance: 0.02, bonusBlockChance: 0.01 },
    icon: "vest_gray"
  },
  armor_scout_mail: {
    id: "armor_scout_mail",
    name: "Cota de Malha do Batedor",
    description: "Anéis entrelaçados com liga resistente a mordidas de feras de masmorra.",
    type: "ARMOR",
    rarity: "UNCOMMON",
    minLevel: 3,
    stats: { bonusHp: 60, bonusMp: 10, bonusPhysicalAtk: 2, bonusMagicalAtk: 0, bonusCritChance: 0, bonusDodgeChance: 0.03, bonusBlockChance: 0.04 },
    icon: "mail_green"
  },
  armor_phantom_cloak: {
    id: "armor_phantom_cloak",
    name: "Manto das Sombras Noturnas",
    description: "Tecido sombrio que absorve o calor e dissipa o impacto cinético inimigo.",
    type: "ARMOR",
    rarity: "RARE",
    minLevel: 5,
    stats: { bonusHp: 100, bonusMp: 20, bonusPhysicalAtk: 4, bonusMagicalAtk: 4, bonusCritChance: 0.03, bonusDodgeChance: 0.06, bonusBlockChance: 0.03 },
    icon: "cloak_blue"
  },
  armor_iron_shield: {
    id: "armor_iron_shield",
    name: "Escudo Tático Blindado",
    description: "Escudo pesado militar reforçado com placas de liga arcana para conter feras.",
    type: "ARMOR",
    rarity: "UNCOMMON",
    minLevel: 3,
    stats: { bonusHp: 50, bonusMp: 0, bonusPhysicalAtk: 0, bonusMagicalAtk: 0, bonusCritChance: 0, bonusDodgeChance: 0.01, bonusBlockChance: 0.08 },
    icon: "shield_iron"
  },
  armor_titanium_plate: {
    id: "armor_titanium_plate",
    name: "Armadura de Placas de Titânio",
    description: "Forjada em forjas geotérmicas para resistir aos golpes mais brutais dos monstros.",
    type: "ARMOR",
    rarity: "EPIC",
    minLevel: 7,
    stats: { bonusHp: 160, bonusMp: 30, bonusPhysicalAtk: 8, bonusMagicalAtk: 6, bonusCritChance: 0.04, bonusDodgeChance: 0.05, bonusBlockChance: 0.09 },
    icon: "cuirass_blood"
  },
  armor_dragon_aegis: {
    id: "armor_dragon_aegis",
    name: "Couraça Dracônica do Portão",
    description: "Couraça de escamas de dragão do abismo que dissipa calor e impacto sísmico.",
    type: "ARMOR",
    rarity: "LEGENDARY",
    minLevel: 8,
    stats: { bonusHp: 240, bonusMp: 50, bonusPhysicalAtk: 14, bonusMagicalAtk: 12, bonusCritChance: 0.06, bonusDodgeChance: 0.07, bonusBlockChance: 0.12 },
    icon: "cuirass_blood"
  },
  armor_monarch_shroud: {
    id: "armor_monarch_shroud",
    name: "Manto Imperial do Soberano",
    description: "Armadura de sombras vivas que envolve o caçador com proteção monárquica.",
    type: "ARMOR",
    rarity: "IMMORTAL",
    minLevel: 10,
    stats: { bonusHp: 340, bonusMp: 80, bonusPhysicalAtk: 22, bonusMagicalAtk: 20, bonusCritChance: 0.09, bonusDodgeChance: 0.10, bonusBlockChance: 0.15 },
    icon: "shroud_red"
  },
  armor_celestial_weave: {
    id: "armor_celestial_weave",
    name: "Tecido do Vácuo Estelar",
    description: "Tecida a partir da energia pura que mantém os limites dimensionais intactos.",
    type: "ARMOR",
    rarity: "COSMIC",
    minLevel: 10,
    stats: { bonusHp: 480, bonusMp: 120, bonusPhysicalAtk: 32, bonusMagicalAtk: 30, bonusCritChance: 0.12, bonusDodgeChance: 0.14, bonusBlockChance: 0.18 },
    icon: "celestial_cosmic"
  },
  armor_divine_aegis: {
    id: "armor_divine_aegis",
    name: "Armadura Sagrada da Aurora",
    description: "Armadura tecida em luz primordial sagrada, impenetrável à escuridão do abismo.",
    type: "ARMOR",
    rarity: "DIVINE",
    minLevel: 12,
    stats: { bonusHp: 320, bonusMp: 120, bonusPhysicalAtk: 20, bonusMagicalAtk: 20, bonusCritChance: 0.08, bonusDodgeChance: 0.10, bonusBlockChance: 0.15 },
    icon: "cuirass_blood"
  },

  // Amuletos
  amulet_copper_talisman: {
    id: "amulet_copper_talisman",
    name: "Talismã de Cobre Rústico",
    description: "Pequeno amuleto protetor com runas gravadas à mão.",
    type: "AMULET",
    rarity: "COMMON",
    minLevel: 1,
    stats: { bonusHp: 15, bonusMp: 15, bonusPhysicalAtk: 1, bonusMagicalAtk: 2, bonusCritChance: 0.01, bonusDodgeChance: 0.01, bonusBlockChance: 0 },
    icon: "amulet_copper"
  },
  amulet_mana_gem: {
    id: "amulet_mana_gem",
    name: "Pingente de Quartzo Arcano",
    description: "Cristal lapidado que vibra em sincronia com o fluxo de mana do caçador.",
    type: "AMULET",
    rarity: "UNCOMMON",
    minLevel: 3,
    stats: { bonusHp: 30, bonusMp: 30, bonusPhysicalAtk: 2, bonusMagicalAtk: 5, bonusCritChance: 0.02, bonusDodgeChance: 0.02, bonusBlockChance: 0 },
    icon: "amulet_green"
  },
  amulet_solar_core: {
    id: "amulet_solar_core",
    name: "Coração Solar Radiante",
    description: "Canaliza a energia luminosa estelar concedendo imensa vitalidade e foco.",
    type: "AMULET",
    rarity: "LEGENDARY",
    minLevel: 8,
    stats: { bonusHp: 90, bonusMp: 70, bonusPhysicalAtk: 10, bonusMagicalAtk: 16, bonusCritChance: 0.06, bonusDodgeChance: 0.04, bonusBlockChance: 0.04 },
    icon: "amulet_gold"
  },

  // Anéis
  ring_iron_band: {
    id: "ring_iron_band",
    name: "Anel de Ferro Forjado",
    description: "Anel simples porém firme que reforça o aperto de combate.",
    type: "RING",
    rarity: "COMMON",
    minLevel: 1,
    stats: { bonusHp: 10, bonusMp: 5, bonusPhysicalAtk: 3, bonusMagicalAtk: 0, bonusCritChance: 0.02, bonusDodgeChance: 0, bonusBlockChance: 0.01 },
    icon: "ring_iron"
  },
  ring_hunters_instinct: {
    id: "ring_hunters_instinct",
    name: "Aliança do Instinto Aguçado",
    description: "Refina os reflexos perceptivos acelerando o tempo de reação.",
    type: "RING",
    rarity: "UNCOMMON",
    minLevel: 3,
    stats: { bonusHp: 20, bonusMp: 15, bonusPhysicalAtk: 5, bonusMagicalAtk: 3, bonusCritChance: 0.04, bonusDodgeChance: 0.03, bonusBlockChance: 0.01 },
    icon: "ring_green"
  },
  ring_infinite_stars: {
    id: "ring_infinite_stars",
    name: "Anel da Singularidade Infinita",
    description: "Contém um microponto gravitacional aumentando drasticamente a taxa de dano crítico.",
    type: "RING",
    rarity: "LEGENDARY",
    minLevel: 8,
    stats: { bonusHp: 70, bonusMp: 50, bonusPhysicalAtk: 16, bonusMagicalAtk: 14, bonusCritChance: 0.10, bonusDodgeChance: 0.05, bonusBlockChance: 0.03 },
    icon: "ring_gold"
  }
};

export const RARITY_DROP_POOL: Record<ItemRarity, ItemDefinition[]> = {
  COMMON: [],
  UNCOMMON: [],
  RARE: [],
  EPIC: [],
  LEGENDARY: [],
  IMMORTAL: [],
  COSMIC: [],
  DIVINE: []
};

// Indexação dos pools por raridade
for (const item of Object.values(MASTER_ITEMS)) {
  if (item.type !== "TROPHY") {
    RARITY_DROP_POOL[item.rarity].push(item);
  }
}
