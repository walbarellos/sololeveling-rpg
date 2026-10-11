import type {
  BattleParticipant,
  BattlePlayerParticipant,
  BattleSnapshot,
  EnemySnapshot,
  HunterClass
} from "@rpg/contracts";
import type { PlayerEntity } from "./player.repository";
import { CLASS_STATS, type SkillDefinition } from "./skills.data";

export class BattleSession {
  public readonly battleId: string;
  public turn = 1;
  public readonly maxTurns = 20;
  public player: BattlePlayerParticipant;
  public enemy: BattleParticipant;
  public log: string[] = [];
  public finished = false;
  public result?: "VICTORY" | "DEFEAT" | "DRAW" | "FLED";
  public rewardExp = 0;

  private skillDefs: Map<string, SkillDefinition>;

  constructor(
    battleId: string,
    playerEntity: PlayerEntity,
    enemySnapshot: EnemySnapshot
  ) {
    this.battleId = battleId;
    const classInfo = CLASS_STATS[playerEntity.hunterClass] ?? CLASS_STATS.WARRIOR;

    this.skillDefs = new Map();
    const skillsCopy = classInfo.defaultSkills.map((s) => {
      this.skillDefs.set(s.id, s);
      return { ...s, currentCooldown: 0 };
    });

    this.player = {
      id: playerEntity.id,
      name: playerEntity.name,
      rank: playerEntity.rank,
      hunterClass: playerEntity.hunterClass,
      hp: playerEntity.hp,
      maxHp: playerEntity.maxHp,
      mp: playerEntity.mp,
      maxMp: playerEntity.maxMp,
      skills: skillsCopy
    };

    this.enemy = {
      id: enemySnapshot.id,
      name: enemySnapshot.name,
      rank: enemySnapshot.rank,
      hp: enemySnapshot.hp,
      maxHp: enemySnapshot.maxHp,
      mp: enemySnapshot.mp,
      maxMp: enemySnapshot.maxMp
    };

    this.log.push(
      `Confronto iniciado! ${this.player.name} (${classInfo.title}) vs [${this.enemy.rank}] ${this.enemy.name}.`
    );
  }

  executeAction(actionId: string): {
    success: boolean;
    error?: "NOT_ENOUGH_MP" | "SKILL_ON_COOLDOWN" | "INVALID_PAYLOAD";
  } {
    if (this.finished) return { success: false, error: "INVALID_PAYLOAD" };

    const skillDef = this.skillDefs.get(actionId);
    const skillState = this.player.skills.find((s) => s.id === actionId);

    if (!skillDef || !skillState) {
      return { success: false, error: "INVALID_PAYLOAD" };
    }

    if (this.player.mp < skillDef.mpCost) {
      return { success: false, error: "NOT_ENOUGH_MP" };
    }

    if (skillState.currentCooldown > 0) {
      return { success: false, error: "SKILL_ON_COOLDOWN" };
    }

    // Spend MP
    this.player.mp -= skillDef.mpCost;

    // Apply Player Action
    let playerLog = `[Turno ${this.turn}] Você usou ${skillDef.name}`;
    if (skillDef.baseDamage > 0) {
      this.enemy.hp = Math.max(0, this.enemy.hp - skillDef.baseDamage);
      playerLog += ` causando ${skillDef.baseDamage} de dano!`;
    }
    if (skillDef.healAmount > 0) {
      const heal = Math.min(this.player.maxHp - this.player.hp, skillDef.healAmount);
      this.player.hp += heal;
      playerLog += ` e recuperou ${heal} de HP!`;
    }
    this.log.push(playerLog);

    // Enemy Turn (if alive)
    if (this.enemy.hp > 0) {
      const enemyDmg = this.enemy.rank === "D" ? 18 : 12;
      this.player.hp = Math.max(0, this.player.hp - enemyDmg);
      this.log.push(
        `[Turno ${this.turn}] ${this.enemy.name} revidou causando ${enemyDmg} de dano a você!`
      );
    }

    // Decrement cooldowns for other skills, and set cooldown for the used skill
    for (const s of this.player.skills) {
      if (s.id === actionId) {
        s.currentCooldown = skillDef.cooldownTurns;
      } else if (s.currentCooldown > 0) {
        s.currentCooldown = Math.max(0, s.currentCooldown - 1);
      }
    }

    // Check End Conditions (including DRAW / Empate)
    if (this.player.hp <= 0 && this.enemy.hp <= 0) {
      this.finished = true;
      this.result = "DRAW";
      this.log.push("Empate fatal! Ambos caíram simultaneamente.");
    } else if (this.enemy.hp <= 0) {
      this.finished = true;
      this.result = "VICTORY";
      this.rewardExp = this.enemy.rank === "D" ? 80 : 40;
      this.log.push(`Vitória gloriosa! [${this.enemy.rank}] ${this.enemy.name} foi derrotado! (+${this.rewardExp} EXP)`);
    } else if (this.player.hp <= 0) {
      this.finished = true;
      this.result = "DEFEAT";
      this.log.push(`Você foi derrotado por ${this.enemy.name}!`);
    } else {
      this.turn++;
      if (this.turn > this.maxTurns) {
        this.finished = true;
        this.result = "DRAW";
        this.log.push("Tempo esgotado! Batalha empatada por limite de turnos.");
      }
    }

    return { success: true };
  }

  flee(): void {
    if (this.finished) return;
    this.finished = true;
    this.result = "FLED";
    this.log.push("Você recuou e escapou estrategicamente do confronto.");
  }

  toSnapshot(): BattleSnapshot {
    return {
      battleId: this.battleId,
      turn: this.turn,
      maxTurns: this.maxTurns,
      player: {
        ...this.player,
        skills: this.player.skills.map((s) => ({ ...s }))
      },
      enemy: { ...this.enemy },
      log: [...this.log],
      finished: this.finished,
      result: this.result,
      rewardExp: this.rewardExp > 0 ? this.rewardExp : undefined
    };
  }
}
