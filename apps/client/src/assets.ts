import Phaser from "phaser";
import type { HunterClass } from "@rpg/contracts";

/**
 * Assets do jogo.
 *  - Retratos: vindos das imagens enviadas (public/assets/portraits, fundo já removido).
 *  - Tiles, monstros, portal, partículas e vinheta: gerados proceduralmente aqui (arte original,
 *    sem arquivos extras), então escalam com tileSize e não dependem de nenhum download.
 */

const BASE = import.meta.env.BASE_URL;

export const PORTRAIT_FILES = {
  healer: "portraits/healer.png",
  assassin: "portraits/assassin.png",
  warrior: "portraits/warrior.png",
  mage: "portraits/mage.png",
  jinwoo_front: "portraits/assassin.png",
  jinwoo_back: "portraits/mage.png",
  bruiser: "portraits/warrior.png",
  director: "portraits/healer.png"
} as const;
export type PortraitKey = keyof typeof PORTRAIT_FILES;

/** Qual retrato representa cada classe. */
export const CLASS_PORTRAIT: Record<HunterClass, PortraitKey> = {
  BATTLE_HEALER: "healer",
  ASSASSIN: "assassin",
  WARRIOR: "warrior",
  MAGE: "mage"
};

export const portraitUrl = (key: PortraitKey) => `${BASE}assets/${PORTRAIT_FILES[key]}`;
export const portraitTokenUrl = (key: PortraitKey) =>
  `${BASE}assets/portraits/${key}_token.png`;
export const GUILD_BANNER_URL = `${BASE}assets/portraits/guild_banner.jpg`;

export const TEX = {
  floor: (i: number) => `floor_${i}`,
  wall: "wall",
  wallTop: "wall_top",
  wallMid: "wall_mid",
  wallBase: "wall_base",
  pillar: "pillar",
  slime: "enemy_slime",
  goblin: "enemy_goblin",
  wolf: "enemy_wolf",
  larva: "enemy_larva",
  sprout: "enemy_sprout",
  ember: "enemy_ember",
  voidling: "enemy_voidling",
  frostbat: "enemy_frostbat",
  hellhound: "enemy_hellhound",
  starspawn: "enemy_starspawn",
  boss: "enemy_boss",
  mote: "mote",
  vignette: "vignette",
  portal: "portal",
  token: (key: PortraitKey) => `token_${key}`
} as const;

export function enemyTextureKey(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("chefe") || n.includes("boss")) return TEX.boss;
  if (n.includes("slime")) return TEX.slime;
  if (n.includes("goblin")) return TEX.goblin;
  if (n.includes("larva")) return TEX.larva;
  if (n.includes("sprout") || n.includes("thorn")) return TEX.sprout;
  if (n.includes("ember") || n.includes("imp")) return TEX.ember;
  if (n.includes("void")) return TEX.voidling;
  if (n.includes("frost") || n.includes("bat")) return TEX.frostbat;
  if (n.includes("hell") || n.includes("hound")) return TEX.hellhound;
  if (n.includes("star") || n.includes("spawn")) return TEX.starspawn;
  if (n.includes("wolf")) return TEX.wolf;
  return TEX.slime;
}

/** Bioma por coordenada do tile no mundo 48x28 — dá cor e clima às 5 salas. */
export function biomeAt(x: number, y: number): number {
  // 0 swamp (gate), 1 nature, 2 crypt, 3 hell, 4 space, 5 frost
  if (x <= 15) {
    if (y <= 6) return 0; // Santuário do Gate (bruma e pântano místico)
    if (y <= 13) return 1; // Ruínas com musgo
    return 3; // Sala 3: Covil das feras / Fenda vulcânica
  }
  if (x <= 31) {
    if (y <= 13) {
      return x >= 24 ? 5 : 2; // Sala 2: Catacumbas geladas e cripta de pedra
    }
    return 4; // Sala 4: Abismo dimensional / Void cósmico
  }
  // Sala 5 (x >= 32): A Sala Final / Câmara do Chefe do Gate
  return y >= 10 && y <= 16 ? 3 : 2; // Cripta imperial com braseiros
}

export const BIOME_NAMES: Record<number, string> = {
  0: "Santuário do Gate",
  1: "Ruínas Esquecidas",
  2: "Catacumbas Antigas",
  3: "Covil Vulcânico",
  4: "Abismo Dimensional",
  5: "Câmara de Gelo"
};

/** Cores de destaque por bioma (para UI / banner) */
export const BIOME_ACCENT: Record<number, string> = {
  0: "#34d399", // verde místico
  1: "#4ade80", // natureza
  2: "#60a5fa", // cripta azul
  3: "#f97316", // fogo
  4: "#a78bfa", // void
  5: "#7dd3fc"  // gelo
};

/** Enfileira os PNGs no loader. */
export function preloadAssets(scene: Phaser.Scene) {
  (Object.keys(PORTRAIT_FILES) as PortraitKey[]).forEach((k) => {
    scene.load.image(TEX.token(k), portraitTokenUrl(k));
  });
}

function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gera todas as texturas procedurais. Chamar uma vez, depois do preload. */
export function buildTextures(scene: Phaser.Scene, tile: number) {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const T = tile;

  // ---- Pisos por bioma (6 temas: swamp, nature, crypt, hell, space, frost) ----
  const biomePalettes = [
    // 0 swamp / Santuário — bruma mística verde-água mais luminosa
    { base: 0x0f241c, noise: 0x143028, crack: 0x0a1c14, edge: 0x2a5a42, hi: 0x3a7a58 },
    // 1 nature / Ruínas — musgo vivo e terra fértil
    { base: 0x1a2e1e, noise: 0x223c28, crack: 0x122018, edge: 0x3a6a42, hi: 0x4a8a52 },
    // 2 crypt / Catacumbas — pedra azulada com toques de runas
    { base: 0x141e32, noise: 0x1a283c, crack: 0x0c1624, edge: 0x2a3e5a, hi: 0x3a5278 },
    // 3 hell / Covil Vulcânico — carvão quente + brasa viva
    { base: 0x221010, noise: 0x2c1814, crack: 0x180c0c, edge: 0x5a2820, hi: 0x7a3a28 },
    // 4 space / Abismo Dimensional — violeta cósmico com brilho
    { base: 0x12102a, noise: 0x1a1838, crack: 0x0c0a20, edge: 0x3a2e70, hi: 0x4a48a0 },
    // 5 frost / Câmara de Gelo — gelo cristalino mais claro
    { base: 0x122028, noise: 0x1a2c38, crack: 0x0c1820, edge: 0x3a5a70, hi: 0x4a7a90 }
  ];
  for (let v = 0; v < 6; v++) {
    const r = rng(1000 + v * 77);
    const p = biomePalettes[v];
    g.clear();
    g.fillStyle(p.base, 1).fillRect(0, 0, T, T);
    for (let i = 0; i < 28; i++) {
      const shade = p.noise + Math.floor(r() * 0x08) * 0x010101;
      g.fillStyle(shade, 1).fillRect(Math.floor(r() * T), Math.floor(r() * T), 2 + Math.floor(r() * 6), 2 + Math.floor(r() * 4));
    }
    if (v !== 0) {
      g.lineStyle(1, p.crack, 0.85).beginPath();
      let cx = r() * T, cy = r() * T * 0.3;
      g.moveTo(cx, cy);
      for (let s = 0; s < 4; s++) {
        cx += (r() - 0.4) * 12;
        cy += 6 + r() * 6;
        g.lineTo(cx, cy);
      }
      g.strokePath();
    }
    // detalhes de bioma
    if (v === 1) { // folhas
      g.fillStyle(0x3d8b4f, 0.35).fillCircle(r() * T, r() * T, 2 + r() * 2);
      g.fillStyle(0x2d6b3f, 0.3).fillCircle(r() * T, r() * T, 1.5 + r() * 2);
    }
    if (v === 3) { // brasas
      g.fillStyle(0xf97316, 0.4).fillCircle(8 + r() * (T - 16), 8 + r() * (T - 16), 1.5);
      g.fillStyle(0xef4444, 0.3).fillCircle(8 + r() * (T - 16), 8 + r() * (T - 16), 1.2);
    }
    if (v === 4) { // estrelas
      g.fillStyle(0xa78bfa, 0.5).fillCircle(r() * T, r() * T, 1);
      g.fillStyle(0xc4b5fd, 0.4).fillCircle(r() * T, r() * T, 0.8);
    }
    if (v === 5) { // gelo
      g.fillStyle(0x7dd3fc, 0.2).fillRect(r() * T, r() * T, 3 + r() * 4, 1);
    }
    g.lineStyle(1, p.edge, 0.9).strokeRect(0.5, 0.5, T - 1, T - 1);
    g.lineStyle(1, p.hi, 0.4).lineBetween(1, 1, T - 1, 1);
    g.lineStyle(1, 0x04060c, 0.6).lineBetween(1, T - 1, T - 1, T - 1);
    g.generateTexture(TEX.floor(v), T, T);
  }

  // ---- 1. Topo da Muralha (Crest / Battlement Capstone) ----
  g.clear();
  g.fillStyle(0x18202c, 1).fillRect(0, 0, T, T);
  g.fillStyle(0x334155, 1).fillRect(0, 0, T, 16);
  g.fillStyle(0x64748b, 0.9).fillRect(0, 0, T, 2);
  g.fillStyle(0x475569, 0.7).fillRect(0, 2, T, 3);
  g.fillStyle(0x0a0f18, 1).fillRect(0, 15, T, 3);
  g.fillStyle(0x1e293b, 1).fillRect(1, 18, T - 2, T - 18);
  g.fillStyle(0x0f172a, 1).fillRect(T / 2 - 1, 18, 2, T - 18);
  g.fillStyle(0x384a62, 0.5).fillRect(1, 18, T / 2 - 2, 1);
  g.fillStyle(0x384a62, 0.5).fillRect(T / 2 + 1, 18, T / 2 - 2, 1);
  g.generateTexture(TEX.wallTop, T, T);

  // ---- 2. Meio da Muralha ----
  g.clear();
  g.fillStyle(0x18202c, 1).fillRect(0, 0, T, T);
  g.fillStyle(0x1e293b, 1).fillRect(1, 0, T - 2, 23);
  g.fillStyle(0x0f172a, 1).fillRect(11, 0, 2, 23);
  g.fillStyle(0x0f172a, 1).fillRect(35, 0, 2, 23);
  g.fillStyle(0x2e3f53, 0.5).fillRect(1, 0, 10, 1);
  g.fillStyle(0x2e3f53, 0.5).fillRect(13, 0, 22, 1);
  g.fillStyle(0x2e3f53, 0.5).fillRect(37, 0, 10, 1);
  g.fillStyle(0x0a0f18, 1).fillRect(0, 23, T, 2);
  g.fillStyle(0x16202c, 1).fillRect(1, 25, T - 2, 23);
  g.fillStyle(0x090d16, 1).fillRect(T / 2 - 1, 25, 2, 23);
  g.fillStyle(0x2e3f53, 0.45).fillRect(1, 25, T / 2 - 2, 1);
  g.fillStyle(0x2e3f53, 0.45).fillRect(T / 2 + 1, 25, T / 2 - 2, 1);
  g.generateTexture(TEX.wallMid, T, T);

  // ---- 3. Base da Muralha ----
  g.clear();
  g.fillStyle(0x000000, 0.6).fillRect(0, T - 5, T, 5);
  g.fillStyle(0x18202c, 1).fillRect(0, 0, T, T - 3);
  g.fillStyle(0x16202c, 1).fillRect(1, 0, T - 2, 38);
  g.fillStyle(0x090d16, 1).fillRect(T / 2 - 1, 0, 2, 38);
  g.fillStyle(0x2e3f53, 0.45).fillRect(1, 0, T / 2 - 2, 1);
  g.fillStyle(0x2e3f53, 0.45).fillRect(T / 2 + 1, 0, T / 2 - 2, 1);
  g.fillStyle(0x223042, 1).fillRect(0, 38, T, 6);
  g.fillStyle(0x384a62, 0.7).fillRect(0, 38, T, 1);
  g.fillStyle(0x090d16, 1).fillRect(0, 44, T, 2);
  g.generateTexture(TEX.wallBase, T, T);

  // ---- 4. Bloco de Muralha Padrão ----
  g.clear();
  g.fillStyle(0x000000, 0.55).fillRect(0, T - 4, T, 4);
  g.fillStyle(0x18202c, 1).fillRect(0, 0, T, T - 2);
  g.fillStyle(0x334155, 1).fillRect(0, 0, T, 16);
  g.fillStyle(0x64748b, 0.9).fillRect(0, 0, T, 2);
  g.fillStyle(0x475569, 0.7).fillRect(0, 2, T, 3);
  g.fillStyle(0x0a0f18, 1).fillRect(0, 15, T, 3);
  g.fillStyle(0x1e293b, 1).fillRect(1, 18, T - 2, 26);
  g.fillStyle(0x0f172a, 1).fillRect(T / 2 - 1, 18, 2, 26);
  g.fillStyle(0x223042, 1).fillRect(0, 40, T, 4);
  g.generateTexture(TEX.wall, T, T);

  // ---- Pilar Monolítico ----
  g.clear();
  g.fillStyle(0x000000, 0.5).fillEllipse(T / 2, T - 4, T * 0.9, 12);
  g.fillStyle(0x1e293b, 1).fillRoundedRect(3, T - 16, T - 6, 14, 2);
  g.fillStyle(0x334155, 1).fillRect(3, T - 16, T - 6, 2);
  g.fillStyle(0x253346, 1).fillRect(7, 8, T - 14, T - 22);
  g.fillStyle(0x384a62, 0.8).fillRect(9, 8, 4, T - 22);
  g.fillStyle(0x16202c, 0.8).fillRect(T - 13, 8, 4, T - 22);
  g.fillStyle(0x334155, 1).fillRoundedRect(4, 2, T - 8, 8, 2);
  g.fillStyle(0x64748b, 0.9).fillRect(4, 2, T - 8, 2);
  g.lineStyle(2, 0x0284c7, 0.85).strokeCircle(T / 2, T / 2 - 2, 7);
  g.lineStyle(2, 0x38bdf8, 0.95).lineBetween(T / 2, T / 2 - 10, T / 2, T / 2 + 6);
  g.fillStyle(0x7dd3fc, 1).fillCircle(T / 2, T / 2 - 2, 2.5);
  g.generateTexture(TEX.pillar, T, T);

  // ---- Slime ----
  g.clear();
  g.fillStyle(0x000000, 0.35).fillEllipse(T / 2, T - 6, T * 0.7, 10);
  g.fillStyle(0x22c55e, 1).fillEllipse(T / 2, T / 2 + 4, T * 0.62, T * 0.5);
  g.fillStyle(0x4ade80, 0.9).fillEllipse(T / 2 - 4, T / 2 - 2, T * 0.28, T * 0.22);
  g.fillStyle(0x166534, 1).fillCircle(T / 2 - 8, T / 2 + 2, 3);
  g.fillStyle(0x166534, 1).fillCircle(T / 2 + 8, T / 2 + 2, 3);
  g.fillStyle(0xf8fafc, 1).fillCircle(T / 2 - 7, T / 2 + 1, 1.2);
  g.fillStyle(0xf8fafc, 1).fillCircle(T / 2 + 9, T / 2 + 1, 1.2);
  g.fillStyle(0x86efac, 0.5).fillEllipse(T / 2, T / 2 + 14, T * 0.2, 6);
  g.generateTexture(TEX.slime, T, T);

  // ---- Goblin ----
  g.clear();
  g.fillStyle(0x000000, 0.4).fillEllipse(T / 2, T - 5, T * 0.55, 9);
  g.fillStyle(0x3f6212, 1).fillTriangle(T / 2 - 12, T / 2 - 2, T / 2 - 18, T / 2 - 14, T / 2 - 6, T / 2);
  g.fillTriangle(T / 2 + 12, T / 2 - 2, T / 2 + 18, T / 2 - 14, T / 2 + 6, T / 2);
  g.fillStyle(0x4d7c0f, 1).fillCircle(T / 2, T / 2 - 2, 11);
  g.fillStyle(0x365314, 1).fillRoundedRect(T / 2 - 9, T / 2 + 6, 18, 14, 4);
  g.fillStyle(0xef4444, 1).fillCircle(T / 2 - 4, T / 2 - 4, 2.5);
  g.fillStyle(0xef4444, 1).fillCircle(T / 2 + 4, T / 2 - 4, 2.5);
  g.fillStyle(0xf8fafc, 1).fillTriangle(T / 2 - 3, T / 2 + 2, T / 2 - 1, T / 2 - 1, T / 2, T / 2 + 2);
  g.fillTriangle(T / 2, T / 2 + 2, T / 2 + 1, T / 2 - 1, T / 2 + 3, T / 2 + 2);
  g.generateTexture(TEX.goblin, T, T);

  // ---- Wolf ----
  g.clear();
  g.fillStyle(0x000000, 0.4).fillEllipse(T / 2, T - 5, T * 0.7, 9);
  g.fillStyle(0x57534e, 1).fillEllipse(T / 2, T / 2 + 4, T * 0.55, T * 0.38);
  g.fillStyle(0x78716c, 1).fillEllipse(T / 2 + 10, T / 2 - 4, T * 0.28, T * 0.22);
  g.fillStyle(0x44403c, 1).fillTriangle(T / 2 + 4, T / 2 - 10, T / 2 + 2, T / 2 - 18, T / 2 + 12, T / 2 - 8);
  g.fillTriangle(T / 2 + 16, T / 2 - 8, T / 2 + 20, T / 2 - 16, T / 2 + 10, T / 2 - 6);
  g.fillStyle(0xf87171, 1).fillCircle(T / 2 + 12, T / 2 - 6, 1.8);
  g.fillStyle(0xf8fafc, 1).fillCircle(T / 2 + 14, T / 2 - 2, 1.5);
  g.generateTexture(TEX.wolf, T, T);

  // ---- Larva ----
  g.clear();
  g.fillStyle(0x000000, 0.3).fillEllipse(T / 2, T - 6, T * 0.6, 8);
  g.fillStyle(0xa3e635, 1).fillEllipse(T / 2, T / 2 + 2, T * 0.55, T * 0.4);
  g.fillStyle(0x65a30d, 0.8).fillEllipse(T / 2 - 6, T / 2, T * 0.18, T * 0.28);
  g.fillStyle(0x65a30d, 0.8).fillEllipse(T / 2 + 6, T / 2, T * 0.18, T * 0.28);
  g.fillStyle(0x1a2e05, 1).fillCircle(T / 2 - 5, T / 2 - 4, 2);
  g.fillStyle(0x1a2e05, 1).fillCircle(T / 2 + 5, T / 2 - 4, 2);
  g.generateTexture(TEX.larva, T, T);

  // ---- Sprout / Thorn ----
  g.clear();
  g.fillStyle(0x000000, 0.3).fillEllipse(T / 2, T - 5, T * 0.5, 8);
  g.fillStyle(0x15803d, 1).fillTriangle(T / 2, T / 2 - 16, T / 2 - 10, T / 2 + 10, T / 2 + 10, T / 2 + 10);
  g.fillStyle(0x22c55e, 1).fillTriangle(T / 2, T / 2 - 8, T / 2 - 6, T / 2 + 8, T / 2 + 6, T / 2 + 8);
  g.fillStyle(0x14532d, 1).fillRect(T / 2 - 2, T / 2 + 4, 4, 12);
  g.fillStyle(0xfbbf24, 1).fillCircle(T / 2, T / 2 - 4, 3);
  g.generateTexture(TEX.sprout, T, T);

  // ---- Ember / Imp ----
  g.clear();
  g.fillStyle(0x000000, 0.35).fillEllipse(T / 2, T - 5, T * 0.5, 8);
  g.fillStyle(0xea580c, 1).fillCircle(T / 2, T / 2 + 2, 12);
  g.fillStyle(0xf97316, 1).fillCircle(T / 2 - 2, T / 2 - 2, 8);
  g.fillStyle(0xfde68a, 0.9).fillCircle(T / 2 - 1, T / 2 - 4, 4);
  g.fillStyle(0x7f1d1d, 1).fillCircle(T / 2 - 5, T / 2, 2);
  g.fillStyle(0x7f1d1d, 1).fillCircle(T / 2 + 4, T / 2, 2);
  g.fillStyle(0xfbbf24, 0.7).fillTriangle(T / 2, T / 2 - 14, T / 2 - 4, T / 2 - 6, T / 2 + 4, T / 2 - 6);
  g.generateTexture(TEX.ember, T, T);

  // ---- Voidling ----
  g.clear();
  g.fillStyle(0x000000, 0.4).fillEllipse(T / 2, T - 5, T * 0.55, 8);
  g.fillStyle(0x4c1d95, 1).fillCircle(T / 2, T / 2, 13);
  g.fillStyle(0x7c3aed, 0.85).fillCircle(T / 2 - 3, T / 2 - 3, 8);
  g.fillStyle(0xc4b5fd, 1).fillCircle(T / 2 - 4, T / 2 - 4, 2.5);
  g.fillStyle(0xc4b5fd, 1).fillCircle(T / 2 + 5, T / 2 - 2, 2);
  g.fillStyle(0x1e1b4b, 0.6).fillEllipse(T / 2, T / 2 + 6, 10, 5);
  g.generateTexture(TEX.voidling, T, T);

  // ---- Frostbat ----
  g.clear();
  g.fillStyle(0x000000, 0.3).fillEllipse(T / 2, T - 4, T * 0.6, 7);
  g.fillStyle(0x0ea5e9, 0.85).fillTriangle(T / 2 - 4, T / 2, T / 2 - 20, T / 2 - 8, T / 2 - 6, T / 2 + 6);
  g.fillTriangle(T / 2 + 4, T / 2, T / 2 + 20, T / 2 - 8, T / 2 + 6, T / 2 + 6);
  g.fillStyle(0x38bdf8, 1).fillEllipse(T / 2, T / 2 + 2, 12, 10);
  g.fillStyle(0xe0f2fe, 1).fillCircle(T / 2 - 3, T / 2, 2);
  g.fillStyle(0xe0f2fe, 1).fillCircle(T / 2 + 3, T / 2, 2);
  g.fillStyle(0x0c4a6e, 1).fillCircle(T / 2 - 3, T / 2, 0.8);
  g.fillStyle(0x0c4a6e, 1).fillCircle(T / 2 + 3, T / 2, 0.8);
  g.generateTexture(TEX.frostbat, T, T);

  // ---- Hellhound ----
  g.clear();
  g.fillStyle(0x000000, 0.45).fillEllipse(T / 2, T - 5, T * 0.7, 9);
  g.fillStyle(0x7f1d1d, 1).fillEllipse(T / 2, T / 2 + 4, T * 0.55, T * 0.36);
  g.fillStyle(0x991b1b, 1).fillEllipse(T / 2 + 10, T / 2 - 2, T * 0.26, T * 0.2);
  g.fillStyle(0x450a0a, 1).fillTriangle(T / 2 + 4, T / 2 - 8, T / 2 + 2, T / 2 - 16, T / 2 + 12, T / 2 - 6);
  g.fillTriangle(T / 2 + 16, T / 2 - 6, T / 2 + 18, T / 2 - 14, T / 2 + 10, T / 2 - 4);
  g.fillStyle(0xfbbf24, 1).fillCircle(T / 2 + 12, T / 2 - 4, 1.8);
  g.fillStyle(0xf97316, 0.7).fillEllipse(T / 2 - 4, T / 2 + 10, 8, 4);
  g.generateTexture(TEX.hellhound, T, T);

  // ---- Starspawn ----
  g.clear();
  g.fillStyle(0x000000, 0.35).fillEllipse(T / 2, T - 5, T * 0.55, 8);
  g.fillStyle(0x312e81, 1).fillCircle(T / 2, T / 2, 12);
  g.fillStyle(0x6366f1, 0.9).fillCircle(T / 2 - 2, T / 2 - 2, 7);
  g.fillStyle(0xa5b4fc, 1).fillCircle(T / 2 - 3, T / 2 - 3, 2);
  g.fillStyle(0xa5b4fc, 1).fillCircle(T / 2 + 4, T / 2 - 1, 1.5);
  g.fillStyle(0xf5f3ff, 1).fillCircle(T / 2, T / 2, 3);
  g.generateTexture(TEX.starspawn, T, T);

  // ---- Partícula (poeira de mana) ----
  g.clear();
  g.fillStyle(0x7dd3fc, 0.25).fillCircle(5, 5, 5);
  g.fillStyle(0xbae6fd, 0.9).fillCircle(5, 5, 2);
  g.generateTexture(TEX.mote, 10, 10);

  // ---- Chefe Goblin do Gate (Rank C Boss) ----
  g.clear();
  g.fillStyle(0x000000, 0.5).fillEllipse(T / 2, T - 6, T * 0.85, 12);
  g.fillStyle(0x7f1d1d, 0.25).fillCircle(T / 2, T / 2, T * 0.45);
  g.fillStyle(0x1e293b, 1).fillTriangle(T / 2 - 20, T / 2, T / 2 - 8, T / 2 - 14, T / 2 - 6, T / 2 + 4);
  g.fillTriangle(T / 2 + 20, T / 2, T / 2 + 8, T / 2 - 14, T / 2 + 6, T / 2 + 4);
  g.fillStyle(0x475569, 1).fillTriangle(T / 2 - 18, T / 2 - 2, T / 2 - 8, T / 2 - 12, T / 2 - 7, T / 2 + 2);
  g.fillTriangle(T / 2 + 18, T / 2 - 2, T / 2 + 8, T / 2 - 12, T / 2 + 7, T / 2 + 2);
  g.fillStyle(0x0f172a, 1).fillRoundedRect(T / 2 - 12, T / 2 + 2, 24, 18, 4);
  g.fillStyle(0x991b1b, 0.8).fillRect(T / 2 - 3, T / 2 + 4, 6, 12);
  g.fillStyle(0x365314, 1).fillTriangle(T / 2 - 14, T / 2 - 8, T / 2 - 24, T / 2 - 18, T / 2 - 11, T / 2 + 1);
  g.fillTriangle(T / 2 + 14, T / 2 - 8, T / 2 + 24, T / 2 - 18, T / 2 + 11, T / 2 + 1);
  g.fillStyle(0x4d7c0f, 1).fillCircle(T / 2, T / 2 - 6, 14);
  g.fillStyle(0xb45309, 1).fillTriangle(T / 2 - 10, T / 2 - 16, T / 2 - 16, T / 2 - 24, T / 2 - 4, T / 2 - 16);
  g.fillTriangle(T / 2 + 10, T / 2 - 16, T / 2 + 16, T / 2 - 24, T / 2 + 4, T / 2 - 16);
  g.fillStyle(0xf59e0b, 1).fillRect(T / 2 - 8, T / 2 - 18, 16, 5);
  g.fillStyle(0xef4444, 1).fillCircle(T / 2 - 5, T / 2 - 8, 3.5).fillCircle(T / 2 + 5, T / 2 - 8, 3.5);
  g.fillStyle(0xfef08a, 1).fillCircle(T / 2 - 4.5, T / 2 - 8, 1.5).fillCircle(T / 2 + 5.5, T / 2 - 8, 1.5);
  g.fillStyle(0xf8fafc, 1).fillTriangle(T / 2 - 4, T / 2 - 1, T / 2 - 2, T / 2 - 5, T / 2, T / 2 - 1);
  g.fillTriangle(T / 2, T / 2 - 1, T / 2 + 2, T / 2 - 5, T / 2 + 4, T / 2 - 1);
  g.generateTexture(TEX.boss, T, T);

  // ---- Portal do Gate (anel místico) ----
  g.clear();
  g.lineStyle(3, 0x38bdf8, 0.95).strokeCircle(T / 2, T / 2, T * 0.38);
  g.lineStyle(2, 0xa855f7, 0.9).strokeCircle(T / 2, T / 2, T * 0.28);
  g.fillStyle(0x38bdf8, 0.12).fillCircle(T / 2, T / 2, T * 0.36);
  g.generateTexture(TEX.portal, T, T);

  g.destroy();
}

/** Vinheta radial para dar clima de masmorra. */
export function addVignette(scene: Phaser.Scene, w: number, h: number) {
  if (!scene.textures.exists(TEX.vignette)) {
    const tex = scene.textures.createCanvas(TEX.vignette, w, h);
    if (tex) {
      const ctx = tex.getContext();
      const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, Math.max(w, h) * 0.65);
      grad.addColorStop(0, "rgba(2,4,10,0)");
      grad.addColorStop(1, "rgba(2,4,10,0.78)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      tex.refresh();
    }
  }
  return scene.add.image(w / 2, h / 2, TEX.vignette).setDepth(900);
}
