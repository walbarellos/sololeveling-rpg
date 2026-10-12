import type {
  EnemySnapshot,
  GateClearAnnouncement
} from "@rpg/contracts";

export interface WorldBossState {
  id: string;
  name: string;
  rank: "E" | "D" | "C";
  level: number;
  maxHp: number;
  currentHp: number;
  alive: boolean;
  position: { x: number; y: number };
  lastDefeatedAt?: number;
}

export class BossService {
  private bosses = new Map<string, WorldBossState>();

  constructor() {
    this.initBosses();
  }

  private initBosses() {
    // 1. Líder Goblin Blindado (Field Boss - Entrada das Ruínas)
    this.bosses.set("boss_goblin_leader", {
      id: "boss_goblin_leader",
      name: "Líder Goblin Blindado",
      rank: "E",
      level: 5,
      maxHp: 280,
      currentHp: 280,
      alive: true,
      position: { x: 12, y: 10 }
    });

    // 2. Matriarca Lobo das Sombras (Field Boss - Covil das Feras)
    this.bosses.set("boss_shadow_wolf", {
      id: "boss_shadow_wolf",
      name: "Matriarca Lobo das Sombras",
      rank: "D",
      level: 8,
      maxHp: 520,
      currentHp: 520,
      alive: true,
      position: { x: 26, y: 6 }
    });

    // 3. Chefe Goblin do Gate de Fogo (Apex Gate Boss - Câmara Final)
    this.bosses.set("boss-1", {
      id: "boss-1",
      name: "Chefe Goblin do Gate de Fogo",
      rank: "C",
      level: 10,
      maxHp: 850,
      currentHp: 850,
      alive: true,
      position: { x: 42, y: 13 }
    });
  }

  getBoss(id: string): WorldBossState | undefined {
    return this.bosses.get(id);
  }

  isBoss(id: string): boolean {
    return this.bosses.has(id);
  }

  getAllBosses(): WorldBossState[] {
    return Array.from(this.bosses.values());
  }

  public static readonly BOSS_RESPAWN_MS = 30_000;

  /**
   * Revive chefes derrotados após BOSS_RESPAWN_MS ou instantaneamente se forçado.
   */
  reviveBosses(now: number, forceAll = false): WorldBossState[] {
    const revived: WorldBossState[] = [];
    for (const b of this.bosses.values()) {
      if (b.alive) continue;
      if (forceAll || (b.lastDefeatedAt && now - b.lastDefeatedAt >= BossService.BOSS_RESPAWN_MS)) {
        b.alive = true;
        b.currentHp = b.maxHp;
        b.lastDefeatedAt = undefined;
        revived.push(b);
      }
    }
    return revived;
  }

  /**
   * Reseta e ressuscita todos os chefes imediatamente (usado pelo Operador de Portais Jin / Reset de Gate).
   */
  resetAllBosses(): void {
    for (const b of this.bosses.values()) {
      b.alive = true;
      b.currentHp = b.maxHp;
      b.lastDefeatedAt = undefined;
    }
  }

  /**
   * Atualiza a vida persistente do chefe após uma batalha.
   * Não reseta a vida do boss quando o caçador morre!
   */
  updateBossHp(id: string, newHp: number): { defeated: boolean; announcement?: GateClearAnnouncement } {
    const boss = this.bosses.get(id);
    if (!boss) return { defeated: false };

    boss.currentHp = Math.max(0, newHp);
    if (boss.currentHp === 0 && boss.alive) {
      boss.alive = false;
      boss.lastDefeatedAt = Date.now();

      let trophy = "Núcleo de Mana do Chefe Goblin";
      if (boss.id === "boss_shadow_wolf") {
        trophy = "Presa da Matriarca das Sombras";
      } else if (boss.id === "boss-1") {
        trophy = "Coração Ígneo do Portão Vermelho";
      }

      return {
        defeated: true,
        announcement: {
          bossName: boss.name,
          slayerName: "Caçador",
          rewardExp: boss.level * 45,
          trophyDropped: trophy,
          newPortalUnlocked: true
        }
      };
    }

    return { defeated: false };
  }

  /**
   * Converte chefes ativos para EnemySnapshot para inclusão no WorldSnapshot.
   */
  toEnemySnapshots(): EnemySnapshot[] {
    const snapshots: EnemySnapshot[] = [];
    for (const b of this.bosses.values()) {
      snapshots.push({
        id: b.id,
        name: b.name,
        rank: b.rank,
        level: b.level,
        position: { ...b.position },
        hp: b.currentHp,
        maxHp: b.maxHp,
        mp: 100,
        maxMp: 100,
        alive: b.alive
      });
    }
    return snapshots;
  }
}
