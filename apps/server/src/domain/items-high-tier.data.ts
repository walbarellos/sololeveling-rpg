import type { ItemDefinition } from "@rpg/contracts";

/**
 * Catálogo de Itens de Alto Nível (Nível 100 a 250+)
 * Raridades: IMMORTAL (Rank S), COSMIC (Rank SS) e DIVINE (Rank SSS+).
 * Concede centenas de pontos de atributos (FOR, AGI, VIT, INT, ATK e HP) dignos dos maiores Monarcas.
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
    stats: { bonusHp: 0, bonusMp: 0, bonusPhysicalAtk: 0, bonusMagicalAtk: 0, bonusCritChance: 0, bonusDodgeChance: 0, bonusBlockChance: 0, bonusStr: 0, bonusAgi: 0, bonusVit: 0, bonusInt: 0 },
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
    stats: { bonusHp: 0, bonusMp: 0, bonusPhysicalAtk: 0, bonusMagicalAtk: 0, bonusCritChance: 0, bonusDodgeChance: 0, bonusBlockChance: 0, bonusStr: 0, bonusAgi: 0, bonusVit: 0, bonusInt: 0 },
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
    stats: { bonusHp: 0, bonusMp: 0, bonusPhysicalAtk: 0, bonusMagicalAtk: 0, bonusCritChance: 0, bonusDodgeChance: 0, bonusBlockChance: 0, bonusStr: 0, bonusAgi: 0, bonusVit: 0, bonusInt: 0 },
    healAmount: 3500,
    manaAmount: 1500,
    icon: "elixir"
  },

  // =========================================================================
  // ARMAS SUPREMAS DE NÍVEL 100+ (RANK S, SS, SSS+)
  // =========================================================================
  weapon_god_slayer_greatsword: {
    id: "weapon_god_slayer_greatsword",
    name: "Montante Caçadora de Deuses",
    description: "Lâmina pesada de ferro estelar banhada no sangue de soberanos celestes. Devasta armaduras titânicas.",
    type: "WEAPON",
    rarity: "IMMORTAL",
    minLevel: 100,
    stats: { bonusHp: 850, bonusMp: 350, bonusPhysicalAtk: 480, bonusMagicalAtk: 220, bonusCritChance: 0.22, bonusDodgeChance: 0.04, bonusBlockChance: 0.12, bonusStr: 140, bonusAgi: 50, bonusVit: 110, bonusInt: 40 },
    icon: "sword_immortal"
  },
  weapon_void_heart_scythe: {
    id: "weapon_void_heart_scythe",
    name: "Foice do Vácuo Gravitacional",
    description: "Arma curvada do abismo cósmico que dobra o espaço e despedaça a realidade a cada corte.",
    type: "WEAPON",
    rarity: "COSMIC",
    minLevel: 125,
    stats: { bonusHp: 1200, bonusMp: 750, bonusPhysicalAtk: 620, bonusMagicalAtk: 540, bonusCritChance: 0.25, bonusDodgeChance: 0.12, bonusBlockChance: 0.06, bonusStr: 120, bonusAgi: 180, bonusVit: 140, bonusInt: 160 },
    icon: "blade_cosmic"
  },
  weapon_archon_divine_spear: {
    id: "weapon_archon_divine_spear",
    name: "Lança Sacra do Arconte Astral",
    description: "Forjada em ouro puro celestial e gravada com profecias milenares de aniquilação.",
    type: "WEAPON",
    rarity: "COSMIC",
    minLevel: 145,
    stats: { bonusHp: 1450, bonusMp: 880, bonusPhysicalAtk: 740, bonusMagicalAtk: 580, bonusCritChance: 0.26, bonusDodgeChance: 0.10, bonusBlockChance: 0.10, bonusStr: 210, bonusAgi: 140, bonusVit: 180, bonusInt: 150 },
    icon: "sword_immortal"
  },
  weapon_astral_oblivion_blade: {
    id: "weapon_astral_oblivion_blade",
    name: "Lâmina do Esquecimento Astral",
    description: "Uma katana que absorve o próprio espaço, desferindo cortes invisíveis a olho nu.",
    type: "WEAPON",
    rarity: "COSMIC",
    minLevel: 165,
    stats: { bonusHp: 1600, bonusMp: 950, bonusPhysicalAtk: 840, bonusMagicalAtk: 650, bonusCritChance: 0.30, bonusDodgeChance: 0.16, bonusBlockChance: 0.08, bonusStr: 240, bonusAgi: 260, bonusVit: 190, bonusInt: 170 },
    icon: "blade_cosmic"
  },
  weapon_kamish_twin_wrath: {
    id: "weapon_kamish_twin_wrath",
    name: "Presas Dracônicas da Calamidade Kamish",
    description: "Adagas lapidadas nas presas do dragão que devastou exércitos inteiros. O ápice da letalidade.",
    type: "WEAPON",
    rarity: "DIVINE",
    minLevel: 185,
    stats: { bonusHp: 2200, bonusMp: 1200, bonusPhysicalAtk: 1150, bonusMagicalAtk: 720, bonusCritChance: 0.35, bonusDodgeChance: 0.20, bonusBlockChance: 0.10, bonusStr: 340, bonusAgi: 380, bonusVit: 240, bonusInt: 190 },
    icon: "blade_dark"
  },
  weapon_abyssal_infinity_staff: {
    id: "weapon_abyssal_infinity_staff",
    name: "Báculo do Infinito Primordial",
    description: "O catalisador supremo da mana arcana, amplificando feitiços e artes sagradas em magnitude colossal.",
    type: "WEAPON",
    rarity: "DIVINE",
    minLevel: 210,
    stats: { bonusHp: 2400, bonusMp: 2200, bonusPhysicalAtk: 680, bonusMagicalAtk: 1350, bonusCritChance: 0.32, bonusDodgeChance: 0.15, bonusBlockChance: 0.12, bonusStr: 160, bonusAgi: 180, bonusVit: 280, bonusInt: 480 },
    icon: "blade_cosmic"
  },
  weapon_genesis_monarch_blade: {
    id: "weapon_genesis_monarch_blade",
    name: "Espada do Monarca Primordial da Criação",
    description: "Empunhada antes do início dos tempos pelo soberano supremo de todas as sombras e dimensões.",
    type: "WEAPON",
    rarity: "DIVINE",
    minLevel: 240,
    stats: { bonusHp: 3200, bonusMp: 1800, bonusPhysicalAtk: 1550, bonusMagicalAtk: 1550, bonusCritChance: 0.40, bonusDodgeChance: 0.22, bonusBlockChance: 0.20, bonusStr: 480, bonusAgi: 380, bonusVit: 420, bonusInt: 480 },
    icon: "blade_dark"
  },

  // =========================================================================
  // ARMADURAS SUPREMAS DE NÍVEL 100+ (RANK S, SS, SSS+)
  // =========================================================================
  armor_temple_arbiter_plate: {
    id: "armor_temple_arbiter_plate",
    name: "Placas Sagradas do Árbitro Celeste",
    description: "Armadura milenar de bronze arcano que absorve impactos com escudos de energia luminosa.",
    type: "ARMOR",
    rarity: "IMMORTAL",
    minLevel: 100,
    stats: { bonusHp: 3200, bonusMp: 900, bonusPhysicalAtk: 110, bonusMagicalAtk: 120, bonusCritChance: 0.08, bonusDodgeChance: 0.08, bonusBlockChance: 0.25, bonusStr: 80, bonusAgi: 50, bonusVit: 240, bonusInt: 80 },
    icon: "cuirass_blood"
  },
  armor_astral_dominion_cuirass: {
    id: "armor_astral_dominion_cuirass",
    name: "Couraça do Domínio Astral",
    description: "Revestimento forjado com meteoritos da borda do universo, neutralizando ondas de choque destrutivas.",
    type: "ARMOR",
    rarity: "COSMIC",
    minLevel: 130,
    stats: { bonusHp: 4800, bonusMp: 1400, bonusPhysicalAtk: 160, bonusMagicalAtk: 190, bonusCritChance: 0.11, bonusDodgeChance: 0.12, bonusBlockChance: 0.28, bonusStr: 120, bonusAgi: 90, bonusVit: 350, bonusInt: 140 },
    icon: "robe_cosmic"
  },
  armor_void_sovereign_mantle: {
    id: "armor_void_sovereign_mantle",
    name: "Manto do Soberano do Vácuo",
    description: "Tecido trançado a partir de matéria escura pura que distorce os ataques dos inimigos no impacto.",
    type: "ARMOR",
    rarity: "COSMIC",
    minLevel: 160,
    stats: { bonusHp: 5800, bonusMp: 1850, bonusPhysicalAtk: 190, bonusMagicalAtk: 250, bonusCritChance: 0.13, bonusDodgeChance: 0.16, bonusBlockChance: 0.26, bonusStr: 140, bonusAgi: 150, bonusVit: 420, bonusInt: 220 },
    icon: "robe_cosmic"
  },
  armor_kamish_dragon_aegis: {
    id: "armor_kamish_dragon_aegis",
    name: "Armadura Dracônica Imperial de Kamish",
    description: "Escamas impenetráveis do Dragão Supremo que repelem cataclismos e atenuam qualquer impacto.",
    type: "ARMOR",
    rarity: "DIVINE",
    minLevel: 185,
    stats: { bonusHp: 8500, bonusMp: 2400, bonusPhysicalAtk: 280, bonusMagicalAtk: 280, bonusCritChance: 0.16, bonusDodgeChance: 0.18, bonusBlockChance: 0.34, bonusStr: 260, bonusAgi: 180, bonusVit: 650, bonusInt: 240 },
    icon: "cuirass_blood"
  },
  armor_divine_immortality_regalia: {
    id: "armor_divine_immortality_regalia",
    name: "Regalia Transcendente da Imortalidade",
    description: "Vestimenta divina dos Monarcas Eternos. Torna o portador uma fortaleza viva inabalável.",
    type: "ARMOR",
    rarity: "DIVINE",
    minLevel: 230,
    stats: { bonusHp: 12500, bonusMp: 3800, bonusPhysicalAtk: 380, bonusMagicalAtk: 380, bonusCritChance: 0.20, bonusDodgeChance: 0.22, bonusBlockChance: 0.38, bonusStr: 380, bonusAgi: 280, bonusVit: 950, bonusInt: 380 },
    icon: "robe_cosmic"
  },

  // =========================================================================
  // ESCUDOS SUPREMOS DE NÍVEL 100+ (RANK S, SS, SSS+)
  // =========================================================================
  shield_solar_titan_aegis: {
    id: "shield_solar_titan_aegis",
    name: "Égide do Titã Solar",
    description: "Escudo forjado no coração de uma supernova, bloqueando até os golpes mais avassaladores.",
    type: "SHIELD",
    rarity: "IMMORTAL",
    minLevel: 100,
    stats: { bonusHp: 1100, bonusMp: 300, bonusPhysicalAtk: 50, bonusMagicalAtk: 40, bonusCritChance: 0.02, bonusDodgeChance: 0.05, bonusBlockChance: 0.27, bonusStr: 70, bonusAgi: 30, bonusVit: 160, bonusInt: 40 },
    icon: "shield_iron"
  },
  shield_stellar_event_horizon: {
    id: "shield_stellar_event_horizon",
    name: "Escudo do Horizonte de Eventos",
    description: "Baluarte que devora a energia de ataques inimigos como um buraco negro em miniatura.",
    type: "SHIELD",
    rarity: "COSMIC",
    minLevel: 135,
    stats: { bonusHp: 1650, bonusMp: 450, bonusPhysicalAtk: 70, bonusMagicalAtk: 60, bonusCritChance: 0.04, bonusDodgeChance: 0.08, bonusBlockChance: 0.30, bonusStr: 100, bonusAgi: 50, bonusVit: 240, bonusInt: 80 },
    icon: "shield_iron"
  },
  shield_archon_celestial_bulwark: {
    id: "shield_archon_celestial_bulwark",
    name: "Baluarte Celestial dos Arcontes",
    description: "Ergue uma barreira de luz solar pura capaz de refletir maldições e golpes de chefes supremos.",
    type: "SHIELD",
    rarity: "COSMIC",
    minLevel: 165,
    stats: { bonusHp: 2200, bonusMp: 600, bonusPhysicalAtk: 90, bonusMagicalAtk: 75, bonusCritChance: 0.05, bonusDodgeChance: 0.10, bonusBlockChance: 0.33, bonusStr: 140, bonusAgi: 70, bonusVit: 340, bonusInt: 110 },
    icon: "shield_iron"
  },
  shield_primordial_dragon_barrier: {
    id: "shield_primordial_dragon_barrier",
    name: "Barreira Dracônica Primordial",
    description: "Ossos peitorais endurecidos da Calamidade Dracônica entrelaçados com adamantium puro.",
    type: "SHIELD",
    rarity: "DIVINE",
    minLevel: 195,
    stats: { bonusHp: 3200, bonusMp: 950, bonusPhysicalAtk: 140, bonusMagicalAtk: 110, bonusCritChance: 0.06, bonusDodgeChance: 0.12, bonusBlockChance: 0.36, bonusStr: 220, bonusAgi: 110, bonusVit: 490, bonusInt: 140 },
    icon: "shield_iron"
  },
  shield_abyssal_monarch_gate: {
    id: "shield_abyssal_monarch_gate",
    name: "Portal do Portão Abissal do Monarca",
    description: "Um escudo que funciona como um portal vivo para o reino dos mortos, engolindo ataques fatais.",
    type: "SHIELD",
    rarity: "DIVINE",
    minLevel: 235,
    stats: { bonusHp: 4800, bonusMp: 1400, bonusPhysicalAtk: 200, bonusMagicalAtk: 170, bonusCritChance: 0.08, bonusDodgeChance: 0.15, bonusBlockChance: 0.40, bonusStr: 320, bonusAgi: 160, bonusVit: 720, bonusInt: 260 },
    icon: "shield_iron"
  },

  // =========================================================================
  // AMULETOS SUPREMOS DE NÍVEL 100+ (RANK S, SS, SSS+)
  // =========================================================================
  amulet_solar_core_relic: {
    id: "amulet_solar_core_relic",
    name: "Relíquia do Núcleo Solar",
    description: "Pingente incandescente com fogo solar preso em cristal, amplificando o dano de todas as artes de combate.",
    type: "AMULET",
    rarity: "IMMORTAL",
    minLevel: 100,
    stats: { bonusHp: 1400, bonusMp: 980, bonusPhysicalAtk: 190, bonusMagicalAtk: 220, bonusCritChance: 0.14, bonusDodgeChance: 0.10, bonusBlockChance: 0.08, bonusStr: 110, bonusAgi: 80, bonusVit: 130, bonusInt: 140 },
    icon: "amulet_gold"
  },
  amulet_stellar_singularity: {
    id: "amulet_stellar_singularity",
    name: "Amuleto da Singularidade Quântica",
    description: "Condensado estelar que sintoniza as frequências de mana cósmica ao corpo do caçador.",
    type: "AMULET",
    rarity: "COSMIC",
    minLevel: 140,
    stats: { bonusHp: 2400, bonusMp: 1650, bonusPhysicalAtk: 310, bonusMagicalAtk: 370, bonusCritChance: 0.18, bonusDodgeChance: 0.15, bonusBlockChance: 0.11, bonusStr: 180, bonusAgi: 140, bonusVit: 210, bonusInt: 240 },
    icon: "amulet_gold"
  },
  amulet_kamish_draconic_heart: {
    id: "amulet_kamish_draconic_heart",
    name: "Coração Dracônico da Fúria de Kamish",
    description: "O núcleo ardente do Dragão da Destruição, concedendo uma reserva brutal de poder bélico.",
    type: "AMULET",
    rarity: "DIVINE",
    minLevel: 185,
    stats: { bonusHp: 4200, bonusMp: 2800, bonusPhysicalAtk: 540, bonusMagicalAtk: 540, bonusCritChance: 0.24, bonusDodgeChance: 0.18, bonusBlockChance: 0.16, bonusStr: 320, bonusAgi: 240, bonusVit: 360, bonusInt: 320 },
    icon: "amulet_blood"
  },
  amulet_monarch_transcendence: {
    id: "amulet_monarch_transcendence",
    name: "Emblema da Transcendência Divina",
    description: "O pingente supremo que canaliza a soberania absoluta dos deuses antigos sobre o destino.",
    type: "AMULET",
    rarity: "DIVINE",
    minLevel: 230,
    stats: { bonusHp: 6200, bonusMp: 4200, bonusPhysicalAtk: 780, bonusMagicalAtk: 780, bonusCritChance: 0.28, bonusDodgeChance: 0.22, bonusBlockChance: 0.20, bonusStr: 480, bonusAgi: 360, bonusVit: 540, bonusInt: 480 },
    icon: "amulet_blood"
  },

  // =========================================================================
  // ANÉIS SUPREMOS DE NÍVEL 100+ (RANK S, SS, SSS+)
  // =========================================================================
  ring_solar_flare_band: {
    id: "ring_solar_flare_band",
    name: "Aliança da Erupção Solar",
    description: "Anel de plasma condensado que explode em luz letal a cada acerto crítico desferido.",
    type: "RING",
    rarity: "IMMORTAL",
    minLevel: 100,
    stats: { bonusHp: 1200, bonusMp: 750, bonusPhysicalAtk: 240, bonusMagicalAtk: 170, bonusCritChance: 0.20, bonusDodgeChance: 0.11, bonusBlockChance: 0.08, bonusStr: 130, bonusAgi: 140, bonusVit: 110, bonusInt: 90 },
    icon: "ring_gold"
  },
  ring_void_singularity_band: {
    id: "ring_void_singularity_band",
    name: "Anel do Horizonte Cósmico",
    description: "Distorce as leis da gravidade aumentando a velocidade de reação e o poder de penetração.",
    type: "RING",
    rarity: "COSMIC",
    minLevel: 140,
    stats: { bonusHp: 2100, bonusMp: 1300, bonusPhysicalAtk: 390, bonusMagicalAtk: 290, bonusCritChance: 0.26, bonusDodgeChance: 0.16, bonusBlockChance: 0.09, bonusStr: 210, bonusAgi: 240, bonusVit: 180, bonusInt: 160 },
    icon: "ring_shadow"
  },
  ring_monarch_blood_oath: {
    id: "ring_monarch_blood_oath",
    name: "Aliança do Juramento de Sangue de Kamish",
    description: "Um laço eterno forjado no sangue do monarca e do dragão, amplificando o poder bélico supremo.",
    type: "RING",
    rarity: "DIVINE",
    minLevel: 185,
    stats: { bonusHp: 3600, bonusMp: 2200, bonusPhysicalAtk: 640, bonusMagicalAtk: 520, bonusCritChance: 0.32, bonusDodgeChance: 0.20, bonusBlockChance: 0.14, bonusStr: 360, bonusAgi: 380, bonusVit: 280, bonusInt: 260 },
    icon: "ring_shadow"
  },
  ring_transcendent_godhood: {
    id: "ring_transcendent_godhood",
    name: "Anel da Onipotência Primordial",
    description: "O último anel da linhagem dos deuses criadores, concedendo domínio absoluto sobre a batalha.",
    type: "RING",
    rarity: "DIVINE",
    minLevel: 230,
    stats: { bonusHp: 5200, bonusMp: 3400, bonusPhysicalAtk: 880, bonusMagicalAtk: 760, bonusCritChance: 0.36, bonusDodgeChance: 0.24, bonusBlockChance: 0.16, bonusStr: 500, bonusAgi: 520, bonusVit: 420, bonusInt: 380 },
    icon: "ring_shadow"
  }
};
