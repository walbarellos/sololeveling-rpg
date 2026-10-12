import type { TileCoord, WorldId, WorldStyle } from "@rpg/contracts";

/**
 * Definições completas dos Mundos e Gates do Hunter RPG (Solo Leveling).
 * Cada Gate de rank é um mapa próprio com limites, obstáculos, altares e portais seguros.
 */

export interface WorldShrine {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface WorldGeometry {
  id: WorldId;
  style: WorldStyle;
  width: number;
  height: number;
  spawn: TileCoord;
  obstacles: readonly TileCoord[];
  shrines?: readonly WorldShrine[];
}

function columnWall(x: number, height: number, openY: readonly number[]): TileCoord[] {
  const open = new Set(openY);
  const tiles: TileCoord[] = [];
  for (let y = 0; y < height; y++) {
    if (!open.has(y)) tiles.push({ x, y });
  }
  return tiles;
}

function rowWall(y: number, width: number, openX: readonly number[]): TileCoord[] {
  const open = new Set(openX);
  const tiles: TileCoord[] = [];
  for (let x = 0; x < width; x++) {
    if (!open.has(x)) tiles.push({ x, y });
  }
  return tiles;
}

// ---------------------------------------------------------------------------
// GATE D: CIDADELA CARMESIM (Rank D · 44x26)
// ---------------------------------------------------------------------------
export const GATE_D_WIDTH = 44;
export const GATE_D_HEIGHT = 26;
export const GATE_D_SPAWN: TileCoord = { x: 3, y: 9 };
export const GATE_D_RETURN: TileCoord = { x: 3, y: 4 };
export const GATE_D_BOSS_PORTAL: TileCoord = { x: 41, y: 6 };

export const GATE_D_OBSTACLES: readonly TileCoord[] = [
  ...columnWall(12, GATE_D_HEIGHT, [11, 12, 13, 14]),
  ...columnWall(26, GATE_D_HEIGHT, [11, 12, 13, 14]),
  ...columnWall(38, GATE_D_HEIGHT, [5, 6, 7]),
  { x: 5, y: 5 }, { x: 8, y: 5 }, { x: 5, y: 19 }, { x: 8, y: 19 },
  { x: 16, y: 6 }, { x: 21, y: 6 }, { x: 16, y: 18 }, { x: 21, y: 18 },
  { x: 30, y: 6 }, { x: 34, y: 6 }, { x: 30, y: 19 }, { x: 34, y: 19 }
];

export const GATE_D_WORLD: WorldGeometry = {
  id: "GATE_D",
  style: "CRIMSON_CITADEL",
  width: GATE_D_WIDTH,
  height: GATE_D_HEIGHT,
  spawn: GATE_D_SPAWN,
  obstacles: GATE_D_OBSTACLES,
  shrines: [
    { id: "shrine_d1", name: "Altar de Rubi do Átrio", x: 3, y: 15 },
    { id: "shrine_d2", name: "Fonte de Mana de Latão", x: 22, y: 5 }
  ]
};

// ---------------------------------------------------------------------------
// GATE C: FENDA GLACIAL DE NIFLHEIM (Rank C · 48x28)
// ---------------------------------------------------------------------------
export const GATE_C_WIDTH = 48;
export const GATE_C_HEIGHT = 28;
export const GATE_C_SPAWN: TileCoord = { x: 3, y: 9 };
export const GATE_C_RETURN: TileCoord = { x: 3, y: 4 };
export const GATE_C_BOSS_PORTAL: TileCoord = { x: 45, y: 6 };

export const GATE_C_OBSTACLES: readonly TileCoord[] = [
  ...columnWall(14, GATE_C_HEIGHT, [12, 13, 14, 15]),
  ...columnWall(30, GATE_C_HEIGHT, [12, 13, 14, 15]),
  ...columnWall(42, GATE_C_HEIGHT, [5, 6, 7]),
  { x: 6, y: 5 }, { x: 9, y: 5 }, { x: 6, y: 21 }, { x: 9, y: 21 },
  { x: 18, y: 6 }, { x: 24, y: 6 }, { x: 18, y: 20 }, { x: 24, y: 20 },
  { x: 34, y: 6 }, { x: 38, y: 6 }, { x: 34, y: 21 }, { x: 38, y: 21 }
];

export const GATE_C_WORLD: WorldGeometry = {
  id: "GATE_C",
  style: "FROZEN_ABYSS",
  width: GATE_C_WIDTH,
  height: GATE_C_HEIGHT,
  spawn: GATE_C_SPAWN,
  obstacles: GATE_C_OBSTACLES,
  shrines: [
    { id: "shrine_c1", name: "Monólito de Permafrost", x: 4, y: 18 },
    { id: "shrine_c2", name: "Fonte Glacial de Niflheim", x: 28, y: 6 }
  ]
};

// ---------------------------------------------------------------------------
// GATE B: NECRÓPOLE DAS SOMBRAS (Rank B · 52x30)
// ---------------------------------------------------------------------------
export const GATE_B_WIDTH = 52;
export const GATE_B_HEIGHT = 30;
export const GATE_B_SPAWN: TileCoord = { x: 4, y: 10 };
export const GATE_B_RETURN: TileCoord = { x: 4, y: 4 };
export const GATE_B_BOSS_PORTAL: TileCoord = { x: 49, y: 7 };

export const GATE_B_OBSTACLES: readonly TileCoord[] = [
  ...columnWall(16, GATE_B_HEIGHT, [13, 14, 15, 16]),
  ...columnWall(33, GATE_B_HEIGHT, [13, 14, 15, 16]),
  ...columnWall(46, GATE_B_HEIGHT, [6, 7, 8]),
  { x: 7, y: 6 }, { x: 11, y: 6 }, { x: 7, y: 23 }, { x: 11, y: 23 },
  { x: 20, y: 7 }, { x: 27, y: 7 }, { x: 20, y: 22 }, { x: 27, y: 22 },
  { x: 37, y: 7 }, { x: 42, y: 7 }, { x: 37, y: 22 }, { x: 42, y: 22 }
];

export const GATE_B_WORLD: WorldGeometry = {
  id: "GATE_B",
  style: "SHADOW_NECROPOLIS",
  width: GATE_B_WIDTH,
  height: GATE_B_HEIGHT,
  spawn: GATE_B_SPAWN,
  obstacles: GATE_B_OBSTACLES,
  shrines: [
    { id: "shrine_b1", name: "Obelisco das Almas", x: 5, y: 20 },
    { id: "shrine_b2", name: "Cripta de Mana Espectral", x: 32, y: 7 }
  ]
};

// ---------------------------------------------------------------------------
// GATE A: CALAMIDADE VULCÂNICA (Rank A · 56x32)
// ---------------------------------------------------------------------------
export const GATE_A_WIDTH = 56;
export const GATE_A_HEIGHT = 32;
export const GATE_A_SPAWN: TileCoord = { x: 4, y: 11 };
export const GATE_A_RETURN: TileCoord = { x: 4, y: 5 };
export const GATE_A_BOSS_PORTAL: TileCoord = { x: 53, y: 8 };

export const GATE_A_OBSTACLES: readonly TileCoord[] = [
  ...columnWall(18, GATE_A_HEIGHT, [14, 15, 16, 17]),
  ...columnWall(36, GATE_A_HEIGHT, [14, 15, 16, 17]),
  ...columnWall(50, GATE_A_HEIGHT, [7, 8, 9]),
  { x: 8, y: 7 }, { x: 13, y: 7 }, { x: 8, y: 24 }, { x: 13, y: 24 },
  { x: 23, y: 8 }, { x: 30, y: 8 }, { x: 23, y: 23 }, { x: 30, y: 23 },
  { x: 41, y: 8 }, { x: 46, y: 8 }, { x: 41, y: 24 }, { x: 46, y: 24 }
];

export const GATE_A_WORLD: WorldGeometry = {
  id: "GATE_A",
  style: "DRAGON_VOLCANO",
  width: GATE_A_WIDTH,
  height: GATE_A_HEIGHT,
  spawn: GATE_A_SPAWN,
  obstacles: GATE_A_OBSTACLES,
  shrines: [
    { id: "shrine_a1", name: "Fonte de Fogo Vivo", x: 5, y: 22 },
    { id: "shrine_a2", name: "Altar Vulcânico de Obsidiana", x: 34, y: 8 }
  ]
};

// ---------------------------------------------------------------------------
// GATE S: TEMPLO DOS DEUSES ANTIGOS / DOUBLE DUNGEON (Rank S · 60x34)
// ---------------------------------------------------------------------------
export const GATE_S_WIDTH = 60;
export const GATE_S_HEIGHT = 34;
export const GATE_S_SPAWN: TileCoord = { x: 5, y: 12 };
export const GATE_S_RETURN: TileCoord = { x: 5, y: 5 };
export const GATE_S_BOSS_PORTAL: TileCoord = { x: 57, y: 9 };

export const GATE_S_OBSTACLES: readonly TileCoord[] = [
  ...columnWall(20, GATE_S_HEIGHT, [15, 16, 17, 18]),
  ...columnWall(40, GATE_S_HEIGHT, [15, 16, 17, 18]),
  ...columnWall(54, GATE_S_HEIGHT, [8, 9, 10]),
  { x: 9, y: 8 }, { x: 15, y: 8 }, { x: 9, y: 26 }, { x: 15, y: 26 },
  { x: 26, y: 9 }, { x: 34, y: 9 }, { x: 26, y: 25 }, { x: 34, y: 25 },
  { x: 45, y: 9 }, { x: 50, y: 9 }, { x: 45, y: 25 }, { x: 50, y: 25 }
];

export const GATE_S_WORLD: WorldGeometry = {
  id: "GATE_S",
  style: "MONARCH_SANCTUM",
  width: GATE_S_WIDTH,
  height: GATE_S_HEIGHT,
  spawn: GATE_S_SPAWN,
  obstacles: GATE_S_OBSTACLES,
  shrines: [
    { id: "shrine_s1", name: "Altar Sagrado da Aurora", x: 6, y: 24 },
    { id: "shrine_s2", name: "Pilar dos Mandamentos Divinos", x: 38, y: 9 }
  ]
};

// ---------------------------------------------------------------------------
// GATE SS: CALAMIDADE CÓSMICA (Rank SS · 64x36)
// ---------------------------------------------------------------------------
export const GATE_SS_WIDTH = 64;
export const GATE_SS_HEIGHT = 36;
export const GATE_SS_SPAWN: TileCoord = { x: 5, y: 13 };
export const GATE_SS_RETURN: TileCoord = { x: 5, y: 5 };
export const GATE_SS_BOSS_PORTAL: TileCoord = { x: 61, y: 9 };

export const GATE_SS_OBSTACLES: readonly TileCoord[] = [
  ...columnWall(22, GATE_SS_HEIGHT, [16, 17, 18, 19]),
  ...columnWall(44, GATE_SS_HEIGHT, [16, 17, 18, 19]),
  ...columnWall(58, GATE_SS_HEIGHT, [8, 9, 10]),
  { x: 10, y: 9 }, { x: 16, y: 9 }, { x: 10, y: 27 }, { x: 16, y: 27 },
  { x: 28, y: 10 }, { x: 37, y: 10 }, { x: 28, y: 26 }, { x: 37, y: 26 },
  { x: 48, y: 10 }, { x: 54, y: 10 }, { x: 48, y: 26 }, { x: 54, y: 26 }
];

export const GATE_SS_WORLD: WorldGeometry = {
  id: "GATE_SS",
  style: "COSMIC_VOID",
  width: GATE_SS_WIDTH,
  height: GATE_SS_HEIGHT,
  spawn: GATE_SS_SPAWN,
  obstacles: GATE_SS_OBSTACLES,
  shrines: [
    { id: "shrine_ss1", name: "Fóton Cósmico de Cura", x: 6, y: 26 },
    { id: "shrine_ss2", name: "Nebulosa Astral de Mana", x: 42, y: 10 }
  ]
};

// ---------------------------------------------------------------------------
// GATE SSS: TRONO DO MONARCA DAS SOMBRAS (Rank SSS/SSS+ · 68x38)
// ---------------------------------------------------------------------------
export const GATE_SSS_WIDTH = 68;
export const GATE_SSS_HEIGHT = 38;
export const GATE_SSS_SPAWN: TileCoord = { x: 6, y: 14 };
export const GATE_SSS_RETURN: TileCoord = { x: 6, y: 5 };
export const GATE_SSS_BOSS_PORTAL: TileCoord = { x: 65, y: 10 };

export const GATE_SSS_OBSTACLES: readonly TileCoord[] = [
  ...columnWall(24, GATE_SSS_HEIGHT, [17, 18, 19, 20]),
  ...columnWall(48, GATE_SSS_HEIGHT, [17, 18, 19, 20]),
  ...columnWall(62, GATE_SSS_HEIGHT, [9, 10, 11]),
  { x: 11, y: 10 }, { x: 18, y: 10 }, { x: 11, y: 29 }, { x: 18, y: 29 },
  { x: 30, y: 11 }, { x: 40, y: 11 }, { x: 30, y: 28 }, { x: 40, y: 28 },
  { x: 52, y: 11 }, { x: 58, y: 11 }, { x: 52, y: 28 }, { x: 58, y: 28 }
];

export const GATE_SSS_WORLD: WorldGeometry = {
  id: "GATE_SSS",
  style: "SHADOW_THRONE",
  width: GATE_SSS_WIDTH,
  height: GATE_SSS_HEIGHT,
  spawn: GATE_SSS_SPAWN,
  obstacles: GATE_SSS_OBSTACLES,
  shrines: [
    { id: "shrine_sss1", name: "Chama Eterna do Soberano", x: 7, y: 28 },
    { id: "shrine_sss2", name: "Altar da Morte Suprema", x: 46, y: 11 }
  ]
};

export const ALL_GATE_WORLDS: Record<WorldId, WorldGeometry> = {
  GATE_E: {
    id: "GATE_E",
    style: "SANCTUARY",
    width: 48,
    height: 28,
    spawn: { x: 2, y: 2 },
    obstacles: [], // preenchido via DEFAULT_OBSTACLES em game.service
    shrines: [
      { id: "shrine_e1", name: "Fonte de Mana do Santuário", x: 2, y: 4 },
      { id: "shrine_e2", name: "Altar das Sombras", x: 38, y: 15 }
    ]
  },
  GATE_D: GATE_D_WORLD,
  GATE_C: GATE_C_WORLD,
  GATE_B: GATE_B_WORLD,
  GATE_A: GATE_A_WORLD,
  GATE_S: GATE_S_WORLD,
  GATE_SS: GATE_SS_WORLD,
  GATE_SSS: GATE_SSS_WORLD
};
