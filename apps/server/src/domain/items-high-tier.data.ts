import type { ItemDefinition } from "@rpg/contracts";

/**
 * Catálogo de Itens de Alto Nível (Nível 100 a 250+)
 * Raridades: IMMORTAL, COSMIC e DIVINE.
 * Separado em arquivo dedicado para manter modularidade e respeitar o limite de 1.000 linhas por arquivo.
 */
export const HIGH_TIER_ITEMS: Record<string, ItemDefinition> = {
  // =========================================================================
  // CONSUMÍVEIS LENDÁRIOS E DIVINOS (Lv 80 a 150)
  // =========================================================================
  potion_hp_immortal: {
    id: "potion_hp_immortal",
    name: "Frasco de Sangue de Titã",
    description: "Extrato condensado de vigor imortal. Restaura instantaneamente 1.500 pontos de HP.",
    type: "CONSUMABLE",
    rarity: "IMMORTAL",
    minLevel: 80,
    stats: { bonusHp: 0, bonusMp: 0, bonusPhysicalAtk: 0, bonusMagicalAtk: 0, bonusCritChance: 0, bonusDodgeChance: 0, bonusBlockChance: 0 },
    healAmount: 1500,
    icon: "potion_red_big"
  },
  potion_mp_immortal: {
    id: "potion_mp_immortal",
    name: "Elixir da Alma Imortal",
    description: "Mana de alta densidade extraída de núcleos divinos. Restaura 800 pontos de MP.",
    type: "CONSUMABLE",
    rarity: "IMMORTAL",
    minLevel: 80,
    stats: { bonusHp: 0, bonusMp: 0, bonusPhysicalAtk: 0, bonusMagicalAtk: 0, bonusCritChance: 0, bonusDodgeChance: 0, bonusBlockChance: 0 },
    manaAmount: 800,
    icon: "potion_blue_big"
  },
  potion_celestial_ambrosia: {
    id: "potion_celestial_ambrosia",
    name: "Ambrósia Cósmica dos Soberanos",
    description: "Néctar celestial dos deuses antigos. Regenera 3.500 de HP e 1.500 de MP simultaneamente.",
    type: "CONSUMABLE",
    rarity: "COSMIC",
    minLevel: 120,
    stats: { bonusHp: 0, bonusMp: 0, bonusPhysicalAtk: 0, bonusMagicalAtk: 0, bonusCritChance: 0, bonusDodgeChance: 0, bonusBlockChance: 0 },
    healAmount: 3500,
    manaAmount: 1500,
    icon: "elixir"
  },

  // =========================================================================
  // ARMAS SUPREMAS DE NÍVEL 100+
  // =========================================================================
  weapon_god_slayer_greatsword: {
    id: "weapon_god_slayer_greatsword",
    name: "Montante Caçadora de Deuses",
    description: "Lâmina pesada de ferro estelar banhada no sangue de soberanos celestes. Devasta armaduras titânicas.",
    type: "WEAPON",
    rarity: "IMMORTAL",
    minLevel: 100,
    stats: { bonusHp: 520, bonusMp: 220, bonusPhysicalAtk: 380, bonusMagicalAtk: 160, bonusCritChance: 0.22, bonusDodgeChance: 0.04, bonusBlockChance: 0.10 },
    icon: "sword_immortal"
  },
  weapon_void_heart_scythe: {
    id: "weapon_void_heart_scythe",
    name: "Foice do Vácuo Gravitacional",
    description: "Arma curvada do abismo cósmico que curva a luz e despedaça a realidade a cada golpe.",
    type: "WEAPON",
    rarity: "COSMIC",
    minLevel: 125,
    stats: { bonusHp: 720, bonusMp: 480, bonusPhysicalAtk: 440, bonusMagicalAtk: 380, bonusCritChance: 0.25, bonusDodgeChance: 0.12, bonusBlockChance: 0.05 },
    icon: "blade_cosmic"
  },
  weapon_archon_divine_spear: {
    id: "weapon_archon_divine_spear",
    name: "Lança Sacra do Arconte Astral",
    description: "Forjada em ouro puro celestial e gravada com as profecias do templo milenar.",
    type: "WEAPON",
    rarity: "COSMIC",
    minLevel: 145,
    stats: { bonusHp: 880, bonusMp: 520, bonusPhysicalAtk: 510, bonusMagicalAtk: 420, bonusCritChance: 0.26, bonusDodgeChance: 0.10, bonusBlockChance: 0.08 },
    icon: "sword_immortal"
  },
  weapon_astral_oblivion_blade: {
    id: "weapon_astral_oblivion_blade",
    name: "Lâmina do Esquecimento Astral",
    description: "Uma katana que absorve o próprio espaço, desferindo cortes invisíveis a olho nu.",
    type: "WEAPON",
    rarity: "COSMIC",
    minLevel: 165,
    stats: { bonusHp: 980, bonusMp: 590, bonusPhysicalAtk: 580, bonusMagicalAtk: 460, bonusCritChance: 0.30, bonusDodgeChance: 0.15, bonusBlockChance: 0.06 },
    icon: "blade_cosmic"
  },
  weapon_kamish_twin_wrath: {
    id: "weapon_kamish_twin_wrath",
    name: "Presas Dracônicas da Calamidade Kamish",
    description: "Adagas perfeitas lapidadas nas presas do dragão que destruiu cidades inteiras. O ápice da letalidade.",
    type: "WEAPON",
    rarity: "DIVINE",
    minLevel: 185,
    stats: { bonusHp: 1100, bonusMp: 680, bonusPhysicalAtk: 690, bonusMagicalAtk: 450, bonusCritChance: 0.35, bonusDodgeChance: 0.18, bonusBlockChance: 0.08 },
    icon: "blade_dark"
  },
  weapon_abyssal_infinity_staff: {
    id: "weapon_abyssal_infinity_staff",
    name: "Báculo do Infinito Primordial",
    description: "O catalisador supremo da mana arcana, amplificando feitiços e curas sagradas em magnitude sem limites.",
    type: "WEAPON",
    rarity: "DIVINE",
    minLevel: 210,
    stats: { bonusHp: 1350, bonusMp: 1200, bonusPhysicalAtk: 450, bonusMagicalAtk: 780, bonusCritChance: 0.32, bonusDodgeChance: 0.14, bonusBlockChance: 0.10 },
    icon: "blade_cosmic"
  },
  weapon_genesis_monarch_blade: {
    id: "weapon_genesis_monarch_blade",
    name: "Espada do Monarca Primordial da Criação",
    description: "Empunhada antes do início dos tempos pelo soberano supremo de todas as sombras e dimensões.",
    type: "WEAPON",
    rarity: "DIVINE",
    minLevel: 240,
    stats: { bonusHp: 1800, bonusMp: 1100, bonusPhysicalAtk: 880, bonusMagicalAtk: 880, bonusCritChance: 0.40, bonusDodgeChance: 0.20, bonusBlockChance: 0.18 },
    icon: "blade_dark"
  },

  // =========================================================================
  // ARMADURAS SUPREMAS DE NÍVEL 100+
  // =========================================================================
  armor_temple_arbiter_plate: {
    id: "armor_temple_arbiter_plate",
    name: "Placas Sagradas do Árbitro Celeste",
    description: "Armadura milenar de bronze arcano que absorve impactos com escudos de energia luminosa.",
    type: "ARMOR",
    rarity: "IMMORTAL",
    minLevel: 100,
    stats: { bonusHp: 2100, bonusMp: 600, bonusPhysicalAtk: 75, bonusMagicalAtk: 85, bonusCritChance: 0.08, bonusDodgeChance: 0.08, bonusBlockChance: 0.24 },
    icon: "cuirass_blood"
  },
  armor_astral_dominion_cuirass: {
    id: "armor_astral_dominion_cuirass",
    name: "Couraça do Domínio Astral",
    description: "Revestimento forjado com meteoritos da borda do universo, neutralizando qualquer tipo de magia.",
    type: "ARMOR",
    rarity: "COSMIC",
    minLevel: 130,
    stats: { bonusHp: 3100, bonusMp: 950, bonusPhysicalAtk: 110, bonusMagicalAtk: 140, bonusCritChance: 0.11, bonusDodgeChance: 0.12, bonusBlockChance: 0.26 },
    icon: "robe_cosmic"
  },
  armor_void_sovereign_mantle: {
    id: "armor_void_sovereign_mantle",
    name: "Manto do Soberano do Vácuo",
    description: "Tecido trançado a partir de matéria escura pura que distorce os ataques dos inimigos no impacto.",
    type: "ARMOR",
    rarity: "COSMIC",
    minLevel: 160,
    stats: { bonusHp: 3800, bonusMp: 1250, bonusPhysicalAtk: 135, bonusMagicalAtk: 180, bonusCritChance: 0.13, bonusDodgeChance: 0.16, bonusBlockChance: 0.24 },
    icon: "robe_cosmic"
  },
  armor_kamish_dragon_aegis: {
    id: "armor_kamish_dragon_aegis",
    name: "Armadura Dracônica Imperial de Kamish",
    description: "Escamas impenetráveis do Dragão Supremo que repelem cataclismos e reduzem o dano recebido pela metade.",
    type: "ARMOR",
    rarity: "DIVINE",
    minLevel: 185,
    stats: { bonusHp: 5200, bonusMp: 1600, bonusPhysicalAtk: 185, bonusMagicalAtk: 185, bonusCritChance: 0.16, bonusDodgeChance: 0.18, bonusBlockChance: 0.32 },
    icon: "cuirass_blood"
  },
  armor_divine_immortality_regalia: {
    id: "armor_divine_immortality_regalia",
    name: "Regalia Transcendente da Imortalidade",
    description: "Vestimenta divina dos Monarcas Eternos. Torna o portador uma fortaleza viva inabalável.",
    type: "ARMOR",
    rarity: "DIVINE",
    minLevel: 230,
    stats: { bonusHp: 6800, bonusMp: 2200, bonusPhysicalAtk: 240, bonusMagicalAtk: 240, bonusCritChance: 0.20, bonusDodgeChance: 0.22, bonusBlockChance: 0.35 },
    icon: "robe_cosmic"
  },

  // =========================================================================
  // ESCUDOS SUPREMOS DE NÍVEL 100+
  // =========================================================================
  shield_solar_titan_aegis: {
    id: "shield_solar_titan_aegis",
    name: "Égide do Titã Solar",
    description: "Escudo maciço forjado no coração de uma supernova, bloqueando até os golpes mais avassaladores.",
    type: "SHIELD",
    rarity: "IMMORTAL",
    minLevel: 100,
    stats: { bonusHp: 680, bonusMp: 180, bonusPhysicalAtk: 28, bonusMagicalAtk: 22, bonusCritChance: 0.02, bonusDodgeChance: 0.05, bonusBlockChance: 0.26 },
    icon: "shield_iron"
  },
  shield_stellar_event_horizon: {
    id: "shield_stellar_event_horizon",
    name: "Escudo do Horizonte de Eventos",
    description: "Baluarte que devora a energia de ataques inimigos como um buraco negro em miniatura.",
    type: "SHIELD",
    rarity: "COSMIC",
    minLevel: 135,
    stats: { bonusHp: 920, bonusMp: 280, bonusPhysicalAtk: 38, bonusMagicalAtk: 32, bonusCritChance: 0.04, bonusDodgeChance: 0.08, bonusBlockChance: 0.28 },
    icon: "shield_iron"
  },
  shield_archon_celestial_bulwark: {
    id: "shield_archon_celestial_bulwark",
    name: "Baluarte Celestial dos Arcontes",
    description: "Ergue uma barreira de luz solar pura capaz de refletir maldições e golpes de chefes supremos.",
    type: "SHIELD",
    rarity: "COSMIC",
    minLevel: 165,
    stats: { bonusHp: 1180, bonusMp: 380, bonusPhysicalAtk: 45, bonusMagicalAtk: 38, bonusCritChance: 0.05, bonusDodgeChance: 0.10, bonusBlockChance: 0.30 },
    icon: "shield_iron"
  },
  shield_primordial_dragon_barrier: {
    id: "shield_primordial_dragon_barrier",
    name: "Barreira Dracônica Primordial",
    description: "Ossos peitorais endurecidos da Calamidade Dracônica entrelaçados com adamantium puro.",
    type: "SHIELD",
    rarity: "DIVINE",
    minLevel: 195,
    stats: { bonusHp: 1650, bonusMp: 520, bonusPhysicalAtk: 65, bonusMagicalAtk: 55, bonusCritChance: 0.06, bonusDodgeChance: 0.12, bonusBlockChance: 0.34 },
    icon: "shield_iron"
  },
  shield_abyssal_monarch_gate: {
    id: "shield_abyssal_monarch_gate",
    name: "Portal do Portão Abissal do Monarca",
    description: "Um escudo que funciona como um portal vivo para o reino dos mortos, engolindo ataques fatais.",
    type: "SHIELD",
    rarity: "DIVINE",
    minLevel: 235,
    stats: { bonusHp: 2400, bonusMp: 750, bonusPhysicalAtk: 90, bonusMagicalAtk: 80, bonusCritChance: 0.08, bonusDodgeChance: 0.15, bonusBlockChance: 0.38 },
    icon: "shield_iron"
  },

  // =========================================================================
  // AMULETOS SUPREMOS DE NÍVEL 100+
  // =========================================================================
  amulet_solar_core_relic: {
    id: "amulet_solar_core_relic",
    name: "Relíquia do Núcleo Solar",
    description: "Pingente incandescente com fogo solar preso em cristal, amplificando o dano de todas as artes de combate.",
    type: "AMULET",
    rarity: "IMMORTAL",
    minLevel: 100,
    stats: { bonusHp: 950, bonusMp: 680, bonusPhysicalAtk: 130, bonusMagicalAtk: 155, bonusCritChance: 0.14, bonusDodgeChance: 0.10, bonusBlockChance: 0.08 },
    icon: "amulet_gold"
  },
  amulet_stellar_singularity: {
    id: "amulet_stellar_singularity",
    name: "Amuleto da Singularidade Quântica",
    description: "Condensado estelar que sintoniza as frequências de mana cósmica ao corpo do caçador.",
    type: "AMULET",
    rarity: "COSMIC",
    minLevel: 140,
    stats: { bonusHp: 1600, bonusMp: 1100, bonusPhysicalAtk: 210, bonusMagicalAtk: 260, bonusCritChance: 0.18, bonusDodgeChance: 0.15, bonusBlockChance: 0.11 },
    icon: "amulet_gold"
  },
  amulet_kamish_draconic_heart: {
    id: "amulet_kamish_draconic_heart",
    name: "Coração Dracônico da Fúria de Kamish",
    description: "O núcleo ardente do Dragão da Destruição, concedendo uma reserva brutal de poder bélico.",
    type: "AMULET",
    rarity: "DIVINE",
    minLevel: 185,
    stats: { bonusHp: 2600, bonusMp: 1750, bonusPhysicalAtk: 350, bonusMagicalAtk: 350, bonusCritChance: 0.24, bonusDodgeChance: 0.18, bonusBlockChance: 0.16 },
    icon: "amulet_blood"
  },
  amulet_monarch_transcendence: {
    id: "amulet_monarch_transcendence",
    name: "Emblema da Transcendência Divina",
    description: "O pingente supremo que canaliza a soberania absoluta dos deuses antigos sobre o destino.",
    type: "AMULET",
    rarity: "DIVINE",
    minLevel: 230,
    stats: { bonusHp: 3500, bonusMp: 2400, bonusPhysicalAtk: 460, bonusMagicalAtk: 460, bonusCritChance: 0.28, bonusDodgeChance: 0.22, bonusBlockChance: 0.20 },
    icon: "amulet_blood"
  },

  // =========================================================================
  // ANÉIS SUPREMOS DE NÍVEL 100+
  // =========================================================================
  ring_solar_flare_band: {
    id: "ring_solar_flare_band",
    name: "Aliança da Erupção Solar",
    description: "Anel de plasma condensado que explode em luz letal a cada acerto crítico desferido.",
    type: "RING",
    rarity: "IMMORTAL",
    minLevel: 100,
    stats: { bonusHp: 800, bonusMp: 520, bonusPhysicalAtk: 160, bonusMagicalAtk: 115, bonusCritChance: 0.20, bonusDodgeChance: 0.11, bonusBlockChance: 0.08 },
    icon: "ring_gold"
  },
  ring_void_singularity_band: {
    id: "ring_void_singularity_band",
    name: "Anel do Horizonte Cósmico",
    description: "Distorce as leis da gravidade aumentando a velocidade de reação e o poder de penetração.",
    type: "RING",
    rarity: "COSMIC",
    minLevel: 140,
    stats: { bonusHp: 1350, bonusMp: 850, bonusPhysicalAtk: 260, bonusMagicalAtk: 200, bonusCritChance: 0.26, bonusDodgeChance: 0.16, bonusBlockChance: 0.09 },
    icon: "ring_shadow"
  },
  ring_monarch_blood_oath: {
    id: "ring_monarch_blood_oath",
    name: "Aliança do Juramento de Sangue de Kamish",
    description: "Um laço eterno forjado no sangue do monarca e do dragão, amplificando o poder bélico supremo.",
    type: "RING",
    rarity: "DIVINE",
    minLevel: 185,
    stats: { bonusHp: 2200, bonusMp: 1450, bonusPhysicalAtk: 400, bonusMagicalAtk: 340, bonusCritChance: 0.32, bonusDodgeChance: 0.20, bonusBlockChance: 0.14 },
    icon: "ring_shadow"
  },
  ring_transcendent_godhood: {
    id: "ring_transcendent_godhood",
    name: "Anel da Onipotência Primordial",
    description: "O último anel da linhagem dos deuses criadores, concedendo domínio absoluto sobre a batalha.",
    type: "RING",
    rarity: "DIVINE",
    minLevel: 230,
    stats: { bonusHp: 3000, bonusMp: 2000, bonusPhysicalAtk: 520, bonusMagicalAtk: 450, bonusCritChance: 0.36, bonusDodgeChance: 0.24, bonusBlockChance: 0.16 },
    icon: "ring_shadow"
  }
};
