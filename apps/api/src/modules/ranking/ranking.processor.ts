import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { RANKING_QUEUE, type RankingJob } from "./ranking.queue";

@Processor(RANKING_QUEUE)
export class RankingProcessor extends WorkerHost {
  private readonly logger = new Logger(RankingProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<RankingJob>): Promise<void> {
    switch (job.data.kind) {
      case "recalc-user":
        return this.recalcUser(job.data.userId);
      case "rebuild-leaderboard":
        return this.rebuildLeaderboard();
    }
  }

  private async recalcUser(userId: string) {
    const games = await this.prisma.gamePlayer.findMany({ where: { userId } });
    if (!games.length) return;

    const totalScore = games.reduce((sum, g) => sum + g.score, 0);
    const bestScore = Math.max(...games.map((g) => g.score));
    const averageScore = Math.round(totalScore / games.length);
    const perfectGuesses = await this.prisma.roundGuess.count({
      where: { userId, score: 5000 },
    });

    await this.prisma.playerStats.upsert({
      where: { userId },
      update: {
        gamesPlayed: games.length,
        totalScore,
        bestScore,
        averageScore,
        perfectGuesses,
      },
      create: {
        userId,
        gamesPlayed: games.length,
        totalScore,
        bestScore,
        averageScore,
        perfectGuesses,
      },
    });
    this.logger.debug(`recalc-user ${userId} → total=${totalScore}`);
  }

  private async rebuildLeaderboard() {
    // Stats are already denormalized; nothing to cache-bust yet.
    // Hook point for future Redis-cached leaderboards.
    this.logger.debug("rebuild-leaderboard executed");
  }
}
