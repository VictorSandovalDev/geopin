import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { BullModule } from "@nestjs/bullmq";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { LocationsModule } from "./modules/locations/locations.module";
import { GameModule } from "./modules/game/game.module";
import { RoomsModule } from "./modules/rooms/rooms.module";
import { RankingModule } from "./modules/ranking/ranking.module";
import { PacksModule } from "./modules/packs/packs.module";
import { HealthController } from "./modules/health/health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: "short", ttl: 1000, limit: 20 },
      { name: "long", ttl: 60_000, limit: 200 },
    ]),
    BullModule.forRoot({
      connection: (() => {
        const url = process.env.REDIS_URL ?? "redis://localhost:6379";
        const u = new URL(url);
        return {
          host: u.hostname,
          port: Number(u.port || 6379),
          password: u.password || undefined,
          username: u.username || undefined,
        };
      })(),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    LocationsModule,
    GameModule,
    RoomsModule,
    RankingModule,
    PacksModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
