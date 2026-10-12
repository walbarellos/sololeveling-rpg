import type { TileCoord, WorldStyle } from "@rpg/contracts";
import { biomeAt } from "./assets";

/**
 * HUNTER RPG — GERADOR ARTÍSTICO DO MAPA DA MASMORRA
 * Solo Leveling Dark Fantasy Aesthetic:
 *  - Lajes de pedra talhada em formato 2x2 com chanfros de iluminação e profundidade 3D.
 *  - Biomas temáticos com paletas ricas, runas, musgo orgânico, magma e éter cósmico.
 *  - Estilo dedicado para a Cidadela Carmesim (Gate Rank D) com flagstones de obsidiana e rubi.
 *  - Muralhas de cantaria com beiral iluminado, cursos de alvenaria e rodapé maciço.
 *  - Sombras de oclusão ambiente (Ambient Occlusion) projetadas sobre o piso.
 *  - Pilares monumentais com gemas de mana lapidadas.
 *  - Plataformas arcanas circulares sob os Gates dimensionais.
 */

interface BiomeTheme {
  name: string;
  mortar: string;
  slabBase: string;
  slabLight: string;
  slabMid: string;
  bevelHi: string;
  bevelShadow: string;
  accent: string;
  glow: string;
  gem: string;
}

export const CRIMSON_CITADEL_THEMES: Record<number, BiomeTheme> = {
  // Setor 0: Átrio Carmesim (Entrada) - Obsidiana com veios de sangue e cinzas
  0: {
    name: "Átrio Carmesim",
    mortar: "#180509",
    slabBase: "#2b0a12",
    slabMid: "#3a0e19",
    slabLight: "#4e1423",
    bevelHi: "#7f2339",
    bevelShadow: "#140306",
    accent: "#f43f5e",
    glow: "#fda4af",
    gem: "#f43f5e"
  },
  // Setor 1: Galeria de Latão e Brasas (Centro) - Basalto negro e latão incandescente
  1: {
    name: "Galeria de Latão",
    mortar: "#1c0b05",
    slabBase: "#33180c",
    slabMid: "#452212",
    slabLight: "#5a2d18",
    bevelHi: "#924822",
    bevelShadow: "#170904",
    accent: "#f97316",
    glow: "#fde047",
    gem: "#fbbf24"
  },
  // Setor 2: Salão do Trono Carmesim (Apex) - Rubi imperial e chamas escarlates
  2: {
    name: "Salão do Trono Carmesim",
    mortar: "#1a040b",
    slabBase: "#360817",
    slabMid: "#4d0e22",
    slabLight: "#681430",
    bevelHi: "#9f1239",
    bevelShadow: "#1a030b",
    accent: "#e11d48",
    glow: "#f43f5e",
    gem: "#e11d48"
  }
};

export const FROZEN_ABYSS_THEME: BiomeTheme = {
  name: "Fenda Glacial de Niflheim",
  mortar: "#05131f",
  slabBase: "#0c283d",
  slabMid: "#133854",
  slabLight: "#1d4c70",
  bevelHi: "#38bdf8",
  bevelShadow: "#061826",
  accent: "#67e8f9",
  glow: "#a5f3fc",
  gem: "#06b6d4"
};

export const SHADOW_NECROPOLIS_THEME: BiomeTheme = {
  name: "Necrópole das Sombras",
  mortar: "#12081c",
  slabBase: "#1f1030",
  slabMid: "#2a1640",
  slabLight: "#381d54",
  bevelHi: "#7e22ce",
  bevelShadow: "#0d0514",
  accent: "#a855f7",
  glow: "#c084fc",
  gem: "#9333ea"
};

export const DRAGON_VOLCANO_THEME: BiomeTheme = {
  name: "Calamidade Vulcânica",
  mortar: "#1c0905",
  slabBase: "#2e1208",
  slabMid: "#40190a",
  slabLight: "#54210d",
  bevelHi: "#c2410c",
  bevelShadow: "#140603",
  accent: "#f97316",
  glow: "#fde047",
  gem: "#ea580c"
};

export const MONARCH_SANCTUM_THEME: BiomeTheme = {
  name: "Templo dos Deuses Antigos",
  mortar: "#191508",
  slabBase: "#2b240f",
  slabMid: "#3d3316",
  slabLight: "#52441d",
  bevelHi: "#ca8a04",
  bevelShadow: "#120f05",
  accent: "#facc15",
  glow: "#fef08a",
  gem: "#eab308"
};

export const COSMIC_VOID_THEME: BiomeTheme = {
  name: "Fenda Cósmica",
  mortar: "#08061a",
  slabBase: "#100d30",
  slabMid: "#181347",
  slabLight: "#221b61",
  bevelHi: "#6366f1",
  bevelShadow: "#060414",
  accent: "#818cf8",
  glow: "#c7d2fe",
  gem: "#4f46e5"
};

export const SHADOW_THRONE_THEME: BiomeTheme = {
  name: "Trono do Monarca das Sombras",
  mortar: "#020408",
  slabBase: "#050b14",
  slabMid: "#091221",
  slabLight: "#0f1c33",
  bevelHi: "#0284c7",
  bevelShadow: "#010205",
  accent: "#38bdf8",
  glow: "#7dd3fc",
  gem: "#0284c7"
};

const BIOMES: Record<number, BiomeTheme> = {
  // 0: Santuário do Gate — Templo arcano de ardósia esmeralda com canais de mana
  0: {
    name: "Santuário do Gate",
    mortar: "#0b1712",
    slabBase: "#182e24",
    slabMid: "#223f32",
    slabLight: "#2c5140",
    bevelHi: "#457a62",
    bevelShadow: "#10211a",
    accent: "#34d399",
    glow: "#38bdf8",
    gem: "#38bdf8"
  },
  // 1: Ruínas Esquecidas — Lajes ancestrais com tufos de musgo vivo e trepadeiras
  1: {
    name: "Ruínas Esquecidas",
    mortar: "#0f190f",
    slabBase: "#223522",
    slabMid: "#2c452c",
    slabLight: "#385638",
    bevelHi: "#527b52",
    bevelShadow: "#172617",
    accent: "#4ade80",
    glow: "#86efac",
    gem: "#22c55e"
  },
  // 2: Catacumbas Antigas — Granito gótico frio e ardósia cinzenta com névoa mística
  2: {
    name: "Catacumbas Antigas",
    mortar: "#0e1520",
    slabBase: "#1f2d3d",
    slabMid: "#2a3c52",
    slabLight: "#354c66",
    bevelHi: "#506f94",
    bevelShadow: "#15202c",
    accent: "#60a5fa",
    glow: "#93c5fd",
    gem: "#93c5fd"
  },
  // 3: Covil Vulcânico — Basalto negro aquecido com veios de lava incandescente e brasas
  3: {
    name: "Covil Vulcânico",
    mortar: "#150909",
    slabBase: "#301818",
    slabMid: "#422222",
    slabLight: "#552c2c",
    bevelHi: "#783f3f",
    bevelShadow: "#220f0f",
    accent: "#f97316",
    glow: "#fde047",
    gem: "#ef4444"
  },
  // 4: Abismo Dimensional — Obsidiana cósmica com fendas de energia do Void violeta
  4: {
    name: "Abismo Dimensional",
    mortar: "#10091c",
    slabBase: "#241838",
    slabMid: "#33224f",
    slabLight: "#422c66",
    bevelHi: "#604291",
    bevelShadow: "#190f28",
    accent: "#a855f7",
    glow: "#e9d5ff",
    gem: "#c084fc"
  },
  // 5: Câmara de Gelo — Permafrost glacial com fendas de gelo cristalino translúcido
  5: {
    name: "Câmara de Gelo",
    mortar: "#0b1824",
    slabBase: "#1d3447",
    slabMid: "#27465e",
    slabLight: "#335978",
    bevelHi: "#4d7ea6",
    bevelShadow: "#132533",
    accent: "#7dd3fc",
    glow: "#e0f2fe",
    gem: "#38bdf8"
  }
};

/** Hashing determinístico por coordenada para gerar variações sem artefatos de flickering. */
function tileRng(x: number, y: number, salt = 0): number {
  let h = (x * 374761393 + y * 668265263 + salt * 1013904223) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function buildDungeonCanvas(
  gw: number,
  gh: number,
  ts: number,
  obstacles: readonly TileCoord[],
  style: WorldStyle = "SANCTUARY"
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = gw * ts;
  canvas.height = gh * ts;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;

  const obsSet = new Set(obstacles.map((o) => `${o.x},${o.y}`));
  const isObs = (x: number, y: number) => obsSet.has(`${x},${y}`);

  // =========================================================================
  // CAMADA 1: PISOS LAJEADOS POR BIOMA (4 lajes de pedra talhada por célula)
  // =========================================================================
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const px = x * ts;
      const py = y * ts;
      let b: BiomeTheme;
      let biomeIdx = 0;
      if (style === "CRIMSON_CITADEL") {
        biomeIdx = x <= 12 ? 0 : x <= 26 ? 1 : 2;
        b = CRIMSON_CITADEL_THEMES[biomeIdx];
      } else if (style === "FROZEN_ABYSS") {
        b = FROZEN_ABYSS_THEME;
      } else if (style === "SHADOW_NECROPOLIS") {
        b = SHADOW_NECROPOLIS_THEME;
      } else if (style === "DRAGON_VOLCANO") {
        b = DRAGON_VOLCANO_THEME;
      } else if (style === "MONARCH_SANCTUM") {
        b = MONARCH_SANCTUM_THEME;
      } else if (style === "COSMIC_VOID") {
        b = COSMIC_VOID_THEME;
      } else if (style === "SHADOW_THRONE") {
        b = SHADOW_THRONE_THEME;
      } else {
        biomeIdx = biomeAt(x, y);
        b = BIOMES[biomeIdx] ?? BIOMES[0];
      }

      // Fundo escuro do rejunte de argamassa
      ctx.fillStyle = b.mortar;
      ctx.fillRect(px, py, ts, ts);

      // Divisão das 4 lajes com leve assimetria natural
      const splitX = Math.floor(ts * 0.52);
      const splitY = Math.floor(ts * 0.48);

      const slabs = [
        { x: px + 1, y: py + 1, w: splitX - 2, h: splitY - 2 },
        { x: px + splitX, y: py + 1, w: ts - splitX - 1, h: splitY + 2 - 2 },
        { x: px + 1, y: py + splitY, w: splitX - 3 - 2, h: ts - splitY - 1 },
        { x: px + splitX - 3, y: py + splitY + 2, w: ts - (splitX - 3) - 1, h: ts - (splitY + 2) - 1 }
      ];

      for (let si = 0; si < slabs.length; si++) {
        const s = slabs[si];
        const rShade = tileRng(x, y, si);

        // Variação orgânica entre tons de pedra
        ctx.fillStyle = rShade > 0.65 ? b.slabLight : rShade > 0.3 ? b.slabMid : b.slabBase;
        ctx.fillRect(s.x, s.y, s.w, s.h);

        // Chanfro de iluminação superior e lateral esquerda (luz difusa zenital)
        ctx.fillStyle = b.bevelHi;
        ctx.fillRect(s.x, s.y, s.w, 1);
        ctx.fillRect(s.x, s.y, 1, s.h);

        // Chanfro de sombra inferior e lateral direita (profundidade)
        ctx.fillStyle = b.bevelShadow;
        ctx.fillRect(s.x, s.y + s.h - 1, s.w, 1);
        ctx.fillRect(s.x + s.w - 1, s.y, 1, s.h);

        // Granulação e textura de pedra natural (2 pontos sutis)
        const gx = s.x + 2 + Math.floor(tileRng(x, y, 10 + si) * (s.w - 4));
        const gy = s.y + 2 + Math.floor(tileRng(x, y, 20 + si) * (s.h - 4));
        ctx.fillStyle = b.bevelHi;
        ctx.fillRect(gx, gy, 1, 1);
      }

      // ---------------------------------------------------------------------
      // DETALHES CARACTERÍSTICOS ARTÍSTICOS DE CADA BIOMA
      // ---------------------------------------------------------------------
      const rFeat = tileRng(x, y, 99);

      if (biomeIdx === 0) {
        // Santuário: Canais de mana e glifos arcanos seletivos (em ~20% das lajes)
        if (rFeat > 0.78) {
          ctx.strokeStyle = b.accent;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(px + ts / 2, py + ts / 2, Math.floor(ts * 0.28), 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = b.glow;
          ctx.beginPath();
          ctx.arc(px + ts / 2, py + ts / 2, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Canais de energia saindo do glifo
          ctx.beginPath();
          ctx.moveTo(px + ts / 2 - 8, py + ts / 2);
          ctx.lineTo(px + ts / 2 + 8, py + ts / 2);
          ctx.moveTo(px + ts / 2, py + ts / 2 - 8);
          ctx.lineTo(px + ts / 2, py + ts / 2 + 8);
          ctx.stroke();
        } else if (rFeat < 0.15) {
          // Trilha de mana que cruza o rejunte
          ctx.strokeStyle = b.accent;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px + 4, py + splitY);
          ctx.lineTo(px + ts - 4, py + splitY);
          ctx.stroke();
        }
      } else if (biomeIdx === 1) {
        // Ruínas: Tufos de musgo vivo e brotos nas fendas de argamassa
        if (rFeat > 0.35) {
          const numPatches = Math.floor(1 + tileRng(x, y, 50) * 3);
          for (let p = 0; p < numPatches; p++) {
            const mx = px + 4 + Math.floor(tileRng(x, y, 60 + p) * (ts - 8));
            const my = py + 4 + Math.floor(tileRng(x, y, 70 + p) * (ts - 8));
            ctx.fillStyle = b.accent;
            ctx.beginPath();
            ctx.ellipse(mx, my, 2.5, 1.8, tileRng(x, y, 80 + p) * Math.PI, 0, Math.PI * 2);
            ctx.fill();

            // Ponto central de folha mais clara
            ctx.fillStyle = b.glow;
            ctx.fillRect(mx, my, 1, 1);
          }
        }
      } else if (biomeIdx === 2) {
        // Catacumbas: Rachaduras com reflexo gélido
        if (rFeat > 0.65) {
          const startX = px + 6 + Math.floor(tileRng(x, y, 12) * 12);
          const startY = py + 6 + Math.floor(tileRng(x, y, 13) * 12);
          ctx.strokeStyle = b.accent;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(startX + 14, startY + 12);
          ctx.lineTo(startX + 10, startY + 22);
          ctx.lineTo(startX + 22, startY + 30);
          ctx.stroke();

          ctx.fillStyle = b.glow;
          ctx.fillRect(startX + 14, startY + 12, 2, 2);
        }
      } else if (biomeIdx === 3) {
        // Covil Vulcânico: Fissura de lava viva e brasas incandescentes
        if (rFeat > 0.45) {
          ctx.strokeStyle = "#991b1b";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(px + 4, py + 10);
          ctx.lineTo(px + 18, py + 22);
          ctx.lineTo(px + 30, py + 18);
          ctx.lineTo(px + 42, py + 38);
          ctx.stroke();

          // Núcleo brilhante de lava amarela
          ctx.strokeStyle = b.accent;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px + 4, py + 10);
          ctx.lineTo(px + 18, py + 22);
          ctx.lineTo(px + 30, py + 18);
          ctx.lineTo(px + 42, py + 38);
          ctx.stroke();

          ctx.fillStyle = b.glow;
          ctx.beginPath();
          ctx.arc(px + 18, py + 22, 2, 0, Math.PI * 2);
          ctx.arc(px + 30, py + 18, 1.8, 0, Math.PI * 2);
          ctx.fill();

          // Brasa solta
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(px + 10, py + 34, 1.5, 1.5);
        }
      } else if (biomeIdx === 4) {
        // Abismo Dimensional: Fenda cósmica do Void e poeira astral
        if (rFeat > 0.5) {
          ctx.strokeStyle = b.accent;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px + 6, py + 38);
          ctx.lineTo(px + 22, py + 20);
          ctx.lineTo(px + 28, py + 24);
          ctx.lineTo(px + 40, py + 6);
          ctx.stroke();

          ctx.fillStyle = b.glow;
          ctx.fillRect(px + 22, py + 20, 2, 2);
        }
        // Microestrelas no abismo
        if (rFeat < 0.3) {
          ctx.fillStyle = "#f5f3ff";
          ctx.fillRect(px + 12, py + 10, 1.5, 1.5);
          ctx.fillRect(px + 34, py + 36, 1, 1);
        }
      } else if (biomeIdx === 5) {
        // Câmara de Gelo: Fendas glaciais translúcidas
        if (rFeat > 0.5) {
          ctx.strokeStyle = b.glow;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px + 8, py + 8);
          ctx.lineTo(px + 22, py + 24);
          ctx.lineTo(px + 26, py + 18);
          ctx.lineTo(px + 40, py + 40);
          ctx.stroke();

          ctx.fillStyle = b.accent;
          ctx.fillRect(px + 14, py + 28, 6, 2);
        }
      }

      // Linha de contorno perimetral sutil para leitura tática impecável da célula
      ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);
    }
  }

  // =========================================================================
  // CAMADA 2: PLATAFORMAS ARCANAS CONCÊNTRICAS (GATE E em 2,2 e GATE D em 5,2)
  // =========================================================================
  const drawArcaneDais = (cx: number, cy: number, haloColor: string, runicColor: string) => {
    ctx.save();
    // Halo suave que ilumina o piso
    const grad = ctx.createRadialGradient(cx, cy, ts * 0.15, cx, cy, ts * 0.95);
    grad.addColorStop(0, haloColor);
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, ts * 0.95, 0, Math.PI * 2);
    ctx.fill();

    // Anéis rúnicos concêntricos da plataforma de invocação
    ctx.strokeStyle = runicColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, ts * 0.76, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, ts * 0.56, 0, Math.PI * 2);
    ctx.stroke();

    // 8 Marcadores celestes e glifos nos eixos
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const rx = cx + Math.cos(angle) * (ts * 0.76);
      const ry = cy + Math.sin(angle) * (ts * 0.76);
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Linhas radiantes para o centro
      ctx.strokeStyle = "rgba(253, 224, 71, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(cx + Math.cos(angle) * (ts * 0.56), cy + Math.sin(angle) * (ts * 0.56));
      ctx.stroke();
    }
    ctx.restore();
  };

  if (style === "CRIMSON_CITADEL") {
    drawArcaneDais(3 * ts + ts / 2, 4 * ts + ts / 2, "rgba(56, 189, 248, 0.4)", "#38bdf8");
    drawArcaneDais(41 * ts + ts / 2, 6 * ts + ts / 2, "rgba(244, 63, 94, 0.5)", "#f43f5e");
  } else if (style === "FROZEN_ABYSS") {
    drawArcaneDais(3 * ts + ts / 2, 4 * ts + ts / 2, "rgba(56, 189, 248, 0.4)", "#38bdf8");
    drawArcaneDais(45 * ts + ts / 2, 6 * ts + ts / 2, "rgba(6, 182, 212, 0.5)", "#06b6d4");
  } else if (style === "SHADOW_NECROPOLIS") {
    drawArcaneDais(4 * ts + ts / 2, 4 * ts + ts / 2, "rgba(56, 189, 248, 0.4)", "#38bdf8");
    drawArcaneDais(49 * ts + ts / 2, 7 * ts + ts / 2, "rgba(168, 85, 247, 0.5)", "#a855f7");
  } else if (style === "DRAGON_VOLCANO") {
    drawArcaneDais(4 * ts + ts / 2, 5 * ts + ts / 2, "rgba(56, 189, 248, 0.4)", "#38bdf8");
    drawArcaneDais(53 * ts + ts / 2, 8 * ts + ts / 2, "rgba(249, 115, 22, 0.5)", "#f97316");
  } else if (style === "MONARCH_SANCTUM") {
    drawArcaneDais(5 * ts + ts / 2, 5 * ts + ts / 2, "rgba(56, 189, 248, 0.4)", "#38bdf8");
    drawArcaneDais(57 * ts + ts / 2, 9 * ts + ts / 2, "rgba(250, 204, 21, 0.5)", "#facc15");
  } else if (style === "COSMIC_VOID") {
    drawArcaneDais(5 * ts + ts / 2, 5 * ts + ts / 2, "rgba(56, 189, 248, 0.4)", "#38bdf8");
    drawArcaneDais(61 * ts + ts / 2, 9 * ts + ts / 2, "rgba(129, 140, 248, 0.5)", "#818cf8");
  } else if (style === "SHADOW_THRONE") {
    drawArcaneDais(6 * ts + ts / 2, 5 * ts + ts / 2, "rgba(56, 189, 248, 0.4)", "#38bdf8");
    drawArcaneDais(65 * ts + ts / 2, 10 * ts + ts / 2, "rgba(56, 189, 248, 0.5)", "#38bdf8");
  } else {
    // Portal de Respawn do Gate E em (2, 2)
    drawArcaneDais(2 * ts + ts / 2, 2 * ts + ts / 2, "rgba(56, 189, 248, 0.35)", "#38bdf8");
    // Portal Fenda Dimensional (Gate D+) em (5, 2)
    drawArcaneDais(5 * ts + ts / 2, 2 * ts + ts / 2, "rgba(168, 85, 247, 0.4)", "#c084fc");
    // Portal de Retorno do Chefe do Gate E em (46, 7) — câmara de extração segura
    drawArcaneDais(46 * ts + ts / 2, 7 * ts + ts / 2, "rgba(56, 189, 248, 0.35)", "#38bdf8");
  }

  // =========================================================================
  // CAMADA 3: SOMBRAS 3D DE OCLUSÃO AMBIENTE (Ambient Occlusion sobre o chão)
  // =========================================================================
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      if (!isObs(x, y)) continue;

      const px = x * ts;
      const py = y * ts;

      // Sombra projetada para o chão ao sul (y + 1)
      if (!isObs(x, y + 1) && y + 1 < gh) {
        const shadowGrad = ctx.createLinearGradient(px, py + ts, px, py + ts + 10);
        shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.75)");
        shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(px, py + ts, ts, 10);
      }

      // Sombra lateral projetada para o chão a leste (x + 1)
      if (!isObs(x + 1, y) && x + 1 < gw) {
        const shadowSide = ctx.createLinearGradient(px + ts, py, px + ts + 6, py);
        shadowSide.addColorStop(0, "rgba(0, 0, 0, 0.55)");
        shadowSide.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = shadowSide;
        ctx.fillRect(px + ts, py, 6, ts);
      }
    }
  }

  // =========================================================================
  // CAMADA 4: MURALHAS DE CANTARIA E PILARES MONUMENTAIS EM 3D
  // =========================================================================
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      if (!isObs(x, y)) continue;

      const px = x * ts;
      const py = y * ts;

      let b: BiomeTheme;
      if (style === "CRIMSON_CITADEL") {
        const sector = x <= 12 ? 0 : x <= 26 ? 1 : 2;
        b = CRIMSON_CITADEL_THEMES[sector];
      } else if (style === "FROZEN_ABYSS") {
        b = FROZEN_ABYSS_THEME;
      } else if (style === "SHADOW_NECROPOLIS") {
        b = SHADOW_NECROPOLIS_THEME;
      } else if (style === "DRAGON_VOLCANO") {
        b = DRAGON_VOLCANO_THEME;
      } else if (style === "MONARCH_SANCTUM") {
        b = MONARCH_SANCTUM_THEME;
      } else if (style === "COSMIC_VOID") {
        b = COSMIC_VOID_THEME;
      } else if (style === "SHADOW_THRONE") {
        b = SHADOW_THRONE_THEME;
      } else {
        const biomeIdx = biomeAt(x, y);
        b = BIOMES[biomeIdx] ?? BIOMES[0];
      }

      const hasAbove = isObs(x, y - 1);
      const hasBelow = isObs(x, y + 1);
      const hasLeft = isObs(x - 1, y);
      const hasRight = isObs(x + 1, y);

      const isPillar = !hasAbove && !hasBelow && !hasLeft && !hasRight;

      const wallBaseColor = b.slabBase;
      const wallBlockColor = b.slabMid;
      const wallBlockLight = b.slabLight;
      const wallCrestColor = b.bevelHi;
      const wallCrestHi = b.accent;
      const wallMortar = b.mortar;
      const pillarShaft = b.slabMid;
      const pillarBase = b.slabBase;

      if (isPillar) {
        // --- PILAR MONOLÍTICO CARVADO COM GEMA DE MANA CENTRAL ---
        // Sombra de contato circular na base
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.beginPath();
        ctx.ellipse(px + ts / 2, py + ts - 4, ts * 0.42, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Plinto / Base quadrada chanfrada
        ctx.fillStyle = pillarBase;
        ctx.fillRect(px + 4, py + ts - 16, ts - 8, 14);
        ctx.fillStyle = wallBlockLight;
        ctx.fillRect(px + 4, py + ts - 16, ts - 8, 2);

        // Fuste do pilar (coluna central de pedra polida)
        ctx.fillStyle = pillarShaft;
        ctx.fillRect(px + 8, py + 8, ts - 16, ts - 22);

        // Luz chanfrada esquerda e sombra chanfrada direita
        ctx.fillStyle = wallCrestHi;
        ctx.fillRect(px + 8, py + 8, 4, ts - 22);
        ctx.fillStyle = b.bevelShadow;
        ctx.fillRect(px + ts - 12, py + 8, 4, ts - 22);

        // Capitel (topo ornamentado do pilar)
        ctx.fillStyle = wallCrestColor;
        ctx.fillRect(px + 5, py + 2, ts - 10, 8);
        ctx.fillStyle = wallCrestHi;
        ctx.fillRect(px + 5, py + 2, ts - 10, 2);

        // Gema de Mana Arcano Central engastada em aro de ouro
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(px + ts / 2, py + ts / 2 - 2, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = b.gem;
        ctx.beginPath();
        ctx.arc(px + ts / 2, py + ts / 2 - 2, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(px + ts / 2 - 1.5, py + ts / 2 - 3.5, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // --- SEÇÃO DE MURALHA DE CANTARIA DE PEDRA MACIÇA ---
        ctx.fillStyle = wallBaseColor;
        ctx.fillRect(px, py, ts, ts);

        if (!hasAbove) {
          // BEIRAL / TOPO DA MURALHA (Crest / Capstone com iluminação superior)
          ctx.fillStyle = wallCrestColor;
          ctx.fillRect(px, py, ts, 16);

          // Borda de luz zenital superior
          ctx.fillStyle = wallCrestHi;
          ctx.fillRect(px, py, ts, 2);

          // Chanfro inferior e sombra sob o beiral
          ctx.fillStyle = b.bevelShadow;
          ctx.fillRect(px, py + 16, ts, 4);

          // Face de alvenaria abaixo do beiral
          ctx.fillStyle = wallBlockColor;
          ctx.fillRect(px + 1, py + 20, ts - 2, ts - 20);

          // Linhas de assentamento vertical de tijolos
          ctx.fillStyle = wallMortar;
          ctx.fillRect(px + Math.floor(ts / 2) - 1, py + 20, 2, ts - 20);

          // Destaque de luz no topo de cada bloco
          ctx.fillStyle = wallBlockLight;
          ctx.fillRect(px + 1, py + 20, Math.floor(ts / 2) - 2, 1);
          ctx.fillRect(px + Math.floor(ts / 2) + 1, py + 20, Math.floor(ts / 2) - 2, 1);
        } else if (hasAbove && hasBelow) {
          // CORPO CENTRAL DA MURALHA (Dois cursos de blocos de cantaria com amarração)
          const rowH = Math.floor(ts / 2) - 2;

          // Curso Superior
          ctx.fillStyle = wallBlockColor;
          ctx.fillRect(px + 1, py + 1, ts - 2, rowH);
          ctx.fillStyle = wallBlockLight;
          ctx.fillRect(px + 1, py + 1, ts - 2, 1);
          ctx.fillStyle = wallMortar;
          ctx.fillRect(px + 12, py + 1, 2, rowH);
          ctx.fillRect(px + 36, py + 1, 2, rowH);

          // Argamassa horizontal divisória
          ctx.fillStyle = wallMortar;
          ctx.fillRect(px, py + Math.floor(ts / 2) - 1, ts, 2);

          // Curso Inferior (deslocado)
          ctx.fillStyle = wallBlockColor;
          ctx.fillRect(px + 1, py + Math.floor(ts / 2) + 1, ts - 2, rowH);
          ctx.fillStyle = wallBlockLight;
          ctx.fillRect(px + 1, py + Math.floor(ts / 2) + 1, ts - 2, 1);
          ctx.fillStyle = wallMortar;
          ctx.fillRect(px + Math.floor(ts / 2) - 1, py + Math.floor(ts / 2) + 1, 2, rowH);
        } else {
          // BASE DA MURALHA (Fundação reforçada com rodapé chanfrado saliente)
          ctx.fillStyle = wallBlockColor;
          ctx.fillRect(px + 1, py, ts - 2, ts - 10);
          ctx.fillStyle = wallMortar;
          ctx.fillRect(px + Math.floor(ts / 2) - 1, py, 2, ts - 10);

          // Rodapé chanfrado saliente
          ctx.fillStyle = wallCrestColor;
          ctx.fillRect(px, py + ts - 10, ts, 8);
          ctx.fillStyle = wallCrestHi;
          ctx.fillRect(px, py + ts - 10, ts, 1);
          ctx.fillStyle = wallMortar;
          ctx.fillRect(px, py + ts - 2, ts, 2);
        }

        // Moldura perimetral externa de sombra para reforçar o relevo
        ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);
      }
    }
  }

  return canvas;
}
