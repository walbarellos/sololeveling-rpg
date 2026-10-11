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
  ClientEvents,
  ServerEvents,
  StepRequestSchema,
  type ServerError
} from "@rpg/contracts";
import { GameService } from "../domain/game.service";

@WebSocketGateway({
  cors: { origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" },
  transports: ["websocket", "polling"]
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  constructor(private readonly game: GameService) {}

  handleConnection(client: Socket) {
    const player = this.game.connect(client.id);
    client.emit(ServerEvents.Welcome, {
      playerId: player.id,
      ...this.game.dimensions
    });
    this.broadcastSnapshot();
  }

  handleDisconnect(client: Socket) {
    this.game.disconnect(client.id);
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.StepRequest)
  handleStep(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = StepRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Invalid step request.");
    }
    const result = this.game.step(client.id, parsed.data.direction);
    if (!result.success) {
      const messages = {
        OUT_OF_BOUNDS: "Movement out of map bounds.",
        OBSTACLE: "Path blocked by obstacle or entity.",
        TOO_FAST: "Step rate limit exceeded."
      } as const;
      return this.sendError(client, result.error, messages[result.error]);
    }
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.AttackRequest)
  handleAttack(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = AttackRequestSchema.safeParse(body);
    if (!parsed.success) {
      return this.sendError(client, "INVALID_PAYLOAD", "Invalid attack request.");
    }
    const result = this.game.attack(client.id, parsed.data.targetId);
    if (!result.success) {
      const map = {
        TARGET_UNAVAILABLE: ["TARGET_UNAVAILABLE", "Target unavailable."],
        TOO_FAR: ["TOO_FAR", "Target is not in adjacent range."],
        COOLDOWN: ["COOLDOWN", "Attack is cooling down."]
      } as const;
      return this.sendError(client, map[result.error][0], map[result.error][1]);
    }
    this.server.emit(ServerEvents.CombatLog, result.log);
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.SnapshotRequest)
  handleSnapshotRequest(@ConnectedSocket() client: Socket) {
    client.emit(ServerEvents.Snapshot, this.game.snapshot());
  }

  private broadcastSnapshot() {
    this.server.emit(ServerEvents.Snapshot, this.game.snapshot());
  }

  private sendError(client: Socket, code: ServerError["code"], message: string) {
    client.emit(ServerEvents.Error, { code, message } satisfies ServerError);
  }
}
