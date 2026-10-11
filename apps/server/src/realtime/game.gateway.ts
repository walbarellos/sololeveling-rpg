import {
  ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect,
  SubscribeMessage, WebSocketGateway, WebSocketServer
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import {
  AttackRequestSchema, ClientEvents, MoveRequestSchema, ServerEvents,
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
    client.emit(ServerEvents.Welcome, { playerId: player.id, ...this.game.dimensions });
    this.broadcastSnapshot();
  }

  handleDisconnect(client: Socket) {
    this.game.disconnect(client.id);
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.MoveRequest)
  handleMove(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = MoveRequestSchema.safeParse(body);
    if (!parsed.success) return this.sendError(client, "INVALID_PAYLOAD", "Invalid movement request.");
    const moved = this.game.move(client.id, parsed.data.target);
    if (!moved) return this.sendError(client, "OUT_OF_BOUNDS", "Movement rejected.");
    this.broadcastSnapshot();
  }

  @SubscribeMessage(ClientEvents.AttackRequest)
  handleAttack(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const parsed = AttackRequestSchema.safeParse(body);
    if (!parsed.success) return this.sendError(client, "INVALID_PAYLOAD", "Invalid attack request.");
    const result = this.game.attack(client.id, parsed.data.targetId);
    if (result.error) {
      const map = {
        TARGET_UNAVAILABLE: ["TARGET_UNAVAILABLE", "Target unavailable."],
        TOO_FAR: ["TOO_FAR", "Target is out of range."],
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
