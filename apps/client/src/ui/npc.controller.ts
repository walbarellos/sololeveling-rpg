import {
  ClientEvents,
  getNextHunterRank,
  RANK_EXAM_REQUIREMENTS,
  type NpcDefinition
} from "@rpg/contracts";
import { socket } from "../network/game-socket";
import { gameState } from "../state/game-state";
import { academyController } from "./academy.controller";
import { inventoryController } from "./inventory.controller";

type ActionVariant = "default" | "gold" | "danger" | "safe";

interface NpcActionDef {
  /** Primary line — short, no emoji */
  label: string;
  /** Secondary line — rank, level, cost, constraint */
  meta?: string;
  variant?: ActionVariant;
  onClick: () => void;
}

/**
 * NPC dialogue modal — dossier-style interaction plate.
 * Presentation only; all game effects go through authoritative socket intents.
 */
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

    this.modal?.setAttribute("data-npc-role", npc.role);

    if (this.tagEl) this.tagEl.textContent = `NPC · ${npc.title.toUpperCase()}`;
    if (this.nameEl) this.nameEl.textContent = npc.name.toUpperCase();
    if (this.titleEl) this.titleEl.textContent = npc.title;
    if (this.portraitImg) {
      this.portraitImg.src = `/assets/portraits/${npc.portrait}.png`;
      this.portraitImg.alt = npc.name;
    }
    if (this.dialogueText) this.dialogueText.textContent = npc.dialogue;

    this.renderActions(npc);
    this.modal?.classList.remove("hidden");
  }

  public close() {
    this.modal?.classList.add("hidden");
    this.modal?.removeAttribute("data-npc-role");
    this.currentNpc = null;
  }

  private renderActions(npc: NpcDefinition) {
    if (!this.actionsContainer) return;
    this.actionsContainer.replaceChildren();

    const actions = this.actionsFor(npc);
    const frag = document.createDocumentFragment();
    for (const action of actions) {
      frag.appendChild(this.buildButton(action));
    }
    this.actionsContainer.appendChild(frag);
  }

  private actionsFor(npc: NpcDefinition): NpcActionDef[] {
    if (npc.role === "ACADEMY") {
      return [
        {
          label: "Prestar exame de ascensão de rank",
          meta: "Homologação oficial · Associação de Caçadores",
          variant: "gold",
          onClick: () => {
            this.close();
            academyController.open();
          }
        },
        {
          label: "Recuperar troféu de chefe retido",
          meta: "Quando o inventário estava cheio no momento do abate",
          variant: "safe",
          onClick: () => {
            const nextRank = gameState.lastMe ? getNextHunterRank(gameState.lastMe.rank) : "D";
            const req = nextRank ? RANK_EXAM_REQUIREMENTS[nextRank] : null;
            const trophyId = req?.requiredTrophyItemId ?? "trophy_goblin_boss_core";
            socket.emit(ClientEvents.ClaimLostTrophyRequest, { trophyId });
            this.setDialogue(
              `Verificando os registros de combate para o troféu [${req?.trophyName ?? "Núcleo Militar"}]. Se a vitória estiver homologada, o troféu será creditado na mochila.`
            );
          }
        },
        {
          label: "Orientações de sobrevivência",
          meta: "Atributos, rank cap e requisitos de prova",
          onClick: () => {
            this.setDialogue(
              "Distribua atributos em Status. Para subir de rank: alcance o nível exigido, invista os pontos e apresente o troféu do chefe do Gate."
            );
          }
        }
      ];
    }

    if (npc.role === "MERCHANT") {
      return [
        {
          label: "Abrir mochila para vender",
          meta: "Negociação item a item",
          variant: "gold",
          onClick: () => {
            this.close();
            inventoryController.open();
          }
        },
        {
          label: "Vender todos os itens comuns e incomuns",
          meta: "Limpeza rápida da mochila · ouro imediato",
          onClick: () => {
            socket.emit(ClientEvents.SellAllJunkRequest, { maxRarity: "UNCOMMON" });
            this.setDialogue(
              "Negócio fechado. Espólios comuns e incomuns convertidos em ouro."
            );
          }
        },
        {
          label: "Poção de vida menor",
          meta: "+60 HP · 30 ouro",
          onClick: () => {
            socket.emit(ClientEvents.MerchantBuyRequest, {
              itemId: "potion_hp_minor",
              quantity: 1
            });
          }
        },
        {
          label: "Elixir de mana menor",
          meta: "+40 MP · 30 ouro",
          onClick: () => {
            socket.emit(ClientEvents.MerchantBuyRequest, {
              itemId: "potion_mp_minor",
              quantity: 1
            });
          }
        },
        {
          label: "Escudo tático blindado",
          meta: "+50 HP · +8% bloqueio · 160 ouro",
          onClick: () => {
            socket.emit(ClientEvents.MerchantBuyRequest, {
              itemId: "armor_iron_shield",
              quantity: 1
            });
          }
        }
      ];
    }

    if (npc.role === "GATEKEEPER") {
      return [
        {
          label: "Reiniciar instância do Gate",
          meta: "Revive todos os chefes · nova expedição",
          variant: "danger",
          onClick: () => {
            socket.emit(ClientEvents.ResetGateRequest, {});
            this.close();
          }
        },
        {
          label: "Catacumbas esquecidas",
          meta: "Teleporte · Rank E/D · Nv. 3–5",
          onClick: () => this.teleport("CATACUMBAS")
        },
        {
          label: "Covil vulcânico da Matriarca Lobo",
          meta: "Teleporte · Rank D · Nv. 5–8",
          onClick: () => this.teleport("COVIL")
        },
        {
          label: "Abismo dimensional cósmico",
          meta: "Teleporte · Rank D/C · Nv. 8–10",
          onClick: () => this.teleport("ABISMO")
        },
        {
          label: "Câmara do Trono do Portão de Fogo",
          meta: "Teleporte · Rank C+ · Nv. 10+",
          variant: "gold",
          onClick: () => this.teleport("CHAMBER")
        },
        {
          label: "Retornar ao Santuário seguro",
          meta: "Zona segura · sem combate",
          variant: "safe",
          onClick: () => this.teleport("SANTUARIO")
        }
      ];
    }

    return [];
  }

  private teleport(zoneId: string) {
    socket.emit(ClientEvents.ZoneTeleportRequest, { zoneId });
    this.close();
  }

  private setDialogue(text: string) {
    if (this.dialogueText) this.dialogueText.textContent = text;
  }

  private buildButton(action: NpcActionDef): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-npc-action";
    if (action.variant && action.variant !== "default") {
      btn.classList.add(`is-${action.variant}`);
    }

    const body = document.createElement("span");
    body.className = "npc-action-body";

    const title = document.createElement("span");
    title.className = "npc-action-title";
    title.textContent = action.label;

    body.appendChild(title);

    if (action.meta) {
      const meta = document.createElement("span");
      meta.className = "npc-action-meta";
      meta.textContent = action.meta;
      body.appendChild(meta);
    }

    const chevron = document.createElement("span");
    chevron.className = "npc-action-chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "›";

    btn.appendChild(body);
    btn.appendChild(chevron);
    btn.addEventListener("click", action.onClick);
    return btn;
  }
}

export const npcController = new NpcController();
