import type { TileCoord, WorldId, WorldStyle } from "@rpg/contracts";

/**
 * Definições dos Mundos e Gates do Hunter RPG.
 * Cada Gate de rank é um grid próprio: limites espaciais, obstáculos e estilo visual
 * não são biomas divididos no mesmo mapa, mas mundos independentes.
 *
 * GATE_E: Santuário do Gate & Masmorra das Sombras (48x28, Rank E, 5 setores)
 * GATE_D: Cidadela Carmesim (32x20, Rank D, 3 naves monumentais com o Chefe Sentinela)
 */

export const GATE_D_WIDTH = 32;
export const GATE_D_HEIGHT = 20;

/** Ponto de spawn ao ingressar na Cidadela Carmesim */
export const GATE_D_SPAWN: TileCoord = { x: 3, y: 9 };

/** Portal de retorno ao Santuário dos NPCs (Gate E) dentro da Cidadela */
export const GATE_D_RETURN: TileCoord = { x: 3, y: 4 };

/** Portal do Chefe (no final do Salão do Trono) para retorno rápido ao Santuário */
export const GATE_D_BOSS_PORTAL: TileCoord = { x: 29, y: 10 };

export interface WorldGeometry {
  id: WorldId;
  style: WorldStyle;
  width: number;
  height: number;
  spawn: TileCoord;
  obstacles: readonly TileCoord[];
}

function columnWall(x: number, height: number, openY: readonly number[]): TileCoord[] {
  const open = new Set(openY);
  const tiles: TileCoord[] = [];
  for (let y = 0; y < height; y++) {
    if (!open.has(y)) tiles.push({ x, y });
  }
  return tiles;
}

export const GATE_D_OBSTACLES: readonly TileCoord[] = [
  // Muralha 1 dividindo Átrio Carmesim e Galeria (abertura central em y=8,9,10,11)
  ...columnWall(10, GATE_D_HEIGHT, [8, 9, 10, 11]),

  // Muralha 2 dividindo Galeria e Salão do Trono (abertura central em y=8,9,10,11)
  ...columnWall(22, GATE_D_HEIGHT, [8, 9, 10, 11]),

  // Pilares do Átrio Carmesim
  { x: 5, y: 4 },
  { x: 8, y: 4 },
  { x: 5, y: 15 },
  { x: 8, y: 15 },

  // Pilares da Galeria de Latão e Cinzas
  { x: 14, y: 5 },
  { x: 18, y: 5 },
  { x: 14, y: 14 },
  { x: 18, y: 14 },

  // Pilares do Salão do Trono da Sentinela
  { x: 25, y: 4 },
  { x: 28, y: 4 },
  { x: 25, y: 15 },
  { x: 28, y: 15 }
];

export const GATE_D_WORLD: WorldGeometry = {
  id: "GATE_D",
  style: "CRIMSON_CITADEL",
  width: GATE_D_WIDTH,
  height: GATE_D_HEIGHT,
  spawn: GATE_D_SPAWN,
  obstacles: GATE_D_OBSTACLES
};
