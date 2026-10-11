import { Inject, Injectable, Optional } from "@nestjs/common";
import type {
  BattleSnapshot,
  CombatLog,
  Direction,
  EnemySnapshot,
  HunterClass,
  PlayerSnapshot,
  ServerErrorCode,
  TileCoord,
  WorldSnapshot
} from "@rpg/contracts";
import { BattleSession } from "./battle.session";
import { CLOCK, SystemClock, type Clock } from "./clock";
import {
  InMemoryPlayerRepository,
  PLAYER_REPOSITORY,
  type PlayerEntity,
  type PlayerRepository
} from "./player.repository";
import { CLASS_STATS } from "./skills.data";

export const GRID_WIDTH = 20;
export const GRID_HEIGHT = 12;
export const TILE_SIZE = 48;
export const STEP_COOLDOWN_MS = 200;
export const ATTACK_COOLDOWN_MS = 600;
export const PLAYER_ATTACK_DAMAGE = 30;

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
    [
      "slime-1",
      {
        id: "slime-1",
        name: "Dungeon Slime",
        rank: "E",
        position: { x: 7, y: 4 },
        hp: 60,
        maxHp: 60,
        mp: 10,
        maxMp: 10,
        alive: true
      }
    ],
    [
      "goblin-1",
      {
        id: "goblin-1",
        name: "Gate Goblin",
        rank: "E",
        position: { x: 12, y: 7 },
        hp: 80,
        maxHp: 80,
        mp: 20,
        maxMp: 20,
        alive: true
      }
    ],
    [
      "wolf-1",
      {
        id: "wolf-1",
        name: "Shadow Wolf",
        rank: "D",
        position: { x: 16, y: 3 },
        hp: 120,
        maxHp: 120,
        mp: 30,
        maxMp: 30,
        alive: true
      }
    ]
  ]);
  private readonly activeBattles = new Map<string, BattleSession>();
  private sequence = 0;
  private battleCounter = 0;

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

    if (existing) {
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

    const stats = CLASS_STATS[hunterClass];
    player.hunterClass = hunterClass;
    player.hp = stats.baseHp;
    player.maxHp = stats.baseHp;
    player.mp = stats.baseMp;
    player.maxMp = stats.baseMp;
    player.sequence = ++this.sequence;
    this.playerRepository.save(player);

    return this.toSnapshot(player);
  }

  step(id: string, direction: Direction): StepResult {
    const player = this.playerRepository.findById(id) as PlayerEntity | null;
    if (!player) {
      return { success: false, error: "OUT_OF_BOUNDS" };
    }

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

    if (session.result === "VICTORY") {
      const enemy = this.enemies.get(session.enemy.id);
      if (enemy) {
        enemy.alive = false;
      }
      player.hp = Math.max(1, session.player.hp);
      player.mp = Math.max(0, session.player.mp);
    } else if (session.result === "DEFEAT") {
      // Defeated: respawn at entrance
      player.position = { x: 2, y: 2 };
      player.hp = player.maxHp;
      player.mp = player.maxMp;
    } else if (session.result === "DRAW") {
      // Draw (like Naruto Game): both knocked down, monstro derrotado e player respawna
      const enemy = this.enemies.get(session.enemy.id);
      if (enemy) {
        enemy.alive = false;
      }
      player.position = { x: 2, y: 2 };
      player.hp = Math.floor(player.maxHp * 0.5);
      player.mp = Math.floor(player.maxMp * 0.5);
    } else if (session.result === "FLED") {
      player.hp = Math.max(1, session.player.hp);
      player.mp = Math.max(0, session.player.mp);
    }

    player.sequence = ++this.sequence;
    this.playerRepository.save(player);
    this.activeBattles.delete(session.battleId);
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

  snapshot(): WorldSnapshot {
    const allPlayers = (this.playerRepository.findAll() as PlayerEntity[]).map((p) =>
      this.toSnapshot(p)
    );
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
      position: { ...p.position },
      hp: p.hp,
      maxHp: p.maxHp,
      mp: p.mp,
      maxMp: p.maxMp,
      stamina: p.stamina,
      maxStamina: p.maxStamina,
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
