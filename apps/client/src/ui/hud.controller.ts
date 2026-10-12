import type { HunterClass, PlayerSnapshot, PlayerStats } from "@rpg/contracts";
import { CLASS_PORTRAIT, portraitUrl } from "../assets";
import { CLASS_TITLES, gameState } from "../state/game-state";

export class HudController {
  // Top bar elements
  public readonly connection = document.querySelector<HTMLSpanElement>("#connection")!;
  public readonly status = document.querySelector<HTMLSpanElement>("#status")!;
  public readonly headerHunterNick = document.querySelector<HTMLSpanElement>("#header-hunter-nick")!;
  public readonly headerHunterResources = document.querySelector<HTMLSpanElement>("#header-hunter-resources")!;
  public readonly hunterRankBadge = document.querySelector<HTMLSpanElement>("#hunter-rank-badge")!;
  public readonly hudLevel = document.querySelector<HTMLSpanElement>("#hud-level");
  public readonly hudExpFill = document.querySelector<HTMLDivElement>("#hud-exp-fill");
  public readonly hudExpText = document.querySelector<HTMLSpanElement>("#hud-exp-text");

  // Sidebar elements
  public readonly sidebarPortrait = document.querySelector<HTMLImageElement>("#sidebar-portrait");
  public readonly sidebarHunterNick = document.querySelector<HTMLDivElement>("#sidebar-hunter-nick");
  public readonly sidebarHunterClass = document.querySelector<HTMLDivElement>("#sidebar-hunter-class");
  public readonly sidebarHunterRank = document.querySelector<HTMLSpanElement>("#sidebar-hunter-rank");
  public readonly sidebarHunterLevel = document.querySelector<HTMLSpanElement>("#sidebar-hunter-level");
  public readonly sidebarLevelCapText = document.querySelector<HTMLSpanElement>("#sidebar-level-cap-text");
  public readonly sidebarHpText = document.querySelector<HTMLSpanElement>("#sidebar-hp-text");
  public readonly sidebarHpBar = document.querySelector<HTMLDivElement>("#sidebar-hp-bar");
  public readonly sidebarMpText = document.querySelector<HTMLSpanElement>("#sidebar-mp-text");
  public readonly sidebarMpBar = document.querySelector<HTMLDivElement>("#sidebar-mp-bar");
  public readonly sidebarExpFill = document.querySelector<HTMLDivElement>("#sidebar-exp-fill");
  public readonly sidebarExpText = document.querySelector<HTMLSpanElement>("#sidebar-exp-text");
  public readonly sidebarStatPointsBadge = document.querySelector<HTMLSpanElement>("#sidebar-stat-points-badge");

  // Combat parameters preview in arena
  public readonly attrAtkPhys = document.querySelector<HTMLSpanElement>("#attr-atk-phys");
  public readonly attrAtkMag = document.querySelector<HTMLSpanElement>("#attr-atk-mag");
  public readonly attrCrit = document.querySelector<HTMLSpanElement>("#attr-crit");
  public readonly attrDef = document.querySelector<HTMLSpanElement>("#attr-def");

  setStatus(msg: string) {
    if (this.status) this.status.textContent = msg;
  }

  setConnection(text: string, color: string) {
    if (this.connection) {
      this.connection.textContent = text;
      this.connection.style.color = color;
    }
  }

  applyPlayerStats(stats?: PlayerStats) {
    if (!stats) return;
    if (this.attrAtkPhys) this.attrAtkPhys.textContent = `${stats.physicalAtk}`;
    if (this.attrAtkMag) this.attrAtkMag.textContent = `${stats.magicalAtk}`;
    if (this.attrCrit) this.attrCrit.textContent = `${Math.round(stats.critChance * 100)}%`;
    if (this.attrDef) {
      this.attrDef.textContent = `${Math.round(stats.dodgeChance * 100)}% / ${Math.round(stats.blockChance * 100)}%`;
    }
  }

  updateClassVisuals(hClass: HunterClass) {
    const playerAvatarBox = document.querySelector<HTMLDivElement>("#player-avatar-box");
    if (playerAvatarBox) {
      const src = portraitUrl(CLASS_PORTRAIT[hClass] ?? "healer");
      if (playerAvatarBox.dataset.cls !== hClass) {
        playerAvatarBox.dataset.cls = hClass;
        playerAvatarBox.innerHTML = `<img class="portrait-img" src="${src}" alt="${hClass}" draggable="false">`;
      }
    }

    const classTitles: Record<HunterClass, string> = {
      BATTLE_HEALER: "«Curandeiro de Combate Sagrado»",
      ASSASSIN: "«Assassino de Sombras»",
      WARRIOR: "«Guerreiro Guardião de Ferro»",
      MAGE: "«Arquimago Dimensional»"
    };
    const battlePlayerClassTitle = document.querySelector<HTMLSpanElement>("#battle-player-class-title");
    if (battlePlayerClassTitle) {
      battlePlayerClassTitle.textContent = classTitles[hClass];
    }
  }

  applyHud(me: PlayerSnapshot) {
    gameState.currentHunterClass = me.hunterClass;

    if (this.headerHunterNick) this.headerHunterNick.textContent = me.name;
    if (this.headerHunterResources) {
      this.headerHunterResources.textContent = `HP: ${me.hp}/${me.maxHp} · MP: ${me.mp}/${me.maxMp}`;
    }
    if (this.hunterRankBadge) {
      this.hunterRankBadge.textContent = `RANK ${me.rank}`;
      this.hunterRankBadge.className = `rank-tag rank-${me.rank.toLowerCase()}`;
    }

    const classSelect = document.querySelector<HTMLSelectElement>("#class-select");
    if (classSelect && classSelect.value !== me.hunterClass) {
      classSelect.value = me.hunterClass;
    }

    this.updateClassVisuals(me.hunterClass);
    this.applyPlayerStats(me.stats);

    const capped = me.level >= me.levelCap;
    if (this.hudLevel) this.hudLevel.textContent = `LV ${me.level}`;
    if (this.hudExpFill) {
      this.hudExpFill.style.width = `${Math.min(100, (100 * me.exp) / me.expToNext)}%`;
      this.hudExpFill.classList.toggle("exp-capped", capped);
    }
    if (this.hudExpText) {
      this.hudExpText.textContent = capped
        ? `EXP ${me.exp} / ${me.expToNext} · TRAVADO`
        : `EXP ${me.exp} / ${me.expToNext}`;
    }

    // Sincroniza o Menu Lateral (Sidebar)
    if (this.sidebarPortrait) this.sidebarPortrait.src = portraitUrl(CLASS_PORTRAIT[me.hunterClass]);
    if (this.sidebarHunterNick) this.sidebarHunterNick.textContent = me.name;
    if (this.sidebarHunterClass) this.sidebarHunterClass.textContent = CLASS_TITLES[me.hunterClass];
    if (this.sidebarHunterRank) {
      this.sidebarHunterRank.textContent = `RANK ${me.rank}`;
      this.sidebarHunterRank.className = `sidebar-rank-tag rank-${me.rank.toLowerCase()}`;
    }
    if (this.sidebarHunterLevel) this.sidebarHunterLevel.textContent = `Lv ${me.level}`;
    if (this.sidebarLevelCapText) {
      this.sidebarLevelCapText.textContent = capped
        ? `NÍVEL ${me.levelCap} (TRAVADO: FAÇA A PROVA)`
        : `NÍVEL ${me.levelCap} (PROVA DO RANK)`;
    }
    if (this.sidebarHpText) this.sidebarHpText.textContent = `${me.hp} / ${me.maxHp}`;
    if (this.sidebarHpBar) this.sidebarHpBar.style.width = `${Math.max(0, (100 * me.hp) / me.maxHp)}%`;
    if (this.sidebarMpText) this.sidebarMpText.textContent = `${me.mp} / ${me.maxMp}`;
    if (this.sidebarMpBar) this.sidebarMpBar.style.width = `${Math.max(0, (100 * me.mp) / me.maxMp)}%`;
    if (this.sidebarExpFill) {
      this.sidebarExpFill.style.width = `${Math.min(100, (100 * me.exp) / me.expToNext)}%`;
      this.sidebarExpFill.classList.toggle("exp-capped", capped);
    }
    if (this.sidebarExpText) {
      this.sidebarExpText.textContent = capped
        ? `${me.exp} / ${me.expToNext} EXP (TRAVADO)`
        : `${me.exp} / ${me.expToNext} EXP (${Math.floor((100 * me.exp) / me.expToNext)}%)`;
    }

    // Badge de pontos não alocados no menu lateral
    const unallocated = me.unallocatedStatPoints ?? 0;
    if (this.sidebarStatPointsBadge) {
      if (unallocated > 0) {
        this.sidebarStatPointsBadge.textContent = `${unallocated} PTS`;
        this.sidebarStatPointsBadge.classList.remove("hidden");
      } else {
        this.sidebarStatPointsBadge.classList.add("hidden");
      }
    }
  }
}

export const hudController = new HudController();
