import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import {
  AllocateStatsRequestSchema,
  AttackRequestSchema,
  BattleActionRequestSchema,
  BattleFleeRequestSchema,
  CancelMissionRequestSchema,
  ClaimMissionRequestSchema,
  ClientEvents,
  EquipItemRequestSchema,
  RankPromotionRequestSchema,
  SelectClassRequestSchema,
  ServerEvents,
  StartBattleRequestSchema,
  StartMissionRequestSchema,
  StepRequestSchema,
  UnequipItemRequestSchema,
  UseCombatConsumableRequestSchema,
  UseItemRequestSchema,
  SellItemRequestSchema,
  SellAllJunkRequestSchema,
  ZoneTeleportRequestSchema,
  ResetGateRequestSchema,
  MerchantBuyRequestSchema,
  ClaimLostTrophyRequestSchema,
  type ServerErrorCode,
  type ServerError
} from "@rpg/contracts";
import { GameService } from "../domain/game.service";
import { resolvePlayerId } from "./identity";

@WebSocketGateway({
  cors: { origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" },
  transports: ["websocket", "polling"]
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly playerBySocket = new Map<string, string>();
  private readonly socketByPlayer = new Map<string, string>();

  constructor(private readonly game: GameService) {}

  /** Identidade autoritativa do socket (nunca vem do payload dos eventos). */
  private pid(client: Socket): string {
    return this.playerBySocket.get(client.id) ?? client.id;
  }

  handleConnection(client: Socket) {
    const playerId = resolvePlayerId(client.handshake.auth, client.id);

    // Mesma chave em outra aba/conexão: a mais nova assume o personagem.
    const previousSocketId = this.socketByPlayer.get(playerId);
    this.playerBySocket.set(client.id, playerId);
    this.socketByPlayer.set(playerId, client.id);
    if (previousSocketId && previousSocketId !== client.id) {
      const previous = this.server.sockets.sockets.get(previousSocketId);
      previous?.emit(ServerEvents.SessionReplaced, {});
      previous?.disconnect(true);
    }

    const player = this.game.connect(playerId);
    client.emit(ServerEvents.Welcome, {
      playerId: player.id,
      ...this.game.dimensions
    });
    client.emit(ServerEvents.MissionsState, this.game.getMissionsState(player.id));
    client.emit(ServerEvents.InventoryState, this.game.getInventoryState(player.id));
    this.broadcastSnapshot();
  }

  handleDisconnect(client: Socket) {
    const playerId = this.playerBySocket.get(client.id);
    this.playerBySocket.delete(client.id);
    if (!playerId) return;
    // Se outra conexão já assumiu este personagem, não derruba o estado dela.
    if (this.socketByPlayer.get(playerId) !== client.id) return;
    this.socketByPlayer.delete(playerId);
    this.game.disconnect(playerId);
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.SelectClassRequest)
  handleSelectClass(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = SelectClassRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Classe inválida.");
    }
    const updated = this.game.selectClass(this.pid(client), parsed.data.hunterClass);
    if (!updated) {
      return this.sendError(client, "ALREADY_IN_BATTLE", "Não pode trocar de classe em batalha.");
    }
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.StepRequest)
  handleStep(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = StepRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Requisição de passo inválida.");
    }
    const result = this.game.step(this.pid(client), parsed.data.direction);
    if (!result.success) {
      const messages: Record<string, string> = {
        OUT_OF_BOUNDS: "Passo fora dos limites do mapa.",
        OBSTACLE: "Caminho bloqueado por obstáculo ou monstro.",
        TOO_FAST: "Limite de velocidade de passo excedido.",
        ALREADY_IN_BATTLE: "Você não pode andar durante um confronto ativo."
      };
      return this.sendError(client, result.error, messages[result.error] ?? "Passo rejeitado.");
    }
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.StartBattleRequest)
  handleStartBattle(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = StartBattleRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Requisição de início de batalha inválida.");
    }
    const result = this.game.startBattle(this.pid(client), parsed.data.targetEnemyId);
    if (!result.success || !result.battle) {
      const messages: Record<string, string> = {
        TARGET_UNAVAILABLE: "Inimigo indisponível ou já derrotado.",
        TOO_FAR: "Você precisa estar adjacente ao monstro para iniciar combate.",
        ALREADY_IN_BATTLE: "Você já está em uma batalha ativa."
      };
      return this.sendError(
        client,
        result.error ?? "TARGET_UNAVAILABLE",
        messages[result.error ?? ""] ?? "Não foi possível iniciar o confronto."
      );
    }
    client.emit(ServerEvents.BattleSnapshot, result.battle);
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.BattleActionRequest)
  handleBattleAction(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = BattleActionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Ação de combate inválida.");
    }
    const result = this.game.executeBattleAction(
      this.pid(client),
      parsed.data.battleId,
      parsed.data.actionId
    );
    if (!result.success || !result.battle) {
      const messages: Record<string, string> = {
        NOT_ENOUGH_MP: "Mana insuficiente para conjurar esta habilidade!",
        SKILL_ON_COOLDOWN: "Esta habilidade ainda está em tempo de recarga (cooldown)!",
        BATTLE_NOT_FOUND: "Sessão de batalha não encontrada."
      };
      return this.sendError(
        client,
        result.error ?? "INVALID_PAYLOAD",
        messages[result.error ?? ""] ?? "Ação de combate rejeitada."
      );
    }

    client.emit(ServerEvents.BattleSnapshot, result.battle);
    if (result.battle.finished) {
      client.emit(ServerEvents.BattleEnded, result.battle);
      const inv = this.game.getInventoryState(this.pid(client));
      if (inv) {
        client.emit(ServerEvents.InventoryState, inv);
      }
      if (result.announcement) {
        this.server.emit(ServerEvents.GateClearAnnouncement, result.announcement);
      }
      this.broadcastSnapshot();
    }
  }

  @SubscribeMessage(ClientEvents.BattleFleeRequest)
  handleBattleFlee(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = BattleFleeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Requisição de fuga inválida.");
    }
    const result = this.game.fleeBattle(this.pid(client), parsed.data.battleId);
    if (!result.success || !result.battle) {
      return this.sendError(client, "BATTLE_NOT_FOUND", "Sessão de batalha não encontrada.");
    }
    client.emit(ServerEvents.BattleSnapshot, result.battle);
    client.emit(ServerEvents.BattleEnded, result.battle);
    const inv = this.game.getInventoryState(this.pid(client));
    if (inv) {
      client.emit(ServerEvents.InventoryState, inv);
    }
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.AttackRequest)
  handleAttack(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = AttackRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Invalid attack request.");
    }
    const result = this.game.attack(this.pid(client), parsed.data.targetId);
    if (!result.success) {
      return this.sendError(client, result.error, "Ataque rejeitado.");
    }
    this.server.emit(ServerEvents.CombatLog, result.log);
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.SnapshotRequest)
  handleSnapshotRequest(@ConnectedSocket() client: Socket) {
    const playerId = this.pid(client);
    client.emit(ServerEvents.Snapshot, this.game.snapshot());
    const inv = this.game.getInventoryState(playerId);
    if (inv) {
      client.emit(ServerEvents.InventoryState, inv);
    }
    const battle = this.game.getActiveBattleForPlayer(playerId);
    if (battle) {
      client.emit(ServerEvents.BattleSnapshot, battle);
    }
  }

  @SubscribeMessage(ClientEvents.MissionsRequest)
  handleMissionsRequest(@ConnectedSocket() client: Socket) {
    client.emit(ServerEvents.MissionsState, this.game.getMissionsState(this.pid(client)));
  }

  @SubscribeMessage(ClientEvents.StartMissionRequest)
  handleStartMission(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = StartMissionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Requisição de missão inválida.");
    }
    const result = this.game.startMission(this.pid(client), parsed.data.missionId);
    if (!result.success || !result.state) {
      const messages: Record<string, string> = {
        MISSION_ALREADY_ACTIVE: "Você já possui uma missão em andamento!",
        MISSION_NOT_FOUND: "Missão não encontrada na Associação.",
        MISSION_LOCKED: "Você não possui o Rank ou Nível exigido para esta missão!"
      };
      return this.sendError(
        client,
        result.error ?? "MISSION_NOT_FOUND",
        messages[result.error ?? ""] ?? "Não foi possível iniciar a missão."
      );
    }
    client.emit(ServerEvents.MissionsState, result.state);
  }

  @SubscribeMessage(ClientEvents.ClaimMissionRequest)
  handleClaimMission(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = ClaimMissionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Requisição de resgate inválida.");
    }
    const result = this.game.claimMission(this.pid(client), parsed.data.runId);
    if (!result.success || !result.result) {
      const messages: Record<string, string> = {
        NO_ACTIVE_MISSION: "Nenhuma missão ativa encontrada para resgatar.",
        MISSION_IN_PROGRESS: "A missão ainda está em andamento! Aguarde o tempo necessário.",
        MISSION_ALREADY_CLAIMED: "Recompensa desta missão já foi resgatada."
      };
      return this.sendError(
        client,
        result.error ?? "NO_ACTIVE_MISSION",
        messages[result.error ?? ""] ?? "Não foi possível coletar a recompensa."
      );
    }
    client.emit(ServerEvents.MissionClaimResult, result.result);
    client.emit(ServerEvents.MissionsState, this.game.getMissionsState(this.pid(client)));
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.CancelMissionRequest)
  handleCancelMission(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = CancelMissionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Requisição de cancelamento inválida.");
    }
    const result = this.game.cancelMission(this.pid(client), parsed.data.runId);
    if (!result.success || !result.state) {
      return this.sendError(client, "NO_ACTIVE_MISSION", "Nenhuma missão ativa para cancelar.");
    }
    client.emit(ServerEvents.MissionsState, result.state);
  }

  @SubscribeMessage(ClientEvents.AllocateStatsRequest)
  handleAllocateStats(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = AllocateStatsRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Distribuição de atributos inválida.");
    }
    const result = this.game.allocateStats(this.pid(client), parsed.data);
    if (!result.success) {
      const messages: Record<string, string> = {
        INSUFFICIENT_STAT_POINTS: "Pontos de atributo insuficientes para distribuir.",
        CANNOT_ALLOCATE_IN_BATTLE: "Não é permitido distribuir pontos durante um confronto.",
        TARGET_UNAVAILABLE: "Caçador não encontrado."
      };
      return this.sendError(
        client,
        result.error ?? "INVALID_PAYLOAD",
        messages[result.error ?? ""] ?? "Falha ao distribuir pontos de atributo."
      );
    }
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.InventoryRequest)
  handleInventoryRequest(@ConnectedSocket() client: Socket) {
    const state = this.game.getInventoryState(this.pid(client));
    if (state) {
      client.emit(ServerEvents.InventoryState, state);
    }
  }

  @SubscribeMessage(ClientEvents.EquipItemRequest)
  handleEquipItem(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = EquipItemRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Requisição de equipamento inválida.");
    }
    const result = this.game.equipItem(this.pid(client), parsed.data.slotIndex);
    if (!result.success || !result.state) {
      const messages: Record<string, string> = {
        ITEM_NOT_FOUND: "Item não encontrado no inventário.",
        CANNOT_EQUIP: "Este item não pode ser equipado.",
        INSUFFICIENT_LEVEL_FOR_ITEM: "Nível insuficiente para equipar este item."
      };
      return this.sendError(client, result.error ?? "CANNOT_EQUIP", messages[result.error ?? ""] ?? "Falha ao equipar item.");
    }
    client.emit(ServerEvents.InventoryState, result.state);
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.UnequipItemRequest)
  handleUnequipItem(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = UnequipItemRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Requisição de desequipar inválida.");
    }
    const result = this.game.unequipItem(this.pid(client), parsed.data.slot);
    if (!result.success || !result.state) {
      return this.sendError(client, result.error ?? "CANNOT_EQUIP", "Inventário cheio ou item inválido.");
    }
    client.emit(ServerEvents.InventoryState, result.state);
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.UseItemRequest)
  handleUseItem(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = UseItemRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Requisição de uso de item inválida.");
    }
    const result = this.game.useItem(this.pid(client), parsed.data.slotIndex);
    if (!result.success || !result.state) {
      return this.sendError(client, result.error ?? "ITEM_NOT_FOUND", "Não foi possível consumir o item.");
    }
    client.emit(ServerEvents.InventoryState, result.state);
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.UseCombatConsumableRequest)
  handleUseCombatConsumable(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = UseCombatConsumableRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Requisição de consumível de combate inválida.");
    }
    const result = this.game.useCombatConsumable(this.pid(client), parsed.data.battleId, parsed.data.itemId);
    if (!result.success || !result.snapshot) {
      const messages: Record<string, string> = {
        CONSUMABLE_CHARGES_EXHAUSTED: "Limite de 2 consumíveis por combate atingido!",
        ITEM_NOT_FOUND: "Item não encontrado no inventário.",
        NOT_IN_BATTLE: "Você não está em combate."
      };
      return this.sendError(
        client,
        result.error ?? "INVALID_PAYLOAD",
        messages[result.error ?? ""] ?? "Falha ao usar consumível."
      );
    }
    client.emit(ServerEvents.BattleSnapshot, result.snapshot);
    if (result.inventoryState) {
      client.emit(ServerEvents.InventoryState, result.inventoryState);
    }
    if (result.snapshot.finished) {
      this.broadcastSnapshot();
      client.emit(ServerEvents.BattleEnded, result.snapshot);
    }
  }

  @SubscribeMessage(ClientEvents.RankPromotionRequest)
  handleRankPromotion(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = RankPromotionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Requisição de promoção inválida.");
    }
    const result = this.game.promoteRank(this.pid(client), parsed.data.targetRank);
    client.emit(ServerEvents.RankPromotionResult, result.result);
    if (result.success) {
      this.broadcastSnapshot();
    }
  }

  @SubscribeMessage(ClientEvents.SellItemRequest)
  handleSellItem(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = SellItemRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Requisição de venda inválida.");
    }
    const result = this.game.sellItem(this.pid(client), parsed.data.slotIndex);
    if (!result.success || !result.state) {
      return this.sendError(client, result.error ?? "INVALID_PAYLOAD", "Não foi possível vender o item.");
    }
    client.emit(ServerEvents.InventoryState, result.state);
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.SellAllJunkRequest)
  handleSellAllJunk(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = SellAllJunkRequestSchema.safeParse(body);
    const maxRarity = parsed.success ? parsed.data.maxRarity : "UNCOMMON";
    const result = this.game.sellAllJunk(this.pid(client), maxRarity);
    client.emit(ServerEvents.InventoryState, result.state);
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.ZoneTeleportRequest)
  handleZoneTeleport(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = ZoneTeleportRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Zona de teleporte inválida.");
    }
    const result = this.game.teleportPlayerToZone(this.pid(client), parsed.data.zoneId);
    if (!result.success) {
      const messages: Record<string, string> = {
        ZONE_LOCKED: "Acesso negado: seu Rank de Caçador é insuficiente para entrar neste setor!",
        ALREADY_IN_BATTLE: "Não é possível teleportar enquanto estiver em combate ativo!",
        ZONE_NOT_FOUND: "Setor dimensional não localizado."
      };
      return this.sendError(
        client,
        result.error ?? "INVALID_PAYLOAD",
        messages[result.error ?? ""] ?? "Falha ao teleportar para o setor."
      );
    }
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.ResetGateRequest)
  handleResetGate(@ConnectedSocket() client: Socket) {
    const result = this.game.resetGate(this.pid(client));
    this.server.emit(ServerEvents.GateResetAnnouncement, { message: result.announcement });
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.MerchantBuyRequest)
  handleMerchantBuy(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = MerchantBuyRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Requisição de compra inválida.");
    }
    const result = this.game.buyMerchantItem(this.pid(client), parsed.data.itemId, parsed.data.quantity);
    if (!result.success || !result.state) {
      return this.sendError(client, result.error ?? "INVALID_PAYLOAD", "Ouro insuficiente ou inventário cheio.");
    }
    client.emit(ServerEvents.InventoryState, result.state);
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.ClaimLostTrophyRequest)
  handleClaimLostTrophy(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = ClaimLostTrophyRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Troféu inválido.");
    }
    const result = this.game.claimLostTrophy(this.pid(client), parsed.data.trophyId);
    if (!result.success) {
      return this.sendError(client, result.error ?? "INVALID_PAYLOAD", "Você ainda não possui autorização ou abate registrado para este troféu.");
    }
    if (result.state) {
      client.emit(ServerEvents.InventoryState, result.state);
    }
    this.broadcastSnapshot();
  }

  private broadcastSnapshot() {
    this.server.emit(ServerEvents.Snapshot, this.game.snapshot());
  }

  private sendError(client: Socket, code: ServerErrorCode, message: string) {
    client.emit(ServerEvents.Error, { code, message } satisfies ServerError);
  }
}
