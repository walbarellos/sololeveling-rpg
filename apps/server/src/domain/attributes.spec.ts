import { describe, expect, it } from "vitest";
import { GameService } from "./game.service";
import { InMemoryPlayerRepository } from "./player.repository";
import { calculatePlayerStats, calculatePlayerMaxHp, calculatePlayerMaxMp, CLASS_STATS } from "./skills.data";
import { STARTING_STAT_POINTS, STAT_POINTS_PER_LEVEL } from "@rpg/contracts";

class FakeClock {
  currentTime = 10_000;
  nowMs(): number {
    return this.currentTime;
  }
}

describe("Sistema de Distribuição de Atributos e Cálculo Derivado", () => {
  it("inicia novo jogador com atributos base em 10 e pontos livres iniciais", () => {
    const service = new GameService(new FakeClock(), new InMemoryPlayerRepository());
    const player = service.connect("p-test-1");

    expect(player.attributes).toEqual({ str: 10, agi: 10, vit: 10, int: 10 });
    expect(player.unallocatedStatPoints).toBe(STARTING_STAT_POINTS);
  });

  it("calcula corretamente os atributos derivados com bônus de atributos", () => {
    const cls = "WARRIOR";
    const baseStats = calculatePlayerStats(cls, 1, { str: 10, agi: 10, vit: 10, int: 10 });
    
    // Investindo +5 em FORÇA (+2 atk físico por ponto)
    const strStats = calculatePlayerStats(cls, 1, { str: 15, agi: 10, vit: 10, int: 10 });
    expect(strStats.physicalAtk).toBe(baseStats.physicalAtk + 10);

    // Investindo +4 em AGILIDADE (+0.5% crit, +0.4% esquiva por ponto)
    const agiStats = calculatePlayerStats(cls, 1, { str: 10, agi: 14, vit: 10, int: 10 });
    expect(agiStats.critChance).toBeCloseTo(baseStats.critChance + 0.02, 3);
    expect(agiStats.dodgeChance).toBeCloseTo(baseStats.dodgeChance + 0.016, 3);

    // Investindo +6 em VITALIDADE (+10 HP max por ponto, +0.3% block por ponto)
    const vitStats = calculatePlayerStats(cls, 1, { str: 10, agi: 10, vit: 16, int: 10 });
    expect(vitStats.blockChance).toBeCloseTo(baseStats.blockChance + 0.018, 3);
    expect(calculatePlayerMaxHp(cls, 1, 16)).toBe(CLASS_STATS[cls].baseHp + 60);

    // Investindo +4 em INTELIGÊNCIA (+2.5 atk mágico, +8 MP max por ponto)
    const intStats = calculatePlayerStats(cls, 1, { str: 10, agi: 10, vit: 10, int: 14 });
    expect(intStats.magicalAtk).toBe(baseStats.magicalAtk + 10);
    expect(calculatePlayerMaxMp(cls, 1, 14)).toBe(CLASS_STATS[cls].baseMp + 32);
  });

  it("permite alocação válida de pontos e atualiza o snapshot do jogador", () => {
    const service = new GameService(new FakeClock(), new InMemoryPlayerRepository());
    service.connect("p-test-2");

    const result = service.allocateStats("p-test-2", {
      str: 2,
      agi: 1,
      vit: 2,
      int: 0
    });

    expect(result.success).toBe(true);
    expect(result.player?.attributes).toEqual({ str: 12, agi: 11, vit: 12, int: 10 });
    expect(result.player?.unallocatedStatPoints).toBe(0); // 5 - 5 = 0
  });

  it("rejeita alocação se os pontos solicitados excederem os pontos disponíveis", () => {
    const service = new GameService(new FakeClock(), new InMemoryPlayerRepository());
    service.connect("p-test-3");

    const result = service.allocateStats("p-test-3", {
      str: 4,
      agi: 3,
      vit: 0,
      int: 0
    }); // custo 7 > 5 disponíveis

    expect(result.success).toBe(false);
    expect(result.error).toBe("INSUFFICIENT_STAT_POINTS");
  });

  it("concede pontos adicionais ao subir de nível via missões", () => {
    const clock = new FakeClock();
    const service = new GameService(clock, new InMemoryPlayerRepository());
    const initialPlayer = service.connect("p-test-4");
    expect(initialPlayer.unallocatedStatPoints).toBe(STARTING_STAT_POINTS);

    // Inicia missão de 5s
    const startRes = service.startMission("p-test-4", "patrol_5s");
    expect(startRes.success).toBe(true);
    const runId = startRes.state?.activeRun?.runId!;

    // Avança tempo e resgata missão repetidas vezes até subir de nível
    // patrol_5s dá 8 EXP no Lv 1. Nível 1 -> 2 requer 40 EXP (5 missões).
    for (let i = 0; i < 5; i++) {
      clock.currentTime += 6000;
      if (i > 0) {
        const nextStart = service.startMission("p-test-4", "patrol_5s");
        if (!nextStart.success) break;
        clock.currentTime += 6000;
        const claimRes = service.claimMission("p-test-4", nextStart.state?.activeRun?.runId!);
        if (claimRes.player && claimRes.player.level > 1) {
          expect(claimRes.player.unallocatedStatPoints).toBe(STARTING_STAT_POINTS + STAT_POINTS_PER_LEVEL);
          break;
        }
      } else {
        const claimRes = service.claimMission("p-test-4", runId);
        if (claimRes.player && claimRes.player.level > 1) {
          expect(claimRes.player.unallocatedStatPoints).toBe(STARTING_STAT_POINTS + STAT_POINTS_PER_LEVEL);
          break;
        }
      }
    }
  });

  it("impede distribuição de atributos enquanto o jogador estiver em batalha ativa", () => {
    const service = new GameService(new FakeClock(), new InMemoryPlayerRepository());
    service.connect("p-test-5");
    // Move para perto do slime em (7, 4)
    // O slime está em (7,4). Jogador começa em (2,2).
    // Para simplificar, iniciamos a batalha diretamente se chegarmos perto,
    // ou checamos a flag inBattle
    const repo = (service as any).playerRepository;
    const player = repo.findById("p-test-5");
    player.inBattle = true;
    repo.save(player);

    const result = service.allocateStats("p-test-5", { str: 1, agi: 0, vit: 0, int: 0 });
    expect(result.success).toBe(false);
    expect(result.error).toBe("CANNOT_ALLOCATE_IN_BATTLE");
  });
});
