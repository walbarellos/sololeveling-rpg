import type {
  EnemySnapshot,
  GateClearAnnouncement,
  HunterRank,
  WorldId
} from "@rpg/contracts";

export interface WorldBossState {
  id: string;
  name: string;
  rank: HunterRank;
  level: number;
  maxHp: number;
  currentHp: number;
  alive: boolean;
  position: { x: number; y: number };
  worldId: WorldId;
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
      position: { x: 12, y: 10 },
      worldId: "GATE_E"
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
      position: { x: 26, y: 6 },
      worldId: "GATE_E"
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
      position: { x: 42, y: 13 },
      worldId: "GATE_E"
    });

    // 4. Chefe Sentinela Carmesim (Apex Boss do Gate Rank D — Cidadela Carmesim)
    this.bosses.set("boss_crimson_sentinel", {
      id: "boss_crimson_sentinel",
      name: "Chefe Sentinela Carmesim",
      rank: "D",
      level: 16,
      maxHp: 980,
      currentHp: 980,
      alive: true,
      position: { x: 36, y: 13 },
      worldId: "GATE_D"
    });

    // 5. Rainha do Gelo Frostbite (Gate Rank C — Fenda Glacial de Niflheim)
    this.bosses.set("boss_frost_queen", {
      id: "boss_frost_queen",
      name: "Rainha do Gelo Frostbite",
      rank: "C",
      level: 30,
      maxHp: 1650,
      currentHp: 1650,
      alive: true,
      position: { x: 40, y: 14 },
      worldId: "GATE_C"
    });

    // 6. Arquilorde Necromante (Gate Rank B — Necrópole das Sombras)
    this.bosses.set("boss_shadow_lich", {
      id: "boss_shadow_lich",
      name: "Arquilorde Necromante",
      rank: "B",
      level: 50,
      maxHp: 2800,
      currentHp: 2800,
      alive: true,
      position: { x: 44, y: 15 },
      worldId: "GATE_B"
    });

    // 7. Dragão de Lava Ignis (Gate Rank A — Calamidade Vulcânica)
    this.bosses.set("boss_dragon_ignis", {
      id: "boss_dragon_ignis",
      name: "Dragão de Lava Ignis",
      rank: "A",
      level: 75,
      maxHp: 4800,
      currentHp: 4800,
      alive: true,
      position: { x: 48, y: 16 },
      worldId: "GATE_A"
    });

    // 8. Estátua de Deus Sorridente (Gate Rank S — Templo dos Deuses Antigos)
    this.bosses.set("boss_god_statue", {
      id: "boss_god_statue",
      name: "Estátua de Deus Sorridente",
      rank: "S",
      level: 110,
      maxHp: 8500,
      currentHp: 8500,
      alive: true,
      position: { x: 52, y: 17 },
      worldId: "GATE_S"
    });

    // 9. Avatar da Calamidade Cósmica (Gate Rank SS — Fenda Cósmica)
    this.bosses.set("boss_cosmic_avatar", {
      id: "boss_cosmic_avatar",
      name: "Avatar da Calamidade Cósmica",
      rank: "SS",
      level: 140,
      maxHp: 14000,
      currentHp: 14000,
      alive: true,
      position: { x: 56, y: 18 },
      worldId: "GATE_SS"
    });

    // 10. Monarca das Sombras Ashborn (Gate Rank SSS+ — Trono Supremo)
    this.bosses.set("boss_shadow_monarch", {
      id: "boss_shadow_monarch",
      name: "Monarca das Sombras Ashborn",
      rank: "SSS+",
      level: 185,
      maxHp: 24000,
      currentHp: 24000,
      alive: true,
      position: { x: 60, y: 19 },
      worldId: "GATE_SSS"
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
      } else if (boss.id === "boss_crimson_sentinel") {
        trophy = "Coração da Cidadela Carmesim";
      } else if (boss.id === "boss_frost_queen") {
        trophy = "Cristal do Coração da Rainha do Gelo";
      } else if (boss.id === "boss_shadow_lich") {
        trophy = "Crânio do Arquilorde Necromante";
      } else if (boss.id === "boss_dragon_ignis") {
        trophy = "Coração Vulcânico do Dragão Ignis";
      } else if (boss.id === "boss_god_statue") {
        trophy = "Fragmento Sagrado da Estátua de Deus";
      } else if (boss.id === "boss_cosmic_avatar") {
        trophy = "Núcleo da Calamidade Cósmica";
      } else if (boss.id === "boss_shadow_monarch") {
        trophy = "Coroa do Monarca das Sombras";
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
        alive: b.alive,
        worldId: b.worldId
      });
    }
    return snapshots;
  }
}
