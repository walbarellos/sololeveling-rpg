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
    description: "Relíquia lendária do Chefe Sentinela Carmesim do Gate Rank D. Exigida no Exame de Rank C.",
    type: "TROPHY",
    rarity: "EPIC",
    minLevel: 12,
    stats: { bonusHp: 70, bonusMp: 40, bonusPhysicalAtk: 6, bonusMagicalAtk: 6, bonusCritChance: 0.04, bonusDodgeChance: 0.02, bonusBlockChance: 0.03 },
    icon: "trophy_core"
  },
  trophy_frost_queen_crystal: {
    id: "trophy_frost_queen_crystal",
    name: "Cristal do Coração da Rainha do Gelo",
    description: "Fragmento de permafrost milenar da Rainha do Gelo Frostbite no Gate C. Exigido no Exame de Rank B.",
    type: "TROPHY",
    rarity: "EPIC",
    minLevel: 20,
    stats: { bonusHp: 90, bonusMp: 60, bonusPhysicalAtk: 10, bonusMagicalAtk: 12, bonusCritChance: 0.05, bonusDodgeChance: 0.03, bonusBlockChance: 0.03 },
    icon: "trophy_core"
  },
  trophy_shadow_lich_skull: {
    id: "trophy_shadow_lich_skull",
    name: "Crânio do Arquilorde Necromante",
    description: "Crânio runado transbordando de mana sombria do Gate B. Exigido no Exame de Rank A.",
    type: "TROPHY",
    rarity: "LEGENDARY",
    minLevel: 35,
    stats: { bonusHp: 130, bonusMp: 90, bonusPhysicalAtk: 18, bonusMagicalAtk: 22, bonusCritChance: 0.07, bonusDodgeChance: 0.05, bonusBlockChance: 0.04 },
    icon: "trophy_core"
  },
  trophy_dragon_heart: {
    id: "trophy_dragon_heart",
    name: "Coração Vulcânico do Dragão Ignis",
    description: "Coração em brasas vivas do Dragão Supremo Ignis no Gate A. Exigido no Exame de Rank S.",
    type: "TROPHY",
    rarity: "LEGENDARY",
    minLevel: 55,
    stats: { bonusHp: 200, bonusMp: 120, bonusPhysicalAtk: 30, bonusMagicalAtk: 30, bonusCritChance: 0.10, bonusDodgeChance: 0.06, bonusBlockChance: 0.06 },
    icon: "trophy_core"
  },
  trophy_god_statue_fragment: {
    id: "trophy_god_statue_fragment",
    name: "Fragmento Sagrado da Estátua de Deus",
    description: "Pedaço da pedra divina da Estátua do Templo Duplo no Gate S. Exigido no Exame de Rank SS.",
    type: "TROPHY",
    rarity: "IMMORTAL",
    minLevel: 80,
    stats: { bonusHp: 320, bonusMp: 180, bonusPhysicalAtk: 45, bonusMagicalAtk: 45, bonusCritChance: 0.12, bonusDodgeChance: 0.08, bonusBlockChance: 0.08 },
    icon: "trophy_core"
  },
  trophy_cosmic_core: {
    id: "trophy_cosmic_core",
    name: "Núcleo da Calamidade Cósmica",
    description: "Coração de uma estrela morta colapsada no Gate SS. Exigido no Exame de Rank SSS.",
    type: "TROPHY",
    rarity: "COSMIC",
    minLevel: 110,
    stats: { bonusHp: 480, bonusMp: 260, bonusPhysicalAtk: 65, bonusMagicalAtk: 65, bonusCritChance: 0.15, bonusDodgeChance: 0.10, bonusBlockChance: 0.10 },
    icon: "trophy_core"
  },
  trophy_shadow_sovereign_crown: {
    id: "trophy_shadow_sovereign_crown",
    name: "Coroa do Monarca das Sombras",
    description: "A coroa do governante da morte derrotado no Trono Supremo do Gate SSS. Consagra o caçador ao Rank SSS+.",
    type: "TROPHY",
    rarity: "DIVINE",
    minLevel: 140,
    stats: { bonusHp: 750, bonusMp: 400, bonusPhysicalAtk: 100, bonusMagicalAtk: 100, bonusCritChance: 0.20, bonusDodgeChance: 0.15, bonusBlockChance: 0.15 },
    icon: "trophy_core"
  },
  trophy_void_essence: {
    id: "trophy_void_essence",
    name: "Essência do Lorde do Vácuo",
    description: "Matéria estelar recolhida após selar a fenda do abismo.",
    type: "TROPHY",
    rarity: "LEGENDARY",
    minLevel: 25,
    stats: { bonusHp: 100, bonusMp: 70, bonusPhysicalAtk: 15, bonusMagicalAtk: 15, bonusCritChance: 0.08, bonusDodgeChance: 0.05, bonusBlockChance: 0.04 },
    icon: "trophy_core"
  },
  trophy_monarch_crown: {
    id: "trophy_monarch_crown",
    name: "Coroa do Monarca Antigo",
    description: "Relíquia lendária do Soberano que comanda as sombras.",
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
    type: "SHIELD",
    rarity: "UNCOMMON",
    minLevel: 3,
    stats: { bonusHp: 50, bonusMp: 0, bonusPhysicalAtk: 0, bonusMagicalAtk: 0, bonusCritChance: 0, bonusDodgeChance: 0.01, bonusBlockChance: 0.08 },
    icon: "shield_iron"
  },
  shield_runic_aegis: {
    id: "shield_runic_aegis",
    name: "Escudo Rúnico Guardião",
    description: "Escudo de carvalho reforçado com runas ancestrais que dissipam impactos brutais.",
    type: "SHIELD",
    rarity: "RARE",
    minLevel: 8,
    stats: { bonusHp: 90, bonusMp: 20, bonusPhysicalAtk: 4, bonusMagicalAtk: 2, bonusCritChance: 0, bonusDodgeChance: 0.02, bonusBlockChance: 0.12 },
    icon: "shield_iron"
  },
  shield_frost_barrier: {
    id: "shield_frost_barrier",
    name: "Baluarte Glacial de Niflheim",
    description: "Forjado no permafrost perpétuo, congela armas inimigas no momento do impacto.",
    type: "SHIELD",
    rarity: "EPIC",
    minLevel: 25,
    stats: { bonusHp: 180, bonusMp: 40, bonusPhysicalAtk: 8, bonusMagicalAtk: 6, bonusCritChance: 0, bonusDodgeChance: 0.03, bonusBlockChance: 0.16 },
    icon: "shield_iron"
  },
  shield_dragon_scale: {
    id: "shield_dragon_scale",
    name: "Égide de Escamas Dracônicas",
    description: "Revestido com escamas de dragão vermelho, absorve o calor e impactos sísmicos com maestria.",
    type: "SHIELD",
    rarity: "LEGENDARY",
    minLevel: 60,
    stats: { bonusHp: 320, bonusMp: 80, bonusPhysicalAtk: 15, bonusMagicalAtk: 12, bonusCritChance: 0, bonusDodgeChance: 0.04, bonusBlockChance: 0.20 },
    icon: "shield_iron"
  },
  shield_divine_bastion: {
    id: "shield_divine_bastion",
    name: "Bastião Sagrado dos Monarcas",
    description: "Escudo monumental sagrado que ergue uma barreira de luz intransponível contra o abismo.",
    type: "SHIELD",
    rarity: "IMMORTAL",
    minLevel: 110,
    stats: { bonusHp: 550, bonusMp: 150, bonusPhysicalAtk: 25, bonusMagicalAtk: 20, bonusCritChance: 0, bonusDodgeChance: 0.06, bonusBlockChance: 0.25 },
    icon: "shield_iron"
  },
  shield_shadow_sovereign: {
    id: "shield_shadow_sovereign",
    name: "Escudo da Soberania das Sombras",
    description: "Forjado da própria escuridão primordial de Ashborn, anula os ataques mais letais do cosmos.",
    type: "SHIELD",
    rarity: "DIVINE",
    minLevel: 180,
    stats: { bonusHp: 1200, bonusMp: 400, bonusPhysicalAtk: 50, bonusMagicalAtk: 40, bonusCritChance: 0.05, bonusDodgeChance: 0.08, bonusBlockChance: 0.32 },
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
  },

  // =========================================================================
  // CONSUMÍVEIS DE ALTO NÍVEL (Ranks C a SSS+)
  // =========================================================================
  potion_hp_elixir: {
    id: "potion_hp_elixir",
    name: "Elixir Vital de Alta Pureza",
    description: "Poção alquímica refinada de seiva do Gate. Restaura 500 pontos de vida.",
    type: "CONSUMABLE",
    rarity: "RARE",
    minLevel: 25,
    stats: { bonusHp: 0, bonusMp: 0, bonusPhysicalAtk: 0, bonusMagicalAtk: 0, bonusCritChance: 0, bonusDodgeChance: 0, bonusBlockChance: 0 },
    healAmount: 500,
    icon: "potion_red_big"
  },
  potion_mp_elixir: {
    id: "potion_mp_elixir",
    name: "Elixir Sagrado de Mana",
    description: "Concentrado líquido de essência mágica. Restaura 350 pontos de mana.",
    type: "CONSUMABLE",
    rarity: "RARE",
    minLevel: 25,
    stats: { bonusHp: 0, bonusMp: 0, bonusPhysicalAtk: 0, bonusMagicalAtk: 0, bonusCritChance: 0, bonusDodgeChance: 0, bonusBlockChance: 0 },
    manaAmount: 350,
    icon: "potion_blue_big"
  },
  potion_hp_supreme: {
    id: "potion_hp_supreme",
    name: "Elixir da Ressurreição das Sombras",
    description: "Bênção suprema infundida com vitalidade de dragão. Restaura 1.800 pontos de vida.",
    type: "CONSUMABLE",
    rarity: "LEGENDARY",
    minLevel: 70,
    stats: { bonusHp: 0, bonusMp: 0, bonusPhysicalAtk: 0, bonusMagicalAtk: 0, bonusCritChance: 0, bonusDodgeChance: 0, bonusBlockChance: 0 },
    healAmount: 1800,
    icon: "potion_red_big"
  },
  potion_mp_supreme: {
    id: "potion_mp_supreme",
    name: "Orbe de Mana Cósmico",
    description: "Essência condensada do Vácuo Astral. Restaura 1.200 pontos de mana.",
    type: "CONSUMABLE",
    rarity: "LEGENDARY",
    minLevel: 70,
    stats: { bonusHp: 0, bonusMp: 0, bonusPhysicalAtk: 0, bonusMagicalAtk: 0, bonusCritChance: 0, bonusDodgeChance: 0, bonusBlockChance: 0 },
    manaAmount: 1200,
    icon: "potion_blue_big"
  },
  potion_divine_nectar: {
    id: "potion_divine_nectar",
    name: "Néctar da Imortalidade dos Monarcas",
    description: "Lágrima sagrada de Ashborn e das Sombras. Restaura 5.000 de HP e 3.000 de MP.",
    type: "CONSUMABLE",
    rarity: "DIVINE",
    minLevel: 130,
    stats: { bonusHp: 0, bonusMp: 0, bonusPhysicalAtk: 0, bonusMagicalAtk: 0, bonusCritChance: 0, bonusDodgeChance: 0, bonusBlockChance: 0 },
    healAmount: 5000,
    manaAmount: 3000,
    icon: "potion_red_big"
  },

  // =========================================================================
  // ARMAS EXPANDIDAS DE ALTO NÍVEL (Lv 12 a 200)
  // =========================================================================
  weapon_crimson_blade: {
    id: "weapon_crimson_blade",
    name: "Lâmina de Aço Carmesim",
    description: "Forjada do minério denso da Cidadela Carmesim do Gate D.",
    type: "WEAPON",
    rarity: "RARE",
    minLevel: 12,
    stats: { bonusHp: 50, bonusMp: 20, bonusPhysicalAtk: 32, bonusMagicalAtk: 15, bonusCritChance: 0.08, bonusDodgeChance: 0.03, bonusBlockChance: 0 },
    icon: "sword_goblin"
  },
  weapon_brass_cleaver: {
    id: "weapon_brass_cleaver",
    name: "Cutelo de Latão Rúnico",
    description: "Pesado e afiado, infundido com runas explosivas do Gate D.",
    type: "WEAPON",
    rarity: "EPIC",
    minLevel: 14,
    stats: { bonusHp: 75, bonusMp: 25, bonusPhysicalAtk: 42, bonusMagicalAtk: 18, bonusCritChance: 0.10, bonusDodgeChance: 0.02, bonusBlockChance: 0.04 },
    icon: "blade_dark"
  },
  weapon_frost_dagger: {
    id: "weapon_frost_dagger",
    name: "Adaga Glacial de Niflheim",
    description: "Forjada do permafrost eterno do Gate C. Congela os pontos vitais do alvo.",
    type: "WEAPON",
    rarity: "RARE",
    minLevel: 20,
    stats: { bonusHp: 60, bonusMp: 40, bonusPhysicalAtk: 48, bonusMagicalAtk: 32, bonusCritChance: 0.09, bonusDodgeChance: 0.04, bonusBlockChance: 0 },
    icon: "blade_cosmic"
  },
  weapon_glacial_scythe: {
    id: "weapon_glacial_scythe",
    name: "Foice da Rainha do Gelo",
    description: "Arma lendária da Rainha Frostbite. Cada corte liberta lâminas gélidas cortantes.",
    type: "WEAPON",
    rarity: "EPIC",
    minLevel: 24,
    stats: { bonusHp: 110, bonusMp: 80, bonusPhysicalAtk: 78, bonusMagicalAtk: 68, bonusCritChance: 0.13, bonusDodgeChance: 0.05, bonusBlockChance: 0.02 },
    icon: "sword_goblin"
  },
  weapon_shadow_reaper_daggers: {
    id: "weapon_shadow_reaper_daggers",
    name: "Adagas Gêmeas do Ceifador Sombrio",
    description: "Par de punhais necróticos extraídos do Arquilorde do Gate B.",
    type: "WEAPON",
    rarity: "EPIC",
    minLevel: 34,
    stats: { bonusHp: 160, bonusMp: 100, bonusPhysicalAtk: 125, bonusMagicalAtk: 85, bonusCritChance: 0.16, bonusDodgeChance: 0.08, bonusBlockChance: 0 },
    icon: "blade_dark"
  },
  weapon_dragon_slayer_greatsword: {
    id: "weapon_dragon_slayer_greatsword",
    name: "Montante Matadora de Dragões",
    description: "Lâmina titânica forjada em obsidiana vulcânica, banhada no sangue de Ignis.",
    type: "WEAPON",
    rarity: "LEGENDARY",
    minLevel: 54,
    stats: { bonusHp: 280, bonusMp: 120, bonusPhysicalAtk: 215, bonusMagicalAtk: 95, bonusCritChance: 0.16, bonusDodgeChance: 0, bonusBlockChance: 0.12 },
    icon: "sword_immortal"
  },
  weapon_kamish_wrath_daggers: {
    id: "weapon_kamish_wrath_daggers",
    name: "Ira de Kamish (Presas do Dragão)",
    description: "As famosas dagas forjadas a partir da presa mais afiada da Calamidade Kamish.",
    type: "WEAPON",
    rarity: "IMMORTAL",
    minLevel: 80,
    stats: { bonusHp: 450, bonusMp: 250, bonusPhysicalAtk: 345, bonusMagicalAtk: 185, bonusCritChance: 0.24, bonusDodgeChance: 0.12, bonusBlockChance: 0.05 },
    icon: "blade_cosmic"
  },
  weapon_cosmic_annihilator_staff: {
    id: "weapon_cosmic_annihilator_staff",
    name: "Cajado da Singularidade Cósmica",
    description: "Catalisador do tecido espacial do Gate SS que dobra a gravidade e o éter estelar.",
    type: "WEAPON",
    rarity: "COSMIC",
    minLevel: 115,
    stats: { bonusHp: 650, bonusMp: 600, bonusPhysicalAtk: 245, bonusMagicalAtk: 465, bonusCritChance: 0.26, bonusDodgeChance: 0.10, bonusBlockChance: 0.06 },
    icon: "blade_cosmic"
  },
  weapon_shadow_commander_blade: {
    id: "weapon_shadow_commander_blade",
    name: "Lâmina do Comandante Igris",
    description: "Espada longa de aço negro imbuída com o juramento de lealdade eterno do Comandante.",
    type: "WEAPON",
    rarity: "IMMORTAL",
    minLevel: 150,
    stats: { bonusHp: 850, bonusMp: 450, bonusPhysicalAtk: 480, bonusMagicalAtk: 280, bonusCritChance: 0.28, bonusDodgeChance: 0.12, bonusBlockChance: 0.10 },
    icon: "blade_dark"
  },
  weapon_shadow_sovereign_blade: {
    id: "weapon_shadow_sovereign_blade",
    name: "Lâmina da Morte do Monarca das Sombras",
    description: "A espada suprema do Monarca Ashborn. Drena as almas de qualquer ser vivente no impacto.",
    type: "WEAPON",
    rarity: "DIVINE",
    minLevel: 200,
    stats: { bonusHp: 1200, bonusMp: 800, bonusPhysicalAtk: 620, bonusMagicalAtk: 620, bonusCritChance: 0.32, bonusDodgeChance: 0.15, bonusBlockChance: 0.14 },
    icon: "blade_dark"
  },

  // =========================================================================
  // ARMADURAS EXPANDIDAS DE ALTO NÍVEL (Lv 12 a 200)
  // =========================================================================
  armor_crimson_cuirass: {
    id: "armor_crimson_cuirass",
    name: "Couraça de Aço Carmesim",
    description: "Blindagem peitoral forjada para os soldados veteranos da Cidadela do Gate D.",
    type: "ARMOR",
    rarity: "RARE",
    minLevel: 12,
    stats: { bonusHp: 120, bonusMp: 30, bonusPhysicalAtk: 8, bonusMagicalAtk: 5, bonusCritChance: 0.02, bonusDodgeChance: 0.02, bonusBlockChance: 0.08 },
    icon: "cuirass_blood"
  },
  armor_frost_mail: {
    id: "armor_frost_mail",
    name: "Cota de Malha Glacial",
    description: "Armadura acolchoada com peles de yeti e escamas gélidas de Niflheim.",
    type: "ARMOR",
    rarity: "RARE",
    minLevel: 20,
    stats: { bonusHp: 180, bonusMp: 60, bonusPhysicalAtk: 10, bonusMagicalAtk: 10, bonusCritChance: 0.02, bonusDodgeChance: 0.03, bonusBlockChance: 0.06 },
    icon: "cuirass_blood"
  },
  armor_niflheim_cuirass: {
    id: "armor_niflheim_cuirass",
    name: "Couraça de Gelo Eterno",
    description: "Armadura maciça de permafrost que dissipa impactos físicos com estilhaços congelantes.",
    type: "ARMOR",
    rarity: "EPIC",
    minLevel: 24,
    stats: { bonusHp: 320, bonusMp: 100, bonusPhysicalAtk: 15, bonusMagicalAtk: 20, bonusCritChance: 0.03, bonusDodgeChance: 0.04, bonusBlockChance: 0.10 },
    icon: "cuirass_blood"
  },
  armor_shadow_chitin_plate: {
    id: "armor_shadow_chitin_plate",
    name: "Armadura de Quitina das Sombras",
    description: "Carapaça negra ultrarresistente dos monstros superiores da Necrópole.",
    type: "ARMOR",
    rarity: "EPIC",
    minLevel: 34,
    stats: { bonusHp: 580, bonusMp: 180, bonusPhysicalAtk: 25, bonusMagicalAtk: 30, bonusCritChance: 0.04, bonusDodgeChance: 0.08, bonusBlockChance: 0.12 },
    icon: "robe_cosmic"
  },
  armor_dragon_scale_armor: {
    id: "armor_dragon_scale_armor",
    name: "Peitoral de Escamas do Dragão Ignis",
    description: "Escamas de dragão vermelho impermeáveis ao fogo e capazes de deflectir ataques maciços.",
    type: "ARMOR",
    rarity: "LEGENDARY",
    minLevel: 54,
    stats: { bonusHp: 950, bonusMp: 280, bonusPhysicalAtk: 40, bonusMagicalAtk: 40, bonusCritChance: 0.06, bonusDodgeChance: 0.06, bonusBlockChance: 0.18 },
    icon: "cuirass_blood"
  },
  armor_monarch_sanctum_cuirass: {
    id: "armor_monarch_sanctum_cuirass",
    name: "Couraça Sacra dos Mandamentos Divinos",
    description: "Placas douradas esculpidas com as tábuas da Lei do Templo dos Deuses.",
    type: "ARMOR",
    rarity: "IMMORTAL",
    minLevel: 80,
    stats: { bonusHp: 1600, bonusMp: 480, bonusPhysicalAtk: 65, bonusMagicalAtk: 75, bonusCritChance: 0.08, bonusDodgeChance: 0.10, bonusBlockChance: 0.22 },
    icon: "cuirass_blood"
  },
  armor_celestial_void_plate: {
    id: "armor_celestial_void_plate",
    name: "Armadura Astral da Singularidade",
    description: "Matéria condensada de estrelas em colapso. Concede invulnerabilidade temporária a golpes críticos.",
    type: "ARMOR",
    rarity: "COSMIC",
    minLevel: 115,
    stats: { bonusHp: 2700, bonusMp: 800, bonusPhysicalAtk: 90, bonusMagicalAtk: 120, bonusCritChance: 0.10, bonusDodgeChance: 0.14, bonusBlockChance: 0.26 },
    icon: "robe_cosmic"
  },
  armor_shadow_monarch_regalia: {
    id: "armor_shadow_monarch_regalia",
    name: "Manto do Soberano das Sombras Ashborn",
    description: "A vestimenta de guerra imperial do governante supremo da Morte.",
    type: "ARMOR",
    rarity: "DIVINE",
    minLevel: 200,
    stats: { bonusHp: 4500, bonusMp: 1500, bonusPhysicalAtk: 160, bonusMagicalAtk: 160, bonusCritChance: 0.15, bonusDodgeChance: 0.20, bonusBlockChance: 0.30 },
    icon: "robe_cosmic"
  },

  // =========================================================================
  // AMULETOS E ANÉIS EXPANDIDOS DE ALTO NÍVEL (Lv 20 a 200)
  // =========================================================================
  amulet_frost_crystal: {
    id: "amulet_frost_crystal",
    name: "Pingente da Geada Eterna",
    description: "Canaliza o frio extremo estabilizando a regeneração de mana e mente.",
    type: "AMULET",
    rarity: "EPIC",
    minLevel: 20,
    stats: { bonusHp: 150, bonusMp: 120, bonusPhysicalAtk: 18, bonusMagicalAtk: 28, bonusCritChance: 0.05, bonusDodgeChance: 0.04, bonusBlockChance: 0.02 },
    icon: "amulet_copper"
  },
  ring_glacial_frost: {
    id: "ring_glacial_frost",
    name: "Aliança do Coração de Gelo",
    description: "Garante frieza letal e mira precisa em combates prolongados.",
    type: "RING",
    rarity: "EPIC",
    minLevel: 20,
    stats: { bonusHp: 120, bonusMp: 80, bonusPhysicalAtk: 22, bonusMagicalAtk: 18, bonusCritChance: 0.08, bonusDodgeChance: 0.05, bonusBlockChance: 0.02 },
    icon: "ring_silver"
  },
  amulet_archlich_eye: {
    id: "amulet_archlich_eye",
    name: "Olho Espectral do Arquilorde",
    description: "Visão necromântica que antecipa ataques e perfura barreiras arcanas.",
    type: "AMULET",
    rarity: "LEGENDARY",
    minLevel: 36,
    stats: { bonusHp: 260, bonusMp: 220, bonusPhysicalAtk: 35, bonusMagicalAtk: 55, bonusCritChance: 0.08, bonusDodgeChance: 0.06, bonusBlockChance: 0.04 },
    icon: "amulet_green"
  },
  ring_shadow_dominance: {
    id: "ring_shadow_dominance",
    name: "Anel da Dominância das Sombras",
    description: "Transborda energia escura, amplificando o dano de acertos críticos.",
    type: "RING",
    rarity: "LEGENDARY",
    minLevel: 36,
    stats: { bonusHp: 220, bonusMp: 160, bonusPhysicalAtk: 45, bonusMagicalAtk: 35, bonusCritChance: 0.12, bonusDodgeChance: 0.06, bonusBlockChance: 0.03 },
    icon: "ring_shadow"
  },
  amulet_dragon_heart_gem: {
    id: "amulet_dragon_heart_gem",
    name: "Gema de Sangue de Ignis",
    description: "Pedra vulcânica ardente que pulsa no ritmo de um coração de dragão vivo.",
    type: "AMULET",
    rarity: "IMMORTAL",
    minLevel: 56,
    stats: { bonusHp: 480, bonusMp: 340, bonusPhysicalAtk: 70, bonusMagicalAtk: 70, bonusCritChance: 0.10, bonusDodgeChance: 0.08, bonusBlockChance: 0.06 },
    icon: "amulet_gold"
  },
  ring_ignis_fury: {
    id: "ring_ignis_fury",
    name: "Anel da Fúria do Dragão",
    description: "Cada golpe do portador incinera a defesa do oponente.",
    type: "RING",
    rarity: "IMMORTAL",
    minLevel: 56,
    stats: { bonusHp: 380, bonusMp: 240, bonusPhysicalAtk: 85, bonusMagicalAtk: 50, bonusCritChance: 0.15, bonusDodgeChance: 0.08, bonusBlockChance: 0.05 },
    icon: "ring_gold"
  },
  amulet_god_fragment: {
    id: "amulet_god_fragment",
    name: "Coração de Pedra dos Deuses",
    description: "Fragmento do monolito central do Templo Secreto. Concede vigor semi-divino.",
    type: "AMULET",
    rarity: "IMMORTAL",
    minLevel: 82,
    stats: { bonusHp: 800, bonusMp: 550, bonusPhysicalAtk: 110, bonusMagicalAtk: 130, bonusCritChance: 0.12, bonusDodgeChance: 0.10, bonusBlockChance: 0.08 },
    icon: "amulet_gold"
  },
  ring_divine_authority: {
    id: "ring_divine_authority",
    name: "Aliança do Mandamento Divino",
    description: "Símbolo dos mandamentos que punem quem ousa desafiar o soberano.",
    type: "RING",
    rarity: "IMMORTAL",
    minLevel: 82,
    stats: { bonusHp: 650, bonusMp: 420, bonusPhysicalAtk: 135, bonusMagicalAtk: 90, bonusCritChance: 0.18, bonusDodgeChance: 0.10, bonusBlockChance: 0.07 },
    icon: "ring_gold"
  },
  amulet_stareater_void: {
    id: "amulet_stareater_void",
    name: "Pingente da Singularidade Cósmica",
    description: "Condensado de pura gravidade estelar do Devorador de Mundos.",
    type: "AMULET",
    rarity: "COSMIC",
    minLevel: 118,
    stats: { bonusHp: 1350, bonusMp: 900, bonusPhysicalAtk: 180, bonusMagicalAtk: 220, bonusCritChance: 0.16, bonusDodgeChance: 0.14, bonusBlockChance: 0.10 },
    icon: "amulet_gold"
  },
  ring_astral_collapse: {
    id: "ring_astral_collapse",
    name: "Anel do Horizonte de Eventos",
    description: "Cria micro-distorções de espaço acelerando o dano de ataque a níveis astronômicos.",
    type: "RING",
    rarity: "COSMIC",
    minLevel: 118,
    stats: { bonusHp: 1100, bonusMp: 700, bonusPhysicalAtk: 220, bonusMagicalAtk: 160, bonusCritChance: 0.24, bonusDodgeChance: 0.14, bonusBlockChance: 0.08 },
    icon: "ring_shadow"
  },
  amulet_shadow_monarch_crown: {
    id: "amulet_shadow_monarch_crown",
    name: "Coração Sombrio do Soberano Supremo",
    description: "A essência ancestral do Monarca das Sombras. Vitalidade e intelecto infinitos.",
    type: "AMULET",
    rarity: "DIVINE",
    minLevel: 200,
    stats: { bonusHp: 2400, bonusMp: 1600, bonusPhysicalAtk: 320, bonusMagicalAtk: 320, bonusCritChance: 0.22, bonusDodgeChance: 0.18, bonusBlockChance: 0.15 },
    icon: "amulet_gold"
  },
  ring_death_sovereignty: {
    id: "ring_death_sovereignty",
    name: "Aliança da Soberania da Morte",
    description: "A autoridade absoluta sobre o exército das sombras e as almas do submundo.",
    type: "RING",
    rarity: "DIVINE",
    minLevel: 200,
    stats: { bonusHp: 2000, bonusMp: 1300, bonusPhysicalAtk: 360, bonusMagicalAtk: 300, bonusCritChance: 0.30, bonusDodgeChance: 0.18, bonusBlockChance: 0.12 },
    icon: "ring_shadow"
  },

  // =========================================================================
  // TROFÉUS DE ESTÁGIO E DO WORLD BOSS SUPREMO
  // =========================================================================
  trophy_kamish_wrath: {
    id: "trophy_kamish_wrath",
    name: "Troféu Presa da Calamidade de Kamish",
    description: "A presa da maior calamidade que a humanidade já enfrentou: o lendário Dragão Kamish.",
    type: "TROPHY",
    rarity: "DIVINE",
    minLevel: 200,
    stats: { bonusHp: 1500, bonusMp: 1000, bonusPhysicalAtk: 250, bonusMagicalAtk: 250, bonusCritChance: 0.25, bonusDodgeChance: 0.12, bonusBlockChance: 0.15 },
    icon: "trophy_fang"
  },
  trophy_igris_blade: {
    id: "trophy_igris_blade",
    name: "Troféu Lâmina Carmesim de Igris",
    description: "Espada lendária do Cavaleiro Vermelho Igris, comandante do Exército das Sombras.",
    type: "TROPHY",
    rarity: "COSMIC",
    minLevel: 185,
    stats: { bonusHp: 800, bonusMp: 500, bonusPhysicalAtk: 180, bonusMagicalAtk: 100, bonusCritChance: 0.18, bonusDodgeChance: 0.10, bonusBlockChance: 0.10 },
    icon: "trophy_core"
  },
  trophy_orc_warlord: {
    id: "trophy_orc_warlord",
    name: "Troféu Machado do Lorde Orc",
    description: "Troféu do Lorde Orc do Abismo, guardião de estágio do Santuário.",
    type: "TROPHY",
    rarity: "RARE",
    minLevel: 7,
    stats: { bonusHp: 40, bonusMp: 20, bonusPhysicalAtk: 8, bonusMagicalAtk: 0, bonusCritChance: 0.04, bonusDodgeChance: 0, bonusBlockChance: 0.03 },
    icon: "trophy_core"
  },
  trophy_brass_gargoyle: {
    id: "trophy_brass_gargoyle",
    name: "Troféu Chifre da Gárgula de Latão",
    description: "Chifre metálico incandescente da Gárgula de Latão da Cidadela Carmesim.",
    type: "TROPHY",
    rarity: "EPIC",
    minLevel: 14,
    stats: { bonusHp: 65, bonusMp: 35, bonusPhysicalAtk: 12, bonusMagicalAtk: 10, bonusCritChance: 0.05, bonusDodgeChance: 0.02, bonusBlockChance: 0.04 },
    icon: "trophy_core"
  },
  trophy_frost_giant: {
    id: "trophy_frost_giant",
    name: "Troféu Coração Glacial do Gigante",
    description: "Coração de gelo perpétuo esculpido do Gigante Glacial de Niflheim.",
    type: "TROPHY",
    rarity: "EPIC",
    minLevel: 26,
    stats: { bonusHp: 120, bonusMp: 60, bonusPhysicalAtk: 25, bonusMagicalAtk: 15, bonusCritChance: 0.06, bonusDodgeChance: 0.03, bonusBlockChance: 0.05 },
    icon: "trophy_core"
  },
  trophy_death_knight: {
    id: "trophy_death_knight",
    name: "Troféu Espada do Cavaleiro da Morte",
    description: "Lâmina gélida espectral retirada do comandante dos túmulos na Necrópole.",
    type: "TROPHY",
    rarity: "LEGENDARY",
    minLevel: 42,
    stats: { bonusHp: 200, bonusMp: 100, bonusPhysicalAtk: 45, bonusMagicalAtk: 20, bonusCritChance: 0.08, bonusDodgeChance: 0.04, bonusBlockChance: 0.06 },
    icon: "trophy_core"
  },
  trophy_volcanic_behemoth: {
    id: "trophy_volcanic_behemoth",
    name: "Troféu Chifre do Behemoth",
    description: "Chifre incandescente esculpido no leito de magma da Calamidade Vulcânica.",
    type: "TROPHY",
    rarity: "LEGENDARY",
    minLevel: 65,
    stats: { bonusHp: 350, bonusMp: 180, bonusPhysicalAtk: 70, bonusMagicalAtk: 35, bonusCritChance: 0.10, bonusDodgeChance: 0.05, bonusBlockChance: 0.08 },
    icon: "trophy_core"
  },
  trophy_god_statue_high_priest: {
    id: "trophy_god_statue_high_priest",
    name: "Troféu Tomo das Asas Negras",
    description: "Escrituras sacrílegas do Sumo-Sacerdote no Templo dos Deuses Antigos.",
    type: "TROPHY",
    rarity: "IMMORTAL",
    minLevel: 95,
    stats: { bonusHp: 550, bonusMp: 300, bonusPhysicalAtk: 95, bonusMagicalAtk: 80, bonusCritChance: 0.12, bonusDodgeChance: 0.06, bonusBlockChance: 0.09 },
    icon: "trophy_core"
  },
  trophy_astral_herald: {
    id: "trophy_astral_herald",
    name: "Troféu Fragmento do Vácuo Infinito",
    description: "Poeira de quasar condensada deixada pelo Arauto Astral da Fenda Cósmica.",
    type: "TROPHY",
    rarity: "IMMORTAL",
    minLevel: 125,
    stats: { bonusHp: 750, bonusMp: 450, bonusPhysicalAtk: 130, bonusMagicalAtk: 110, bonusCritChance: 0.15, bonusDodgeChance: 0.08, bonusBlockChance: 0.10 },
    icon: "trophy_core"
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
