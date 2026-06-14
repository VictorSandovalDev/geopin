import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { UserProfile, LeaderboardEntry } from "@geopin/types";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { stats: true },
    });
    if (!user) throw new NotFoundException();

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarSeed: user.avatarSeed,
      country: user.country,
      isPremium: user.isPremium,
      createdAt: user.createdAt.toISOString(),
      stats: {
        gamesPlayed: user.stats?.gamesPlayed ?? 0,
        totalScore: user.stats?.totalScore ?? 0,
        averageScore: user.stats?.averageScore ?? 0,
        bestScore: user.stats?.bestScore ?? 0,
        perfectGuesses: user.stats?.perfectGuesses ?? 0,
      },
    };
  }

  async leaderboard(opts: {
    country?: string;
    limit?: number;
  }): Promise<LeaderboardEntry[]> {
    const limit = Math.min(opts.limit ?? 50, 100);
    const rows = await this.prisma.playerStats.findMany({
      where: opts.country ? { user: { country: opts.country } } : undefined,
      orderBy: [{ totalScore: "desc" }, { averageScore: "desc" }],
      take: limit,
      include: { user: true },
    });
    return rows.map((row, i) => ({
      rank: i + 1,
      userId: row.userId,
      username: row.user.username,
      avatarSeed: row.user.avatarSeed,
      country: row.user.country,
      totalScore: row.totalScore,
      gamesPlayed: row.gamesPlayed,
      averageScore: Math.round(row.averageScore),
    }));
  }
}
