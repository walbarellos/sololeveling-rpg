import { Inject, Injectable, Optional } from "@nestjs/common";
import type { CombatLog, EnemySnapshot, PlayerSnapshot, Vec2, WorldSnapshot } from "@rpg/contracts";
import { CLOCK, SystemClock, type Clock } from "./clock";

const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 600;
const PLAYER_SPEED = 220; // world units per second
const ATTACK_RANGE = 72;
const ATTACK_COOLDOWN_MS = 650;
const ATTACK_DAMAGE = 25;

type PlayerState = PlayerSnapshot & { lastAttackAt: number; lastSeenAt: number };
type EnemyState = EnemySnapshot;

@Injectable()
export class GameService {
  private readonly players = new Map<string, PlayerState>();
  private readonly enemies = new Map<string, EnemyState>([
    ["slime-1", { id: "slime-1", position: { x: 470, y: 290 }, hp: 100, maxHp: 100, alive: true }],
    ["slime-2", { id: "slime-2", position: { x: 650, y: 380 }, hp: 100, maxHp: 100, alive: true }],
    ["slime-3", { id: "slime-3", position: { x: 300, y: 410 }, hp: 100, maxHp: 100, alive: true }]
  ]);
  private sequence = 0;

  constructor(@Optional() @Inject(CLOCK) private readonly clock: Clock = new SystemClock()) {}

  get dimensions() {
    return { worldWidth: WORLD_WIDTH, worldHeight: WORLD_HEIGHT };
  }

  connect(id: string): PlayerSnapshot {
    const existing = this.players.get(id);
    if (existing) return this.toSnapshot(existing);
    const now = this.clock.nowMs();
    const player: PlayerState = {
      id, name: `Adventurer-${id.slice(0, 4)}`,
      position: { x: 120 + Math.random() * 100, y: 120 + Math.random() * 100 },
      hp: 100, maxHp: 100, sequence: ++this.sequence,
      lastAttackAt: 0, lastSeenAt: now
    };
    this.players.set(id, player);
    return this.toSnapshot(player);
  }

  disconnect(id: string) {
    // Demo session state only. Production disconnects must not erase durable characters.
    this.players.delete(id);
  }

  move(id: string, target: Vec2): PlayerSnapshot | null {
    const player = this.players.get(id);
    if (!player) return null;
    if (!this.isInBounds(target)) return null;
    const now = this.clock.nowMs();
    const elapsedSeconds = Math.max(0, Math.min((now - player.lastSeenAt) / 1000, 0.25));
    const dx = target.x - player.position.x;
    const dy = target.y - player.position.y;
    const distance = Math.hypot(dx, dy);
    const maxDistance = PLAYER_SPEED * elapsedSeconds;
    const ratio = distance > maxDistance && distance > 0 ? maxDistance / distance : 1;
    player.position = {
      x: this.clamp(player.position.x + dx * ratio, 0, WORLD_WIDTH),
      y: this.clamp(player.position.y + dy * ratio, 0, WORLD_HEIGHT)
    };
    player.lastSeenAt = now;
    player.sequence = ++this.sequence;
    return this.toSnapshot(player);
  }

  attack(attackerId: string, targetId: string): { log?: CombatLog; error?: "TARGET_UNAVAILABLE" | "TOO_FAR" | "COOLDOWN" } {
    const player = this.players.get(attackerId);
    const enemy = this.enemies.get(targetId);
    if (!player || !enemy || !enemy.alive) return { error: "TARGET_UNAVAILABLE" };
    if (Math.hypot(player.position.x - enemy.position.x, player.position.y - enemy.position.y) > ATTACK_RANGE) {
      return { error: "TOO_FAR" };
    }
    const now = this.clock.nowMs();
    if (now - player.lastAttackAt < ATTACK_COOLDOWN_MS) return { error: "COOLDOWN" };
    player.lastAttackAt = now;
    enemy.hp = Math.max(0, enemy.hp - ATTACK_DAMAGE);
    enemy.alive = enemy.hp > 0;
    const log: CombatLog = {
      attackerId, targetId, damage: ATTACK_DAMAGE, targetHp: enemy.hp,
      defeated: !enemy.alive, sequence: ++this.sequence
    };
    return { log };
  }

  snapshot(): WorldSnapshot {
    return {
      players: [...this.players.values()].map((p) => this.toSnapshot(p)),
      enemies: [...this.enemies.values()].map((e) => ({ ...e, position: { ...e.position } })),
      serverTime: this.clock.nowMs()
    };
  }

  private toSnapshot(p: PlayerState): PlayerSnapshot {
    return {
      id: p.id, name: p.name, position: { ...p.position },
      hp: p.hp, maxHp: p.maxHp, sequence: p.sequence
    };
  }
  private isInBounds(p: Vec2) {
    return Number.isFinite(p.x) && Number.isFinite(p.y) &&
      p.x >= 0 && p.y >= 0 && p.x <= WORLD_WIDTH && p.y <= WORLD_HEIGHT;
  }
  private clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
}
