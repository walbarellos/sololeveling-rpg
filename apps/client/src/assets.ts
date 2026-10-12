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
  shrine: "shrine",
  token: (key: PortraitKey) => `token_${key}`
} as const;

export function enemyTextureKey(name: string): string {
  const n = name.toLowerCase();
  if (
    n.includes("chefe") ||
    n.includes("boss") ||
    n.includes("sentinela") ||
    n.includes("rainha") ||
    n.includes("frostbite") ||
    n.includes("arquilorde") ||
    n.includes("ignis") ||
    n.includes("dragão") ||
    n.includes("estátua") ||
    n.includes("avatar") ||
    n.includes("monarca") ||
    n.includes("ashborn") ||
    n.includes("igris") ||
    n.includes("beru") ||
    n.includes("bellion") ||
    n.includes("kamish") ||
    n.includes("gárgula") ||
    n.includes("gargoyle") ||
    n.includes("warlord") ||
    n.includes("lorde") ||
    n.includes("gigante") ||
    n.includes("giant")
  ) {
    return TEX.boss;
  }
  if (n.includes("cinzas") || n.includes("ash") || n.includes("magma") || n.includes("behemoth") || n.includes("serpente")) return TEX.ember;
  if (n.includes("latão") || n.includes("brass") || n.includes("cão") || n.includes("hell") || n.includes("hound")) return TEX.hellhound;
  if (n.includes("rúnica") || n.includes("blade") || n.includes("lâmina") || n.includes("espectro") || n.includes("lich")) return TEX.voidling;
  if (n.includes("gelo") || n.includes("frost") || n.includes("golem") || n.includes("permafrost") || n.includes("bat")) return TEX.frostbat;
  if (n.includes("morte") || n.includes("knight") || n.includes("carniçal") || n.includes("wolf") || n.includes("lobo")) return TEX.wolf;
  if (n.includes("guardião") || n.includes("carrasco") || n.includes("sacerdote") || n.includes("goblin")) return TEX.goblin;
  if (n.includes("estrela") || n.includes("stareater") || n.includes("vácuo") || n.includes("abominação") || n.includes("star") || n.includes("spawn")) return TEX.starspawn;
  if (n.includes("slime")) return TEX.slime;
  if (n.includes("larva")) return TEX.larva;
  if (n.includes("sprout") || n.includes("thorn")) return TEX.sprout;
  if (n.includes("ember") || n.includes("imp")) return TEX.ember;
  if (n.includes("void")) return TEX.voidling;
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

  // ---- Pisos por bioma (6 temas: Santuário, Ruínas, Catacumbas, Covil, Abismo, Gelo) ----
  const biomePalettes = [
    // 0 Santuário do Gate — templo arcano místico com lajes de pedra esmeralda/ardósia e runas de mana
    {
      base: 0x182c23,
      slab: 0x223d31,
      mortar: 0x0c1712,
      hi: 0x3b6652,
      shadow: 0x112019,
      accent: 0x34d399,
      glow: 0x38bdf8
    },
    // 1 Ruínas Esquecidas — lajes de pedra ancestral com musgo vibrante e fendas
    {
      base: 0x223324,
      slab: 0x2d4430,
      mortar: 0x101a11,
      hi: 0x476b4c,
      shadow: 0x172419,
      accent: 0x4ade80,
      glow: 0x22c55e
    },
    // 2 Catacumbas Antigas — lajes góticas de ardósia cinza-azulada com runas frias
    {
      base: 0x1e2a38,
      slab: 0x293a4d,
      mortar: 0x0f1620,
      hi: 0x445f7e,
      shadow: 0x141e2b,
      accent: 0x60a5fa,
      glow: 0x93c5fd
    },
    // 3 Covil Vulcânico — basalto negro com fissuras de magma incandescente e brasas
    {
      base: 0x2c1818,
      slab: 0x3b2222,
      mortar: 0x160a0a,
      hi: 0x5e3737,
      shadow: 0x1e0f0f,
      accent: 0xf97316,
      glow: 0xfacc15
    },
    // 4 Abismo Dimensional — obsidiana cósmica com fendas de energia do Void violeta
    {
      base: 0x221738,
      slab: 0x31224f,
      mortar: 0x120a1f,
      hi: 0x523b82,
      shadow: 0x180f29,
      accent: 0xa855f7,
      glow: 0xc084fc
    },
    // 5 Câmara de Gelo — permafrost e gelo glacial translúcido com reflexos cristalinos
    {
      base: 0x1c3444,
      slab: 0x27495e,
      mortar: 0x0d1c26,
      hi: 0x437696,
      shadow: 0x132633,
      accent: 0x7dd3fc,
      glow: 0xe0f2fe
    }
  ];

  for (let v = 0; v < 6; v++) {
    const r = rng(2000 + v * 123);
    const p = biomePalettes[v];
    g.clear();

    // Fundo base e argamassa de rejunte profundo
    g.fillStyle(p.mortar, 1).fillRect(0, 0, T, T);

    // 4 Lajes de pedra talhada em formato 2x2 com rejunte e chanfros
    const slabs = [
      { x: 1, y: 1, w: Math.floor(T * 0.52) - 2, h: Math.floor(T * 0.48) - 2 },
      { x: Math.floor(T * 0.52), y: 1, w: T - Math.floor(T * 0.52) - 1, h: Math.floor(T * 0.54) - 2 },
      { x: 1, y: Math.floor(T * 0.48), w: Math.floor(T * 0.46) - 2, h: T - Math.floor(T * 0.48) - 1 },
      { x: Math.floor(T * 0.46), y: Math.floor(T * 0.54), w: T - Math.floor(T * 0.46) - 1, h: T - Math.floor(T * 0.54) - 1 }
    ];

    for (let si = 0; si < slabs.length; si++) {
      const s = slabs[si];
      const slabShade = p.slab + Math.floor((r() - 0.5) * 8) * 0x010101;
      g.fillStyle(slabShade, 1).fillRect(s.x, s.y, s.w, s.h);

      // Chanfro de iluminação no topo e esquerda da laje
      g.lineStyle(1, p.hi, 0.75).lineBetween(s.x, s.y, s.x + s.w - 1, s.y);
      g.lineStyle(1, p.hi, 0.55).lineBetween(s.x, s.y, s.x, s.y + s.h - 1);

      // Chanfro de sombra na base e direita da laje
      g.lineStyle(1, p.shadow, 0.85).lineBetween(s.x, s.y + s.h - 1, s.x + s.w - 1, s.y + s.h - 1);
      g.lineStyle(1, p.shadow, 0.75).lineBetween(s.x + s.w - 1, s.y, s.x + s.w - 1, s.y + s.h - 1);

      // Textura granular de pedra
      for (let gi = 0; gi < 8; gi++) {
        const gx = s.x + 2 + Math.floor(r() * (s.w - 4));
        const gy = s.y + 2 + Math.floor(r() * (s.h - 4));
        const dotCol = r() > 0.5 ? p.hi : p.shadow;
        g.fillStyle(dotCol, 0.35).fillRect(gx, gy, 1 + Math.floor(r() * 2), 1);
      }
    }

    // Detalhes estilizados característicos por Bioma:
    if (v === 0) {
      // Santuário: Runas de Mana entalhadas e círculo arcano sutil
      g.lineStyle(1, p.accent, 0.45).strokeCircle(T / 2, T / 2, T * 0.28);
      g.lineStyle(1, p.glow, 0.7).strokeCircle(T / 2, T / 2, 4);
      g.fillStyle(p.glow, 0.85).fillCircle(T / 2, T / 2, 2);
      // Runas lineares de mana nos canais
      g.lineStyle(1, p.accent, 0.55).lineBetween(T / 2 - 8, T / 2, T / 2 + 8, T / 2);
      g.lineStyle(1, p.accent, 0.55).lineBetween(T / 2, T / 2 - 8, T / 2, T / 2 + 8);
    } else if (v === 1) {
      // Ruínas: Musgo vivo verde e folhagens crescendo nas fendas
      for (let m = 0; m < 5; m++) {
        const mx = 6 + Math.floor(r() * (T - 12));
        const my = 6 + Math.floor(r() * (T - 12));
        g.fillStyle(p.accent, 0.8).fillCircle(mx, my, 2 + Math.floor(r() * 2));
        g.fillStyle(p.glow, 0.6).fillCircle(mx + 1, my - 1, 1.5);
      }
    } else if (v === 2) {
      // Catacumbas: Rachaduras com reflexo gélido
      g.lineStyle(1, p.accent, 0.7).beginPath();
      g.moveTo(6, 12);
      g.lineTo(18, 22);
      g.lineTo(24, 20);
      g.lineTo(34, 38);
      g.strokePath();
      g.fillStyle(p.glow, 0.75).fillCircle(24, 20, 1.5);
    } else if (v === 3) {
      // Covil Vulcânico: Fenda de magma vivo e incandescente
      g.lineStyle(3, 0x991b1b, 0.85).beginPath();
      g.moveTo(4, 8);
      g.lineTo(16, 20);
      g.lineTo(28, 18);
      g.lineTo(42, 38);
      g.strokePath();
      // Núcleo brilhante de lava amarela/laranja
      g.lineStyle(1.5, p.accent, 0.95).beginPath();
      g.moveTo(4, 8);
      g.lineTo(16, 20);
      g.lineTo(28, 18);
      g.lineTo(42, 38);
      g.strokePath();
      g.fillStyle(p.glow, 0.9).fillCircle(16, 20, 2);
      g.fillStyle(p.glow, 0.9).fillCircle(28, 18, 2);
      // Brasas espalhadas
      g.fillStyle(0xf97316, 0.7).fillCircle(10, 36, 1.5);
      g.fillStyle(0xef4444, 0.6).fillCircle(38, 12, 1.5);
    } else if (v === 4) {
      // Abismo: Fendas cósmicas do Void e micropontos estelares
      g.lineStyle(1.5, p.accent, 0.85).beginPath();
      g.moveTo(8, 40);
      g.lineTo(22, 24);
      g.lineTo(26, 26);
      g.lineTo(40, 6);
      g.strokePath();
      g.fillStyle(p.glow, 0.9).fillCircle(22, 24, 2);
      g.fillStyle(0xf5f3ff, 0.85).fillCircle(12, 10, 1.2);
      g.fillStyle(0xf5f3ff, 0.85).fillCircle(36, 36, 1.2);
      g.fillStyle(0xc4b5fd, 0.7).fillCircle(30, 14, 1);
    } else if (v === 5) {
      // Câmara de Gelo: Fendas de gelo cristalino translúcido
      g.lineStyle(1.5, 0xe0f2fe, 0.8).beginPath();
      g.moveTo(6, 6);
      g.lineTo(20, 22);
      g.lineTo(26, 18);
      g.lineTo(40, 42);
      g.strokePath();
      g.fillStyle(p.glow, 0.75).fillRect(10, 28, 8, 2);
      g.fillStyle(p.accent, 0.8).fillRect(28, 10, 6, 2);
    }

    // Moldura perimetral externa com relevo sutil
    g.lineStyle(1, 0x050a08, 0.65).strokeRect(0, 0, T, T);
    g.generateTexture(TEX.floor(v), T, T);
  }

  // ---- 1. Topo da Muralha (Crest / Parapet com chanfro iluminado) ----
  g.clear();
  // Fundo de alvenaria
  g.fillStyle(0x1a2634, 1).fillRect(0, 0, T, T);
  // Beiral superior iluminado (Pedra de topo polida)
  g.fillStyle(0x475569, 1).fillRect(0, 0, T, 16);
  g.fillStyle(0x94a3b8, 0.95).fillRect(0, 0, T, 2); // borda de luz
  g.fillStyle(0x64748b, 0.85).fillRect(0, 2, T, 4);
  // Chanfro e corte de sombra sob o beiral
  g.fillStyle(0x0a0f18, 1).fillRect(0, 16, T, 4);
  // Parede de tijolos frontal abaixo do beiral
  g.fillStyle(0x273546, 1).fillRect(1, 20, T - 2, T - 20);
  g.fillStyle(0x0f172a, 1).fillRect(T / 2 - 1, 20, 2, T - 20);
  g.fillStyle(0x475a72, 0.6).fillRect(1, 20, T / 2 - 2, 1);
  g.fillStyle(0x475a72, 0.6).fillRect(T / 2 + 1, 20, T / 2 - 2, 1);
  g.generateTexture(TEX.wallTop, T, T);

  // ---- 2. Meio da Muralha (Blocos de cantaria de pedra com relevo 3D) ----
  g.clear();
  g.fillStyle(0x0a0f18, 1).fillRect(0, 0, T, T);
  // Fileira 1 de tijolos
  g.fillStyle(0x273546, 1).fillRect(1, 1, T - 2, 22);
  g.fillStyle(0x475a72, 0.7).fillRect(1, 1, T - 2, 1); // luz do tijolo
  g.fillStyle(0x0f172a, 1).fillRect(12, 1, 2, 22);
  g.fillStyle(0x0f172a, 1).fillRect(36, 1, 2, 22);
  // Argamassa horizontal divisória
  g.fillStyle(0x080c14, 1).fillRect(0, 23, T, 2);
  // Fileira 2 de tijolos (deslocada)
  g.fillStyle(0x243242, 1).fillRect(1, 25, T - 2, 22);
  g.fillStyle(0x475a72, 0.6).fillRect(1, 25, T - 2, 1); // luz do tijolo
  g.fillStyle(0x0f172a, 1).fillRect(T / 2 - 1, 25, 2, 22);
  g.generateTexture(TEX.wallMid, T, T);

  // ---- 3. Base da Muralha (Rodapé maciço reforçado + sombra de piso) ----
  g.clear();
  g.fillStyle(0x000000, 0.65).fillRect(0, T - 6, T, 6); // sombra de contato com o chão
  g.fillStyle(0x243242, 1).fillRect(1, 0, T - 2, 36);
  g.fillStyle(0x0f172a, 1).fillRect(T / 2 - 1, 0, 2, 36);
  g.fillStyle(0x475a72, 0.5).fillRect(1, 0, T / 2 - 2, 1);
  g.fillStyle(0x475a72, 0.5).fillRect(T / 2 + 1, 0, T / 2 - 2, 1);
  // Rodapé chanfrado saliente
  g.fillStyle(0x334155, 1).fillRect(0, 36, T, 7);
  g.fillStyle(0x64748b, 0.85).fillRect(0, 36, T, 1); // destaque de luz do rodapé
  g.fillStyle(0x0b111a, 1).fillRect(0, 42, T, 2);
  g.generateTexture(TEX.wallBase, T, T);

  // ---- 4. Bloco de Muralha Padrão (Isolado) ----
  g.clear();
  g.fillStyle(0x000000, 0.6).fillRect(0, T - 4, T, 4);
  // Beiral
  g.fillStyle(0x475569, 1).fillRect(0, 0, T, 14);
  g.fillStyle(0x94a3b8, 0.95).fillRect(0, 0, T, 2);
  g.fillStyle(0x0a0f18, 1).fillRect(0, 14, T, 3);
  // Tijolo central
  g.fillStyle(0x273546, 1).fillRect(1, 17, T - 2, 24);
  g.fillStyle(0x475a72, 0.6).fillRect(1, 17, T - 2, 1);
  g.fillStyle(0x0f172a, 1).fillRect(T / 2 - 1, 17, 2, 24);
  // Base
  g.fillStyle(0x334155, 1).fillRect(0, 41, T, 4);
  g.fillStyle(0x64748b, 0.8).fillRect(0, 41, T, 1);
  g.generateTexture(TEX.wall, T, T);

  // ---- Pilar Monolítico (Coluna de Templo Arcano com Gema de Mana) ----
  g.clear();
  g.fillStyle(0x000000, 0.6).fillEllipse(T / 2, T - 4, T * 0.9, 12);
  // Base alargada
  g.fillStyle(0x273546, 1).fillRoundedRect(3, T - 16, T - 6, 14, 2);
  g.fillStyle(0x475569, 1).fillRect(3, T - 16, T - 6, 2);
  // Fuste do pilar (corpo central)
  g.fillStyle(0x334155, 1).fillRect(7, 8, T - 14, T - 22);
  g.fillStyle(0x64748b, 0.85).fillRect(8, 8, 4, T - 22); // destaque de luz lateral
  g.fillStyle(0x1a2634, 0.9).fillRect(T - 13, 8, 5, T - 22); // sombra lateral
  // Capitel do pilar (topo)
  g.fillStyle(0x475569, 1).fillRoundedRect(4, 2, T - 8, 8, 2);
  g.fillStyle(0x94a3b8, 0.95).fillRect(4, 2, T - 8, 2);
  // Gema de Mana Arcano Central no Pilar
  g.fillStyle(0x0284c7, 0.9).fillCircle(T / 2, T / 2 - 2, 8);
  g.fillStyle(0x38bdf8, 1).fillCircle(T / 2, T / 2 - 2, 5);
  g.fillStyle(0xe0f2fe, 1).fillCircle(T / 2 - 1, T / 2 - 3, 2);
  // Aros de ferro dourado prendendo a gema
  g.lineStyle(2, 0xf59e0b, 0.95).strokeCircle(T / 2, T / 2 - 2, 8);
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

  // ---- Portal do Gate (Fenda Dimensional Solo Leveling) ----
  g.clear();
  // Aura de distorção dimensional escura
  g.fillStyle(0x020617, 0.7).fillCircle(T / 2, T / 2, T * 0.46);
  // Anel rúnico externo
  g.lineStyle(2.5, 0x38bdf8, 0.95).strokeCircle(T / 2, T / 2, T * 0.42);
  g.lineStyle(1.5, 0x818cf8, 0.8).strokeCircle(T / 2, T / 2, T * 0.35);
  // Marcadores de runas nos 8 eixos
  for (let a = 0; a < 8; a++) {
    const angle = (a / 8) * Math.PI * 2;
    const rx = T / 2 + Math.cos(angle) * (T * 0.42);
    const ry = T / 2 + Math.sin(angle) * (T * 0.42);
    g.fillStyle(0xfde047, 0.95).fillCircle(rx, ry, 1.8);
  }
  // Vórtice de mana intermediário
  g.fillStyle(0x1d4ed8, 0.4).fillCircle(T / 2, T / 2, T * 0.32);
  g.fillStyle(0x2563eb, 0.55).fillCircle(T / 2, T / 2, T * 0.24);
  // Singularidade branca incandescente
  g.fillStyle(0x38bdf8, 0.85).fillCircle(T / 2, T / 2, T * 0.16);
  g.fillStyle(0xffffff, 1).fillCircle(T / 2, T / 2, T * 0.08);
  g.generateTexture(TEX.portal, T, T);

  // ---- Altar de Restauração / Fonte de Mana (Shrine) ----
  g.clear();
  g.fillStyle(0x020617, 0.6).fillEllipse(T / 2, T - 6, T * 0.75, 12);
  // Base do altar em pedra entalhada
  g.fillStyle(0x1e293b, 1).fillRoundedRect(T * 0.2, T * 0.55, T * 0.6, T * 0.35, 3);
  g.lineStyle(1.5, 0x0ea5e9, 0.8).strokeRoundedRect(T * 0.2, T * 0.55, T * 0.6, T * 0.35, 3);
  // Bacia sagrada com água de mana
  g.fillStyle(0x0284c7, 0.85).fillEllipse(T / 2, T * 0.58, T * 0.45, 10);
  g.fillStyle(0x38bdf8, 0.9).fillCircle(T / 2, T * 0.58, 4);
  // Cristal sagrado flutuante lapidado
  g.fillStyle(0x38bdf8, 0.95).fillTriangle(T / 2, T * 0.16, T * 0.3, T * 0.38, T * 0.7, T * 0.38);
  g.fillStyle(0x7dd3fc, 0.95).fillTriangle(T / 2, T * 0.48, T * 0.3, T * 0.38, T * 0.7, T * 0.38);
  g.fillStyle(0xffffff, 1).fillCircle(T / 2, T * 0.35, 2.5);
  g.lineStyle(1, 0xbae6fd, 0.9).strokeCircle(T / 2, T * 0.35, 6);
  g.generateTexture(TEX.shrine, T, T);

  g.destroy();
}

/** Vinheta radial para dar clima de masmorra. */
export function addVignette(scene: Phaser.Scene, w: number, h: number) {
  if (!scene.textures.exists(TEX.vignette)) {
    const tex = scene.textures.createCanvas(TEX.vignette, w, h);
    if (tex) {
      const ctx = tex.getContext();
      const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, Math.max(w, h) * 0.65);
      grad.addColorStop(0, "rgba(2,4,10,0)");
      grad.addColorStop(1, "rgba(2,4,10,0.45)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      tex.refresh();
    }
  }
  return scene.add.image(w / 2, h / 2, TEX.vignette).setDepth(900);
}
