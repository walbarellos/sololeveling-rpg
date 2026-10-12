import {
  mobExp,
  statMult,
  type BattleEvent,
  type BattleParticipant,
  type BattlePlayerParticipant,
  type BattleRewards,
  type BattleSnapshot,
  type EnemySnapshot,
  type ItemDefinition
} from "@rpg/contracts";
import type { PlayerEntity } from "./player.repository";
import { CLASS_STATS, calculatePlayerStats, type SkillDefinition } from "./skills.data";

export type RngFn = () => number;

export class BattleSession {
  public readonly battleId: string;
  public turn = 1;
  public readonly maxTurns = 20;
  public player: BattlePlayerParticipant;
  public enemy: BattleParticipant;
  public log: string[] = [];
  public finished = false;
  public result?: "VICTORY" | "DEFEAT" | "DRAW" | "FLED";
  public drawReason?: "MUTUAL_DEATH" | "TURN_LIMIT";
  public rewardExp = 0;
  /** Preenchido pelo GameService ao aplicar o EXP (a sessão não conhece o estado persistente). */
  public rewards?: BattleRewards;
  /** Eventos do último turno resolvido, na ordem em que aconteceram. */
  public events: BattleEvent[] = [];
  public consumablesRemaining = 2;
  public readonly isGateBoss: boolean;
  public turnCareerCounters = { crits: 0, dodges: 0, blocks: 0 };

  private skillDefs: Map<string, SkillDefinition>;
  private readonly enemyDamageBase: number;
  public rng: RngFn;

  constructor(
    battleId: string,
    playerEntity: PlayerEntity,
    enemySnapshot: EnemySnapshot,
    rng?: RngFn
  ) {
    this.battleId = battleId;
    this.rng = rng ?? (() => (process.env.NODE_ENV === "test" ? 0.99 : Math.random()));

    const classInfo = CLASS_STATS[playerEntity.hunterClass] ?? CLASS_STATS.WARRIOR;

    this.skillDefs = new Map();
    const mult = statMult(playerEntity.level);
    const skillsCopy = classInfo.defaultSkills.map((s) => {
      // Dano e cura escalam com o nível (Lv1 = valores base).
      const scaled: SkillDefinition = {
        ...s,
        baseDamage: Math.floor(s.baseDamage * mult),
        healAmount: Math.floor(s.healAmount * mult)
      };
      this.skillDefs.set(s.id, scaled);
      return { ...s, currentCooldown: 0 };
    });

    this.player = {
      id: playerEntity.id,
      name: playerEntity.name,
      rank: playerEntity.rank,
      level: playerEntity.level,
      hunterClass: playerEntity.hunterClass,
      hp: playerEntity.hp,
      maxHp: playerEntity.maxHp,
      mp: playerEntity.mp,
      maxMp: playerEntity.maxMp,
      skills: skillsCopy,
      stats: calculatePlayerStats(
        playerEntity.hunterClass,
        playerEntity.level,
        playerEntity.attributes
      )
    };

    this.enemy = {
      id: enemySnapshot.id,
      name: enemySnapshot.name,
      rank: enemySnapshot.rank,
      level: enemySnapshot.level,
      hp: enemySnapshot.hp,
      maxHp: enemySnapshot.maxHp,
      mp: enemySnapshot.mp,
      maxMp: enemySnapshot.maxMp
    };
    this.enemyDamageBase = Math.round(
      (enemySnapshot.rank === "C" ? 24 : enemySnapshot.rank === "D" ? 18 : 12) * statMult(enemySnapshot.level)
    );

    this.isGateBoss =
      enemySnapshot.name.toLowerCase().includes("chefe") ||
      enemySnapshot.name.toLowerCase().includes("boss");

    this.log.push(
      `[SISTEMA] Confronto iniciado! [${this.player.rank}] ${this.player.name} (${classInfo.title}) VS [${this.enemy.rank}] ${this.enemy.name}.`
    );
  }

  setRng(fn: RngFn) {
    this.rng = fn;
  }

  /** Escreve a linha de log e registra o evento correspondente (mesma ordem, mesmo índice). */
  private note(
    text: string,
    kind: BattleEvent["kind"],
    target: BattleEvent["target"],
    amount: number,
    targetHpAfter: number
  ): void {
    this.log.push(text);
    this.events.push({ kind, target, amount, targetHpAfter, logIndex: this.log.length - 1 });
  }

  executeConsumable(item: ItemDefinition): {
    success: boolean;
    error?: "CONSUMABLE_CHARGES_EXHAUSTED" | "INVALID_PAYLOAD";
  } {
    if (this.finished) return { success: false, error: "INVALID_PAYLOAD" };
    if (this.consumablesRemaining <= 0) {
      return { success: false, error: "CONSUMABLE_CHARGES_EXHAUSTED" };
    }
    if (item.type !== "CONSUMABLE") {
      return { success: false, error: "INVALID_PAYLOAD" };
    }

    this.events = [];
    this.consumablesRemaining--;

    // Aplica cura de vida ou restauração de mana
    if (item.healAmount && item.healAmount > 0) {
      const heal = Math.min(this.player.maxHp - this.player.hp, item.healAmount);
      this.player.hp += heal;
      this.note(
        `[CONSUMÍVEL] Você bebeu ${item.name} recuperando +${heal} de HP! (${this.consumablesRemaining} uso(s) restante(s)).`,
        "HEAL",
        "player",
        heal,
        this.player.hp
      );
    }
    if (item.manaAmount && item.manaAmount > 0) {
      const mana = Math.min(this.player.maxMp - this.player.mp, item.manaAmount);
      this.player.mp += mana;
      this.note(
        `[CONSUMÍVEL] Você usou ${item.name} restaurando +${mana} de Mana! (${this.consumablesRemaining} uso(s) restante(s)).`,
        "HEAL",
        "player",
        mana,
        this.player.hp
      );
    }

    // Retaliação do monstro
    this.resolveEnemyRetaliation();

    // Reduz cooldowns das habilidades do jogador em 1 turno
    for (const s of this.player.skills) {
      if (s.currentCooldown > 0) {
        s.currentCooldown = Math.max(0, s.currentCooldown - 1);
      }
    }

    this.checkEndConditions();
    return { success: true };
  }

  executeAction(actionId: string): {
    success: boolean;
    error?: "NOT_ENOUGH_MP" | "SKILL_ON_COOLDOWN" | "INVALID_PAYLOAD";
  } {
    if (this.finished) return { success: false, error: "INVALID_PAYLOAD" };
    this.events = [];

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

    const enemyHpAtStart = this.enemy.hp;

    // Spend MP
    this.player.mp -= skillDef.mpCost;

    // --- PLAYER ACTION RESOLUTION ---
    let playerDmg = skillDef.baseDamage;
    let isCrit = false;
    let isEnemyBlock = false;

    if (playerDmg > 0) {
      const critChance = this.player.stats?.critChance ?? 0.15;
      const enemyDodgeChance = this.enemy.rank === "D" ? 0.12 : 0.06;
      const enemyBlockChance = 0.10;

      if (this.rng() < enemyDodgeChance) {
        playerDmg = 0;
        this.note(
          `[ESQUIVA] [${this.enemy.rank}] ${this.enemy.name} se esquivou agilmente de ${skillDef.name}! (0 de dano)`,
          "DODGE",
          "enemy",
          0,
          this.enemy.hp
        );
      } else {
        if (this.rng() < critChance) {
          isCrit = true;
          this.turnCareerCounters.crits++;
          playerDmg = Math.floor(playerDmg * 1.6);
        } else if (this.rng() < enemyBlockChance) {
          isEnemyBlock = true;
          playerDmg = Math.floor(playerDmg * 0.5);
        }

        this.enemy.hp = Math.max(0, this.enemy.hp - playerDmg);

        if (isCrit) {
          this.note(
            `[CRÍTICO] GOLPE CRÍTICO! Você usou ${skillDef.name} causando ${playerDmg} de dano devastador!`,
            "CRIT",
            "enemy",
            playerDmg,
            this.enemy.hp
          );
        } else if (isEnemyBlock) {
          this.note(
            `[BLOQUEIO] ${this.enemy.name} aparou parte do golpe! ${skillDef.name} causou ${playerDmg} de dano.`,
            "BLOCK",
            "enemy",
            playerDmg,
            this.enemy.hp
          );
        } else {
          this.note(
            `[DANO] Você usou ${skillDef.name} causando ${playerDmg} de dano a ${this.enemy.name}.`,
            "HIT",
            "enemy",
            playerDmg,
            this.enemy.hp
          );
        }
      }
    }

    if (skillDef.healAmount > 0) {
      const heal = Math.min(this.player.maxHp - this.player.hp, skillDef.healAmount);
      this.player.hp += heal;
      this.note(
        `[CURA] Canalização Sagrada! Você restaurou +${heal} de HP (Vida atual: ${this.player.hp}/${this.player.maxHp}).`,
        "HEAL",
        "player",
        heal,
        this.player.hp
      );
    }

    // --- ENEMY ACTION RESOLUTION (simultaneous turn like Naruto Game) ---
    if (enemyHpAtStart > 0) {
      this.resolveEnemyRetaliation();
    }

    // Decrement cooldowns for other skills, and set cooldown for the used skill
    for (const s of this.player.skills) {
      if (s.id === actionId) {
        s.currentCooldown = skillDef.cooldownTurns;
      } else if (s.currentCooldown > 0) {
        s.currentCooldown = Math.max(0, s.currentCooldown - 1);
      }
    }

    this.checkEndConditions();
    return { success: true };
  }

  private resolveEnemyRetaliation(): void {
    let enemyDmg = this.enemyDamageBase;
    const playerDodgeChance = this.player.stats?.dodgeChance ?? 0.08;
    const playerBlockChance = this.player.stats?.blockChance ?? 0.10;

    if (this.rng() < playerDodgeChance) {
      this.turnCareerCounters.dodges++;
      this.note(
        `[ESQUIVA] Você previu o movimento de ${this.enemy.name} e se esquivou com maestria! (0 de dano sofrido)`,
        "DODGE",
        "player",
        0,
        this.player.hp
      );
    } else if (this.rng() < playerBlockChance) {
      this.turnCareerCounters.blocks++;
      enemyDmg = Math.floor(enemyDmg * 0.5);
      this.player.hp = Math.max(0, this.player.hp - enemyDmg);
      this.note(
        `[BLOQUEIO] Você ergueu a guarda e bloqueou o impacto! Sofreu apenas ${enemyDmg} de dano de ${this.enemy.name}.`,
        "BLOCK",
        "player",
        enemyDmg,
        this.player.hp
      );
    } else {
      this.player.hp = Math.max(0, this.player.hp - enemyDmg);
      this.note(
        `[DANO] ${this.enemy.name} revidou com ferocidade causando ${enemyDmg} de dano em você!`,
        "HIT",
        "player",
        enemyDmg,
        this.player.hp
      );
    }
  }

  private checkEndConditions(): void {
    if (this.player.hp <= 0 && this.enemy.hp <= 0) {
      this.finished = true;
      this.result = "DRAW";
      this.drawReason = "MUTUAL_DEATH";
      this.rewardExp = Math.floor(mobExp(this.enemy.level) / 2);
      this.note(
        "[EMPATE] Golpe mútuo fatal! Ambos os combatentes tombaram ao mesmo tempo.",
        "DEATH",
        "enemy",
        0,
        0
      );
      this.events.push({ kind: "DEATH", target: "player", amount: 0, targetHpAfter: 0, logIndex: this.log.length - 1 });
    } else if (this.enemy.hp <= 0) {
      this.finished = true;
      this.result = "VICTORY";
      // Chefes de Gate rendem 5x o EXP de um monstro comum do mesmo nível.
      this.rewardExp = mobExp(this.enemy.level) * (this.isGateBoss ? 5 : 1);
      this.note(
        `[VITÓRIA] Oponente aniquilado! [${this.enemy.rank}] ${this.enemy.name} foi eliminado (+${this.rewardExp} EXP).`,
        "DEATH",
        "enemy",
        0,
        0
      );
    } else if (this.player.hp <= 0) {
      this.finished = true;
      this.result = "DEFEAT";
      this.note(
        `[DERROTA] Você foi sobrepujado por [${this.enemy.rank}] ${this.enemy.name}!`,
        "DEATH",
        "player",
        0,
        0
      );
    } else {
      this.turn++;
      if (this.turn > this.maxTurns) {
        this.finished = true;
        this.result = "DRAW";
        this.drawReason = "TURN_LIMIT";
        this.rewardExp = 0;
        this.log.push(
          `[RECUO TÁTICO] Limite de ${this.maxTurns} turnos atingido! Você recuou taticamente perante a resistência de [${this.enemy.rank}] ${this.enemy.name}.`
        );
      }
    }
  }

  flee(): void {
    if (this.finished) return;
    this.events = [];
    this.finished = true;
    this.result = "FLED";
    this.log.push("[FUGA] Você recuou taticamente e escapou com segurança.");
  }

  toSnapshot(): BattleSnapshot {
    return {
      battleId: this.battleId,
      turn: this.turn,
      maxTurns: this.maxTurns,
      player: {
        ...this.player,
        skills: this.player.skills.map((s) => ({ ...s })),
        stats: this.player.stats ? { ...this.player.stats } : undefined
      },
      enemy: { ...this.enemy },
      log: [...this.log],
      finished: this.finished,
      result: this.result,
      drawReason: this.drawReason,
      rewardExp: this.rewardExp > 0 ? this.rewardExp : undefined,
      rewards: this.rewards ? { ...this.rewards } : undefined,
      events: this.events.map((e) => ({ ...e })),
      consumablesRemaining: this.consumablesRemaining,
      isGateBoss: this.isGateBoss
    };
  }
}
