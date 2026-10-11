import { Inject, Injectable, Optional } from "@nestjs/common";
import {
  MISSIONS,
  RANK_CAP,
  applyExp,
  expToNext,
  isRankAllowed,
  mobExp,
  statMult,
  type BattleRewards,
  type BattleSnapshot,
  type CombatLog,
  type Direction,
  type EnemySnapshot,
  type HunterClass,
  type HunterRank,
  type MissionClaimResult,
  type MissionRun,
  type MissionsState,
  type PlayerSnapshot,
  type ServerErrorCode,
  type TileCoord,
  type WorldSnapshot
} from "@rpg/contracts";
import { BattleSession } from "./battle.session";
import { CLOCK, SystemClock, type Clock } from "./clock";
import {
  InMemoryPlayerRepository,
  PLAYER_REPOSITORY,
  type PlayerEntity,
  type PlayerRepository
} from "./player.repository";
import { CLASS_STATS, calculatePlayerStats } from "./skills.data";

export const GRID_WIDTH = 20;
export const GRID_HEIGHT = 12;
export const TILE_SIZE = 48;
export const STEP_COOLDOWN_MS = 200;
export const ATTACK_COOLDOWN_MS = 600;
export const PLAYER_ATTACK_DAMAGE = 30;
/** Respawn lazy: o monstro volta a ficar vivo na próxima leitura do mundo após este intervalo. */
export const ENEMY_RESPAWN_MS = 30_000;

export interface MobTemplate {
  name: string;
  rank: HunterRank;
  baseHp: number;
  baseMp: number;
}

export const MOB_TEMPLATES: Record<string, MobTemplate> = {
  slime: {
    name: "Dungeon Slime",
    rank: "E",
    baseHp: 60,
    baseMp: 10
  },
  goblin: {
    name: "Gate Goblin",
    rank: "E",
    baseHp: 68,
    baseMp: 17
  },
  wolf: {
    name: "Shadow Wolf",
    rank: "D",
    baseHp: 83,
    baseMp: 21
  }
};

export function createEnemyInstance(
  id: string,
  templateKey: keyof typeof MOB_TEMPLATES,
  level: number,
  position: TileCoord
): EnemySnapshot {
  const template = MOB_TEMPLATES[templateKey];
  const mult = statMult(level);
  const hp = Math.round(template.baseHp * mult);
  const mp = Math.round(template.baseMp * mult);
  return {
    id,
    name: template.name,
    rank: template.rank,
    level,
    position,
    hp,
    maxHp: hp,
    mp,
    maxMp: mp,
    alive: true
  };
}

export const DEFAULT_OBSTACLES: readonly TileCoord[] = [
  { x: 5, y: 3 },
  { x: 5, y: 4 },
  { x: 5, y: 5 },
  { x: 14, y: 6 },
  { x: 14, y: 7 },
  { x: 14, y: 8 },
  { x: 9, y: 2 },
  { x: 10, y: 2 },
  { x: 9, y: 9 },
  { x: 10, y: 9 }
];

export type StepResult =
  | { success: true; player: PlayerSnapshot }
  | { success: false; error: ServerErrorCode };

export type AttackResult =
  | { success: true; log: CombatLog; player: PlayerSnapshot }
  | { success: false; error: ServerErrorCode };

@Injectable()
export class GameService {
  private readonly obstacleSet = new Set<string>();
  private readonly enemies = new Map<string, EnemySnapshot>([
    ["slime-1", createEnemyInstance("slime-1", "slime", 1, { x: 7, y: 4 })],
    ["goblin-1", createEnemyInstance("goblin-1", "goblin", 3, { x: 12, y: 7 })],
    ["wolf-1", createEnemyInstance("wolf-1", "wolf", 6, { x: 16, y: 3 })]
  ]);
  private readonly activeBattles = new Map<string, BattleSession>();
  private readonly online = new Set<string>();
  private readonly diedAt = new Map<string, number>();
  private sequence = 0;
  private battleCounter = 0;
  private missionCounter = 0;

  constructor(
    @Optional() @Inject(CLOCK) private readonly clock: Clock = new SystemClock(),
    @Optional()
    @Inject(PLAYER_REPOSITORY)
    private readonly playerRepository: PlayerRepository = new InMemoryPlayerRepository()
  ) {
    for (const obs of DEFAULT_OBSTACLES) {
      this.obstacleSet.add(`${obs.x},${obs.y}`);
    }
  }

  get dimensions() {
    return {
      gridWidth: GRID_WIDTH,
      gridHeight: GRID_HEIGHT,
      tileSize: TILE_SIZE,
      obstacles: [...DEFAULT_OBSTACLES]
    };
  }

  connect(id: string): PlayerSnapshot {
    const existing = this.playerRepository.findById(id) as PlayerEntity | null;
    const now = this.clock.nowMs();
    this.online.add(id);

    if (existing) {
      // Reconexão (F5, aba nova): batalha em andamento é abandonada, o resto do estado persiste.
      if (existing.activeBattleId) {
        this.activeBattles.delete(existing.activeBattleId);
        existing.inBattle = false;
        existing.activeBattleId = undefined;
      }
      existing.lastStepAt = now;
      this.playerRepository.save(existing);
      return this.toSnapshot(existing);
    }

    const defaultClass: HunterClass = "BATTLE_HEALER";
    const classStats = CLASS_STATS[defaultClass];

    const newPlayer: PlayerEntity = {
      id,
      name: `Hunter-${id.slice(0, 4)}`,
      rank: "E",
      hunterClass: defaultClass,
      level: 1,
      exp: 0,
      position: { x: 2, y: 2 },
      hp: classStats.baseHp,
      maxHp: classStats.baseHp,
      mp: classStats.baseMp,
      maxMp: classStats.baseMp,
      stamina: 50,
      maxStamina: 50,
      inBattle: false,
      sequence: ++this.sequence,
      lastStepAt: now,
      lastAttackAt: 0
    };

    this.playerRepository.save(newPlayer);
    return this.toSnapshot(newPlayer);
  }

  disconnect(id: string) {
    this.online.delete(id);
    const player = this.playerRepository.findById(id) as PlayerEntity | null;
    if (player && player.activeBattleId) {
      this.activeBattles.delete(player.activeBattleId);
      player.inBattle = false;
      player.activeBattleId = undefined;
      this.playerRepository.save(player);
    }
  }

  selectClass(id: string, hunterClass: HunterClass): PlayerSnapshot | null {
    const player = this.playerRepository.findById(id) as PlayerEntity | null;
    if (!player || player.inBattle) return null;

    player.hunterClass = hunterClass;
    this.recomputeMaxStats(player);
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    player.sequence = ++this.sequence;
    this.playerRepository.save(player);

    return this.toSnapshot(player);
  }

  step(id: string, direction: Direction): StepResult {
    const player = this.playerRepository.findById(id) as PlayerEntity | null;
    if (!player) {
      return { success: false, error: "OUT_OF_BOUNDS" };
    }
    this.reviveEnemies();

    if (player.inBattle) {
      return { success: false, error: "ALREADY_IN_BATTLE" };
    }

    const now = this.clock.nowMs();
    if (now - player.lastStepAt < STEP_COOLDOWN_MS) {
      return { success: false, error: "TOO_FAST" };
    }

    const delta = this.getDirectionDelta(direction);
    const targetX = player.position.x + delta.dx;
    const targetY = player.position.y + delta.dy;

    if (!this.isInBounds(targetX, targetY)) {
      return { success: false, error: "OUT_OF_BOUNDS" };
    }

    if (this.isObstacle(targetX, targetY)) {
      return { success: false, error: "OBSTACLE" };
    }

    // Check if an alive enemy blocks this tile
    for (const enemy of this.enemies.values()) {
      if (enemy.alive && enemy.position.x === targetX && enemy.position.y === targetY) {
        return { success: false, error: "OBSTACLE" };
      }
    }

    player.position = { x: targetX, y: targetY };
    player.lastStepAt = now;
    player.sequence = ++this.sequence;
    this.playerRepository.save(player);

    return { success: true, player: this.toSnapshot(player) };
  }

  startBattle(
    playerId: string,
    targetEnemyId: string
  ): { success: boolean; battle?: BattleSnapshot; error?: ServerErrorCode } {
    this.reviveEnemies();
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    const enemy = this.enemies.get(targetEnemyId);

    if (!player || !enemy || !enemy.alive) {
      return { success: false, error: "TARGET_UNAVAILABLE" };
    }

    if (player.inBattle) {
      return { success: false, error: "ALREADY_IN_BATTLE" };
    }

    // Proximity check: Chebyshev distance <= 1
    const dx = Math.abs(player.position.x - enemy.position.x);
    const dy = Math.abs(player.position.y - enemy.position.y);
    if (Math.max(dx, dy) > 1) {
      return { success: false, error: "TOO_FAR" };
    }

    const battleId = `battle-${++this.battleCounter}`;
    const session = new BattleSession(battleId, player, enemy);
    this.activeBattles.set(battleId, session);

    player.inBattle = true;
    player.activeBattleId = battleId;
    player.sequence = ++this.sequence;
    this.playerRepository.save(player);

    return { success: true, battle: session.toSnapshot() };
  }

  executeBattleAction(
    playerId: string,
    battleId: string,
    actionId: string
  ): { success: boolean; battle?: BattleSnapshot; error?: ServerErrorCode } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    const session = this.activeBattles.get(battleId);

    if (!player || !session || session.player.id !== playerId) {
      return { success: false, error: "BATTLE_NOT_FOUND" };
    }

    const result = session.executeAction(actionId);
    if (!result.success) {
      return { success: false, error: result.error as ServerErrorCode };
    }

    if (session.finished) {
      this.resolveBattleEnd(player, session);
    }

    return { success: true, battle: session.toSnapshot() };
  }

  fleeBattle(
    playerId: string,
    battleId: string
  ): { success: boolean; battle?: BattleSnapshot; error?: ServerErrorCode } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    const session = this.activeBattles.get(battleId);

    if (!player || !session || session.player.id !== playerId) {
      return { success: false, error: "BATTLE_NOT_FOUND" };
    }

    session.flee();
    this.resolveBattleEnd(player, session);

    return { success: true, battle: session.toSnapshot() };
  }

  private resolveBattleEnd(player: PlayerEntity, session: BattleSession): void {
    player.inBattle = false;
    player.activeBattleId = undefined;

    const kill = (): void => {
      const enemy = this.enemies.get(session.enemy.id);
      if (enemy) this.killEnemy(enemy);
    };

    if (session.result === "VICTORY") {
      kill();
      player.hp = Math.max(1, session.player.hp);
      player.mp = Math.max(0, session.player.mp);
    } else if (session.result === "DEFEAT") {
      // Defeated: respawn at entrance
      player.position = { x: 2, y: 2 };
      player.hp = player.maxHp;
      player.mp = player.maxMp;
    } else if (session.result === "DRAW") {
      if (session.drawReason === "TURN_LIMIT" || (session.player.hp > 0 && session.enemy.hp > 0)) {
        // Recuo tático por limite de turnos: monstro permanece vivo com o HP restante
        const enemy = this.enemies.get(session.enemy.id);
        if (enemy) {
          enemy.hp = Math.max(1, session.enemy.hp);
        }
        player.hp = Math.max(1, session.player.hp);
        player.mp = Math.max(0, session.player.mp);
      } else {
        // Empate por morte simultânea: ambos caem, monstro derrotado e player respawna
        kill();
        player.position = { x: 2, y: 2 };
        player.hp = Math.floor(player.maxHp * 0.5);
        player.mp = Math.floor(player.maxMp * 0.5);
      }
    } else if (session.result === "FLED") {
      player.hp = Math.max(1, session.player.hp);
      player.mp = Math.max(0, session.player.mp);
    }

    // Servidor é a única fonte de EXP: o valor vem da sessão, nunca do cliente.
    if (session.rewardExp > 0) {
      this.grantExp(player, session);
    }

    player.sequence = ++this.sequence;
    this.playerRepository.save(player);
    this.activeBattles.delete(session.battleId);
  }

  private grantExp(player: PlayerEntity, session: BattleSession): void {
    const before = { level: player.level, exp: player.exp };
    const result = applyExp(player, session.rewardExp);
    player.level = result.level;
    player.exp = result.exp;

    if (result.level > before.level) {
      // Level up: stats escalam e HP/MP voltam cheios.
      this.recomputeMaxStats(player);
      player.hp = player.maxHp;
      player.mp = player.maxMp;
    }

    session.rewards = {
      expGained: session.rewardExp,
      levelBefore: before.level,
      levelAfter: result.level,
      expBefore: before.exp,
      expAfter: result.exp,
      capped: result.capped,
      levelCap: RANK_CAP[player.rank]
    };
  }

  private recomputeMaxStats(player: PlayerEntity): void {
    const stats = CLASS_STATS[player.hunterClass];
    const mult = statMult(player.level);
    player.maxHp = Math.floor(stats.baseHp * mult);
    player.maxMp = Math.floor(stats.baseMp * mult);
  }

  private killEnemy(enemy: EnemySnapshot): void {
    enemy.alive = false;
    this.diedAt.set(enemy.id, this.clock.nowMs());
  }

  /** Respawn lazy (ADR 5): sem timers, avalia o tempo decorrido ao ler o mundo. */
  private reviveEnemies(): void {
    const now = this.clock.nowMs();
    const players = this.playerRepository.findAll() as PlayerEntity[];
    for (const enemy of this.enemies.values()) {
      if (enemy.alive) continue;
      const died = this.diedAt.get(enemy.id);
      if (died === undefined || now - died < ENEMY_RESPAWN_MS) continue;
      const occupied = players.some(
        (p) => p.position.x === enemy.position.x && p.position.y === enemy.position.y
      );
      if (occupied) continue; // espera o tile ficar livre
      enemy.alive = true;
      enemy.hp = enemy.maxHp;
      enemy.mp = enemy.maxMp;
      this.diedAt.delete(enemy.id);
    }
  }

  // Backwards-compatible legacy quick attack method
  attack(attackerId: string, targetId: string): AttackResult {
    const player = this.playerRepository.findById(attackerId) as PlayerEntity | null;
    const enemy = this.enemies.get(targetId);

    if (!player || !enemy || !enemy.alive) {
      return { success: false, error: "TARGET_UNAVAILABLE" };
    }

    const dx = Math.abs(player.position.x - enemy.position.x);
    const dy = Math.abs(player.position.y - enemy.position.y);
    if (Math.max(dx, dy) > 1) {
      return { success: false, error: "TOO_FAR" };
    }

    const now = this.clock.nowMs();
    if (now - player.lastAttackAt < ATTACK_COOLDOWN_MS) {
      return { success: false, error: "COOLDOWN" };
    }

    player.lastAttackAt = now;
    enemy.hp = Math.max(0, enemy.hp - PLAYER_ATTACK_DAMAGE);
    enemy.alive = enemy.hp > 0;
    if (!enemy.alive) this.killEnemy(enemy);

    let counterDamage = 0;
    if (enemy.alive) {
      counterDamage = enemy.rank === "D" ? 15 : 10;
      player.hp = Math.max(0, player.hp - counterDamage);
      if (player.hp === 0) {
        player.position = { x: 2, y: 2 };
        player.hp = player.maxHp;
      }
    }

    player.sequence = ++this.sequence;
    this.playerRepository.save(player);

    const log: CombatLog = {
      attackerId,
      targetId,
      damage: PLAYER_ATTACK_DAMAGE,
      counterDamage: counterDamage > 0 ? counterDamage : undefined,
      targetHp: enemy.hp,
      attackerHp: player.hp,
      defeated: !enemy.alive,
      sequence: ++this.sequence
    };

    return { success: true, log, player: this.toSnapshot(player) };
  }

  getMissionsState(playerId: string): MissionsState {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    const now = this.clock.nowMs();
    let activeRun: MissionRun | null = null;
    if (player?.activeMission) {
      activeRun = {
        ...player.activeMission,
        completed: now >= player.activeMission.endsAt
      };
    }
    return {
      available: [...MISSIONS],
      activeRun,
      serverTime: now
    };
  }

  startMission(
    playerId: string,
    missionId: string
  ): { success: boolean; state?: MissionsState; error?: ServerErrorCode } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return { success: false, error: "TARGET_UNAVAILABLE" };

    if (player.activeMission) {
      return { success: false, error: "MISSION_ALREADY_ACTIVE" };
    }

    const mission = MISSIONS.find((m) => m.id === missionId);
    if (!mission) {
      return { success: false, error: "MISSION_NOT_FOUND" };
    }

    if (!isRankAllowed(player.rank, mission.minRank) || player.level < mission.minLevel) {
      return { success: false, error: "MISSION_LOCKED" };
    }

    const now = this.clock.nowMs();
    const runId = `mission-${player.id}-${now}-${++this.missionCounter}`;
    const potentialExp = mobExp(player.level) * mission.killsEquiv;

    player.activeMission = {
      runId,
      missionId: mission.id,
      name: mission.name,
      startedAt: now,
      endsAt: now + mission.durationMs,
      durationMs: mission.durationMs,
      killsEquiv: mission.killsEquiv,
      potentialExp,
      completed: false
    };

    this.playerRepository.save(player);
    return { success: true, state: this.getMissionsState(playerId) };
  }

  claimMission(
    playerId: string,
    runId: string
  ): {
    success: boolean;
    result?: MissionClaimResult;
    player?: PlayerSnapshot;
    error?: ServerErrorCode;
  } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return { success: false, error: "TARGET_UNAVAILABLE" };

    // ADR 10: Idempotência de recompensas
    if (player.lastClaimedMissionRunId === runId) {
      return { success: false, error: "MISSION_ALREADY_CLAIMED" };
    }

    if (!player.activeMission || player.activeMission.runId !== runId) {
      return { success: false, error: "NO_ACTIVE_MISSION" };
    }

    // ADR 5: Avaliação lazy por timestamp, sem timers de servidor
    const now = this.clock.nowMs();
    if (now < player.activeMission.endsAt) {
      return { success: false, error: "MISSION_IN_PROGRESS" };
    }

    const missionRun = player.activeMission;
    const expGained = missionRun.potentialExp;

    const before = { level: player.level, exp: player.exp };
    const expResult = applyExp(player, expGained);
    player.level = expResult.level;
    player.exp = expResult.exp;

    if (expResult.level > before.level) {
      this.recomputeMaxStats(player);
      player.hp = player.maxHp;
      player.mp = player.maxMp;
    }

    const rewards: BattleRewards = {
      expGained,
      levelBefore: before.level,
      levelAfter: expResult.level,
      expBefore: before.exp,
      expAfter: expResult.exp,
      capped: expResult.capped,
      levelCap: RANK_CAP[player.rank]
    };

    player.lastClaimedMissionRunId = runId;
    player.activeMission = undefined;
    player.sequence = ++this.sequence;
    this.playerRepository.save(player);

    const result: MissionClaimResult = {
      success: true,
      runId,
      missionId: missionRun.missionId,
      expGained,
      rewards,
      message: `Missão "${missionRun.name}" concluída com sucesso! +${expGained} EXP coletados.`
    };

    return { success: true, result, player: this.toSnapshot(player) };
  }

  cancelMission(
    playerId: string,
    runId: string
  ): { success: boolean; state?: MissionsState; error?: ServerErrorCode } {
    const player = this.playerRepository.findById(playerId) as PlayerEntity | null;
    if (!player) return { success: false, error: "TARGET_UNAVAILABLE" };

    if (!player.activeMission || player.activeMission.runId !== runId) {
      return { success: false, error: "NO_ACTIVE_MISSION" };
    }

    player.activeMission = undefined;
    this.playerRepository.save(player);
    return { success: true, state: this.getMissionsState(playerId) };
  }

  snapshot(): WorldSnapshot {
    this.reviveEnemies();
    // Só jogadores online aparecem no mundo; o estado persistente continua no repositório.
    const allPlayers = (this.playerRepository.findAll() as PlayerEntity[])
      .filter((p) => this.online.has(p.id))
      .map((p) => this.toSnapshot(p));
    return {
      players: allPlayers,
      enemies: [...this.enemies.values()].map((e) => ({
        ...e,
        position: { ...e.position }
      })),
      obstacles: [...DEFAULT_OBSTACLES],
      serverTime: this.clock.nowMs()
    };
  }

  private toSnapshot(p: PlayerEntity): PlayerSnapshot {
    return {
      id: p.id,
      name: p.name,
      rank: p.rank,
      hunterClass: p.hunterClass,
      level: p.level,
      exp: p.exp,
      expToNext: expToNext(p.level),
      levelCap: RANK_CAP[p.rank],
      position: { ...p.position },
      hp: p.hp,
      maxHp: p.maxHp,
      mp: p.mp,
      maxMp: p.maxMp,
      stamina: p.stamina,
      maxStamina: p.maxStamina,
      stats: calculatePlayerStats(p.hunterClass, p.level),
      inBattle: p.inBattle,
      activeBattleId: p.activeBattleId,
      sequence: p.sequence
    };
  }

  private isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;
  }

  private isObstacle(x: number, y: number): boolean {
    return this.obstacleSet.has(`${x},${y}`);
  }

  private getDirectionDelta(dir: Direction): { dx: number; dy: number } {
    switch (dir) {
      case "UP":
        return { dx: 0, dy: -1 };
      case "DOWN":
        return { dx: 0, dy: 1 };
      case "LEFT":
        return { dx: -1, dy: 0 };
      case "RIGHT":
        return { dx: 1, dy: 0 };
    }
  }
}
