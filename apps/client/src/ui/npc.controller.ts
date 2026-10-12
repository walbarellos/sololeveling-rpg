import {
  ClientEvents,
  type NpcDefinition,
  type ZoneTeleportRequest
} from "@rpg/contracts";
import { socket } from "../network/game-socket";
import { academyController } from "./academy.controller";
import { inventoryController } from "./inventory.controller";

export class NpcController {
  public readonly modal = document.querySelector<HTMLDivElement>("#npc-modal");
  public readonly btnClose = document.querySelector<HTMLButtonElement>("#btn-npc-close");
  public readonly tagEl = document.querySelector<HTMLSpanElement>("#npc-modal-tag");
  public readonly nameEl = document.querySelector<HTMLHeadingElement>("#npc-modal-name");
  public readonly titleEl = document.querySelector<HTMLSpanElement>("#npc-modal-title");
  public readonly portraitImg = document.querySelector<HTMLImageElement>("#npc-portrait-img");
  public readonly dialogueText = document.querySelector<HTMLParagraphElement>("#npc-dialogue-text");
  public readonly actionsContainer = document.querySelector<HTMLDivElement>("#npc-actions-container");

  private currentNpc: NpcDefinition | null = null;

  constructor() {
    this.bindEvents();
  }

  private bindEvents() {
    this.btnClose?.addEventListener("click", () => this.close());
  }

  public isOpen(): boolean {
    return !this.modal?.classList.contains("hidden");
  }

  public openNpc(npc: NpcDefinition) {
    this.currentNpc = npc;
    if (this.tagEl) this.tagEl.textContent = `[NPC · ${npc.title.toUpperCase()}]`;
    if (this.nameEl) this.nameEl.textContent = npc.name.toUpperCase();
    if (this.titleEl) this.titleEl.textContent = npc.title;
    if (this.portraitImg) this.portraitImg.src = `/assets/portraits/${npc.portrait}.png`;
    if (this.dialogueText) this.dialogueText.textContent = npc.dialogue;

    this.renderActions(npc);
    this.modal?.classList.remove("hidden");
  }

  public close() {
    this.modal?.classList.add("hidden");
    this.currentNpc = null;
  }

  private renderActions(npc: NpcDefinition) {
    if (!this.actionsContainer) return;
    this.actionsContainer.innerHTML = "";

    if (npc.role === "ACADEMY") {
      this.addButton(
        "🎖️ Prestar Exame de Ascensão de Rank",
        "action-gold",
        () => {
          this.close();
          academyController.open();
        }
      );

      this.addButton(
        "📦 Recuperar Troféu de Chefe Perdido (Inventário Cheio)",
        "",
        () => {
          socket.emit(ClientEvents.ClaimLostTrophyRequest, { trophyId: "trophy_goblin_boss_core" });
          if (this.dialogueText) {
            this.dialogueText.textContent = "Verificando registros de combate da Associação... Se sua vitória foi validada, o troféu militar será creditado em sua mochila!";
          }
        }
      );

      this.addButton(
        "📜 Orientações Militares de Sobrevivência",
        "",
        () => {
          if (this.dialogueText) {
            this.dialogueText.textContent = "Caçador, lembre-se: distribua seus pontos de atributos na tela de Status! Para avançar de Rank, você deve atingir o nível necessário, alocar seus atributos e apresentar o troféu do respectivo chefe do Gate.";
          }
        }
      );
    } else if (npc.role === "MERCHANT") {
      this.addButton(
        "🎒 Abrir Mochila para Vender Itens",
        "action-gold",
        () => {
          this.close();
          inventoryController.open();
        }
      );

      this.addButton(
        "💰 Vender Todos os Itens Comuns e Incomuns (Limpar Mochila)",
        "action-gold",
        () => {
          socket.emit(ClientEvents.SellAllJunkRequest, { maxRarity: "UNCOMMON" });
          if (this.dialogueText) {
            this.dialogueText.textContent = "Excelente negócio! Comprei todos os seus espólios comuns e incomuns por ouro limpo.";
          }
        }
      );

      this.addButton(
        "🧪 Comprar Poção de Vida Menor (+60 HP) · 30 Ouro",
        "",
        () => {
          socket.emit(ClientEvents.MerchantBuyRequest, { itemId: "potion_hp_minor", quantity: 1 });
        }
      );

      this.addButton(
        "🔮 Comprar Elixir de Mana Menor (+40 MP) · 30 Ouro",
        "",
        () => {
          socket.emit(ClientEvents.MerchantBuyRequest, { itemId: "potion_mp_minor", quantity: 1 });
        }
      );

      this.addButton(
        "🛡️ Comprar Escudo Tático Blindado (+50 HP, +8% Bloqueio) · 160 Ouro",
        "",
        () => {
          socket.emit(ClientEvents.MerchantBuyRequest, { itemId: "armor_iron_shield", quantity: 1 });
        }
      );
    } else if (npc.role === "GATEKEEPER") {
      this.addButton(
        "⚡ REINICIAR INSTÂNCIA DO GATE (REVIVER TODOS OS CHEFES)",
        "action-danger",
        () => {
          socket.emit(ClientEvents.ResetGateRequest, {});
          this.close();
        }
      );

      this.addButton(
        "🌀 Teleporte: Catacumbas Esquecidas (Rank E/D · Lv 3–5)",
        "",
        () => {
          socket.emit(ClientEvents.ZoneTeleportRequest, { zoneId: "CATACUMBAS" });
          this.close();
        }
      );

      this.addButton(
        "🔥 Teleporte: Covil Vulcânico da Matriarca Lobo (Rank D · Lv 5–8)",
        "",
        () => {
          socket.emit(ClientEvents.ZoneTeleportRequest, { zoneId: "COVIL" });
          this.close();
        }
      );

      this.addButton(
        "🌌 Teleporte: Abismo Dimensional Cósmico (Rank D/C · Lv 8–10)",
        "",
        () => {
          socket.emit(ClientEvents.ZoneTeleportRequest, { zoneId: "ABISMO" });
          this.close();
        }
      );

      this.addButton(
        "👑 Teleporte: Câmara do Trono do Portão de Fogo (Rank C+ · Lv 10+)",
        "action-gold",
        () => {
          socket.emit(ClientEvents.ZoneTeleportRequest, { zoneId: "CHAMBER" });
          this.close();
        }
      );

      this.addButton(
        "🛡️ Teleporte: Retornar ao Santuário Seguro",
        "",
        () => {
          socket.emit(ClientEvents.ZoneTeleportRequest, { zoneId: "SANTUARIO" });
          this.close();
        }
      );
    }
  }

  private addButton(label: string, extraClass: string, onClick: () => void) {
    if (!this.actionsContainer) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `btn-npc-action ${extraClass}`;
    btn.innerHTML = `<span>${label}</span><span>›</span>`;
    btn.addEventListener("click", onClick);
    this.actionsContainer.appendChild(btn);
  }
}

export const npcController = new NpcController();
