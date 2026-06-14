import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { RANKING_QUEUE, type RankingJob } from "./ranking.queue";

@Injectable()
export class RankingService {
  constructor(
    @InjectQueue(RANKING_QUEUE) private readonly queue: Queue<RankingJob>,
  ) {}

  queueRecalc(userId: string) {
    return this.queue.add("recalc-user", { kind: "recalc-user", userId });
  }

  queueRebuild() {
    return this.queue.add("rebuild-leaderboard", { kind: "rebuild-leaderboard" });
  }
}
