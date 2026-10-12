import {
  ClientEvents,
  ITEM_RARITY_COLORS,
  expToNext,
  type BattleEvent,
  type BattleRewards,
  type BattleSnapshot
} from "@rpg/contracts";
import { AVATARS } from "../avatars";
import { socket } from "../network/game-socket";
import { skillIcon } from "../skillicons";
import { gameState } from "../state/game-state";
import { hudController } from "../ui/hud.controller";
import { getItemIconUrl } from "../ui/inventory.controller";

const PREFERS_REDUCED_MOTION = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export class BattleController {
  // DOM Elements - Battle Arena
  public readonly battleScreen = document.querySelector<HTMLDivElement>("#battle-screen")!;
  public readonly battleTurnIndicator = document.querySelector<HTMLSpanElement>("#battle-turn-indicator")!;

  // Player Card
  public readonly playerAvatarBox = document.querySelector<HTMLDivElement>("#player-avatar-box")!;
  public readonly battlePlayerName = document.querySelector<HTMLSpanElement>("#battle-player-name")!;
  public readonly battlePlayerClassTitle = document.querySelector<HTMLSpanElement>("#battle-player-class-title")!;
  public readonly battlePlayerBadge = document.querySelector<HTMLSpanElement>("#battle-player-badge")!;
  public readonly battlePlayerHpText = document.querySelector<HTMLSpanElement>("#battle-player-hp-text")!;
  public readonly battlePlayerHpBar = document.querySelector<HTMLDivElement>("#battle-player-hp-bar")!;
  public readonly battlePlayerMpText = document.querySelector<HTMLSpanElement>("#battle-player-mp-text")!;
  public readonly battlePlayerMpBar = document.querySelector<HTMLDivElement>("#battle-player-mp-bar")!;

  // Enemy Card
  public readonly enemyAvatarBox = document.querySelector<HTMLDivElement>("#enemy-avatar-box")!;
  public readonly battleEnemyName = document.querySelector<HTMLSpanElement>("#battle-enemy-name")!;
  public readonly battleEnemyBadge = document.querySelector<HTMLSpanElement>("#battle-enemy-badge")!;
  public readonly battleEnemyHpText = document.querySelector<HTMLSpanElement>("#battle-enemy-hp-text")!;
  public readonly battleEnemyHpBar = document.querySelector<HTMLDivElement>("#battle-enemy-hp-bar")!;
  public readonly battleEnemyMpText = document.querySelector<HTMLSpanElement>("#battle-enemy-mp-text")!;
  public readonly battleEnemyMpBar = document.querySelector<HTMLDivElement>("#battle-enemy-mp-bar")!;

  // Center Column
  public readonly battleLogFeed = document.querySelector<HTMLDivElement>("#battle-log")!;
  public readonly skillsDeck = document.querySelector<HTMLDivElement>("#skills-deck")!;
  public readonly btnFlee = document.querySelector<HTMLButtonElement>("#btn-flee")!;

  // Consumables Bar
  public readonly battleConsumablesCharges = document.querySelector<HTMLSpanElement>("#battle-consumables-charges");
  public readonly btnCombatPotionHp = document.querySelector<HTMLButtonElement>("#btn-combat-potion-hp");
  public readonly btnCombatPotionMp = document.querySelector<HTMLButtonElement>("#btn-combat-potion-mp");
  public readonly combatHpPotionQty = document.querySelector<HTMLSpanElement>("#combat-hp-potion-qty");
  public readonly combatMpPotionQty = document.querySelector<HTMLSpanElement>("#combat-mp-potion-qty");

  // Result Modal
  public readonly battleResultModal = document.querySelector<HTMLDivElement>("#battle-result-modal")!;
  public readonly resultIcon = document.querySelector<HTMLDivElement>("#result-icon")!;
  public readonly resultTitle = document.querySelector<HTMLHeadingElement>("#result-title")!;
  public readonly resultDesc = document.querySelector<HTMLDivElement>("#result-desc")!;
  public readonly btnReturnMap = document.querySelector<HTMLButtonElement>("#btn-return-map")!;
  public readonly expBlock = document.querySelector<HTMLDivElement>("#exp-block")!;
  public readonly expLevel = document.querySelector<HTMLSpanElement>("#exp-level")!;
  public readonly expNumbers = document.querySelector<HTMLSpanElement>("#exp-numbers")!;
  public readonly expFill = document.querySelector<HTMLDivElement>("#exp-fill")!;
  public readonly expGain = document.querySelector<HTMLDivElement>("#exp-gain")!;
  public readonly expNote = document.querySelector<HTMLDivElement>("#exp-note")!;
  public readonly rewardDrops = document.querySelector<HTMLDivElement>("#reward-drops")!;
  public readonly rewardNone = document.querySelector<HTMLSpanElement>("#reward-none")!;

  // Queue & Animation State
  public pending = 0;
  public fast = false;
  private chain: Promise<void> = Promise.resolve();

  constructor() {
    this.bindEvents();
  }

  private bindEvents() {
    this.btnCombatPotionHp?.addEventListener("click", () => this.useCombatPotion("hp"));
    this.btnCombatPotionMp?.addEventListener("click", () => this.useCombatPotion("mp"));

    this.btnFlee?.addEventListener("click", () => {
      if (!gameState.currentBattle || gameState.currentBattle.finished) return;
      socket.emit(ClientEvents.BattleFleeRequest, { battleId: gameState.currentBattle.battleId });
    });

    this.btnReturnMap?.addEventListener("click", () => {
      if (this.pending > 0) {
        this.fast = true;
        return;
      }
      if (gameState.currentBattle && !gameState.currentBattle.finished) {
        socket.emit(ClientEvents.BattleFleeRequest, { battleId: gameState.currentBattle.battleId });
      }
      gameState.currentBattle = null;
      this.resetBattleVisuals();
      hudController.setStatus("Explore o mapa · [E] combate o monstro adjacente · clique num monstro para ir até ele");
      this.battleResultModal.classList.add("hidden");
      this.battleScreen.classList.add("hidden");
      socket.emit(ClientEvents.SnapshotRequest);
    });

    this.battleScreen?.addEventListener("click", () => {
      if (this.pending > 0) this.fast = true;
    });
  }

  public sleep(ms: number): Promise<void> {
    return new Promise<void>((resolve) =>
      setTimeout(resolve, this.fast || PREFERS_REDUCED_MOTION ? 0 : ms)
    );
  }

  public enqueue(task: () => Promise<void>) {
    this.pending++;
    this.chain = this.chain
      .then(task)
      .catch((err) => console.error("battle sequence failed", err))
      .then(() => {
        this.pending--;
        if (this.pending === 0) {
          this.fast = false;
          if (gameState.lastMe) hudController.applyHud(gameState.lastMe);
        }
      });
  }

  public resetBattleVisuals() {
    this.battleResultModal.classList.add("hidden");
    for (const box of [this.playerAvatarBox, this.enemyAvatarBox]) {
      box?.classList.remove("dying", "hit-flash", "hit-crit", "dodge-slide");
      box?.querySelectorAll(".float-num").forEach((n) => n.remove());
    }
    this.battleScreen?.classList.remove("outcome-win", "outcome-lose", "outcome-neutral", "shake");
  }

  public setPlayerBars(hp: number, maxHp: number, mp: number, maxMp: number) {
    if (this.battlePlayerHpText) this.battlePlayerHpText.textContent = `${hp} / ${maxHp}`;
    if (this.battlePlayerHpBar) this.battlePlayerHpBar.style.width = `${Math.max(0, (100 * hp) / maxHp)}%`;
    if (this.battlePlayerMpText) this.battlePlayerMpText.textContent = `${mp} / ${maxMp}`;
    if (this.battlePlayerMpBar) this.battlePlayerMpBar.style.width = `${Math.max(0, (100 * mp) / maxMp)}%`;
  }

  public setEnemyHp(hp: number, maxHp: number) {
    if (this.battleEnemyHpText) this.battleEnemyHpText.textContent = `${hp} / ${maxHp}`;
    if (this.battleEnemyHpBar) this.battleEnemyHpBar.style.width = `${Math.max(0, (100 * hp) / maxHp)}%`;
  }

  public pulse(el: HTMLElement, cls: string) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  public floatText(box: HTMLElement, text: string, cls: string) {
    const el = document.createElement("span");
    el.className = `float-num ${cls}`;
    el.textContent = text;
    box.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  public revealLogUpTo(index: number) {
    for (let i = 0; i <= index && i < this.battleLogFeed.children.length; i++) {
      this.battleLogFeed.children[i].classList.remove("log-hidden");
    }
    this.battleLogFeed.scrollTop = this.battleLogFeed.scrollHeight;
  }

  public renderBattleArena(b: BattleSnapshot, locked = this.pending > 0) {
    this.battleScreen.classList.remove("hidden");
    if (!b.finished) {
      this.battleResultModal.classList.add("hidden");
    }
    this.battleTurnIndicator.textContent = `TURNO ${b.turn} / ${b.maxTurns}`;

    // 1. Update Player Card
    this.battlePlayerName.textContent = b.player.name;
    this.battlePlayerBadge.textContent = `RANK ${b.player.rank} · Lv ${b.player.level}`;
    this.setPlayerBars(b.player.hp, b.player.maxHp, b.player.mp, b.player.maxMp);
    hudController.updateClassVisuals(b.player.hunterClass);
    hudController.applyPlayerStats(b.player.stats ?? gameState.lastMe?.stats);

    // 2. Update Enemy Card
    this.battleEnemyName.textContent = b.enemy.name;
    this.battleEnemyBadge.textContent = `RANK ${b.enemy.rank} · Lv ${b.enemy.level}`;
    this.setEnemyHp(b.enemy.hp, b.enemy.maxHp);
    if (this.battleEnemyMpText) this.battleEnemyMpText.textContent = `${b.enemy.mp} / ${b.enemy.maxMp}`;
    if (this.battleEnemyMpBar) this.battleEnemyMpBar.style.width = `${Math.max(0, (100 * b.enemy.mp) / b.enemy.maxMp)}%`;

    if (this.enemyAvatarBox) {
      if (b.enemy.name.toLowerCase().includes("slime")) {
        this.enemyAvatarBox.innerHTML = AVATARS.SLIME;
      } else if (b.enemy.name.toLowerCase().includes("goblin")) {
        this.enemyAvatarBox.innerHTML = AVATARS.GOBLIN;
      } else {
        this.enemyAvatarBox.innerHTML = AVATARS.WOLF;
      }
    }

    // 3. Render Battle Log Feed
    this.battleLogFeed.innerHTML = "";
    for (const entry of b.log) {
      const line = document.createElement("div");
      line.className = "log-line";

      let badgeClass = "badge-normal";
      let badgeText = "AÇÃO";

      if (entry.includes("[CRÍTICO]")) { badgeClass = "badge-crit"; badgeText = "CRÍTICO"; }
      else if (entry.includes("[ESQUIVOU]") || entry.includes("[ESQUIVA]")) { badgeClass = "badge-dodge"; badgeText = "ESQUIVA"; }
      else if (entry.includes("[BLOQUEIO]")) { badgeClass = "badge-block"; badgeText = "BLOQUEIO"; }
      else if (entry.includes("[CURA]")) { badgeClass = "badge-heal"; badgeText = "CURA"; }
      else if (entry.includes("[DANO]")) { badgeClass = "badge-damage"; badgeText = "DANO"; }
      else if (entry.includes("[VITÓRIA]")) { badgeClass = "badge-crit"; badgeText = "VITÓRIA"; }
      else if (entry.includes("[RECUO TÁTICO]")) { badgeClass = "badge-block"; badgeText = "RECUO"; }
      else if (entry.includes("[EMPATE]")) { badgeClass = "badge-dodge"; badgeText = "EMPATE"; }
      else if (entry.includes("[DERROTA]")) { badgeClass = "badge-damage"; badgeText = "DERROTA"; }

      const cleanText = entry.replace(/\[.*?\]\s*/g, "");
      line.innerHTML = `
        <span class="log-badge ${badgeClass}">${badgeText}</span>
        <span class="log-text">${cleanText}</span>
      `;
      this.battleLogFeed.appendChild(line);
    }
    this.battleLogFeed.scrollTop = this.battleLogFeed.scrollHeight;

    // 4. Render Action Deck
    this.skillsDeck.innerHTML = "";
    const skillInfo = document.querySelector<HTMLDivElement>("#skill-info");
    b.player.skills.forEach((skill, idx) => {
      const slot = document.createElement("button");
      const icon = skillIcon(skill.id);
      const notEnoughMp = b.player.mp < skill.mpCost;
      const onCooldown = skill.currentCooldown > 0;
      slot.className = `skill-icon-btn kind-${icon.kind}`;
      slot.disabled = notEnoughMp || onCooldown || b.finished || locked;
      slot.title = `${skill.name} — ${skill.description}`;
      slot.setAttribute("aria-label", `${skill.name}. ${skill.description}. Custo ${skill.mpCost} MP`);

      const cost = skill.mpCost === 0 ? "grátis" : `${skill.mpCost} MP`;
      slot.innerHTML = `
        <span class="skill-key">${idx + 1}</span>
        <span class="skill-glyph">${icon.svg}</span>
        <span class="skill-name">${skill.name}</span>
        <span class="skill-cost ${notEnoughMp ? "skill-cost-low" : ""}">${notEnoughMp ? "sem MP" : cost}</span>
        ${onCooldown ? `<span class="skill-cd">CD: ${skill.currentCooldown}</span>` : ""}
      `;

      const showInfo = () => {
        if (skillInfo) {
          skillInfo.textContent = `${skill.name} · ${cost}${skill.cooldownTurns ? ` · recarga ${skill.cooldownTurns}t` : ""} — ${skill.description}`;
        }
      };
      slot.addEventListener("mouseenter", showInfo);
      slot.addEventListener("focus", showInfo);

      slot.addEventListener("click", () => {
        if (b.finished || this.pending > 0) return;
        socket.emit(ClientEvents.BattleActionRequest, {
          battleId: b.battleId,
          actionId: skill.id
        });
      });

      this.skillsDeck.appendChild(slot);
    });

    this.renderConsumablesBar(b, locked);
  }

  public renderConsumablesBar(b: BattleSnapshot, locked: boolean) {
    const charges = b.consumablesRemaining ?? 2;
    if (this.battleConsumablesCharges) {
      this.battleConsumablesCharges.textContent = `CARGAS: ${charges} / 2`;
    }

    const hpSlot = gameState.inventory.find(
      (s) => s.item.type === "CONSUMABLE" && (s.item.healAmount ?? 0) > 0
    );
    const mpSlot = gameState.inventory.find(
      (s) => s.item.type === "CONSUMABLE" && (s.item.manaAmount ?? 0) > 0
    );

    const hpQty = hpSlot ? hpSlot.quantity : 0;
    const mpQty = mpSlot ? mpSlot.quantity : 0;

    if (this.combatHpPotionQty) this.combatHpPotionQty.textContent = `x${hpQty}`;
    if (this.combatMpPotionQty) this.combatMpPotionQty.textContent = `x${mpQty}`;

    const canUse = !locked && !b.finished && charges > 0;
    if (this.btnCombatPotionHp) {
      this.btnCombatPotionHp.disabled = !canUse || hpQty === 0;
    }
    if (this.btnCombatPotionMp) {
      this.btnCombatPotionMp.disabled = !canUse || mpQty === 0;
    }
  }

  private useCombatPotion(type: "hp" | "mp") {
    if (!gameState.currentBattle || gameState.currentBattle.finished || this.pending > 0) return;
    if ((gameState.currentBattle.consumablesRemaining ?? 2) <= 0) return;

    const slot = gameState.inventory.find((s) =>
      type === "hp"
        ? s.item.type === "CONSUMABLE" && (s.item.healAmount ?? 0) > 0
        : s.item.type === "CONSUMABLE" && (s.item.manaAmount ?? 0) > 0
    );
    if (!slot) return;

    socket.emit(ClientEvents.UseCombatConsumableRequest, {
      battleId: gameState.currentBattle.battleId,
      itemId: slot.item.id
    });
  }

  public showBattleOutcome(b: BattleSnapshot) {
    if (!b.finished) return;
    this.battleResultModal.classList.remove("hidden");

    if (b.result === "VICTORY") {
      this.resultIcon.innerHTML = `<span class="result-badge-text tag-win">[VITÓRIA]</span>`;
      this.resultTitle.textContent = "VITÓRIA GLORIOSA";
      this.resultTitle.style.color = "#facc15";
      this.resultDesc.textContent = `A besta [${b.enemy.rank}] ${b.enemy.name} foi eliminada com sucesso.`;
    } else if (b.result === "DRAW") {
      this.resultIcon.innerHTML = `<span class="result-badge-text tag-draw">[EMPATE]</span>`;
      if (b.drawReason === "TURN_LIMIT" || (b.player.hp > 0 && b.enemy.hp > 0)) {
        this.resultTitle.textContent = "RECUO TÁTICO";
        this.resultTitle.style.color = "#38bdf8";
        this.resultDesc.textContent = `Limite de ${b.maxTurns} turnos atingido! O combate terminou sem vencedor e você recuou taticamente.`;
      } else {
        this.resultTitle.textContent = "EMPATE EM COMBATE";
        this.resultTitle.style.color = "#38bdf8";
        this.resultDesc.textContent = "Golpe fatal simultâneo! Ambos os combatentes sucumbiram na mesma rodada.";
      }
    } else if (b.result === "DEFEAT") {
      this.resultIcon.innerHTML = `<span class="result-badge-text tag-lose">[DERROTA]</span>`;
      this.resultTitle.textContent = "DERROTA NA MASMORRA";
      this.resultTitle.style.color = "#ef4444";
      this.resultDesc.textContent = "Você sofreu ferimentos graves e foi resgatado na entrada do Gate.";
    } else if (b.result === "FLED") {
      this.resultIcon.innerHTML = `<span class="result-badge-text tag-flee">[FUGA]</span>`;
      this.resultTitle.textContent = "FUGA BEM-SUCEDIDA";
      this.resultTitle.style.color = "#94a3b8";
      this.resultDesc.textContent = "Você rompeu o engajamento e recuou para um quadrante seguro do mapa.";
    }

    this.expBlock.classList.toggle("hidden", !b.rewards);
    this.rewardNone.classList.toggle("hidden", !!b.rewards);
    const drops = b.rewards?.drops ?? [];
    this.rewardDrops.classList.toggle("hidden", drops.length === 0);
    this.rewardDrops.innerHTML = drops
      .map(
        (d) => `<div class="reward-drop-item rarity-${d.rarity.toLowerCase()}">
          <img class="item-img" src="${getItemIconUrl(d.icon, d.rarity)}" alt="" draggable="false" />
          <span class="reward-drop-name" style="color:${ITEM_RARITY_COLORS[d.rarity].hex}">${d.name}</span>
          <span class="reward-drop-rarity">${ITEM_RARITY_COLORS[d.rarity].name}</span>
        </div>`
      )
      .join("");
    this.expNote.textContent = "";
    this.expLevel.classList.remove("levelup");
    if (b.rewards) {
      this.expGain.textContent = `+${b.rewards.expGained} EXP`;
      this.expLevel.textContent = `Lv ${b.rewards.levelBefore}`;
      this.setExpBar(b.rewards.expBefore, expToNext(b.rewards.levelBefore));
    }
  }

  public setExpBar(exp: number, need: number) {
    this.expFill.style.transition = "none";
    this.expFill.style.width = `${Math.min(100, (100 * exp) / need)}%`;
    void this.expFill.offsetWidth;
    this.expFill.style.transition = "";
    this.expNumbers.textContent = `${exp} / ${need}`;
  }

  public async animateExpBar(r: BattleRewards) {
    let lvl = r.levelBefore;
    await this.sleep(500);
    for (;;) {
      const need = expToNext(lvl);
      const last = lvl === r.levelAfter;
      const target = last ? r.expAfter : need;
      this.expFill.style.width = `${Math.min(100, (100 * target) / need)}%`;
      this.expNumbers.textContent = `${target} / ${need}`;
      await this.sleep(900);
      if (last) break;
      lvl++;
      this.expLevel.textContent = `LEVEL UP! Lv ${lvl}`;
      this.expLevel.classList.add("levelup");
      await this.sleep(600);
      this.setExpBar(0, expToNext(lvl));
    }
    this.expLevel.textContent = `Lv ${lvl}`;
    if (r.levelAfter > r.levelBefore) {
      this.expLevel.classList.add("levelup");
      this.expNote.textContent = "HP e MP restaurados. Status aumentaram!";
    } else if (r.capped) {
      this.expNote.textContent = `Nível ${r.levelCap} é o máximo do seu rank. O EXP fica retido até a prova de rank.`;
    }
  }

  public async playEvent(e: BattleEvent, b: BattleSnapshot) {
    const box = e.target === "player" ? this.playerAvatarBox : this.enemyAvatarBox;
    this.revealLogUpTo(e.logIndex);

    if (e.kind === "DEATH") {
      if (e.target === "player") this.setPlayerBars(0, b.player.maxHp, b.player.mp, b.player.maxMp);
      else this.setEnemyHp(0, b.enemy.maxHp);
      this.pulse(this.battleScreen, "shake");
      box.classList.add("dying");
      await this.sleep(1100);
      return;
    }

    if (e.kind === "HEAL") {
      this.setPlayerBars(e.targetHpAfter, b.player.maxHp, b.player.mp, b.player.maxMp);
      this.floatText(box, `+${e.amount}`, "float-heal");
      await this.sleep(550);
      return;
    }

    if (e.kind === "DODGE") {
      this.floatText(box, "ESQUIVOU", "float-dodge");
      this.pulse(box, "dodge-slide");
      await this.sleep(550);
      return;
    }

    if (e.target === "player") this.setPlayerBars(e.targetHpAfter, b.player.maxHp, b.player.mp, b.player.maxMp);
    else this.setEnemyHp(e.targetHpAfter, b.enemy.maxHp);

    if (e.kind === "CRIT") {
      this.floatText(box, `-${e.amount}!`, "float-crit");
      this.pulse(box, "hit-crit");
      this.pulse(this.battleScreen, "shake");
      await this.sleep(750);
    } else if (e.kind === "BLOCK") {
      this.floatText(box, `-${e.amount} [BLOQ]`, "float-block");
      this.pulse(box, "hit-flash");
      await this.sleep(600);
    } else {
      this.floatText(box, `-${e.amount}`, "float-hit");
      this.pulse(box, "hit-flash");
      await this.sleep(600);
    }
  }

  public async playTurn(prev: BattleSnapshot | null, next: BattleSnapshot) {
    if (!prev) this.resetBattleVisuals();
    this.renderBattleArena(next, true);

    if (!prev || next.events.length === 0) {
      if (!next.finished) this.renderBattleArena(next, false);
      return;
    }

    this.setPlayerBars(prev.player.hp, next.player.maxHp, next.player.mp, next.player.maxMp);
    this.setEnemyHp(prev.enemy.hp, next.enemy.maxHp);
    for (let i = prev.log.length; i < this.battleLogFeed.children.length; i++) {
      this.battleLogFeed.children[i].classList.add("log-hidden");
    }
    await this.sleep(200);

    for (const e of next.events) await this.playEvent(e, next);

    this.revealLogUpTo(next.log.length - 1);
    this.setPlayerBars(next.player.hp, next.player.maxHp, next.player.mp, next.player.maxMp);
    this.setEnemyHp(next.enemy.hp, next.enemy.maxHp);
    if (!next.finished) this.renderBattleArena(next, false);
  }

  public async finishBattle(b: BattleSnapshot) {
    if (b.result !== "FLED") {
      await this.sleep(500);
      this.battleScreen.classList.add(
        b.result === "VICTORY" ? "outcome-win" : b.result === "DEFEAT" ? "outcome-lose" : "outcome-neutral"
      );
      await this.sleep(700);
    }
    this.showBattleOutcome(b);
    if (b.rewards) await this.animateExpBar(b.rewards);
    if (b.result === "VICTORY" || b.result === "FLED") {
      await this.sleep(2200);
      if (gameState.currentBattle && gameState.currentBattle.battleId === b.battleId && this.pending === 0) {
        this.btnReturnMap?.click();
      }
    }
  }

  public handleKey(key: string) {
    if (!gameState.currentBattle) return;
    if (this.pending > 0) {
      this.fast = true;
      return;
    }
    if (gameState.currentBattle.finished) return;

    if (key === "1" || key === "2" || key === "3") {
      const index = parseInt(key, 10) - 1;
      const skill = gameState.currentBattle.player.skills[index];
      if (skill && skill.currentCooldown === 0 && gameState.currentBattle.player.mp >= skill.mpCost) {
        socket.emit(ClientEvents.BattleActionRequest, {
          battleId: gameState.currentBattle.battleId,
          actionId: skill.id
        });
      }
    } else if (key === "f" || key === "F") {
      socket.emit(ClientEvents.BattleFleeRequest, { battleId: gameState.currentBattle.battleId });
    }
  }
}

export const battleController = new BattleController();
