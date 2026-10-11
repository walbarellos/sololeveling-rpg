import { Inject, Injectable, Optional } from "@nestjs/common";
import type {
  CombatLog,
  Direction,
  EnemySnapshot,
  PlayerSnapshot,
  TileCoord,
  WorldSnapshot
} from "@rpg/contracts";
import { CLOCK, SystemClock, type Clock } from "./clock";
import {
  InMemoryPlayerRepository,
  PLAYER_REPOSITORY,
  type PlayerEntity,
  type PlayerRepository
} from "./player.repository";

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
  | { success: false; error: "OUT_OF_BOUNDS" | "OBSTACLE" | "TOO_FAST" };

export type AttackResult =
  | { success: true; log: CombatLog; player: PlayerSnapshot }
  | { success: false; error: "TARGET_UNAVAILABLE" | "TOO_FAR" | "COOLDOWN" };

@Injectable()
export class GameService {
  private readonly obstacleSet = new Set<string>();
  private readonly enemies = new Map<string, EnemySnapshot>([
    [
      "slime-1",
      { id: "slime-1", name: "Dungeon Slime", rank: "E", position: { x: 7, y: 4 }, hp: 60, maxHp: 60, alive: true }
    ],
    [
      "goblin-1",
      { id: "goblin-1", name: "Gate Goblin", rank: "E", position: { x: 12, y: 7 }, hp: 80, maxHp: 80, alive: true }
    ],
    [
      "wolf-1",
      { id: "wolf-1", name: "Shadow Wolf", rank: "D", position: { x: 16, y: 3 }, hp: 120, maxHp: 120, alive: true }
    ]
  ]);
  private sequence = 0;

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

    const newPlayer: PlayerEntity = {
      id,
      name: `Hunter-${id.slice(0, 4)}`,
      rank: "E",
      level: 1,
      position: { x: 2, y: 2 },
      hp: 100,
      maxHp: 100,
      stamina: 50,
      maxStamina: 50,
      sequence: ++this.sequence,
      lastStepAt: now,
      lastAttackAt: 0
    };

    this.playerRepository.save(newPlayer);
    return this.toSnapshot(newPlayer);
  }

  disconnect(id: string) {
    // Keep durable character state in repository; session disconnect doesn't erase character.
  }

  step(id: string, direction: Direction): StepResult {
    const player = this.playerRepository.findById(id) as PlayerEntity | null;
    if (!player) {
      return { success: false, error: "OUT_OF_BOUNDS" };
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

  attack(attackerId: string, targetId: string): AttackResult {
    const player = this.playerRepository.findById(attackerId) as PlayerEntity | null;
    const enemy = this.enemies.get(targetId);

    if (!player || !enemy || !enemy.alive) {
      return { success: false, error: "TARGET_UNAVAILABLE" };
    }

    // Distance in grid: Chebyshev distance must be <= 1 (adjacent 8 tiles)
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

    // Apply player damage to enemy
    enemy.hp = Math.max(0, enemy.hp - PLAYER_ATTACK_DAMAGE);
    enemy.alive = enemy.hp > 0;

    // Counter-attack damage if enemy survived
    let counterDamage = 0;
    if (enemy.alive) {
      counterDamage = enemy.rank === "D" ? 15 : 10;
      player.hp = Math.max(0, player.hp - counterDamage);
      if (player.hp === 0) {
        // Player defeated: respawn at entrance
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
      level: p.level,
      position: { ...p.position },
      hp: p.hp,
      maxHp: p.maxHp,
      stamina: p.stamina,
      maxStamina: p.maxStamina,
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
