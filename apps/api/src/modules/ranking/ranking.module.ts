import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { RANKING_QUEUE } from "./ranking.queue";
import { RankingProcessor } from "./ranking.processor";
import { RankingService } from "./ranking.service";

@Module({
  imports: [BullModule.registerQueue({ name: RANKING_QUEUE })],
  providers: [RankingProcessor, RankingService],
  exports: [RankingService],
})
export class RankingModule {}
