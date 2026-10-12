import {
  ClientEvents,
  ITEM_RARITY_COLORS,
  type HunterClass
} from "@rpg/contracts";
import { CLASS_PORTRAIT, portraitUrl } from "../assets";
import { socket } from "../network/game-socket";
import { CLASS_TITLES, gameState } from "../state/game-state";
import { hudController } from "./hud.controller";

export class ProfileController {
  public readonly profileModal = document.querySelector<HTMLDivElement>("#profile-modal");
  public readonly btnProfileClose = document.querySelector<HTMLButtonElement>("#btn-profile-close");
  public readonly profilePortraitImg = document.querySelector<HTMLImageElement>("#profile-portrait-img");
  public readonly profileNickDisplay = document.querySelector<HTMLSpanElement>("#profile-nick-display");
  public readonly profileClassDisplay = document.querySelector<HTMLSpanElement>("#profile-class-display");
  public readonly profileRankDisplay = document.querySelector<HTMLSpanElement>("#profile-rank-display");
  public readonly profileLevelVal = document.querySelector<HTMLSpanElement>("#profile-level-val");
  public readonly profileExpVal = document.querySelector<HTMLSpanElement>("#profile-exp-val");
  public readonly profileAtkPhys = document.querySelector<HTMLSpanElement>("#profile-atk-phys");
  public readonly profileAtkMag = document.querySelector<HTMLSpanElement>("#profile-atk-mag");
  public readonly profileCrit = document.querySelector<HTMLSpanElement>("#profile-crit");
  public readonly profileDodge = document.querySelector<HTMLSpanElement>("#profile-dodge");
  public readonly profileBlock = document.querySelector<HTMLSpanElement>("#profile-block");
  public readonly profileMaxHp = document.querySelector<HTMLSpanElement>("#profile-max-hp");
  public readonly profileMaxMp = document.querySelector<HTMLSpanElement>("#profile-max-mp");
  public readonly profileMult = document.querySelector<HTMLSpanElement>("#profile-mult");

  // Career Records Elements
  public readonly careerCrits = document.querySelector<HTMLSpanElement>("#career-crits");
  public readonly careerDodges = document.querySelector<HTMLSpanElement>("#career-dodges");
  public readonly careerBlocks = document.querySelector<HTMLSpanElement>("#career-blocks");
  public readonly careerMonsters = document.querySelector<HTMLSpanElement>("#career-monsters");
  public readonly careerBosses = document.querySelector<HTMLSpanElement>("#career-bosses");
  public readonly careerMissions = document.querySelector<HTMLSpanElement>("#career-missions");
  public readonly careerTotalItems = document.querySelector<HTMLSpanElement>("#career-total-items");
  public readonly careerHighestRarity = document.querySelector<HTMLSpanElement>("#career-highest-rarity");
  public readonly careerBestItem = document.querySelector<HTMLSpanElement>("#career-best-item");

  // Stat Distribution Elements
  public readonly profileUnallocatedPts = document.querySelector<HTMLSpanElement>("#profile-unallocated-pts");
  public readonly statValStr = document.querySelector<HTMLSpanElement>("#stat-val-str");
  public readonly statPendingStr = document.querySelector<HTMLSpanElement>("#stat-pending-str");
  public readonly btnDecStr = document.querySelector<HTMLButtonElement>("#btn-dec-str");
  public readonly btnIncStr = document.querySelector<HTMLButtonElement>("#btn-inc-str");

  public readonly statValAgi = document.querySelector<HTMLSpanElement>("#stat-val-agi");
  public readonly statPendingAgi = document.querySelector<HTMLSpanElement>("#stat-pending-agi");
  public readonly btnDecAgi = document.querySelector<HTMLButtonElement>("#btn-dec-agi");
  public readonly btnIncAgi = document.querySelector<HTMLButtonElement>("#btn-inc-agi");

  public readonly statValVit = document.querySelector<HTMLSpanElement>("#stat-val-vit");
  public readonly statPendingVit = document.querySelector<HTMLSpanElement>("#stat-pending-vit");
  public readonly btnDecVit = document.querySelector<HTMLButtonElement>("#btn-dec-vit");
  public readonly btnIncVit = document.querySelector<HTMLButtonElement>("#btn-inc-vit");

  public readonly statValInt = document.querySelector<HTMLSpanElement>("#stat-val-int");
  public readonly statPendingInt = document.querySelector<HTMLSpanElement>("#stat-pending-int");
  public readonly btnDecInt = document.querySelector<HTMLButtonElement>("#btn-dec-int");
  public readonly btnIncInt = document.querySelector<HTMLButtonElement>("#btn-inc-int");

  public readonly btnResetStats = document.querySelector<HTMLButtonElement>("#btn-reset-stats");
  public readonly btnConfirmStats = document.querySelector<HTMLButtonElement>("#btn-confirm-stats");
  public readonly classSelect = document.querySelector<HTMLSelectElement>("#class-select");

  public pendingStats = { str: 0, agi: 0, vit: 0, int: 0 };

  constructor() {
    this.bindEvents();
  }

  private bindEvents() {
    this.btnIncStr?.addEventListener("click", () => this.adjustStat("str", 1));
    this.btnDecStr?.addEventListener("click", () => this.adjustStat("str", -1));
    this.btnIncAgi?.addEventListener("click", () => this.adjustStat("agi", 1));
    this.btnDecAgi?.addEventListener("click", () => this.adjustStat("agi", -1));
    this.btnIncVit?.addEventListener("click", () => this.adjustStat("vit", 1));
    this.btnDecVit?.addEventListener("click", () => this.adjustStat("vit", -1));
    this.btnIncInt?.addEventListener("click", () => this.adjustStat("int", 1));
    this.btnDecInt?.addEventListener("click", () => this.adjustStat("int", -1));

    this.btnResetStats?.addEventListener("click", () => {
      this.pendingStats = { str: 0, agi: 0, vit: 0, int: 0 };
      this.updateStatDistributionUI();
    });

    this.btnConfirmStats?.addEventListener("click", () => {
      const total = this.pendingStats.str + this.pendingStats.agi + this.pendingStats.vit + this.pendingStats.int;
      if (total <= 0) return;
      socket.emit(ClientEvents.AllocateStatsRequest, {
        str: this.pendingStats.str,
        agi: this.pendingStats.agi,
        vit: this.pendingStats.vit,
        int: this.pendingStats.int
      });
      this.pendingStats = { str: 0, agi: 0, vit: 0, int: 0 };
      this.updateStatDistributionUI();
    });

    this.classSelect?.addEventListener("change", () => {
      const hClass = this.classSelect!.value as HunterClass;
      gameState.currentHunterClass = hClass;
      socket.emit(ClientEvents.SelectClassRequest, { hunterClass: hClass });
      hudController.updateClassVisuals(hClass);
      this.classSelect?.blur();
    });

    const btnDev50 = document.querySelector<HTMLButtonElement>("#btn-dev-lvl-50");
    btnDev50?.addEventListener("click", () => {
      socket.emit(ClientEvents.DevSetLevelRequest, { level: 50, rank: "B" });
      hudController.setStatus("Personagem ajustado para Nível 50 (Rank B)!");
    });

    const btnDev100 = document.querySelector<HTMLButtonElement>("#btn-dev-lvl-100");
    btnDev100?.addEventListener("click", () => {
      socket.emit(ClientEvents.DevSetLevelRequest, { level: 100, rank: "S" });
      hudController.setStatus("Personagem ajustado para Nível 100 (Rank S)!");
    });
  }

  public getRemainingPoints(): number {
    const totalPending = this.pendingStats.str + this.pendingStats.agi + this.pendingStats.vit + this.pendingStats.int;
    return Math.max(0, (gameState.lastMe?.unallocatedStatPoints ?? 0) - totalPending);
  }

  public adjustStat(stat: "str" | "agi" | "vit" | "int", delta: number) {
    if (delta > 0) {
      if (this.getRemainingPoints() > 0) {
        this.pendingStats[stat]++;
      }
    } else if (delta < 0) {
      if (this.pendingStats[stat] > 0) {
        this.pendingStats[stat]--;
      }
    }
    this.updateStatDistributionUI();
  }

  public updateStatDistributionUI() {
    const me = gameState.lastMe;
    if (!me) return;

    const attrs = me.attributes ?? { str: 10, agi: 10, vit: 10, int: 10 };
    const remaining = this.getRemainingPoints();
    const totalPending = this.pendingStats.str + this.pendingStats.agi + this.pendingStats.vit + this.pendingStats.int;

    if (this.profileUnallocatedPts) {
      this.profileUnallocatedPts.textContent = `${remaining}`;
      this.profileUnallocatedPts.classList.toggle("has-points", remaining > 0);
    }

    const statsKeys = ["str", "agi", "vit", "int"] as const;
    const valEls = { str: this.statValStr, agi: this.statValAgi, vit: this.statValVit, int: this.statValInt };
    const pendingEls = { str: this.statPendingStr, agi: this.statPendingAgi, vit: this.statPendingVit, int: this.statPendingInt };
    const decBtns = { str: this.btnDecStr, agi: this.btnDecAgi, vit: this.btnDecVit, int: this.btnDecInt };
    const incBtns = { str: this.btnIncStr, agi: this.btnIncAgi, vit: this.btnIncVit, int: this.btnIncInt };

    for (const k of statsKeys) {
      const currentVal = attrs[k];
      const pendingVal = this.pendingStats[k];
      if (valEls[k]) valEls[k]!.textContent = `${currentVal}`;
      if (pendingEls[k]) {
        pendingEls[k]!.textContent = `+${pendingVal}`;
        pendingEls[k]!.classList.toggle("has-pending", pendingVal > 0);
      }
      if (decBtns[k]) decBtns[k]!.disabled = pendingVal <= 0;
      if (incBtns[k]) incBtns[k]!.disabled = remaining <= 0;
    }

    if (this.btnResetStats) this.btnResetStats.disabled = totalPending <= 0;
    if (this.btnConfirmStats) this.btnConfirmStats.disabled = totalPending <= 0;

    // Pré-visualização de atributos derivados
    if (me.stats) {
      const bonusStr = this.pendingStats.str * 2;
      const bonusInt = this.pendingStats.int * 2.5;
      const bonusAgiCrit = this.pendingStats.agi * 0.005;
      const bonusAgiDodge = this.pendingStats.agi * 0.004;
      const bonusVitHp = this.pendingStats.vit * 10;
      const bonusVitBlock = this.pendingStats.vit * 0.003;
      const bonusIntMp = this.pendingStats.int * 8;

      const previewAtkPhys = me.stats.physicalAtk + bonusStr;
      const previewAtkMag = Math.round(me.stats.magicalAtk + bonusInt);
      const previewCrit = Math.min(0.75, me.stats.critChance + bonusAgiCrit);
      const previewDodge = Math.min(0.50, me.stats.dodgeChance + bonusAgiDodge);
      const previewBlock = Math.min(0.60, me.stats.blockChance + bonusVitBlock);
      const previewHp = me.maxHp + bonusVitHp;
      const previewMp = me.maxMp + bonusIntMp;

      if (this.profileAtkPhys) {
        this.profileAtkPhys.textContent = totalPending > 0 && bonusStr > 0
          ? `${previewAtkPhys} (+${bonusStr})`
          : `${me.stats.physicalAtk}`;
        this.profileAtkPhys.classList.toggle("stat-preview-up", bonusStr > 0);
      }
      if (this.profileAtkMag) {
        this.profileAtkMag.textContent = totalPending > 0 && bonusInt > 0
          ? `${previewAtkMag} (+${Math.round(bonusInt)})`
          : `${me.stats.magicalAtk}`;
        this.profileAtkMag.classList.toggle("stat-preview-up", bonusInt > 0);
      }
      if (this.profileCrit) {
        this.profileCrit.textContent = totalPending > 0 && bonusAgiCrit > 0
          ? `${Math.round(previewCrit * 100)}% (+${(bonusAgiCrit * 100).toFixed(1)}%)`
          : `${Math.round(me.stats.critChance * 100)}%`;
        this.profileCrit.classList.toggle("stat-preview-up", bonusAgiCrit > 0);
      }
      if (this.profileDodge) {
        this.profileDodge.textContent = totalPending > 0 && bonusAgiDodge > 0
          ? `${Math.round(previewDodge * 100)}% (+${(bonusAgiDodge * 100).toFixed(1)}%)`
          : `${Math.round(me.stats.dodgeChance * 100)}%`;
        this.profileDodge.classList.toggle("stat-preview-up", bonusAgiDodge > 0);
      }
      if (this.profileBlock) {
        this.profileBlock.textContent = totalPending > 0 && bonusVitBlock > 0
          ? `${Math.round(previewBlock * 100)}% (+${(bonusVitBlock * 100).toFixed(1)}%)`
          : `${Math.round(me.stats.blockChance * 100)}%`;
        this.profileBlock.classList.toggle("stat-preview-up", bonusVitBlock > 0);
      }
      if (this.profileMaxHp) {
        this.profileMaxHp.textContent = totalPending > 0 && bonusVitHp > 0
          ? `${previewHp} HP (+${bonusVitHp})`
          : `${me.maxHp} HP`;
        this.profileMaxHp.classList.toggle("stat-preview-up", bonusVitHp > 0);
      }
      if (this.profileMaxMp) {
        this.profileMaxMp.textContent = totalPending > 0 && bonusIntMp > 0
          ? `${previewMp} MP (+${bonusIntMp})`
          : `${me.maxMp} MP`;
        this.profileMaxMp.classList.toggle("stat-preview-up", bonusIntMp > 0);
      }
    }
  }

  public updateProfileModal() {
    const me = gameState.lastMe;
    if (!me) return;
    if (this.profilePortraitImg) this.profilePortraitImg.src = portraitUrl(CLASS_PORTRAIT[me.hunterClass]);
    if (this.profileNickDisplay) this.profileNickDisplay.textContent = me.name;
    if (this.profileClassDisplay) this.profileClassDisplay.textContent = CLASS_TITLES[me.hunterClass];
    if (this.profileRankDisplay) {
      this.profileRankDisplay.textContent = `RANK ${me.rank}`;
      this.profileRankDisplay.className = `rank-tag rank-${me.rank.toLowerCase().replace("+", "-plus")}`;
    }
    if (this.profileLevelVal) this.profileLevelVal.textContent = `Lv ${me.level}`;
    if (this.profileExpVal) this.profileExpVal.textContent = `${me.exp} / ${me.expToNext} (Cap: Lv ${me.levelCap})`;
    if (this.profileMult) this.profileMult.textContent = `${(1 + 0.09 * (me.level - 1)).toFixed(2)}x`;

    // Render Career Stats
    const c = gameState.careerStats;
    if (this.careerCrits) this.careerCrits.textContent = c.criticalHitsDealt.toLocaleString();
    if (this.careerDodges) this.careerDodges.textContent = c.attacksDodged.toLocaleString();
    if (this.careerBlocks) this.careerBlocks.textContent = c.attacksBlocked.toLocaleString();
    if (this.careerMonsters) this.careerMonsters.textContent = c.regularMonstersSlain.toLocaleString();
    if (this.careerBosses) this.careerBosses.textContent = c.gateBossesSlain.toLocaleString();
    if (this.careerMissions) this.careerMissions.textContent = c.missionsCompleted.toLocaleString();
    if (this.careerTotalItems) this.careerTotalItems.textContent = c.totalItemsDropped.toLocaleString();
    if (this.careerHighestRarity) {
      this.careerHighestRarity.textContent = c.highestRarityDropped ? ITEM_RARITY_COLORS[c.highestRarityDropped].name : "—";
      if (c.highestRarityDropped) {
        this.careerHighestRarity.style.color = ITEM_RARITY_COLORS[c.highestRarityDropped].hex;
      } else {
        this.careerHighestRarity.style.color = "";
      }
    }
    if (this.careerBestItem) {
      this.careerBestItem.textContent = c.bestItemDroppedName ?? "—";
    }

    this.updateStatDistributionUI();
  }
}

export const profileController = new ProfileController();
