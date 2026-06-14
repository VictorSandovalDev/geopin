import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  DEFAULT_ROUNDS,
  DEFAULT_ROUND_SECONDS,
  MAX_PLAYERS_PER_ROOM,
  type LatLng,
  type Player,
  type RoomState,
  type StartGamePayload,
} from "@geopin/types";
import { RoomStore } from "./room.store";
import { LocationsService } from "../locations/locations.service";
import { GameService } from "../game/game.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    private readonly store: RoomStore,
    private readonly locations: LocationsService,
    private readonly game: GameService,
    private readonly prisma: PrismaService,
  ) {}

  /** Create-or-get an open room. A null `code` mints a fresh one. */
  async ensure(code: string | null, host: Player): Promise<RoomState> {
    if (code) {
      const existing = await this.store.get(code);
      if (existing) return existing;
    }
    const newCode = code ?? this.generateCode();
    const state: RoomState = {
      code: newCode,
      hostId: host.userId,
      players: [{ ...host, isHost: true, ready: false, connected: true }],
      status: "lobby",
      config: {
        rounds: DEFAULT_ROUNDS,
        roundSeconds: DEFAULT_ROUND_SECONDS,
        difficulty: "normal",
        allowPan: true,
        allowZoom: true,
        allowMove: true,
        packId: "world",
      },
      currentRound: 0,
      rounds: [],
      createdAt: Date.now(),
    };
    await this.store.save(state);
    return state;
  }

  async join(code: string, player: Player): Promise<RoomState> {
    const state = await this.store.get(code);
    if (!state) throw new NotFoundException("room not found");
    if (state.status !== "lobby" && !state.players.find((p) => p.userId === player.userId)) {
      throw new BadRequestException("game already in progress");
    }
    if (state.players.length >= MAX_PLAYERS_PER_ROOM) {
      throw new BadRequestException("room is full");
    }

    const existing = state.players.find((p) => p.userId === player.userId);
    if (existing) {
      existing.connected = true;
      existing.username = player.username;
    } else {
      state.players.push({ ...player, isHost: false, ready: false, connected: true });
    }
    await this.store.save(state);
    return state;
  }

  async leave(code: string, userId: string): Promise<RoomState | null> {
    const state = await this.store.get(code);
    if (!state) return null;
    state.players = state.players.filter((p) => p.userId !== userId);
    if (state.players.length === 0) {
      await this.store.delete(code);
      return null;
    }
    if (state.hostId === userId) {
      state.hostId = state.players[0]!.userId;
      state.players[0]!.isHost = true;
    }
    await this.store.save(state);
    return state;
  }

  async setReady(code: string, userId: string, ready: boolean): Promise<RoomState> {
    const state = await this.mustGet(code);
    const p = state.players.find((x) => x.userId === userId);
    if (!p) throw new NotFoundException("player not in room");
    p.ready = ready;
    await this.store.save(state);
    return state;
  }

  async start(code: string, userId: string, opts: StartGamePayload = {}): Promise<RoomState> {
    const state = await this.mustGet(code);
    if (state.hostId !== userId)
      throw new BadRequestException("only host can start the game");
    if (state.status !== "lobby")
      throw new BadRequestException("game already started");

    const rounds = clamp(opts.rounds ?? state.config.rounds, 1, 20);
    const roundSeconds = clamp(
      opts.roundSeconds ?? state.config.roundSeconds,
      15,
      600,
    );
    const difficulty = opts.difficulty ?? state.config.difficulty;
    const packId = opts.packId ?? state.config.packId ?? "world";

    // Prefer client-supplied panoramas (truly random from Google); fall back
    // to the curated dataset if the host couldn't pick enough.
    let locations: any[] = [];
    if (opts.locations && opts.locations.length >= rounds) {
      locations = opts.locations.slice(0, rounds).map((l, i) => ({
        id: l.id || `ext_${Date.now()}_${i}`,
        lat: l.lat,
        lng: l.lng,
        country: l.country,
        city: l.city,
        provider: l.provider ?? "google",
        providerRef: l.providerRef,
      }));
      // Persist these runtime-picked locations so rounds can reference them.
      for (const loc of locations) {
        await this.prisma.location
          .upsert({
            where: { id: loc.id },
            update: {},
            create: {
              id: loc.id,
              lat: loc.lat,
              lng: loc.lng,
              country: loc.country ?? null,
              city: loc.city ?? null,
              provider: loc.provider ?? "google",
              providerRef: loc.providerRef ?? null,
            },
          })
          .catch(() => {});
      }
    } else {
      locations = await this.locations.pickRandom(rounds, {
        difficulty,
        packId,
      });
    }

    state.config = { ...state.config, rounds, roundSeconds, difficulty, packId };
    state.status = "playing";
    state.currentRound = 0;
    state.rounds = locations.map((loc, i) => ({
      index: i,
      location: loc,
      startedAt: 0,
      endsAt: 0,
      status: "idle",
      guesses: [],
    }));
    // kick off the first round
    const now = Date.now();
    state.rounds[0]!.startedAt = now;
    state.rounds[0]!.endsAt = now + roundSeconds * 1000;
    state.rounds[0]!.status = "active";

    // Persist to Postgres — best-effort. Sockets don't block on DB.
    try {
      const game = await this.game.createGame({
        code: state.code,
        hostId: state.hostId,
        difficulty,
        rounds,
        roundSeconds,
        locations,
        playerIds: state.players.map((p) => p.userId),
      });
      await this.store.setGameId(state.code, game.id);
    } catch (err) {
      this.logger.warn(`createGame failed: ${(err as Error).message}`);
    }

    await this.store.save(state);
    return state;
  }

  async submitGuess(
    code: string,
    userId: string,
    guess: LatLng,
  ): Promise<{ state: RoomState; alreadyGuessed: boolean }> {
    const state = await this.mustGet(code);
    if (state.status !== "playing") throw new BadRequestException("not playing");
    const round = state.rounds[state.currentRound];
    if (!round || round.status !== "active")
      throw new BadRequestException("round not active");

    if (round.guesses.find((g) => g.userId === userId))
      return { state, alreadyGuessed: true };

    const player = state.players.find((p) => p.userId === userId);
    if (!player) throw new NotFoundException("player not in room");

    const { distanceKm, score } = this.game.scoreGuess(guess, round.location);
    round.guesses.push({
      userId,
      username: player.username,
      guess,
      distanceKm,
      score,
      submittedAt: Date.now(),
    });
    player.totalScore += score;

    // Persist (non-blocking for WS delivery)
    const gameId = await this.store.getGameId(code);
    if (gameId) {
      this.game
        .recordGuess({
          gameId,
          roundIndex: round.index,
          userId,
          guess,
          actual: round.location,
        })
        .catch((err) =>
          this.logger.warn(`recordGuess failed: ${(err as Error).message}`),
        );
    }

    await this.store.save(state);
    return { state, alreadyGuessed: false };
  }

  /**
   * Close the current round (reveal). Safe to call either when the timer
   * expires or when every connected player has guessed.
   */
  async closeRound(code: string): Promise<RoomState> {
    const state = await this.mustGet(code);
    const round = state.rounds[state.currentRound];
    if (!round || round.status !== "active") return state;
    round.status = "reveal";
    await this.store.save(state);
    return state;
  }

  async advance(code: string): Promise<{ state: RoomState; ended: boolean }> {
    const state = await this.mustGet(code);
    const nextIndex = state.currentRound + 1;
    if (nextIndex >= state.rounds.length) {
      state.status = "finished";
      await this.store.save(state);
      const gameId = await this.store.getGameId(code);
      if (gameId) {
        this.game.endGame(gameId).catch((err) =>
          this.logger.warn(`endGame failed: ${(err as Error).message}`),
        );
      }
      return { state, ended: true };
    }
    const now = Date.now();
    state.currentRound = nextIndex;
    state.rounds[nextIndex]!.startedAt = now;
    state.rounds[nextIndex]!.endsAt = now + state.config.roundSeconds * 1000;
    state.rounds[nextIndex]!.status = "active";
    await this.store.save(state);
    return { state, ended: false };
  }

  async mustGet(code: string): Promise<RoomState> {
    const state = await this.store.get(code);
    if (!state) throw new NotFoundException("room not found");
    return state;
  }

  /** Sanitize state before sending it to clients (strips unresolved answers). */
  sanitizeForPlayer(state: RoomState): RoomState {
    const copy = structuredClone(state);
    for (let i = 0; i < copy.rounds.length; i++) {
      const r = copy.rounds[i]!;
      // Hide the location for any round that is still active (player shouldn't see the answer)
      if (r.status === "active" && r.index === copy.currentRound) {
        r.location = { ...r.location, country: undefined, city: undefined };
      }
    }
    return copy;
  }

  private generateCode(): string {
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars
    let out = "";
    for (let i = 0; i < 6; i++)
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
