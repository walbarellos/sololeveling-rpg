import {
  ClientEvents,
  isRankAllowed,
  mobExp,
  type MissionRun,
  type MissionsState
} from "@rpg/contracts";
import { socket } from "../network/game-socket";
import { gameState } from "../state/game-state";

export class MissionsController {
  public readonly btnMissionsToggle = document.querySelector<HTMLButtonElement>("#btn-missions-toggle");
  public readonly missionHudBadge = document.querySelector<HTMLSpanElement>("#mission-hud-badge");
  public readonly missionsModal = document.querySelector<HTMLDivElement>("#missions-modal");
  public readonly btnMissionsClose = document.querySelector<HTMLButtonElement>("#btn-missions-close");

  public readonly activeMissionContainer = document.querySelector<HTMLDivElement>("#active-mission-container");
  public readonly activeMissionsCounter = document.querySelector<HTMLSpanElement>("#active-missions-counter");
  public readonly activeMissionsList = document.querySelector<HTMLDivElement>("#active-missions-list");

  public readonly missionsList = document.querySelector<HTMLDivElement>("#missions-list");
  public readonly sidebarMissionBadge = document.querySelector<HTMLSpanElement>("#sidebar-mission-badge");

  constructor() {
    setInterval(() => this.updateMissionTicker(), 500);
  }

  public formatDuration(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  public formatDurationLabel(ms: number): string {
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} min`;
    const hr = Math.floor(min / 60);
    return `${hr} hora${hr > 1 ? "s" : ""}`;
  }

  public getActiveRuns(): MissionRun[] {
    const state = gameState.currentMissionsState;
    if (!state) return [];
    if (state.activeRuns && state.activeRuns.length > 0) return state.activeRuns;
    if (state.activeRun) return [state.activeRun];
    return [];
  }

  public updateMissionTicker() {
    const activeRuns = this.getActiveRuns();
    const count = activeRuns.length;

    if (count === 0) {
      this.missionHudBadge?.classList.add("hidden");
      this.sidebarMissionBadge?.classList.add("hidden");
      this.activeMissionContainer?.classList.add("hidden");
      return;
    }

    if (this.activeMissionContainer) this.activeMissionContainer.classList.remove("hidden");
    if (this.activeMissionsCounter) this.activeMissionsCounter.textContent = `(${count} / 3)`;

    const now = Date.now();
    let anyReady = false;
    let minRemainingMs = Infinity;

    for (const run of activeRuns) {
      const remainingMs = Math.max(0, run.endsAt - now);
      if (remainingMs === 0) {
        anyReady = true;
      } else if (remainingMs < minRemainingMs) {
        minRemainingMs = remainingMs;
      }

      // Update individual card if in DOM
      const card = this.activeMissionsList?.querySelector<HTMLDivElement>(`[data-run-id="${run.runId}"]`);
      if (card) {
        const elapsed = Math.max(0, now - run.startedAt);
        const progressPct = Math.min(100, (elapsed / run.durationMs) * 100);
        const progressBar = card.querySelector<HTMLDivElement>(".bar-mission");
        const timerEl = card.querySelector<HTMLSpanElement>(".active-timer-display");
        const statusEl = card.querySelector<HTMLSpanElement>(".active-status-text");
        const btnClaim = card.querySelector<HTMLButtonElement>(".btn-rpg-claim");

        if (progressBar) progressBar.style.width = `${progressPct}%`;

        if (remainingMs === 0) {
          card.classList.add("ready");
          if (timerEl) timerEl.textContent = "00:00";
          if (statusEl) statusEl.textContent = "Missão concluída! Pronto para coletar.";
          if (btnClaim) {
            btnClaim.disabled = false;
            btnClaim.textContent = `COLETAR (+${run.potentialExp} EXP)`;
          }
        } else {
          card.classList.remove("ready");
          const formatted = this.formatDuration(remainingMs);
          if (timerEl) timerEl.textContent = formatted;
          if (statusEl) statusEl.textContent = "Em andamento…";
          if (btnClaim) {
            btnClaim.disabled = true;
            btnClaim.textContent = "EM PROGRESSO";
          }
        }
      }
    }

    // Update global badges
    if (anyReady) {
      if (this.missionHudBadge) {
        this.missionHudBadge.textContent = "COLETAR!";
        this.missionHudBadge.classList.remove("hidden");
        this.missionHudBadge.classList.add("ready");
      }
      if (this.sidebarMissionBadge) {
        this.sidebarMissionBadge.textContent = "PRONTO!";
        this.sidebarMissionBadge.classList.remove("hidden");
        this.sidebarMissionBadge.classList.add("ready");
      }
    } else if (minRemainingMs !== Infinity) {
      const formatted = this.formatDuration(minRemainingMs);
      if (this.missionHudBadge) {
        this.missionHudBadge.textContent = formatted;
        this.missionHudBadge.classList.remove("hidden");
        this.missionHudBadge.classList.remove("ready");
      }
      if (this.sidebarMissionBadge) {
        this.sidebarMissionBadge.textContent = formatted;
        this.sidebarMissionBadge.classList.remove("hidden");
        this.sidebarMissionBadge.classList.remove("ready");
      }
    }
  }

  public renderMissionsModal(state: MissionsState) {
    gameState.currentMissionsState = state;
    this.renderActiveRuns();
    this.renderAvailableList(state);
    this.updateMissionTicker();
  }

  private renderActiveRuns() {
    if (!this.activeMissionsList) return;
    this.activeMissionsList.innerHTML = "";

    const activeRuns = this.getActiveRuns();
    if (this.activeMissionsCounter) {
      this.activeMissionsCounter.textContent = `(${activeRuns.length} / 3)`;
    }

    if (activeRuns.length === 0) {
      this.activeMissionContainer?.classList.add("hidden");
      return;
    }

    this.activeMissionContainer?.classList.remove("hidden");

    for (const run of activeRuns) {
      const card = document.createElement("div");
      card.className = "active-mission-card";
      card.dataset.runId = run.runId;

      card.innerHTML = `
        <div class="active-mission-header">
          <span class="active-mission-name">${run.name}</span>
          <span class="active-timer-display">...</span>
        </div>
        <div class="active-mission-body">
          <div class="active-mission-meta">
            <span class="active-status-text">Calculando tempo…</span>
          </div>
          <div class="mission-progress-track">
            <div class="bar-mission" style="width: 0%;"></div>
          </div>
          <div class="active-mission-actions">
            <button class="btn-rpg-claim" disabled type="button">COLETAR</button>
            <button class="btn-rpg-cancel-mission" type="button">CANCELAR</button>
          </div>
        </div>
      `;

      const btnClaim = card.querySelector<HTMLButtonElement>(".btn-rpg-claim");
      btnClaim?.addEventListener("click", () => {
        socket.emit(ClientEvents.ClaimMissionRequest, { runId: run.runId });
      });

      const btnCancel = card.querySelector<HTMLButtonElement>(".btn-rpg-cancel-mission");
      btnCancel?.addEventListener("click", () => {
        socket.emit(ClientEvents.CancelMissionRequest, { runId: run.runId });
      });

      this.activeMissionsList.appendChild(card);
    }
  }

  private renderAvailableList(state: MissionsState) {
    if (!this.missionsList) return;
    this.missionsList.innerHTML = "";

    const me = gameState.lastMe;
    const activeRuns = this.getActiveRuns();
    const isAtCapacity = activeRuns.length >= 3;

    for (const mission of state.available) {
      const isAlreadyRunning = activeRuns.some((r) => r.missionId === mission.id);
      const isRankOk = me ? isRankAllowed(me.rank, mission.minRank) : false;
      const isLevelOk = me ? me.level >= mission.minLevel : false;
      const isLocked = !isRankOk || !isLevelOk;
      const potentialExp = me ? mobExp(me.level) * mission.killsEquiv : mission.killsEquiv * 8;

      const card = document.createElement("div");
      card.className = `mission-item-card ${isLocked ? "locked" : ""}`;

      let reqsText = "";
      if (isLocked) {
        const parts: string[] = [];
        if (!isRankOk) parts.push(`Rank ${mission.minRank}`);
        if (!isLevelOk) parts.push(`Nível ${mission.minLevel}`);
        reqsText = `Requer ${parts.join(" e ")}`;
      }

      let btnText = "INICIAR";
      let btnDisabled = isLocked || isAtCapacity || isAlreadyRunning;
      let btnTitle = "Iniciar missão autônoma";

      if (isLocked) {
        btnText = "BLOQUEADO";
        btnTitle = reqsText;
      } else if (isAlreadyRunning) {
        btnText = "EM EXECUÇÃO";
        btnTitle = "Esta missão já está em andamento";
      } else if (isAtCapacity) {
        btnText = "CAPACIDADE MÁXIMA";
        btnTitle = "Você já possui o limite de 3 missões simultâneas";
      }

      card.innerHTML = `
        <div class="mission-card-left">
          <div class="mission-item-icon">[${mission.minRank}]</div>
          <div class="mission-item-details">
            <div class="mission-item-top">
              <span class="mission-item-name">${mission.name}</span>
              <span class="mission-badge-time">${this.formatDurationLabel(mission.durationMs)}</span>
              <span class="mission-badge-exp">+${potentialExp} EXP</span>
            </div>
            <span class="mission-item-desc">${mission.description}</span>
            ${reqsText ? `<span class="mission-item-reqs">${reqsText}</span>` : ""}
          </div>
        </div>
        <div class="mission-card-right">
          <button class="btn-start-mission" ${btnDisabled ? "disabled" : ""} title="${btnTitle}">
            ${btnText}
          </button>
        </div>
      `;

      const btnStart = card.querySelector<HTMLButtonElement>(".btn-start-mission");
      btnStart?.addEventListener("click", () => {
        if (btnDisabled) return;
        socket.emit(ClientEvents.StartMissionRequest, { missionId: mission.id });
      });

      this.missionsList.appendChild(card);
    }
  }
}

export const missionsController = new MissionsController();
