import { Module } from "@nestjs/common";
import { GameGateway } from "./realtime/game.gateway";
import { GameService } from "./domain/game.service";
import { CLOCK, SystemClock } from "./domain/clock";
import { InMemoryPlayerRepository, PLAYER_REPOSITORY } from "./domain/player.repository";

@Module({
  providers: [
    GameService,
    GameGateway,
    { provide: CLOCK, useClass: SystemClock },
    { provide: PLAYER_REPOSITORY, useClass: InMemoryPlayerRepository }
  ]
})
export class AppModule {}
