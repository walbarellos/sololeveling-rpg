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
  jinwoo_front: "portraits/jinwoo_front.png",
  jinwoo_back: "portraits/jinwoo_back.png",
  bruiser: "portraits/bruiser.png",
  director: "portraits/director.png"
} as const;
export type PortraitKey = keyof typeof PORTRAIT_FILES;

/** Qual retrato representa cada classe. */
export const CLASS_PORTRAIT: Record<HunterClass, PortraitKey> = {
  ASSASSIN: "jinwoo_front",
  MAGE: "jinwoo_back",
  WARRIOR: "bruiser",
  BATTLE_HEALER: "director"
};

export const portraitUrl = (key: PortraitKey) => `${BASE}assets/${PORTRAIT_FILES[key]}`;
export const portraitTokenUrl = (key: PortraitKey) =>
  `${BASE}assets/portraits/${key}_token.png`;
export const GUILD_BANNER_URL = `${BASE}assets/portraits/guild_banner.jpg`;

export const TEX = {
  floor: (i: number) => `floor_${i}`,
  pillar: "pillar",
  slime: "enemy_slime",
  goblin: "enemy_goblin",
  wolf: "enemy_wolf",
  mote: "mote",
  vignette: "vignette",
  portal: "portal",
  token: (key: PortraitKey) => `token_${key}`
} as const;

export function enemyTextureKey(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("slime")) return TEX.slime;
  if (n.includes("goblin")) return TEX.goblin;
  return TEX.wolf;
}

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

  // ---- Piso de pedra (3 variações) ----
  for (let v = 0; v < 3; v++) {
    const r = rng(1000 + v * 77);
    g.clear();
    g.fillStyle(0x0d1424, 1).fillRect(0, 0, T, T);
    for (let i = 0; i < 26; i++) {
      const shade = 0x0a1020 + Math.floor(r() * 0x0c) * 0x010101;
      g.fillStyle(shade, 1).fillRect(Math.floor(r() * T), Math.floor(r() * T), 2 + Math.floor(r() * 5), 2 + Math.floor(r() * 3));
    }
    // rachadura
    if (v !== 0) {
      g.lineStyle(1, 0x050810, 0.9).beginPath();
      let cx = r() * T, cy = r() * T * 0.3;
      g.moveTo(cx, cy);
      for (let s = 0; s < 4; s++) {
        cx += (r() - 0.4) * 12;
        cy += 6 + r() * 6;
        g.lineTo(cx, cy);
      }
      g.strokePath();
    }
    // junta e brilho de borda
    g.lineStyle(1, 0x1b2740, 0.9).strokeRect(0.5, 0.5, T - 1, T - 1);
    g.lineStyle(1, 0x22304d, 0.5).lineBetween(1, 1, T - 1, 1);
    g.lineStyle(1, 0x04060c, 0.7).lineBetween(1, T - 1, T - 1, T - 1);
    g.generateTexture(TEX.floor(v), T, T);
  }

  // ---- Pilar com runa azul ----
  g.clear();
  g.fillStyle(0x000000, 0.35).fillEllipse(T / 2, T - 6, T * 0.8, 10);
  g.fillStyle(0x334155, 1).fillRoundedRect(5, 4, T - 10, T - 10, 5);
  g.fillStyle(0x1e293b, 1).fillRoundedRect(8, 7, T - 16, T - 16, 4);
  g.fillStyle(0x475569, 1).fillRect(5, 4, T - 10, 3);
  g.lineStyle(2, 0x38bdf8, 0.9).strokeCircle(T / 2, T / 2, 7);
  g.lineStyle(2, 0x38bdf8, 0.9).lineBetween(T / 2, T / 2 - 11, T / 2, T / 2 + 11);
  g.fillStyle(0x7dd3fc, 1).fillCircle(T / 2, T / 2, 2.5);
  g.generateTexture(TEX.pillar, T, T);

  // ---- Slime ----
  g.clear();
  g.fillStyle(0x000000, 0.35).fillEllipse(T / 2, T - 8, T * 0.7, 9);
  g.fillStyle(0x15803d, 1).fillEllipse(T / 2, T / 2 + 4, T * 0.78, T * 0.62);
  g.fillStyle(0x22c55e, 1).fillEllipse(T / 2, T / 2 + 1, T * 0.7, T * 0.54);
  g.fillStyle(0x86efac, 0.8).fillEllipse(T / 2 - 8, T / 2 - 7, 9, 5);
  g.fillStyle(0x052e16, 1).fillCircle(T / 2 - 6, T / 2 + 1, 3).fillCircle(T / 2 + 6, T / 2 + 1, 3);
  g.fillStyle(0xffffff, 1).fillCircle(T / 2 - 5, T / 2, 1).fillCircle(T / 2 + 7, T / 2, 1);
  g.generateTexture(TEX.slime, T, T);

  // ---- Goblin ----
  g.clear();
  g.fillStyle(0x000000, 0.35).fillEllipse(T / 2, T - 7, T * 0.6, 9);
  g.fillStyle(0x3f2a14, 1).fillRoundedRect(T / 2 - 10, T / 2 + 4, 20, 16, 3); // corpo/couro
  g.fillStyle(0x4d7c0f, 1).fillTriangle(T / 2 - 12, T / 2 - 6, T / 2 - 22, T / 2 - 12, T / 2 - 11, T / 2 + 2); // orelhas
  g.fillTriangle(T / 2 + 12, T / 2 - 6, T / 2 + 22, T / 2 - 12, T / 2 + 11, T / 2 + 2);
  g.fillStyle(0x65a30d, 1).fillCircle(T / 2, T / 2 - 4, 12);
  g.fillStyle(0xfacc15, 1).fillCircle(T / 2 - 5, T / 2 - 6, 3).fillCircle(T / 2 + 5, T / 2 - 6, 3);
  g.fillStyle(0x7f1d1d, 1).fillCircle(T / 2 - 5, T / 2 - 6, 1.3).fillCircle(T / 2 + 5, T / 2 - 6, 1.3);
  g.fillStyle(0x1a2e05, 1).fillRect(T / 2 - 5, T / 2 + 1, 10, 2);
  g.fillStyle(0xe5e7eb, 1).fillTriangle(T / 2 - 3, T / 2 + 3, T / 2 - 1, T / 2 + 3, T / 2 - 2, T / 2 + 6);
  g.generateTexture(TEX.goblin, T, T);

  // ---- Lobo das Sombras ----
  g.clear();
  g.fillStyle(0x000000, 0.35).fillEllipse(T / 2, T - 7, T * 0.75, 9);
  g.fillStyle(0x1e1b3a, 1).fillEllipse(T / 2, T / 2 + 6, T * 0.74, T * 0.4); // corpo
  g.fillStyle(0x312e5c, 1).fillTriangle(T / 2 - 14, T / 2 - 4, T / 2 - 10, T / 2 - 18, T / 2 - 4, T / 2 - 6); // orelhas
  g.fillTriangle(T / 2 + 14, T / 2 - 4, T / 2 + 10, T / 2 - 18, T / 2 + 4, T / 2 - 6);
  g.fillStyle(0x3b3770, 1).fillEllipse(T / 2, T / 2 - 2, 26, 20); // cabeça
  g.fillStyle(0x1e1b3a, 1).fillEllipse(T / 2, T / 2 + 6, 14, 9); // focinho
  g.fillStyle(0xa855f7, 1).fillTriangle(T / 2 - 8, T / 2 - 6, T / 2 - 2, T / 2 - 4, T / 2 - 7, T / 2 - 1);
  g.fillTriangle(T / 2 + 8, T / 2 - 6, T / 2 + 2, T / 2 - 4, T / 2 + 7, T / 2 - 1);
  g.fillStyle(0x020617, 1).fillCircle(T / 2, T / 2 + 5, 2);
  g.generateTexture(TEX.wolf, T, T);

  // ---- Partícula (poeira de mana) ----
  g.clear();
  g.fillStyle(0x7dd3fc, 0.25).fillCircle(5, 5, 5);
  g.fillStyle(0xbae6fd, 0.9).fillCircle(5, 5, 2);
  g.generateTexture(TEX.mote, 10, 10);

  // ---- Portal do Gate (anel) ----
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
