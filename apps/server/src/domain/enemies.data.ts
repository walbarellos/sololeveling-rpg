import {
  statMult,
  type EnemySnapshot,
  type HunterRank,
  type TileCoord,
  type WorldId
} from "@rpg/contracts";

export interface MobTemplate {
  name: string;
  rank: HunterRank;
  baseHp: number;
  baseMp: number;
  /** Tema visual do bioma: nature | larva | space | hell | swamp | crypt | frost */
  theme: string;
}

export const MOB_TEMPLATES: Record<string, MobTemplate> = {
  slime: { name: "Dungeon Slime", rank: "E", baseHp: 60, baseMp: 10, theme: "swamp" },
  larva: { name: "Cave Larva", rank: "E", baseHp: 48, baseMp: 6, theme: "larva" },
  goblin: { name: "Gate Goblin", rank: "E", baseHp: 68, baseMp: 14, theme: "crypt" },
  sprout: { name: "Thorn Sprout", rank: "E", baseHp: 52, baseMp: 18, theme: "nature" },
  wolf: { name: "Shadow Wolf", rank: "D", baseHp: 83, baseMp: 21, theme: "crypt" },
  ember: { name: "Ember Imp", rank: "D", baseHp: 72, baseMp: 30, theme: "hell" },
  voidling: { name: "Voidling", rank: "D", baseHp: 78, baseMp: 35, theme: "space" },
  frostbat: { name: "Frost Bat", rank: "D", baseHp: 70, baseMp: 22, theme: "frost" },
  hellhound: { name: "Hell Hound", rank: "C", baseHp: 115, baseMp: 28, theme: "hell" },
  starspawn: { name: "Starspawn", rank: "C", baseHp: 105, baseMp: 42, theme: "space" },
  boss: { name: "Chefe Goblin do Gate", rank: "C", baseHp: 220, baseMp: 50, theme: "crypt" },
  ashguard: { name: "Guarda de Cinzas", rank: "D", baseHp: 120, baseMp: 24, theme: "crimson" },
  brasshound: { name: "Cão de Latão", rank: "D", baseHp: 140, baseMp: 18, theme: "brass" },
  runeblade: { name: "Lâmina Rúnica", rank: "D", baseHp: 128, baseMp: 40, theme: "rune" },

  // GATE C — Fenda Glacial de Niflheim
  frostwolf: { name: "Lobo Glacial", rank: "C", baseHp: 160, baseMp: 30, theme: "frost" },
  frostgolem: { name: "Golem de Permafrost", rank: "C", baseHp: 220, baseMp: 20, theme: "frost" },
  icespecter: { name: "Espectro da Nevasca", rank: "C", baseHp: 175, baseMp: 55, theme: "frost" },

  // GATE B — Necrópole das Sombras
  deathknight: { name: "Cavaleiro da Morte", rank: "B", baseHp: 280, baseMp: 40, theme: "crypt" },
  ghoul_lord: { name: "Lorde Carniçal", rank: "B", baseHp: 320, baseMp: 30, theme: "swamp" },
  shadowlich: { name: "Lich Sombrio", rank: "B", baseHp: 250, baseMp: 90, theme: "space" },

  // GATE A — Calamidade Vulcânica
  magma_drake: { name: "Draconiano de Magma", rank: "A", baseHp: 440, baseMp: 60, theme: "hell" },
  fire_behemoth: { name: "Behemoth Vulcânico", rank: "A", baseHp: 520, baseMp: 45, theme: "hell" },
  flame_serpent: { name: "Serpente das Cinzas", rank: "A", baseHp: 410, baseMp: 80, theme: "hell" },

  // GATE S — Templo dos Deuses Antigos
  temple_guardian: { name: "Guardião de Pedra do Templo", rank: "S", baseHp: 680, baseMp: 80, theme: "crypt" },
  winged_executioner: { name: "Carrasco Alado", rank: "S", baseHp: 750, baseMp: 90, theme: "nature" },
  ruin_priest: { name: "Alto Sacerdote da Ruína", rank: "S", baseHp: 620, baseMp: 150, theme: "space" },

  // GATE SS — Fenda Cósmica
  stareater: { name: "Devorador de Estrelas", rank: "SS", baseHp: 1050, baseMp: 120, theme: "space" },
  void_abomination: { name: "Abominação do Vácuo", rank: "SS", baseHp: 1200, baseMp: 140, theme: "space" },

  // GATE SSS — Trono do Monarca das Sombras
  shadow_commander: { name: "Comandante das Sombras Igris", rank: "SSS", baseHp: 1600, baseMp: 200, theme: "crypt" },
  shadow_beru: { name: "Lorde das Sombras Beru", rank: "SSS", baseHp: 1850, baseMp: 220, theme: "larva" },
  shadow_bellion: { name: "General Supremo Bellion", rank: "SSS+", baseHp: 2200, baseMp: 250, theme: "crypt" }
};

export function createEnemyInstance(
  id: string,
  templateKey: keyof typeof MOB_TEMPLATES,
  level: number,
  position: TileCoord,
  worldId: WorldId = "GATE_E"
): EnemySnapshot {
  const template = MOB_TEMPLATES[templateKey];
  const mult = statMult(level);
  const hp = Math.round(template.baseHp * mult);
  const mp = Math.round(template.baseMp * mult);
  return {
    id,
    name: template.name,
    rank: template.rank,
    level,
    position,
    hp,
    maxHp: hp,
    mp,
    maxMp: mp,
    alive: true,
    worldId
  };
}

export const DEFAULT_OBSTACLES: readonly TileCoord[] = [
  // --- SALA 1: Santuário do Gate (0..15, 0..13) ---
  { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 },
  { x: 9, y: 2 }, { x: 10, y: 2 },
  { x: 9, y: 9 }, { x: 10, y: 9 },
  // Muralha leste dividindo Sala 1 e Sala 2 (passagem aberta em y=5,6,7)
  { x: 15, y: 0 }, { x: 15, y: 1 }, { x: 15, y: 2 }, { x: 15, y: 3 }, { x: 15, y: 4 },
  { x: 15, y: 8 }, { x: 15, y: 9 }, { x: 15, y: 10 }, { x: 15, y: 11 }, { x: 15, y: 12 }, { x: 15, y: 13 },
  // Muralha sul dividindo Sala 1 e Sala 3 (passagem aberta em x=6,7,8)
  { x: 0, y: 13 }, { x: 1, y: 13 }, { x: 2, y: 13 }, { x: 3, y: 13 }, { x: 4, y: 13 }, { x: 5, y: 13 },
  { x: 9, y: 13 }, { x: 10, y: 13 }, { x: 11, y: 13 }, { x: 12, y: 13 }, { x: 13, y: 13 }, { x: 14, y: 13 },

  // --- SALA 2: Catacumbas Esquecidas (16..31, 0..13) ---
  { x: 20, y: 3 }, { x: 21, y: 3 }, { x: 26, y: 3 }, { x: 27, y: 3 },
  { x: 20, y: 9 }, { x: 21, y: 9 }, { x: 26, y: 9 }, { x: 27, y: 9 },
  { x: 16, y: 13 }, { x: 17, y: 13 }, { x: 18, y: 13 }, { x: 19, y: 13 }, { x: 20, y: 13 }, { x: 21, y: 13 }, { x: 22, y: 13 },
  { x: 26, y: 13 }, { x: 27, y: 13 }, { x: 28, y: 13 }, { x: 29, y: 13 }, { x: 30, y: 13 }, { x: 31, y: 13 },
  { x: 31, y: 0 }, { x: 31, y: 1 }, { x: 31, y: 2 }, { x: 31, y: 3 }, { x: 31, y: 4 },
  { x: 31, y: 8 }, { x: 31, y: 9 }, { x: 31, y: 10 }, { x: 31, y: 11 }, { x: 31, y: 12 },

  // --- SALA 3: Fenda Vulcânica / Covil das Feras (0..15, 14..27) ---
  { x: 4, y: 18 }, { x: 5, y: 18 },
  { x: 10, y: 23 }, { x: 11, y: 23 },
  { x: 15, y: 14 }, { x: 15, y: 15 }, { x: 15, y: 16 }, { x: 15, y: 17 }, { x: 15, y: 18 }, { x: 15, y: 19 },
  { x: 15, y: 23 }, { x: 15, y: 24 }, { x: 15, y: 25 }, { x: 15, y: 26 }, { x: 15, y: 27 },

  // --- SALA 4: Abismo Dimensional / Câmara Cósmica (16..31, 14..27) ---
  { x: 21, y: 17 }, { x: 22, y: 17 }, { x: 27, y: 17 }, { x: 28, y: 17 },
  { x: 21, y: 23 }, { x: 22, y: 23 }, { x: 27, y: 23 }, { x: 28, y: 23 },
  { x: 31, y: 14 }, { x: 31, y: 15 }, { x: 31, y: 16 }, { x: 31, y: 17 }, { x: 31, y: 18 }, { x: 31, y: 19 },
  { x: 31, y: 23 }, { x: 31, y: 24 }, { x: 31, y: 25 }, { x: 31, y: 26 }, { x: 31, y: 27 },

  // --- SALA 5: A Sala Final / Câmara do Chefe do Gate (32..47, 0..27) ---
  { x: 36, y: 7 }, { x: 37, y: 7 }, { x: 36, y: 8 }, { x: 37, y: 8 },
  { x: 36, y: 19 }, { x: 37, y: 19 }, { x: 36, y: 20 }, { x: 37, y: 20 },
  { x: 43, y: 7 }, { x: 44, y: 7 }, { x: 43, y: 8 }, { x: 44, y: 8 },
  { x: 43, y: 19 }, { x: 44, y: 19 }, { x: 43, y: 20 }, { x: 44, y: 20 }
];

export function createInitialEnemies(): [string, EnemySnapshot][] {
  return [
    // SALA 1: Santuário do Gate (Entrada & Treinamento Rank E, Lv 1–3)
    ["slime-1", createEnemyInstance("slime-1", "slime", 1, { x: 7, y: 4 })],
    ["slime-2", createEnemyInstance("slime-2", "slime", 1, { x: 10, y: 3 })],
    ["larva-1", createEnemyInstance("larva-1", "larva", 1, { x: 3, y: 8 })],
    ["sprout-1", createEnemyInstance("sprout-1", "sprout", 2, { x: 12, y: 10 })],

    // SALA 2: Catacumbas Esquecidas (Rank E/D, Lv 3–5)
    ["goblin-1", createEnemyInstance("goblin-1", "goblin", 3, { x: 22, y: 5 })],
    ["goblin-2", createEnemyInstance("goblin-2", "goblin", 3, { x: 28, y: 6 })],
    ["larva-2", createEnemyInstance("larva-2", "larva", 2, { x: 18, y: 10 })],
    ["frostbat-1", createEnemyInstance("frostbat-1", "frostbat", 4, { x: 25, y: 11 })],

    // SALA 3: Fenda Vulcânica / Covil das Feras (Rank D, Lv 5–7)
    ["wolf-1", createEnemyInstance("wolf-1", "wolf", 5, { x: 6, y: 20 })],
    ["ember-1", createEnemyInstance("ember-1", "ember", 5, { x: 12, y: 22 })],
    ["wolf-2", createEnemyInstance("wolf-2", "wolf", 6, { x: 4, y: 25 })],

    // SALA 4: Abismo Dimensional / Câmara Cósmica (Rank D/C, Lv 7–9)
    ["voidling-1", createEnemyInstance("voidling-1", "voidling", 6, { x: 22, y: 19 })],
    ["hellhound-1", createEnemyInstance("hellhound-1", "hellhound", 8, { x: 26, y: 23 })],
    ["starspawn-1", createEnemyInstance("starspawn-1", "starspawn", 9, { x: 29, y: 17 })],

    // SALA 5: A Sala Final / Câmara do Chefe do Gate (Rank C, Lv 10 Boss gerenciado pelo BossService)
    ["hellhound-2", createEnemyInstance("hellhound-2", "hellhound", 8, { x: 38, y: 11 })],
    ["starspawn-2", createEnemyInstance("starspawn-2", "starspawn", 9, { x: 38, y: 16 })],

    // GATE D — Cidadela Carmesim (mapa próprio, níveis 12–15, superior ao chefe lv 10 do Gate E)
    ["ash-1", createEnemyInstance("ash-1", "ashguard", 12, { x: 15, y: 9 }, "GATE_D")],
    ["ash-2", createEnemyInstance("ash-2", "ashguard", 13, { x: 16, y: 13 }, "GATE_D")],
    ["brass-1", createEnemyInstance("brass-1", "brasshound", 14, { x: 19, y: 8 }, "GATE_D")],
    ["rune-1", createEnemyInstance("rune-1", "runeblade", 14, { x: 25, y: 9 }, "GATE_D")],
    ["rune-2", createEnemyInstance("rune-2", "runeblade", 15, { x: 27, y: 13 }, "GATE_D")],

    // GATE C — Fenda Glacial de Niflheim (Rank C, Lv 20–26)
    ["frostwolf-1", createEnemyInstance("frostwolf-1", "frostwolf", 20, { x: 18, y: 10 }, "GATE_C")],
    ["frostwolf-2", createEnemyInstance("frostwolf-2", "frostwolf", 21, { x: 22, y: 14 }, "GATE_C")],
    ["frostgolem-1", createEnemyInstance("frostgolem-1", "frostgolem", 24, { x: 28, y: 11 }, "GATE_C")],
    ["icespecter-1", createEnemyInstance("icespecter-1", "icespecter", 26, { x: 35, y: 13 }, "GATE_C")],

    // GATE B — Necrópole das Sombras (Rank B, Lv 34–45)
    ["deathknight-1", createEnemyInstance("deathknight-1", "deathknight", 34, { x: 20, y: 12 }, "GATE_B")],
    ["ghoul-1", createEnemyInstance("ghoul-1", "ghoul_lord", 38, { x: 25, y: 16 }, "GATE_B")],
    ["deathknight-2", createEnemyInstance("deathknight-2", "deathknight", 40, { x: 31, y: 10 }, "GATE_B")],
    ["shadowlich-1", createEnemyInstance("shadowlich-1", "shadowlich", 45, { x: 38, y: 14 }, "GATE_B")],

    // GATE A — Calamidade Vulcânica (Rank A, Lv 54–70)
    ["magma-1", createEnemyInstance("magma-1", "magma_drake", 54, { x: 22, y: 12 }, "GATE_A")],
    ["behemoth-1", createEnemyInstance("behemoth-1", "fire_behemoth", 60, { x: 28, y: 17 }, "GATE_A")],
    ["flame-1", createEnemyInstance("flame-1", "flame_serpent", 65, { x: 35, y: 11 }, "GATE_A")],
    ["magma-2", createEnemyInstance("magma-2", "magma_drake", 70, { x: 42, y: 15 }, "GATE_A")],

    // GATE S — Templo dos Deuses Antigos (Rank S, Lv 82–105)
    ["guardian-1", createEnemyInstance("guardian-1", "temple_guardian", 82, { x: 24, y: 13 }, "GATE_S")],
    ["winged-1", createEnemyInstance("winged-1", "winged_executioner", 90, { x: 31, y: 18 }, "GATE_S")],
    ["ruin-1", createEnemyInstance("ruin-1", "ruin_priest", 100, { x: 39, y: 12 }, "GATE_S")],
    ["guardian-2", createEnemyInstance("guardian-2", "temple_guardian", 105, { x: 46, y: 16 }, "GATE_S")],

    // GATE SS — Fenda Cósmica (Rank SS, Lv 118–135)
    ["stareater-1", createEnemyInstance("stareater-1", "stareater", 118, { x: 26, y: 14 }, "GATE_SS")],
    ["void-abom-1", createEnemyInstance("void-abom-1", "void_abomination", 126, { x: 34, y: 20 }, "GATE_SS")],
    ["stareater-2", createEnemyInstance("stareater-2", "stareater", 135, { x: 46, y: 13 }, "GATE_SS")],

    // GATE SSS — Trono do Monarca das Sombras (Rank SSS/SSS+, Lv 150–175)
    ["igris-1", createEnemyInstance("igris-1", "shadow_commander", 152, { x: 28, y: 15 }, "GATE_SSS")],
    ["beru-1", createEnemyInstance("beru-1", "shadow_beru", 164, { x: 38, y: 21 }, "GATE_SSS")],
    ["bellion-1", createEnemyInstance("bellion-1", "shadow_bellion", 175, { x: 50, y: 14 }, "GATE_SSS")]
  ];
}
