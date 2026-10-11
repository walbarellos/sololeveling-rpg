import { Module } from "@nestjs/common";
import { GameGateway } from "./realtime/game.gateway";
import { GameService } from "./domain/game.service";

@Module({
  providers: [GameService, GameGateway]
})
export class AppModule {}
