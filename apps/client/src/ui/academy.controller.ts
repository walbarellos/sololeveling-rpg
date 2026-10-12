import {
  ClientEvents,
  getNextHunterRank,
  RANK_EXAM_REQUIREMENTS,
  type HunterRank,
  type RankPromotionResult
} from "@rpg/contracts";
import { socket } from "../network/game-socket";
import { gameState, getMyPlayer } from "../state/game-state";

export class AcademyController {
  public readonly academyModal = document.querySelector<HTMLDivElement>("#academy-modal");
  public readonly btnAcademyClose = document.querySelector<HTMLButtonElement>("#btn-academy-close");
  public readonly btnCalcToggle = document.querySelector<HTMLButtonElement>("#btn-calc-toggle");
  public readonly examStatusEl = document.querySelector<HTMLDivElement>("#academy-exam-status");
  public readonly btnStartExam = document.querySelector<HTMLButtonElement>("#btn-start-rank-exam");

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
    const levelOk = me.level >= req.minLevel;
    const allocated =
      (me.attributes.str - 10) +
      (me.attributes.agi - 10) +
      (me.attributes.vit - 10) +
      (me.attributes.int - 10);
    const statsOk = allocated >= req.minAllocatedStats;
    const hasTrophy = gameState.inventory.some((s) => s.item.id === req.requiredTrophyItemId);
    const isEligible = levelOk && statsOk && hasTrophy;

    this.examStatusEl.innerHTML = `
      <div style="margin-bottom: 12px; color: #94a3b8; font-size: 0.85rem;">
        Exame de Ascensão Militar: <strong style="color: #38bdf8;">RANK ${me.rank} → RANK ${nextRank}</strong>
        <p style="margin-top: 4px; color: #cbd5e1; font-style: italic;">"${req.description}"</p>
      </div>
      <div class="exam-req ${levelOk ? "ok" : "missing"}">
        <span>Nível Mínimo do Caçador:</span>
        <strong>Lv ${me.level} / ${req.minLevel} ${levelOk ? "[OK]" : "[PENDENTE]"}</strong>
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
    } else {
      this.renderExamStatus();
    }
  }
}

export const academyController = new AcademyController();
