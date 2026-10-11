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
  AttackRequestSchema,
  BattleActionRequestSchema,
  BattleFleeRequestSchema,
  CancelMissionRequestSchema,
  ClaimMissionRequestSchema,
  ClientEvents,
  SelectClassRequestSchema,
  ServerEvents,
  StartBattleRequestSchema,
  StartMissionRequestSchema,
  StepRequestSchema,
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
    client.emit(ServerEvents.Snapshot, this.game.snapshot());
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

  private broadcastSnapshot() {
    this.server.emit(ServerEvents.Snapshot, this.game.snapshot());
  }

  private sendError(client: Socket, code: ServerErrorCode, message: string) {
    client.emit(ServerEvents.Error, { code, message } satisfies ServerError);
  }
}
