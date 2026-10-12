import {
  ClientEvents,
  getNextHunterRank,
  RANK_EXAM_REQUIREMENTS,
  type HunterRank,
  type RankPromotionResult
} from "@rpg/contracts";
import { socket } from "../network/game-socket";
import { gameState, getMyPlayer } from "../state/game-state";

interface RankGuideContent {
  modalSubtitle: string;
  examTitle: string;
  examSubtitle: string;
  guideHtml: string;
}

const RANK_GUIDES: Record<HunterRank, RankGuideContent> = {
  E: {
    modalSubtitle: "Diretrizes de Qualificação: Ascensão de Rank E para Rank D",
    examTitle: "PROVA OFICIAL DE ASCENSÃO — RANK D",
    examSubtitle: "Exame de Qualificação perante a Associação de Caçadores",
    guideHtml: `
      <h3 class="article-title">1. DIRETRIZES DE ASCENSÃO: RANK E → RANK D</h3>
      <p class="article-text">
        Todo caçador recém-desperto inicia no <strong>Rank E</strong>. Para romper o limite básico e ingressar no escalão militar de Rank D, você deve provar aptidão tática e derrotar a ameaça regente do Gate E.
      </p>
      <div class="academy-callout">
        <div class="callout-heading">A REGRA DO CAP DE NÍVEL (RANK CAP):</div>
        <p>
          No Rank E, seu nível máximo de saturação mágica é <strong>Nível 12</strong>. A aprovação na prova rompe esse selo, elevando seu teto máximo para <strong>Nível 25</strong>.
        </p>
      </div>
      <ul class="academy-steps">
        <li><strong>Passo 1 (Treino de Status):</strong> Distribua pelo menos <strong>15 pontos de atributos</strong> na sua ficha em STATUS & PERFIL.</li>
        <li><strong>Passo 2 (Caçada do Chefe):</strong> Enfrente e destrua o <strong>Chefe Goblin</strong> (Lv 10) na Câmara do Trono do Gate E.</li>
        <li><strong>Passo 3 (Mérito de Caçador):</strong> Ao vencer, recolha o <strong>Núcleo de Mana do Chefe Goblin</strong>. Não há restrição rígida de nível: caçadores audazes que derrotarem o chefe em níveis inferiores (ex: Lv 8 ou 9) podem homologar a graduação imediatamente!</li>
        <li><strong>Recompensas de Homologação:</strong> Teto de nível expandido para Lv 25, +5 pontos bônus de atributo e acesso garantido ao <strong>Gate D (Masmorra Carmesim)</strong>.</li>
      </ul>
    `
  },
  D: {
    modalSubtitle: "Diretrizes de Sobrevivência: Ascensão de Rank D para Rank C",
    examTitle: "PROVA OFICIAL DE ASCENSÃO — RANK C",
    examSubtitle: "Incursão ao Gate Carmesim e Qualificação perante a Associação",
    guideHtml: `
      <h3 class="article-title">1. DIRETRIZES DE ASCENSÃO: RANK D → RANK C</h3>
      <p class="article-text">
        Você alcançou o <strong>Rank D</strong> e agora possui autorização para explorar fissuras perigosas. A ascensão ao <strong>Rank C</strong> exige a abolição do guardião autômato das ruínas de latão.
      </p>
      <div class="academy-callout">
        <div class="callout-heading">A REGRA DO CAP DE NÍVEL (RANK CAP):</div>
        <p>
          No Rank D, seu nível máximo é <strong>Nível 25</strong>. A aprovação neste exame expande seu potencial para o <strong>Nível 40</strong> e concede novas missões de combate de longa duração.
        </p>
      </div>
      <ul class="academy-steps">
        <li><strong>Passo 1 (Treino de Status):</strong> Aloque pelo menos <strong>45 pontos de atributos</strong> distribuídos na sua ficha de Caçador.</li>
        <li><strong>Passo 2 (Incursão ao Gate D):</strong> Atravesse o Portal dimensional no Santuário para ingressar no <strong>Gate D (Masmorra Carmesim)</strong>.</li>
        <li><strong>Passo 3 (Abolição do Sentinela):</strong> Alcance o Salão do Trono Carmesim e destrua o temido <strong>Sentinela de Latão Carmesim</strong> (Lv 20), recolhendo seu <strong>Coração Carmesim de Latão</strong>.</li>
        <li><strong>Passo 4 (Abertura de Portal):</strong> A derrota do Sentinela abre o <strong>Portal para o Gate C (Glacial)</strong> nas coordenadas táticas do mapa, além de desbloquear +8 pontos de status livres!</li>
      </ul>
    `
  },
  C: {
    modalSubtitle: "Diretrizes de Conquista: Ascensão de Rank C para Rank B",
    examTitle: "PROVA OFICIAL DE ASCENSÃO — RANK B",
    examSubtitle: "Incursão ao Permafrost de Niflheim e Homologação de Elite",
    guideHtml: `
      <h3 class="article-title">1. DIRETRIZES DE ASCENSÃO: RANK C → RANK B</h3>
      <p class="article-text">
        Como Caçador <strong>Rank C</strong>, você já domina batalhas avançadas. A ascensão ao <strong>Rank B</strong> classifica você como Caçador de Elite Nacional, capaz de suportar as nevascas mortais de Niflheim.
      </p>
      <div class="academy-callout">
        <div class="callout-heading">A REGRA DO CAP DE NÍVEL (RANK CAP):</div>
        <p>
          No Rank C, seu nível máximo é <strong>Nível 40</strong>. A homologação militar para Rank B expande seu teto para o <strong>Nível 55</strong> e libera acesso a equipamentos de raridade Épica.
        </p>
      </div>
      <ul class="academy-steps">
        <li><strong>Passo 1 (Treino de Status):</strong> Aloque pelo menos <strong>90 pontos de atributos</strong> na ficha de combate.</li>
        <li><strong>Passo 2 (Incursão ao Gate C):</strong> Atravesse o portal de transição do Gate D ou viaje diretamente ao <strong>Gate C (Glacial)</strong>.</li>
        <li><strong>Passo 3 (Abolição da Rainha do Gelo):</strong> Subjugue a soberana do frio <strong>Rainha do Gelo de Niflheim</strong> (Lv 35) e colete o raríssimo <strong>Cristal Glacial da Rainha</strong>.</li>
        <li><strong>Passo 4 (Recompensas):</strong> Homologue a ascensão para Rank B, receba +10 pontos bônus de atributos e destranque o <strong>Portal para o Gate B (Cripta das Sombras)</strong>!</li>
      </ul>
    `
  },
  B: {
    modalSubtitle: "Diretrizes de Alta Patente: Ascensão de Rank B para Rank A",
    examTitle: "PROVA OFICIAL DE ASCENSÃO — RANK A",
    examSubtitle: "Exame de Calamidade Espectral perante a Associação de Caçadores",
    guideHtml: `
      <h3 class="article-title">1. DIRETRIZES DE ASCENSÃO: RANK B → RANK A</h3>
      <p class="article-text">
        Caçadores <strong>Rank B</strong> formam a vanguarda das guildas. A ascensão ao <strong>Rank A</strong> confere liderança de raides e poder para purificar criptas corrompidas por necromancia ancestral.
      </p>
      <div class="academy-callout">
        <div class="callout-heading">A REGRA DO CAP DE NÍVEL (RANK CAP):</div>
        <p>
          No Rank B, seu nível máximo é <strong>Nível 55</strong>. A ascensão para Rank A expande seu teto para o <strong>Nível 70</strong>.
        </p>
      </div>
      <ul class="academy-steps">
        <li><strong>Passo 1 (Treino de Status):</strong> Distribua pelo menos <strong>150 pontos de atributos</strong> na ficha.</li>
        <li><strong>Passo 2 (Incursão ao Gate B):</strong> Adentre a <strong>Cripta das Sombras (Gate B)</strong> e desbrave os corredores espectrais.</li>
        <li><strong>Passo 3 (Abolição do Arquilorde):</strong> Destrua o <strong>Arquilorde Lich Espectral</strong> (Lv 50) e apresente o <strong>Crânio Espectral do Arquilorde</strong>.</li>
        <li><strong>Passo 4 (Recompensas):</strong> Teto ampliado para Lv 70, +15 pontos de atributos e destrancamento do <strong>Portal para o Gate A (Magma Primordial)</strong>!</li>
      </ul>
    `
  },
  A: {
    modalSubtitle: "Exame de Nível Nacional: Ascensão de Rank A para Rank S",
    examTitle: "PROVA OFICIAL DE ASCENSÃO — RANK S",
    examSubtitle: "Consagração como Autoridade de Nível Nacional",
    guideHtml: `
      <h3 class="article-title">1. DIRETRIZES DE ASCENSÃO: RANK A → RANK S</h3>
      <p class="article-text">
        O <strong>Rank S</strong> não é apenas uma patente; é a força de um exército concentrada em um único caçador. Apenas aqueles capazes de domar o fogo primordial de dragões ancestrais sobrevivem a este teste.
      </p>
      <div class="academy-callout">
        <div class="callout-heading">A REGRA DO CAP DE NÍVEL (RANK CAP):</div>
        <p>
          No Rank A, seu teto é <strong>Nível 70</strong>. O Rank S expande seu teto para o <strong>Nível 85</strong> e confere o título de Autoridade Nacional.
        </p>
      </div>
      <ul class="academy-steps">
        <li><strong>Passo 1 (Treino de Status):</strong> Distribua pelo menos <strong>220 pontos de atributos</strong> na sua ficha.</li>
        <li><strong>Passo 2 (Incursão ao Gate A):</strong> Entre na <strong>Cratera do Magma Primordial (Gate A)</strong> sob temperaturas infernais.</li>
        <li><strong>Passo 3 (Abolição do Dragão):</strong> Abata o titã alado <strong>Dragão Flamejante Ignis</strong> (Lv 68) e arranque o seu <strong>Coração Primordial do Dragão</strong>.</li>
        <li><strong>Passo 4 (Recompensas):</strong> Teto Lv 85, +20 pontos de atributo e liberação imediata do <strong>Portal para o Gate S (Templo Sagrado)</strong>!</li>
      </ul>
    `
  },
  S: {
    modalSubtitle: "Quebra de Limites Humanos: Ascensão de Rank S para Rank SS",
    examTitle: "PROVA DE TRANSCENDÊNCIA — RANK SS",
    examSubtitle: "Desafio aos Deuses Antigos no Templo Sagrado",
    guideHtml: `
      <h3 class="article-title">1. DIRETRIZES DE TRANSCENDÊNCIA: RANK S → RANK SS</h3>
      <p class="article-text">
        Ao alcançar o <strong>Rank S</strong>, você ultrapassou os limites comuns. O <strong>Rank SS</strong> exige que você enfrente as estátuas colossais do Templo Sagrado que punem intrusos com raios divinos.
      </p>
      <div class="academy-callout">
        <div class="callout-heading">A REGRA DO CAP DE NÍVEL (RANK CAP):</div>
        <p>
          No Rank S, seu nível máximo é Lv 85. O Rank SS desbloqueia o <strong>Nível 100 Máximo</strong>.
        </p>
      </div>
      <ul class="academy-steps">
        <li><strong>Passo 1 (Treino de Status):</strong> Distribua pelo menos <strong>300 pontos de atributos</strong> na ficha.</li>
        <li><strong>Passo 2 (Incursão ao Gate S):</strong> Entre no <strong>Grande Templo Sagrado (Gate S)</strong>.</li>
        <li><strong>Passo 3 (Abolição da Divindade):</strong> Pulverize a colossal <strong>Estátua Divina dos Mandamentos</strong> (Lv 85) e recupere o <strong>Fragmento da Estátua Divina</strong>.</li>
        <li><strong>Passo 4 (Recompensas):</strong> Teto expandido para Nível 100, +25 pontos de atributo e abertura do <strong>Portal para o Gate SS (Vácuo Cósmico)</strong>!</li>
      </ul>
    `
  },
  SS: {
    modalSubtitle: "Apoteose do Soberano: Ascensão de Rank SS para Rank SSS+",
    examTitle: "PROVA DO MONARCA DAS SOMBRAS — RANK SSS+",
    examSubtitle: "Desafio à Singularidade Cósmica e Ascensão ao Trono Supremo",
    guideHtml: `
      <h3 class="article-title">1. DIRETRIZES SUPREMAS: RANK SS → RANK SSS+</h3>
      <p class="article-text">
        O <strong>Rank SSS+</strong> é a apoteose: você não é mais apenas um caçador, mas a personificação viva da soberania e do poder absoluto.
      </p>
      <div class="academy-callout">
        <div class="callout-heading">ESTADO SUPREMO (RANK SSS+):</div>
        <p>
          Poder irrestrito. Desbloqueio definitivo de todos os portais e soberania total sobre as forças do Gate.
        </p>
      </div>
      <ul class="academy-steps">
        <li><strong>Passo 1 (Treino de Status):</strong> Distribua pelo menos <strong>400 pontos de atributos</strong> na ficha.</li>
        <li><strong>Passo 2 (Incursão ao Gate SS):</strong> Adentre o <strong>Vácuo Cósmico Infinito (Gate SS)</strong>.</li>
        <li><strong>Passo 3 (Abolição Cósmica):</strong> Subjugue o <strong>Devorador do Vácuo Cósmico</strong> (Lv 100) e recolha o <strong>Núcleo Cósmico do Devorador</strong>.</li>
        <li><strong>Passo 4 (Coroação):</strong> Homologue a ascensão militar máxima para se consagrar como Monarca no Trono de Ashborn!</li>
      </ul>
    `
  },
  SSS: {
    modalSubtitle: "Patamar Máximo Alcançado: Monarca Supremo da Associação",
    examTitle: "ÁPICE NACIONAL SUPREMO — RANK SSS+",
    examSubtitle: "Você alcançou a soberania absoluta do mundo dos Gates",
    guideHtml: `
      <h3 class="article-title">1. O TRONO DO MONARCA SUPREMO</h3>
      <p class="article-text">
        Não restam exames perante a Associação de Caçadores. Você derrotou todas as calamidades dimensionais, cruzou todos os Gates e reina como o Monarca Absoluto.
      </p>
      <div class="academy-callout">
        <div class="callout-heading">HONRA SUPREMA:</div>
        <p>
          Seu nome está gravado para sempre no ápice da humanidade. Todos os portais e segredos do mundo estão permanentemente abertos para sua passagem.
        </p>
      </div>
    `
  },
  "SSS+": {
    modalSubtitle: "Patamar Máximo Alcançado: Monarca Supremo da Associação",
    examTitle: "ÁPICE NACIONAL SUPREMO — RANK SSS+",
    examSubtitle: "Você alcançou a soberania absoluta do mundo dos Gates",
    guideHtml: `
      <h3 class="article-title">1. O TRONO DO MONARCA SUPREMO</h3>
      <p class="article-text">
        Não restam exames perante a Associação de Caçadores. Você derrotou todas as calamidades dimensionais, cruzou todos os Gates e reina como o Monarca Absoluto.
      </p>
      <div class="academy-callout">
        <div class="callout-heading">HONRA SUPREMA:</div>
        <p>
          Seu nome está gravado para sempre no ápice da humanidade. Todos os portais e segredos do mundo estão permanentemente abertos para sua passagem.
        </p>
      </div>
    `
  }
};

export class AcademyController {
  public readonly academyModal = document.querySelector<HTMLDivElement>("#academy-modal");
  public readonly btnAcademyClose = document.querySelector<HTMLButtonElement>("#btn-academy-close");
  public readonly btnCalcToggle = document.querySelector<HTMLButtonElement>("#btn-calc-toggle");
  public readonly examStatusEl = document.querySelector<HTMLDivElement>("#academy-exam-status");
  public readonly btnStartExam = document.querySelector<HTMLButtonElement>("#btn-start-rank-exam");
  public readonly modalSubtitle = document.querySelector<HTMLSpanElement>("#academy-modal-subtitle");
  public readonly examTitle = document.querySelector<HTMLHeadingElement>("#academy-exam-title");
  public readonly examSubtitle = document.querySelector<HTMLSpanElement>("#academy-exam-subtitle");
  public readonly dynamicGuideEl = document.querySelector<HTMLElement>("#academy-dynamic-guide");

  constructor() {
    this.bindEvents();
  }

  public open() {
    this.academyModal?.classList.remove("hidden");
    this.renderExamStatus();
  }

  public close() {
    this.academyModal?.classList.add("hidden");
  }

  public isOpen(): boolean {
    return !this.academyModal?.classList.contains("hidden");
  }

  private bindEvents() {
    this.btnStartExam?.addEventListener("click", () => {
      const me = getMyPlayer() ?? gameState.lastMe;
      if (!me) return;
      const targetRank = getNextHunterRank(me.rank);
      if (!targetRank) return;
      socket.emit(ClientEvents.RankPromotionRequest, { targetRank });
    });
  }

  public renderExamStatus() {
    if (!this.examStatusEl) return;
    const me = getMyPlayer() ?? gameState.lastMe;
    if (!me) {
      this.examStatusEl.innerHTML = `<p class="exam-hint">Aguardando dados do caçador...</p>`;
      return;
    }

    const currentRank = me.rank;
    const guide = RANK_GUIDES[currentRank] ?? RANK_GUIDES.E;

    // Atualiza cabeçalhos dinâmicos
    if (this.modalSubtitle) this.modalSubtitle.textContent = guide.modalSubtitle;
    if (this.examTitle) this.examTitle.textContent = guide.examTitle;
    if (this.examSubtitle) this.examSubtitle.textContent = guide.examSubtitle;
    if (this.dynamicGuideEl) this.dynamicGuideEl.innerHTML = guide.guideHtml;

    const nextRank = getNextHunterRank(me.rank);
    if (!nextRank || !RANK_EXAM_REQUIREMENTS[nextRank]) {
      this.examStatusEl.innerHTML = `
        <div class="exam-req ok">
          Caçador já homologado no patamar máximo: <strong>RANK ${me.rank}</strong>! Você alcançou o nível nacional supremo da Associação de Caçadores.
        </div>
      `;
      if (this.btnStartExam) {
        this.btnStartExam.disabled = true;
        this.btnStartExam.textContent = `ÁPICE ALCANÇADO (RANK ${me.rank})`;
      }
      return;
    }

    const req = RANK_EXAM_REQUIREMENTS[nextRank];
    const allocated =
      (me.attributes.str - 10) +
      (me.attributes.agi - 10) +
      (me.attributes.vit - 10) +
      (me.attributes.int - 10);
    const statsOk = allocated >= req.minAllocatedStats;
    const hasTrophy = gameState.inventory.some((s) => s.item.id === req.requiredTrophyItemId);

    // Sistema meritocrático (estilo Solo Leveling): o nível NÃO bloqueia se o caçador possuir o troféu e atributos!
    const isEligible = statsOk && hasTrophy;

    this.examStatusEl.innerHTML = `
      <div style="margin-bottom: 12px; color: #94a3b8; font-size: 0.85rem;">
        Exame de Ascensão Militar: <strong style="color: #38bdf8;">RANK ${me.rank} → RANK ${nextRank}</strong>
        <p style="margin-top: 4px; color: #cbd5e1; font-style: italic;">"${req.description}"</p>
      </div>
      <div class="exam-req ok">
        <span>Nível do Caçador:</span>
        <strong>Lv ${me.level} (Recomendado: Lv ${req.recommendedLevel ?? req.minLevel}+) [LIVRE]</strong>
      </div>
      <div class="exam-req ${statsOk ? "ok" : "missing"}">
        <span>Atributos Distribuídos na Ficha:</span>
        <strong>${allocated} / ${req.minAllocatedStats} pts ${statsOk ? "[OK]" : "[PENDENTE]"}</strong>
      </div>
      <div class="exam-req ${hasTrophy ? "ok" : "missing"}">
        <span>Troféu de Abolição Militar:</span>
        <strong>${req.trophyName} ${hasTrophy ? "[OK]" : "[PENDENTE]"}</strong>
      </div>
      <p class="exam-hint">
        ${
          isEligible
            ? `Todos os requisitos cumpridos! Clique abaixo para homologar sua ascensão para RANK ${nextRank}.`
            : `Complete os requisitos pendentes abatendo o chefe correspondente ou alocando seus pontos de atributos na ficha.`
        }
      </p>
    `;

    if (this.btnStartExam) {
      this.btnStartExam.disabled = !isEligible;
      this.btnStartExam.textContent = isEligible
        ? `INICIAR HOMOLOGAÇÃO PARA RANK ${nextRank}`
        : "REQUISITOS INCOMPLETOS";
    }
  }

  public renderPromotionResult(result: RankPromotionResult) {
    if (!this.examStatusEl) return;
    if (result.success) {
      this.examStatusEl.innerHTML = `
        <div class="rank-promotion-banner">
          <strong>RANK UP HOMOLOGADO!</strong>
          <p>${result.message}</p>
          <p style="margin-top: 8px; color: #ffd700; font-weight: 700;">
            NOVO RANK: [${result.newRank}] · TETO DE NÍVEL: Lv ${result.unlockedLevelCap} · +${result.rewardStatPoints} PTS DE ATRIBUTOS
          </p>
        </div>
      `;
      if (this.btnStartExam) {
        this.btnStartExam.disabled = true;
        this.btnStartExam.textContent = `HOMOLOGADO (RANK ${result.newRank})`;
      }
      // Re-renderiza o guia para refletir o novo rank imediatamente!
      setTimeout(() => this.renderExamStatus(), 2000);
    } else {
      this.renderExamStatus();
    }
  }
}

export const academyController = new AcademyController();

