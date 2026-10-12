import {
  ClientEvents,
  getItemGoldValue,
  ITEM_RARITY_COLORS,
  type EquipmentSlotName,
  type InventorySlot,
  type ItemDefinition,
  type ItemRarity,
  type ItemType,
  type PlayerEquipment
} from "@rpg/contracts";
import { socket } from "../network/game-socket";
import { gameState } from "../state/game-state";

const ITEM_ICON_BASE = "/assets/items/individual";

/** Maps server icon keys to a sprite family in the rarity pack. */
const ICON_FAMILY: Record<string, string> = {
  potion_red: "potion_red", potion_red_big: "potion_red",
  potion_blue: "potion_blue", potion_blue_big: "potion_blue",
  elixir: "elixir",
  trophy_core: "amulet_blood", trophy_fang: "amulet_fang",
  sword_iron: "sword_goblin", sword_goblin: "sword_goblin",
  glaive_green: "blade_dark", blade_blue: "blade_dark", blade_dark: "blade_dark",
  scythe_purple: "blade_cosmic", fang_cosmic: "blade_cosmic", blade_cosmic: "blade_cosmic",
  sword_gold: "sword_immortal", dagger_red: "sword_immortal", sword_immortal: "sword_immortal",
  vest_gray: "armor_shadow", mail_green: "armor_shadow", armor_shadow: "armor_shadow",
  cloak_blue: "robe_cosmic", shroud_red: "cuirass_blood", cuirass_blood: "cuirass_blood",
  plate_purple: "cuirass_blood", aegis_gold: "cuirass_blood", shield_iron: "shield_iron",
  celestial_cosmic: "robe_cosmic", robe_cosmic: "robe_cosmic",
  amulet_copper: "amulet_fang", amulet_green: "amulet_fang", amulet_fang: "amulet_fang",
  amulet_gold: "amulet_blood", amulet_blood: "amulet_blood",
  ring_iron: "ring_silver", ring_green: "ring_silver", ring_gold: "ring_silver", ring_silver: "ring_silver",
  ring_shadow: "ring_shadow"
};

/** Sprites limpos (sem variação por raridade); a raridade é mostrada por borda/brilho via CSS. */
export function getItemIconUrl(icon: string, _rarity?: ItemRarity): string {
  const family = ICON_FAMILY[icon] ?? "elixir";
  return `${ITEM_ICON_BASE}/${family}.png`;
}

function itemImg(icon: string, rarity: ItemRarity): string {
  return `<img class="item-img" src="${getItemIconUrl(icon, rarity)}" alt="" draggable="false" />`;
}

export class InventoryController {
  public readonly inventoryModal = document.querySelector<HTMLDivElement>("#inventory-modal");
  public readonly btnInventoryClose = document.querySelector<HTMLButtonElement>("#btn-inventory-close");
  public readonly invCapacityCounter = document.querySelector<HTMLSpanElement>("#inv-capacity-counter");
  public readonly invGridSlots = document.querySelector<HTMLDivElement>("#inventory-grid-slots");
  public readonly inspectCard = document.querySelector<HTMLDivElement>("#inventory-inspect-card");

  public readonly equipSlotWeapon = document.querySelector<HTMLDivElement>("#equip-slot-weapon");
  public readonly equipSlotShield = document.querySelector<HTMLDivElement>("#equip-slot-shield");
  public readonly equipSlotArmor = document.querySelector<HTMLDivElement>("#equip-slot-armor");
  public readonly equipSlotAmulet = document.querySelector<HTMLDivElement>("#equip-slot-amulet");
  public readonly equipSlotRing = document.querySelector<HTMLDivElement>("#equip-slot-ring");

  public readonly gearBonusPatk = document.querySelector<HTMLSpanElement>("#gear-bonus-patk");
  public readonly gearBonusMatk = document.querySelector<HTMLSpanElement>("#gear-bonus-matk");
  public readonly gearBonusDef = document.querySelector<HTMLSpanElement>("#gear-bonus-def");
  public readonly gearBonusHpmp = document.querySelector<HTMLSpanElement>("#gear-bonus-hpmp");

  private selectedSlotIndex: number | null = null;
  private selectedEquipSlot: EquipmentSlotName | null = null;
  public isQuickSellMode: boolean = false;

  constructor() {
    this.bindEvents();
  }

  public open() {
    this.inventoryModal?.classList.remove("hidden");
    this.render();
  }

  public close() {
    this.inventoryModal?.classList.add("hidden");
    this.selectedSlotIndex = null;
    this.selectedEquipSlot = null;
    if (this.isQuickSellMode) {
      this.isQuickSellMode = false;
      const btnToggle = document.querySelector<HTMLButtonElement>("#btn-toggle-quick-sell");
      btnToggle?.classList.remove("active");
      const alertEl = document.querySelector<HTMLDivElement>("#quick-sell-mode-alert");
      alertEl?.classList.add("hidden");
    }
  }

  public isOpen(): boolean {
    return !this.inventoryModal?.classList.contains("hidden");
  }

  private bindEvents() {
    this.btnInventoryClose?.addEventListener("click", () => this.close());

    // Paperdoll click events
    const equipSlots: Array<{ el: HTMLDivElement | null; slot: EquipmentSlotName }> = [
      { el: this.equipSlotWeapon, slot: "weapon" },
      { el: this.equipSlotShield, slot: "shield" },
      { el: this.equipSlotArmor, slot: "armor" },
      { el: this.equipSlotAmulet, slot: "amulet" },
      { el: this.equipSlotRing, slot: "ring" }
    ];

    for (const { el, slot } of equipSlots) {
      el?.addEventListener("click", () => {
        const item = gameState.equipment[slot];
        if (item) {
          this.selectedSlotIndex = null;
          this.selectedEquipSlot = slot;
          this.render();
          this.renderInspect(item, true, null, slot);
        }
      });
    }

    // Toggle modo venda rápida (1-clique)
    const btnToggleQuickSell = document.querySelector<HTMLButtonElement>("#btn-toggle-quick-sell");
    const quickSellAlert = document.querySelector<HTMLDivElement>("#quick-sell-mode-alert");
    btnToggleQuickSell?.addEventListener("click", () => {
      this.isQuickSellMode = !this.isQuickSellMode;
      btnToggleQuickSell.classList.toggle("active", this.isQuickSellMode);
      quickSellAlert?.classList.toggle("hidden", !this.isQuickSellMode);
      this.render();
    });

    // Botões de venda em lote por raridade
    const btnSellCommon = document.querySelector<HTMLButtonElement>("#btn-sell-common");
    btnSellCommon?.addEventListener("click", () => {
      socket.emit(ClientEvents.SellAllJunkRequest, { maxRarity: "COMMON" });
      this.selectedSlotIndex = null;
      this.clearInspect();
    });

    const btnSellUncommon = document.querySelector<HTMLButtonElement>("#btn-sell-uncommon");
    btnSellUncommon?.addEventListener("click", () => {
      socket.emit(ClientEvents.SellAllJunkRequest, { maxRarity: "UNCOMMON" });
      this.selectedSlotIndex = null;
      this.clearInspect();
    });

    const btnSellRare = document.querySelector<HTMLButtonElement>("#btn-sell-rare");
    btnSellRare?.addEventListener("click", () => {
      socket.emit(ClientEvents.SellAllJunkRequest, { maxRarity: "RARE" });
      this.selectedSlotIndex = null;
      this.clearInspect();
    });
  }

  public render() {
    const goldEl = document.querySelector<HTMLSpanElement>("#inv-gold-display");
    if (goldEl && gameState.lastMe) {
      goldEl.innerHTML = `<span style="color: #f59e0b; margin-right: 4px;">[G]</span> ${(gameState.lastMe.gold ?? 0).toLocaleString()} OURO`;
    }

    this.renderPaperdoll();
    this.renderGrid();
  }

  private renderPaperdoll() {
    const slots: Array<{ el: HTMLDivElement | null; slotName: EquipmentSlotName; fallbackIcon: string }> = [
      { el: this.equipSlotWeapon, slotName: "weapon", fallbackIcon: `${ITEM_ICON_BASE}/sword_goblin.png` },
      { el: this.equipSlotShield, slotName: "shield", fallbackIcon: `${ITEM_ICON_BASE}/shield_iron.png` },
      { el: this.equipSlotArmor, slotName: "armor", fallbackIcon: `${ITEM_ICON_BASE}/armor_shadow.png` },
      { el: this.equipSlotAmulet, slotName: "amulet", fallbackIcon: `${ITEM_ICON_BASE}/amulet_fang.png` },
      { el: this.equipSlotRing, slotName: "ring", fallbackIcon: `${ITEM_ICON_BASE}/ring_silver.png` }
    ];

    let totalPatk = 0;
    let totalMatk = 0;
    let totalHp = 0;
    let totalMp = 0;
    let totalBlock = 0;
    let totalDodge = 0;

    for (const { el, slotName, fallbackIcon } of slots) {
      if (!el) continue;
      const item: ItemDefinition | null = gameState.equipment[slotName];
      const isSelected = this.selectedEquipSlot === slotName;

      el.classList.toggle("selected", isSelected);

      if (item) {
        const stats = item.stats ?? {};
        totalPatk += stats.bonusPhysicalAtk ?? 0;
        totalMatk += stats.bonusMagicalAtk ?? 0;
        totalHp += stats.bonusHp ?? 0;
        totalMp += stats.bonusMp ?? 0;
        totalBlock += stats.bonusBlockChance ?? 0;
        totalDodge += stats.bonusDodgeChance ?? 0;

        const rarityClass = this.getRarityClass(item.rarity);
        el.className = `equip-slot-box ${isSelected ? "selected" : ""} ${rarityClass}`;
        el.innerHTML = `
          <span class="slot-type-label">${this.getSlotLabel(slotName)}</span>
          <div class="slot-content">
            <span class="inv-slot-icon">${itemImg(item.icon, item.rarity)}</span>
            <span class="slot-item-name" style="color: ${ITEM_RARITY_COLORS[item.rarity].hex}; font-weight: 700;">${item.name}</span>
          </div>
        `;
      } else {
        el.className = `equip-slot-box ${isSelected ? "selected" : ""}`;
        el.innerHTML = `
          <span class="slot-type-label">${this.getSlotLabel(slotName)}</span>
          <div class="slot-content empty">
            <img class="slot-placeholder-icon" src="${fallbackIcon}" alt="" draggable="false" />
            <span class="slot-item-name">Vazio</span>
          </div>
        `;
      }
    }

    if (this.gearBonusPatk) this.gearBonusPatk.textContent = `+${totalPatk}`;
    if (this.gearBonusMatk) this.gearBonusMatk.textContent = `+${totalMatk}`;
    if (this.gearBonusDef) {
      this.gearBonusDef.textContent = `+${(totalBlock * 100).toFixed(0)}% / +${(totalDodge * 100).toFixed(0)}%`;
    }
    if (this.gearBonusHpmp) this.gearBonusHpmp.textContent = `+${totalHp} / +${totalMp}`;
  }

  private getSlotForType(type: ItemType): EquipmentSlotName | null {
    switch (type) {
      case "WEAPON": return "weapon";
      case "SHIELD": return "shield";
      case "ARMOR": return "armor";
      case "AMULET": return "amulet";
      case "RING": return "ring";
      default: return null;
    }
  }

  private renderGrid() {
    if (!this.invGridSlots) return;
    this.invGridSlots.innerHTML = "";
    this.invGridSlots.classList.toggle("quick-sell-active", this.isQuickSellMode);

    const inventory = gameState.inventory;
    const occupiedCount = inventory.length;

    if (this.invCapacityCounter) {
      this.invCapacityCounter.textContent = `${occupiedCount} / 24 OCUPADOS`;
    }

    // Auto-clear inspect if selected slot was sold or removed
    if (this.selectedSlotIndex !== null) {
      const stillExists = inventory.some((s) => s.slotIndex === this.selectedSlotIndex);
      if (!stillExists) {
        this.selectedSlotIndex = null;
        this.clearInspect();
      }
    }

    const equippedIds = new Set(
      Object.values(gameState.equipment)
        .filter((eq): eq is ItemDefinition => eq !== null)
        .map((eq) => eq.id)
    );

    const me = gameState.lastMe;

    for (let i = 0; i < 24; i++) {
      const slot: InventorySlot | undefined = inventory.find((s) => s.slotIndex === i);
      const slotEl = document.createElement("div");
      const isSelected = this.selectedSlotIndex === i;

      if (slot) {
        const item = slot.item;
        const isEquipped = equippedIds.has(item.id);
        const isLocked = me ? me.level < item.minLevel : false;
        const rarityClass = this.getRarityClass(item.rarity);
        const canSell = !isEquipped && item.type !== "TROPHY";
        const goldVal = getItemGoldValue(item) * slot.quantity;
        const sellHint = canSell ? ` · [Botão Direito / Shift+Clique]: Vender (+${goldVal} G)` : "";

        slotEl.className = `inv-slot ${rarityClass} ${isSelected ? "selected" : ""} ${isEquipped ? "equipped" : ""} ${isLocked ? "level-locked" : ""}`;
        slotEl.title = `${item.name} (${ITEM_RARITY_COLORS[item.rarity].name})${isLocked ? ` · Requer Lv ${item.minLevel}` : ""}${sellHint}`;

        let qtyHtml = "";
        if (slot.quantity > 1) {
          qtyHtml = `<span class="inv-slot-quantity">${slot.quantity}</span>`;
        }

        let indicatorHtml = "";
        if (isEquipped) {
          indicatorHtml = `<span class="inv-slot-equipped-indicator">EQUIP</span>`;
        } else if (isLocked) {
          indicatorHtml = `<span class="inv-slot-lock-badge">Lv ${item.minLevel}</span>`;
        }

        slotEl.innerHTML = `
          ${indicatorHtml}
          <span class="inv-slot-icon">${itemImg(item.icon, item.rarity)}</span>
          ${qtyHtml}
        `;

        // Atalho: Botão Direito vende instantaneamente
        slotEl.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          if (canSell) {
            socket.emit(ClientEvents.SellItemRequest, { slotIndex: i });
            if (this.selectedSlotIndex === i) {
              this.selectedSlotIndex = null;
              this.clearInspect();
            }
          }
        });

        // Clique: Se estiver no Modo Venda Rápida ou Shift+Clique, vende imediatamente
        slotEl.addEventListener("click", (e) => {
          if (canSell && (e.shiftKey || this.isQuickSellMode)) {
            socket.emit(ClientEvents.SellItemRequest, { slotIndex: i });
            if (this.selectedSlotIndex === i) {
              this.selectedSlotIndex = null;
              this.clearInspect();
            }
            return;
          }

          this.selectedSlotIndex = i;
          this.selectedEquipSlot = null;
          this.render();
          this.renderInspect(item, isEquipped, i, null);
        });
      } else {
        slotEl.className = `inv-slot empty ${isSelected ? "selected" : ""}`;
        slotEl.addEventListener("click", () => {
          this.selectedSlotIndex = null;
          this.selectedEquipSlot = null;
          this.render();
          this.clearInspect();
        });
      }

      this.invGridSlots.appendChild(slotEl);
    }
  }

  private renderInspect(
    item: ItemDefinition,
    isEquipped: boolean,
    slotIndex: number | null,
    equipSlotName: EquipmentSlotName | null
  ) {
    if (!this.inspectCard) return;

    const rarityColor = ITEM_RARITY_COLORS[item.rarity].hex;
    const rarityLabel = ITEM_RARITY_COLORS[item.rarity].name;
    const badgeClass = this.getBadgeClass(item.rarity);

    const targetSlot = equipSlotName ?? this.getSlotForType(item.type);
    const isActuallyEquipped = targetSlot ? gameState.equipment[targetSlot]?.id === item.id : false;
    const me = gameState.lastMe;
    const isLevelLocked = me ? me.level < item.minLevel : false;
    const currentEquippedInSlot = targetSlot ? gameState.equipment[targetSlot] : null;

    // Format stats list with comparison
    const statLines: string[] = [];
    const s = item.stats ?? {};
    const currS = (!isActuallyEquipped && currentEquippedInSlot) ? currentEquippedInSlot.stats ?? {} : null;

    const diffBadge = (currVal: number, oldVal: number, isPercent = false): string => {
      const diff = currVal - oldVal;
      if (Math.abs(diff) < 0.0001) return "";
      const sign = diff > 0 ? "+" : "";
      const text = isPercent ? `${sign}${(diff * 100).toFixed(1)}%` : `${sign}${diff}`;
      const color = diff > 0 ? "#22c55e" : "#ef4444";
      return `<span style="color: ${color}; font-size: 0.7rem; font-weight: 700; margin-left: 6px;">(${text})</span>`;
    };

    if (s.bonusPhysicalAtk) {
      const diff = currS ? diffBadge(s.bonusPhysicalAtk, currS.bonusPhysicalAtk ?? 0) : "";
      statLines.push(`<div class="inspect-stat-row"><span>ATK Físico:</span><span class="inspect-stat-val">+${s.bonusPhysicalAtk}${diff}</span></div>`);
    }
    if (s.bonusMagicalAtk) {
      const diff = currS ? diffBadge(s.bonusMagicalAtk, currS.bonusMagicalAtk ?? 0) : "";
      statLines.push(`<div class="inspect-stat-row"><span>ATK Mágico:</span><span class="inspect-stat-val">+${s.bonusMagicalAtk}${diff}</span></div>`);
    }
    if (s.bonusHp) {
      const diff = currS ? diffBadge(s.bonusHp, currS.bonusHp ?? 0) : "";
      statLines.push(`<div class="inspect-stat-row"><span>Vitalidade (HP):</span><span class="inspect-stat-val">+${s.bonusHp}${diff}</span></div>`);
    }
    if (s.bonusMp) {
      const diff = currS ? diffBadge(s.bonusMp, currS.bonusMp ?? 0) : "";
      statLines.push(`<div class="inspect-stat-row"><span>Mana (MP):</span><span class="inspect-stat-val">+${s.bonusMp}${diff}</span></div>`);
    }
    if (s.bonusCritChance) {
      const diff = currS ? diffBadge(s.bonusCritChance, currS.bonusCritChance ?? 0, true) : "";
      statLines.push(`<div class="inspect-stat-row"><span>Taxa Crítica:</span><span class="inspect-stat-val">+${(s.bonusCritChance * 100).toFixed(1)}%${diff}</span></div>`);
    }
    if (s.bonusDodgeChance) {
      const diff = currS ? diffBadge(s.bonusDodgeChance, currS.bonusDodgeChance ?? 0, true) : "";
      statLines.push(`<div class="inspect-stat-row"><span>Taxa Esquiva:</span><span class="inspect-stat-val">+${(s.bonusDodgeChance * 100).toFixed(1)}%${diff}</span></div>`);
    }
    if (s.bonusBlockChance) {
      const diff = currS ? diffBadge(s.bonusBlockChance, currS.bonusBlockChance ?? 0, true) : "";
      statLines.push(`<div class="inspect-stat-row"><span>Taxa Bloqueio:</span><span class="inspect-stat-val">+${(s.bonusBlockChance * 100).toFixed(1)}%${diff}</span></div>`);
    }
    if (item.healAmount) statLines.push(`<div class="inspect-stat-row"><span>Recuperação HP:</span><span class="inspect-stat-val" style="color: #4ade80;">+${item.healAmount} HP</span></div>`);
    if (item.manaAmount) statLines.push(`<div class="inspect-stat-row"><span>Recuperação MP:</span><span class="inspect-stat-val" style="color: #60a5fa;">+${item.manaAmount} MP</span></div>`);

    let actionBtnHtml = "";
    const isEquipment = ["WEAPON", "SHIELD", "ARMOR", "AMULET", "RING"].includes(item.type);
    if (isActuallyEquipped && targetSlot) {
      actionBtnHtml = `<button id="btn-inspect-action" class="btn-item-action unequip" type="button">DESEQUIPAR (${this.getSlotLabel(targetSlot)})</button>`;
    } else if (isEquipment && slotIndex !== null) {
      if (isLevelLocked) {
        actionBtnHtml = `<button id="btn-inspect-action" class="btn-item-action disabled" type="button" disabled style="opacity: 0.55; cursor: not-allowed; background: #334155; border-color: #64748b;">NÍVEL INSUFICIENTE (REQ. LV ${item.minLevel})</button>`;
      } else {
        const verb = currentEquippedInSlot ? "SUBSTITUIR" : "EQUIPAR";
        const slotName = targetSlot ? ` EM ${this.getSlotLabel(targetSlot)}` : "";
        actionBtnHtml = `<button id="btn-inspect-action" class="btn-item-action" type="button">${verb}${slotName}</button>`;
      }
    } else if (item.type === "CONSUMABLE" && slotIndex !== null) {
      actionBtnHtml = `<button id="btn-inspect-action" class="btn-item-action use" type="button">USAR CONSUMÍVEL</button>`;
    }

    const reqColor = isLevelLocked ? "#ef4444" : "#94a3b8";

    const goldValue = getItemGoldValue(item);
    const quantity = slotIndex !== null ? (gameState.inventory.find((s) => s.slotIndex === slotIndex)?.quantity ?? 1) : 1;
    const totalGoldEarned = goldValue * quantity;

    let sellBtnHtml = "";
    if (!isActuallyEquipped && item.type !== "TROPHY" && slotIndex !== null) {
      sellBtnHtml = `<button id="btn-inspect-sell" class="btn-rpg-sell" type="button">VENDER (+${totalGoldEarned} OURO)</button>`;
    }

    this.inspectCard.className = `item-inspect-card ${this.getRarityClass(item.rarity)}`;
    this.inspectCard.innerHTML = `
      <div class="inspect-header">
        <div class="inspect-name-row">
          <span class="inspect-icon">${itemImg(item.icon, item.rarity)}</span>
          <div style="display: flex; flex-direction: column;">
            <span class="inspect-name" style="color: ${rarityColor};">${item.name}</span>
            <span class="inspect-rarity-badge ${badgeClass}">${rarityLabel}</span>
          </div>
        </div>
      </div>

      <div class="inspect-type-row">
        <span>Categoria: <strong>${this.getItemKindLabel(item.type)}</strong></span>
        <span style="color: ${reqColor};">Requer: <strong>Lv ${item.minLevel}</strong></span>
      </div>

      ${statLines.length > 0 ? `<div class="inspect-stats-block">${statLines.join("")}</div>` : ""}

      <p class="inspect-desc">"${item.description}"</p>

      <div class="inspect-actions" style="display: flex; gap: 8px; flex-wrap: wrap;">
        ${actionBtnHtml}
        ${sellBtnHtml}
      </div>
    `;

    const actionBtn = this.inspectCard.querySelector<HTMLButtonElement>("#btn-inspect-action");
    actionBtn?.addEventListener("click", () => {
      if (isActuallyEquipped && targetSlot) {
        socket.emit(ClientEvents.UnequipItemRequest, { slot: targetSlot });
        this.clearInspect();
      } else if (isEquipment && slotIndex !== null && !isLevelLocked) {
        socket.emit(ClientEvents.EquipItemRequest, { slotIndex });
      } else if (item.type === "CONSUMABLE" && slotIndex !== null) {
        socket.emit(ClientEvents.UseItemRequest, { slotIndex });
      }
    });

    const sellBtn = this.inspectCard.querySelector<HTMLButtonElement>("#btn-inspect-sell");
    sellBtn?.addEventListener("click", () => {
      if (slotIndex !== null) {
        socket.emit(ClientEvents.SellItemRequest, { slotIndex });
        this.clearInspect();
      }
    });
  }

  private clearInspect() {
    if (!this.inspectCard) return;
    this.inspectCard.className = "item-inspect-card empty-inspect";
    this.inspectCard.innerHTML = `
      <div class="inspect-placeholder-msg">
        Selecione um item da mochila ou equipamento para inspecionar atributos e raridade.
      </div>
    `;
  }

  private getRarityClass(rarity: ItemRarity): string {
    const map: Record<ItemRarity, string> = {
      COMMON: "rarity-common",
      UNCOMMON: "rarity-uncommon",
      RARE: "rarity-rare",
      EPIC: "rarity-epic",
      LEGENDARY: "rarity-legendary",
      IMMORTAL: "rarity-immortal",
      COSMIC: "rarity-cosmic",
      DIVINE: "rarity-divine"
    };
    return map[rarity] ?? "rarity-common";
  }

  private getBadgeClass(rarity: ItemRarity): string {
    const map: Record<ItemRarity, string> = {
      COMMON: "badge-common",
      UNCOMMON: "badge-uncommon",
      RARE: "badge-rare",
      EPIC: "badge-epic",
      LEGENDARY: "badge-legendary",
      IMMORTAL: "badge-immortal",
      COSMIC: "badge-cosmic",
      DIVINE: "badge-divine"
    };
    return map[rarity] ?? "badge-common";
  }

  private getSlotLabel(slot: EquipmentSlotName): string {
    const map: Record<EquipmentSlotName, string> = {
      weapon: "ARMA",
      shield: "ESCUDO",
      armor: "ARMADURA",
      amulet: "AMULETO",
      ring: "ANEL"
    };
    return map[slot];
  }

  private getItemKindLabel(type: ItemType): string {
    const map: Record<ItemType, string> = {
      WEAPON: "Arma",
      SHIELD: "Escudo",
      ARMOR: "Armadura",
      AMULET: "Amuleto",
      RING: "Anel",
      CONSUMABLE: "Consumível / Elixir",
      TROPHY: "Troféu de Abolição"
    };
    return map[type] ?? "Item";
  }
}

export const inventoryController = new InventoryController();
