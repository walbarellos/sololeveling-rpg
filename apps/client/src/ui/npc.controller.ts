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
  label: string;
  meta?: string;
  variant?: ActionVariant;
  onClick: () => void;
}

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

  private playerRank(): string {
    return gameState.lastMe?.rank ?? "E";
  }

  private rankAtLeast(min: string): boolean {
    const order = ["E", "D", "C", "B", "A", "S", "SS", "SSS", "SSS+"];
    const cur = order.indexOf(this.playerRank());
    const need = order.indexOf(min);
    return cur >= 0 && need >= 0 && cur >= need;
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
            this.setDialogue("Negócio fechado. Espólios comuns e incomuns convertidos em ouro.");
          }
        },
        {
          label: "Poção de vida menor",
          meta: "+60 HP · 30 ouro",
          onClick: () => {
            socket.emit(ClientEvents.MerchantBuyRequest, { itemId: "potion_hp_minor", quantity: 1 });
          }
        },
        {
          label: "Elixir de mana menor",
          meta: "+40 MP · 30 ouro",
          onClick: () => {
            socket.emit(ClientEvents.MerchantBuyRequest, { itemId: "potion_mp_minor", quantity: 1 });
          }
        },
        {
          label: "Escudo tático blindado",
          meta: "+50 HP · +8% bloqueio · 160 ouro",
          onClick: () => {
            socket.emit(ClientEvents.MerchantBuyRequest, { itemId: "armor_iron_shield", quantity: 1 });
          }
        }
      ];
    }

    if (npc.role === "GATEKEEPER") {
      const rank = this.playerRank();
      const gates: Array<{ id: string; name: string; rankNeed: string; zone: any; levels: string }> = [
        { id: "D", name: "Cidadela Carmesim", rankNeed: "D", zone: "ENTER_GATE_D", levels: "Nv. 12–16" },
        { id: "C", name: "Fenda Glacial de Niflheim", rankNeed: "C", zone: "ENTER_GATE_C", levels: "Nv. 20–30" },
        { id: "B", name: "Necrópole das Sombras", rankNeed: "B", zone: "ENTER_GATE_B", levels: "Nv. 34–50" },
        { id: "A", name: "Calamidade Vulcânica", rankNeed: "A", zone: "ENTER_GATE_A", levels: "Nv. 54–75" },
        { id: "S", name: "Templo dos Deuses Antigos (Double Dungeon)", rankNeed: "S", zone: "ENTER_GATE_S", levels: "Nv. 82–110" },
        { id: "SS", name: "Fenda da Calamidade Cósmica", rankNeed: "SS", zone: "ENTER_GATE_SS", levels: "Nv. 118–140" },
        { id: "SSS", name: "Trono do Monarca das Sombras", rankNeed: "SSS", zone: "ENTER_GATE_SSS", levels: "Nv. 150–185+" }
      ];

      const gateActions: NpcActionDef[] = [
        {
          label: "Reiniciar instância do Gate",
          meta: "Revive todos os monstros e chefes · nova expedição",
          variant: "danger",
          onClick: () => {
            socket.emit(ClientEvents.ResetGateRequest, {});
            this.close();
          }
        }
      ];

      for (const g of gates) {
        const hasRank = this.rankAtLeast(g.rankNeed);
        gateActions.push({
          label: hasRank ? `${g.name} (Gate Rank ${g.id})` : `${g.name} (Bloqueado)`,
          meta: hasRank
            ? `Teleporte · ${g.levels} · Requer Rank ${g.id}`
            : `Requer Rank ${g.id} (Você: Rank ${rank}) · preste o exame com Baek`,
          variant: hasRank ? "gold" : "default",
          onClick: () => {
            if (!hasRank) {
              this.setDialogue(
                `A passagem para ${g.name} requer Rank ${g.rankNeed} ou superior. Seu rank atual é ${rank}. Fale com o Inspetor Baek após cumprir os requisitos da prova.`
              );
              return;
            }
            this.teleport(g.zone);
          }
        });
      }

      gateActions.push(
        {
          label: "Catacumbas esquecidas (Gate E)",
          meta: "Teleporte · Setor 2 · Nv. 3–5",
          onClick: () => this.teleport("CATACUMBAS")
        },
        {
          label: "Covil das feras (Gate E)",
          meta: "Teleporte · Setor 3 · Nv. 5–8",
          onClick: () => this.teleport("COVIL")
        },
        {
          label: "Retornar ao Santuário seguro (Gate E)",
          meta: "Zona segura · sem combate",
          variant: "safe",
          onClick: () => this.teleport("RETURN_GATE_E")
        }
      );

      return gateActions;
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
