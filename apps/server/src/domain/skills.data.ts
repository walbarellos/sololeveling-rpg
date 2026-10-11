import {
  statMult,
  type HunterClass,
  type PlayerAttributes,
  type PlayerStats,
  type Skill
} from "@rpg/contracts";

export interface SkillDefinition extends Skill {
  baseDamage: number;
  healAmount: number;
  damageType: "PHYSICAL" | "MAGICAL" | "HOLY";
}

export interface ClassConfig {
  baseHp: number;
  baseMp: number;
  basePhysicalAtk: number;
  baseMagicalAtk: number;
  critChance: number;
  dodgeChance: number;
  blockChance: number;
  title: string;
  defaultSkills: SkillDefinition[];
}

export const CLASS_STATS: Record<HunterClass, ClassConfig> = {
  WARRIOR: {
    baseHp: 140,
    baseMp: 40,
    basePhysicalAtk: 38,
    baseMagicalAtk: 12,
    critChance: 0.15,
    dodgeChance: 0.08,
    blockChance: 0.28,
    title: "Guerreiro Guardião",
    defaultSkills: [
      {
        id: "strike",
        name: "Corte Pesado",
        description: "Golpe físico direto com a espada",
        mpCost: 0,
        cooldownTurns: 0,
        currentCooldown: 0,
        baseDamage: 22,
        healAmount: 0,
        damageType: "PHYSICAL"
      },
      {
        id: "brutal_cleave",
        name: "Golpe Demolidor",
        description: "Ataque concentrado que racha armaduras",
        mpCost: 15,
        cooldownTurns: 2,
        currentCooldown: 0,
        baseDamage: 42,
        healAmount: 0,
        damageType: "PHYSICAL"
      },
      {
        id: "iron_bulwark",
        name: "Muralha de Ferro",
        description: "Postura defensiva firme e contra-golpe",
        mpCost: 20,
        cooldownTurns: 2,
        currentCooldown: 0,
        baseDamage: 18,
        healAmount: 25,
        damageType: "PHYSICAL"
      }
    ]
  },
  ASSASSIN: {
    baseHp: 100,
    baseMp: 60,
    basePhysicalAtk: 46,
    baseMagicalAtk: 15,
    critChance: 0.35,
    dodgeChance: 0.22,
    blockChance: 0.08,
    title: "Assassino de Sombras",
    defaultSkills: [
      {
        id: "dagger_slash",
        name: "Golpe de Adaga",
        description: "Corte veloz com adagas gêmeas",
        mpCost: 0,
        cooldownTurns: 0,
        currentCooldown: 0,
        baseDamage: 24,
        healAmount: 0,
        damageType: "PHYSICAL"
      },
      {
        id: "shadow_slice",
        name: "Corte Fantasma",
        description: "Passo sombrio que atinge pontos vitais",
        mpCost: 15,
        cooldownTurns: 2,
        currentCooldown: 0,
        baseDamage: 46,
        healAmount: 0,
        damageType: "PHYSICAL"
      },
      {
        id: "assassinate",
        name: "Execução Furtiva",
        description: "Ataque fulminante nas sombras",
        mpCost: 30,
        cooldownTurns: 3,
        currentCooldown: 0,
        baseDamage: 65,
        healAmount: 0,
        damageType: "PHYSICAL"
      }
    ]
  },
  MAGE: {
    baseHp: 90,
    baseMp: 100,
    basePhysicalAtk: 18,
    baseMagicalAtk: 58,
    critChance: 0.25,
    dodgeChance: 0.08,
    blockChance: 0.10,
    title: "Mago Dimensional",
    defaultSkills: [
      {
        id: "arcane_bolt",
        name: "Disparo Arcano",
        description: "Projétil de pura mana dimensional",
        mpCost: 0,
        cooldownTurns: 0,
        currentCooldown: 0,
        baseDamage: 20,
        healAmount: 0,
        damageType: "MAGICAL"
      },
      {
        id: "frost_lance",
        name: "Lança Glacial",
        description: "Espinho congelante de alta perfuração mágica",
        mpCost: 20,
        cooldownTurns: 1,
        currentCooldown: 0,
        baseDamage: 45,
        healAmount: 0,
        damageType: "MAGICAL"
      },
      {
        id: "void_nova",
        name: "Nova do Vazio",
        description: "Explosão massiva de poder arcano",
        mpCost: 40,
        cooldownTurns: 3,
        currentCooldown: 0,
        baseDamage: 75,
        healAmount: 0,
        damageType: "MAGICAL"
      }
    ]
  },
  BATTLE_HEALER: {
    baseHp: 120,
    baseMp: 80,
    basePhysicalAtk: 26,
    baseMagicalAtk: 38,
    critChance: 0.15,
    dodgeChance: 0.10,
    blockChance: 0.15,
    title: "Curandeiro de Combate",
    defaultSkills: [
      {
        id: "radiant_strike",
        name: "Punição de Luz",
        description: "Dano sagrado que pune criaturas das trevas",
        mpCost: 0,
        cooldownTurns: 0,
        currentCooldown: 0,
        baseDamage: 22,
        healAmount: 0,
        damageType: "HOLY"
      },
      {
        id: "holy_smite",
        name: "Smite Sagrado",
        description: "Impacto radiante que fere o inimigo e restaura 20 HP",
        mpCost: 20,
        cooldownTurns: 2,
        currentCooldown: 0,
        baseDamage: 38,
        healAmount: 20,
        damageType: "HOLY"
      },
      {
        id: "divine_grace",
        name: "Graça Celestial",
        description: "Luz sagrada que restaura 50 HP",
        mpCost: 25,
        cooldownTurns: 3,
        currentCooldown: 0,
        baseDamage: 0,
        healAmount: 50,
        damageType: "HOLY"
      }
    ]
  }
};

export function calculatePlayerStats(
  hunterClass: HunterClass,
  level: number,
  attributes?: PlayerAttributes
): PlayerStats {
  const config = CLASS_STATS[hunterClass] ?? CLASS_STATS.WARRIOR;
  const mult = statMult(level);

  const bonusStr = attributes ? Math.max(0, attributes.str - 10) : 0;
  const bonusAgi = attributes ? Math.max(0, attributes.agi - 10) : 0;
  const bonusVit = attributes ? Math.max(0, attributes.vit - 10) : 0;
  const bonusInt = attributes ? Math.max(0, attributes.int - 10) : 0;

  return {
    physicalAtk: Math.round(config.basePhysicalAtk * mult + bonusStr * 2),
    magicalAtk: Math.round(config.baseMagicalAtk * mult + bonusInt * 2.5),
    critChance: Math.min(0.75, Number((config.critChance + bonusAgi * 0.005).toFixed(4))),
    dodgeChance: Math.min(0.50, Number((config.dodgeChance + bonusAgi * 0.004).toFixed(4))),
    blockChance: Math.min(0.60, Number((config.blockChance + bonusVit * 0.003).toFixed(4)))
  };
}

export function calculatePlayerMaxHp(hunterClass: HunterClass, level: number, vit = 10): number {
  const config = CLASS_STATS[hunterClass] ?? CLASS_STATS.WARRIOR;
  const mult = statMult(level);
  const bonusVit = Math.max(0, vit - 10);
  return Math.floor(config.baseHp * mult + bonusVit * 10);
}

export function calculatePlayerMaxMp(hunterClass: HunterClass, level: number, int = 10): number {
  const config = CLASS_STATS[hunterClass] ?? CLASS_STATS.WARRIOR;
  const mult = statMult(level);
  const bonusInt = Math.max(0, int - 10);
  return Math.floor(config.baseMp * mult + bonusInt * 8);
}
