import { Module } from "@nestjs/common";
import { RoomsService } from "./rooms.service";
import { RoomsGateway } from "./rooms.gateway";
import { RoomStore } from "./room.store";
import { redisProvider } from "../../common/redis.provider";
import { WsJwtGuard } from "../../common/ws-jwt.guard";
import { LocationsModule } from "../locations/locations.module";
import { GameModule } from "../game/game.module";

@Module({
  imports: [LocationsModule, GameModule],
  providers: [RoomsService, RoomsGateway, RoomStore, redisProvider, WsJwtGuard],
  exports: [RoomsService],
})
export class RoomsModule {}
