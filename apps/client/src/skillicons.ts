/**
 * Ícones das habilidades (SVG inline, arte original). Cada habilidade mostra a ação em si:
 * facada = alguém esfaqueando, magia = projétil/cristal/explosão, cura = cruz verde, etc.
 */
export type SkillKind = "phys" | "shadow" | "magic" | "holy" | "heal" | "guard";

const W = (inner: string) =>
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

/** Silhueta de alguém dando uma facada (corpo inclinado, braço estendido com adaga). */
const stabber = (color: string) => `
  <circle cx="20" cy="17" r="6" fill="${color}"/>
  <path d="M21 25 L26 41" stroke="${color}" stroke-width="7"/>
  <path d="M26 41 L17 56 M26 41 L37 55" stroke="${color}" stroke-width="5"/>
  <path d="M23 30 L42 33" stroke="${color}" stroke-width="5"/>
  <path d="M41 33 L56 30 L41 37 Z" fill="#e2e8f0" stroke="#e2e8f0" stroke-width="1.5"/>
  <path d="M5 26 H13 M3 34 H12 M6 42 H14" stroke="#fca5a5" stroke-width="2" opacity=".6"/>`;

const ICONS: Record<string, { kind: SkillKind; svg: string }> = {
  // ----- Guerreiro -----
  strike: {
    kind: "phys",
    svg: W(`<path d="M8 22 Q32 24 56 50" stroke="#fca5a5" stroke-width="3" opacity=".7" stroke-dasharray="2 4"/>
      <path d="M17 47 L47 15" stroke="#e2e8f0" stroke-width="7"/>
      <path d="M17 47 L47 15" stroke="#94a3b8" stroke-width="2"/>
      <path d="M12 36 L28 52" stroke="#facc15" stroke-width="5"/>
      <path d="M15 49 L8 56" stroke="#92400e" stroke-width="6"/>`)
  },
  brutal_cleave: {
    kind: "phys",
    svg: W(`<path d="M32 4 V38" stroke="#e2e8f0" stroke-width="9"/>
      <path d="M32 4 V38" stroke="#94a3b8" stroke-width="2"/>
      <path d="M22 38 H42" stroke="#facc15" stroke-width="5"/>
      <path d="M32 40 V50" stroke="#92400e" stroke-width="6"/>
      <path d="M32 52 L12 60 M32 52 L52 60 M32 52 L32 62 M32 52 L6 48 M32 52 L58 48" stroke="#fb923c" stroke-width="3"/>
      <path d="M10 40 l3 -4 M54 40 l-3 -4 M16 30 l4 -2" stroke="#fdba74" stroke-width="3"/>`)
  },
  iron_bulwark: {
    kind: "guard",
    svg: W(`<path d="M32 6 L54 14 V32 C54 45 45 54 32 60 C19 54 10 45 10 32 V14 Z" fill="#334155" stroke="#94a3b8" stroke-width="3"/>
      <path d="M32 12 L48 18 V32 C48 41 42 48 32 53 Z" fill="#475569"/>
      <path d="M32 18 V46 M20 30 H44" stroke="#facc15" stroke-width="4"/>`)
  },
  // ----- Assassino -----
  dagger_slash: { kind: "phys", svg: W(stabber("#1e1b4b")) },
  shadow_slice: {
    kind: "shadow",
    svg: W(`<path d="M10 12 Q34 30 56 54" stroke="#6d28d9" stroke-width="9" opacity=".45"/>
      <path d="M54 12 Q30 30 8 54" stroke="#6d28d9" stroke-width="9" opacity=".45"/>
      <path d="M10 12 Q34 30 56 54" stroke="#e9d5ff" stroke-width="3"/>
      <path d="M54 12 Q30 30 8 54" stroke="#e9d5ff" stroke-width="3"/>
      <circle cx="32" cy="32" r="4" fill="#faf5ff"/>`)
  },
  assassinate: {
    kind: "shadow",
    svg: W(`<circle cx="48" cy="16" r="6" fill="#94a3b8"/>
      <path d="M48 24 V42 M48 42 L42 57 M48 42 L55 57" stroke="#94a3b8" stroke-width="6"/>
      <circle cx="14" cy="18" r="6" fill="#1e1b4b"/>
      <path d="M15 26 L20 42 M20 42 L11 57 M20 42 L30 56" stroke="#1e1b4b" stroke-width="6"/>
      <path d="M17 31 L38 33" stroke="#1e1b4b" stroke-width="5"/>
      <path d="M37 31 L47 33 L37 37 Z" fill="#e2e8f0" stroke="#e2e8f0" stroke-width="1.5"/>
      <path d="M50 30 l7 -5 M52 35 l8 1 M50 39 l6 6" stroke="#ef4444" stroke-width="3"/>`)
  },
  // ----- Mago -----
  arcane_bolt: {
    kind: "magic",
    svg: W(`<path d="M6 58 L30 34 M12 46 L28 38 M20 58 L32 40" stroke="#a78bfa" stroke-width="3" opacity=".7"/>
      <circle cx="40" cy="24" r="14" fill="#7c3aed"/>
      <circle cx="40" cy="24" r="14" stroke="#c4b5fd" stroke-width="2"/>
      <circle cx="35" cy="19" r="4" fill="#f5f3ff" opacity=".9"/>
      <path d="M54 8 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2 Z" fill="#fde68a" stroke="none"/>`)
  },
  frost_lance: {
    kind: "magic",
    svg: W(`<path d="M10 54 L50 10" stroke="#67e8f9" stroke-width="6"/>
      <path d="M44 6 L58 6 L58 20 L50 14 Z" fill="#a5f3fc" stroke="#e0f2fe" stroke-width="2"/>
      <path d="M10 54 L50 10" stroke="#ecfeff" stroke-width="2"/>
      <path d="M24 38 L14 34 M30 31 L28 20 M36 24 L46 28" stroke="#bae6fd" stroke-width="3"/>
      <path d="M12 12 v8 M8 16 h8 M10 14 l4 4 M14 14 l-4 4" stroke="#e0f2fe" stroke-width="2"/>`)
  },
  void_nova: {
    kind: "magic",
    svg: W(`<circle cx="32" cy="32" r="26" stroke="#7c3aed" stroke-width="3" opacity=".5"/>
      <circle cx="32" cy="32" r="18" stroke="#a78bfa" stroke-width="3" opacity=".8"/>
      <circle cx="32" cy="32" r="9" fill="#0b0220" stroke="#e9d5ff" stroke-width="2"/>
      <path d="M32 2 V10 M32 54 V62 M2 32 H10 M54 32 H62 M10 10 l6 6 M48 48 l6 6 M54 10 l-6 6 M16 48 l-6 6" stroke="#c4b5fd" stroke-width="3"/>`)
  },
  // ----- Curandeiro de combate -----
  radiant_strike: {
    kind: "holy",
    svg: W(`<circle cx="32" cy="30" r="20" fill="#fde047" opacity=".25"/>
      <path d="M32 2 V12 M8 14 l7 7 M56 14 l-7 7 M2 34 h10 M52 34 h10" stroke="#fde047" stroke-width="3"/>
      <path d="M32 10 V44" stroke="#f8fafc" stroke-width="8"/>
      <path d="M32 10 V44" stroke="#cbd5e1" stroke-width="2"/>
      <path d="M21 44 H43" stroke="#f59e0b" stroke-width="5"/>
      <path d="M32 46 V58" stroke="#92400e" stroke-width="6"/>`)
  },
  holy_smite: {
    kind: "holy",
    svg: W(`<path d="M38 2 L22 28 H33 L24 50" stroke="#fef9c3" stroke-width="7"/>
      <path d="M38 2 L22 28 H33 L24 50" stroke="#facc15" stroke-width="3"/>
      <ellipse cx="24" cy="56" rx="16" ry="5" stroke="#fde047" stroke-width="3"/>
      <path d="M8 46 l5 4 M42 46 l-5 4 M6 56 h-4 M46 56 h4" stroke="#fde68a" stroke-width="3"/>
      <path d="M52 12 v10 M47 17 h10" stroke="#fef9c3" stroke-width="3"/>`)
  },
  divine_grace: {
    kind: "heal",
    svg: W(`<ellipse cx="32" cy="9" rx="13" ry="4" stroke="#fde047" stroke-width="3"/>
      <path d="M26 22 H38 V32 H48 V44 H38 V54 H26 V44 H16 V32 H26 Z" fill="#22c55e" stroke="#bbf7d0" stroke-width="2.5"/>
      <path d="M8 22 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2 Z M54 40 l2 3 3 2 -3 2 -2 3 -2 -3 -3 -2 3 -2 Z" fill="#dcfce7" stroke="none"/>`)
  }
};

const FALLBACK = {
  kind: "magic" as SkillKind,
  svg: W(`<path d="M32 6 L39 25 L58 25 L43 37 L49 56 L32 44 L15 56 L21 37 L6 25 L25 25 Z" fill="#facc15" stroke="#fef9c3" stroke-width="2"/>`)
};

export function skillIcon(id: string): { kind: SkillKind; svg: string } {
  return ICONS[id] ?? FALLBACK;
}
