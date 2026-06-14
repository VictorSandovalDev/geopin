import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { haversineKm, scoreFromDistance } from "../../common/haversine";
import type {
  GameDifficulty,
  LatLng,
  Location,
  MAX_ROUND_SCORE as _m,
} from "@geopin/types";

export interface CommitGuessInput {
  gameId: string;
  roundIndex: number;
  userId: string;
  guess: LatLng;
  actual: LatLng;
}

/**
 * Pure domain logic for GeoPin. Rooms service uses this to score guesses;
 * persistence is performed here so state stays consistent.
 */
@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}

  scoreGuess(guess: LatLng, actual: LatLng) {
    const distanceKm = haversineKm(guess, actual);
    const score = scoreFromDistance(distanceKm);
    return { distanceKm, score };
  }

  async createGame(input: {
    code: string;
    hostId?: string;
    mode?: "CLASSIC" | "DUEL" | "TEAM" | "TRAINING";
    difficulty?: GameDifficulty;
    rounds: number;
    roundSeconds: number;
    locations: Location[];
    playerIds: string[];
  }) {
    const diff = (input.difficulty ?? "normal").toUpperCase() as any;
    const game = await this.prisma.game.create({
      data: {
        code: input.code,
        hostId: input.hostId ?? null,
        mode: (input.mode ?? "CLASSIC") as any,
        difficulty: diff,
        roundCount: input.rounds,
        roundSeconds: input.roundSeconds,
        startedAt: new Date(),
        players: {
          createMany: {
            data: input.playerIds.map((userId) => ({ userId })),
            skipDuplicates: true,
          },
        },
        rounds: {
          createMany: {
            data: input.locations.map((loc, i) => ({
              index: i,
              locationId: loc.id,
            })),
          },
        },
      },
      include: { rounds: true, players: true },
    });
    return game;
  }

  async recordGuess(input: CommitGuessInput) {
    const { distanceKm, score } = this.scoreGuess(input.guess, input.actual);
    const round = await this.prisma.round.findFirst({
      where: { gameId: input.gameId, index: input.roundIndex },
    });
    if (!round) return { distanceKm, score, persisted: false };

    await this.prisma.roundGuess.upsert({
      where: {
        roundId_userId: { roundId: round.id, userId: input.userId },
      },
      update: { guessLat: input.guess.lat, guessLng: input.guess.lng, distanceKm, score },
      create: {
        roundId: round.id,
        userId: input.userId,
        guessLat: input.guess.lat,
        guessLng: input.guess.lng,
        distanceKm,
        score,
      },
    });

    await this.prisma.gamePlayer.update({
      where: { gameId_userId: { gameId: input.gameId, userId: input.userId } },
      data: { score: { increment: score } },
    });

    return { distanceKm, score, persisted: true };
  }

  async endGame(gameId: string) {
    const players = await this.prisma.gamePlayer.findMany({
      where: { gameId },
      orderBy: { score: "desc" },
    });
    // assign ranks
    await Promise.all(
      players.map((p, i) =>
        this.prisma.gamePlayer.update({
          where: { id: p.id },
          data: { rank: i + 1 },
        }),
      ),
    );
    await this.prisma.game.update({
      where: { id: gameId },
      data: { endedAt: new Date() },
    });
    return players;
  }
}
