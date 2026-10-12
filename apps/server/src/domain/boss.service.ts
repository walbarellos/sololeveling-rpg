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
    // === GATE E: O SANTUÁRIO JOGÁVEL ===
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

    // 2. Lorde Orc do Abismo (Stage Boss - Setor Central)
    this.bosses.set("boss_goblin_warlord", {
      id: "boss_goblin_warlord",
      name: "Lorde Orc do Abismo",
      rank: "E",
      level: 7,
      maxHp: 450,
      currentHp: 450,
      alive: true,
      position: { x: 20, y: 5 },
      worldId: "GATE_E"
    });

    // 3. Matriarca Lobo das Sombras (Field Boss - Covil das Feras)
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

    // 4. Chefe Goblin do Gate de Fogo (Apex Gate Boss - Câmara Final)
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

    // === GATE D: CIDADELA CARMESIM ===
    // 5. Gárgula de Latão Incandescente (Stage Boss - Galeria Central)
    this.bosses.set("boss_brass_gargoyle", {
      id: "boss_brass_gargoyle",
      name: "Gárgula de Latão Incandescente",
      rank: "D",
      level: 14,
      maxHp: 750,
      currentHp: 750,
      alive: true,
      position: { x: 20, y: 12 },
      worldId: "GATE_D"
    });

    // 6. Chefe Sentinela Carmesim (Apex Boss - Trono Carmesim)
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

    // === GATE C: FENDA GLACIAL DE NIFLHEIM ===
    // 7. Gigante de Gelo Glacial (Stage Boss - Setor Central)
    this.bosses.set("boss_frost_giant", {
      id: "boss_frost_giant",
      name: "Gigante de Gelo Glacial",
      rank: "C",
      level: 26,
      maxHp: 1200,
      currentHp: 1200,
      alive: true,
      position: { x: 22, y: 13 },
      worldId: "GATE_C"
    });

    // 8. Rainha do Gelo Frostbite (Apex Boss - Salão Congelado)
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

    // === GATE B: NECRÓPOLE DAS SOMBRAS ===
    // 9. Cavaleiro da Morte Espectral (Stage Boss - Corredor dos Túmulos)
    this.bosses.set("boss_death_knight", {
      id: "boss_death_knight",
      name: "Cavaleiro da Morte Espectral",
      rank: "B",
      level: 42,
      maxHp: 2100,
      currentHp: 2100,
      alive: true,
      position: { x: 24, y: 14 },
      worldId: "GATE_B"
    });

    // 10. Arquilorde Necromante (Apex Boss - Mausoléu Arcano)
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

    // === GATE A: CALAMIDADE VULCÂNICA ===
    // 11. Behemoth de Magma Primordial (Stage Boss - Rio de Lava)
    this.bosses.set("boss_volcanic_behemoth", {
      id: "boss_volcanic_behemoth",
      name: "Behemoth de Magma Primordial",
      rank: "A",
      level: 65,
      maxHp: 3600,
      currentHp: 3600,
      alive: true,
      position: { x: 27, y: 15 },
      worldId: "GATE_A"
    });

    // 12. Dragão de Lava Ignis (Apex Boss - Cratera da Calamidade)
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

    // === GATE S: TEMPLO DOS DEUSES ANTIGOS ===
    // 13. Sumo-Sacerdote das Asas Negras (Stage Boss - Pátio das Provações)
    this.bosses.set("boss_god_statue_high_priest", {
      id: "boss_god_statue_high_priest",
      name: "Sumo-Sacerdote das Asas Negras",
      rank: "S",
      level: 95,
      maxHp: 6200,
      currentHp: 6200,
      alive: true,
      position: { x: 30, y: 16 },
      worldId: "GATE_S"
    });

    // 14. Estátua de Deus Sorridente (Apex Boss - Trono dos Mandamentos)
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

    // === GATE SS: FENDA CÓSMICA ===
    // 15. Arauto do Vácuo Infinito (Stage Boss - Passagem Astral)
    this.bosses.set("boss_astral_herald", {
      id: "boss_astral_herald",
      name: "Arauto do Vácuo Infinito",
      rank: "SS",
      level: 125,
      maxHp: 10500,
      currentHp: 10500,
      alive: true,
      position: { x: 33, y: 17 },
      worldId: "GATE_SS"
    });

    // 16. Avatar da Calamidade Cósmica (Apex Boss - Núcleo Dimensional)
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

    // === GATE SSS: TRONO SUPREMO DO MONARCA DAS SOMBRAS ===
    // 17. Comandante Vermelho Igris (Stage Boss - Guardião do Portão)
    this.bosses.set("boss_igris_red_knight", {
      id: "boss_igris_red_knight",
      name: "Comandante Vermelho Igris",
      rank: "SSS",
      level: 165,
      maxHp: 18000,
      currentHp: 18000,
      alive: true,
      position: { x: 36, y: 18 },
      worldId: "GATE_SSS"
    });

    // 18. Monarca das Sombras Ashborn (Apex Boss - Trono da Morte)
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

    // 19. WORLD BOSS SUPREMO: KAMISH, O DRAGÃO DA CALAMIDADE PRIMORDIAL
    this.bosses.set("worldboss_kamish", {
      id: "worldboss_kamish",
      name: "Kamish, o Dragão da Calamidade",
      rank: "SSS+",
      level: 200,
      maxHp: 50000,
      currentHp: 50000,
      alive: true,
      position: { x: 50, y: 25 },
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
      if (boss.id === "boss_goblin_warlord") {
        trophy = "Machado do Lorde Orc";
      } else if (boss.id === "boss_shadow_wolf") {
        trophy = "Presa da Matriarca das Sombras";
      } else if (boss.id === "boss-1") {
        trophy = "Coração Ígneo do Portão Vermelho";
      } else if (boss.id === "boss_brass_gargoyle") {
        trophy = "Chifre da Gárgula de Latão";
      } else if (boss.id === "boss_crimson_sentinel") {
        trophy = "Coração da Cidadela Carmesim";
      } else if (boss.id === "boss_frost_giant") {
        trophy = "Coração Glacial do Gigante de Gelo";
      } else if (boss.id === "boss_frost_queen") {
        trophy = "Cristal do Coração da Rainha do Gelo";
      } else if (boss.id === "boss_death_knight") {
        trophy = "Espada Espectral do Cavaleiro da Morte";
      } else if (boss.id === "boss_shadow_lich") {
        trophy = "Crânio do Arquilorde Necromante";
      } else if (boss.id === "boss_volcanic_behemoth") {
        trophy = "Chifre Primordial do Behemoth de Magma";
      } else if (boss.id === "boss_dragon_ignis") {
        trophy = "Coração Vulcânico do Dragão Ignis";
      } else if (boss.id === "boss_god_statue_high_priest") {
        trophy = "Tomo Sombrio das Asas Negras";
      } else if (boss.id === "boss_god_statue") {
        trophy = "Fragmento Sagrado da Estátua de Deus";
      } else if (boss.id === "boss_astral_herald") {
        trophy = "Fragmento do Vácuo Infinito";
      } else if (boss.id === "boss_cosmic_avatar") {
        trophy = "Núcleo da Calamidade Cósmica";
      } else if (boss.id === "boss_igris_red_knight") {
        trophy = "Lâmina Carmesim de Igris";
      } else if (boss.id === "boss_shadow_monarch") {
        trophy = "Coroa do Monarca das Sombras";
      } else if (boss.id === "worldboss_kamish") {
        trophy = "Presa da Calamidade de Kamish";
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
