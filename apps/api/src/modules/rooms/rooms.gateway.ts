import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { UseGuards, Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import {
  WS_EVENTS,
  type JoinRoomPayload,
  type Player,
  type StartGamePayload,
  type SubmitGuessPayload,
  type ChatPayload,
} from "@geopin/types";
import { WsJwtGuard } from "../../common/ws-jwt.guard";
import { RoomsService } from "./rooms.service";

@WebSocketGateway({ cors: { origin: "*" }, transports: ["websocket"] })
export class RoomsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(RoomsGateway.name);
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly rooms: RoomsService,
    private readonly jwt: JwtService,
  ) {}

  handleConnection(client: Socket) {
    const token =
      (client.handshake.auth && (client.handshake.auth.token as string)) ||
      null;
    if (!token) {
      client.emit(WS_EVENTS.ERROR, { code: "no_token" });
      client.disconnect();
      return;
    }
    try {
      const payload = this.jwt.verify(token) as {
        sub: string;
        username: string;
      };
      client.data.user = payload;
      this.logger.debug(`socket connected: ${payload.username} (${client.id})`);
    } catch {
      client.emit(WS_EVENTS.ERROR, { code: "invalid_token" });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user as { sub: string } | undefined;
    const code = client.data.roomCode as string | undefined;
    if (!user || !code) return;

    const state = await this.rooms.leave(code, user.sub);
    if (state) {
      this.server.to(code).emit(WS_EVENTS.PLAYER_LEFT, { userId: user.sub });
      this.broadcastState(code, state);
    } else {
      this.cancelTimer(code);
    }
  }

  /* -------------------- client → server -------------------- */

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(WS_EVENTS.JOIN_ROOM)
  async onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinRoomPayload,
  ) {
    const user = client.data.user as { sub: string; username: string };
    const player: Player = {
      userId: user.sub,
      username: user.username,
      avatarSeed: await this.rooms.avatarSeedOf(user.sub),
      totalScore: 0,
      connected: true,
      ready: false,
      isHost: false,
    };

    const state = body.code
      ? await this.rooms.join(body.code, player)
      : await this.rooms.ensure(null, player);

    client.data.roomCode = state.code;
    await client.join(state.code);

    this.server.to(state.code).emit(WS_EVENTS.PLAYER_JOINED, {
      userId: user.sub,
      username: user.username,
    });
    this.broadcastState(state.code, state);
    return { ok: true, code: state.code };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(WS_EVENTS.LEAVE_ROOM)
  async onLeave(@ConnectedSocket() client: Socket) {
    const user = client.data.user as { sub: string };
    const code = client.data.roomCode as string | undefined;
    if (!code) return;
    await client.leave(code);
    client.data.roomCode = null;
    const state = await this.rooms.leave(code, user.sub);
    if (state) this.broadcastState(code, state);
    else this.cancelTimer(code);
    return { ok: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(WS_EVENTS.SET_READY)
  async onReady(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { ready: boolean },
  ) {
    const user = client.data.user as { sub: string };
    const code = client.data.roomCode as string;
    const state = await this.rooms.setReady(code, user.sub, !!body.ready);
    this.broadcastState(code, state);
    return { ok: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(WS_EVENTS.START_GAME)
  async onStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: StartGamePayload,
  ) {
    const user = client.data.user as { sub: string };
    const code = client.data.roomCode as string;
    const state = await this.rooms.start(code, user.sub, body);
    this.startRoundTimer(code);
    this.server.to(code).emit(WS_EVENTS.ROUND_STARTED, {
      roundIndex: state.currentRound,
      location: state.rounds[state.currentRound]!.location,
      endsAt: state.rounds[state.currentRound]!.endsAt,
    });
    this.broadcastState(code, state);
    return { ok: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(WS_EVENTS.SUBMIT_GUESS)
  async onGuess(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SubmitGuessPayload,
  ) {
    const user = client.data.user as { sub: string };
    const code = client.data.roomCode as string;
    const { state } = await this.rooms.submitGuess(code, user.sub, body.guess);
    this.broadcastState(code, state);

    // if everybody guessed, close early
    const round = state.rounds[state.currentRound]!;
    const activePlayers = state.players.filter((p) => p.connected);
    if (round.guesses.length >= activePlayers.length) {
      await this.closeAndReveal(code);
    }
    return { ok: true };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(WS_EVENTS.NEXT_ROUND)
  async onNext(@ConnectedSocket() client: Socket) {
    const user = client.data.user as { sub: string };
    const code = client.data.roomCode as string;
    const state = await this.rooms.mustGet(code);
    if (state.hostId !== user.sub) {
      client.emit(WS_EVENTS.ERROR, { code: "not_host" });
      return;
    }
    const { state: next, ended } = await this.rooms.advance(code);
    if (ended) {
      const leaderboard = next.players
        .slice()
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((p) => ({
          userId: p.userId,
          username: p.username,
          score: p.totalScore,
        }));
      this.server.to(code).emit(WS_EVENTS.GAME_ENDED, {
        winnerId: leaderboard[0]?.userId ?? "",
        leaderboard,
      });
      this.cancelTimer(code);
    } else {
      const r = next.rounds[next.currentRound]!;
      this.server.to(code).emit(WS_EVENTS.ROUND_STARTED, {
        roundIndex: r.index,
        location: r.location,
        endsAt: r.endsAt,
      });
      this.startRoundTimer(code);
    }
    this.broadcastState(code, next);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(WS_EVENTS.PLAY_AGAIN)
  async onPlayAgain(@ConnectedSocket() client: Socket) {
    const user = client.data.user as { sub: string };
    const code = client.data.roomCode as string | undefined;
    if (!code) return;
    try {
      const state = await this.rooms.playAgain(code, user.sub);
      this.broadcastState(code, state);
      return { ok: true };
    } catch (err) {
      client.emit(WS_EVENTS.ERROR, { code: (err as Error).message });
      return { ok: false };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(WS_EVENTS.CHAT)
  async onChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: ChatPayload,
  ) {
    const user = client.data.user as { sub: string; username: string };
    const code = client.data.roomCode as string;
    if (!code || !body.text || body.text.length > 200) return;
    this.server.to(code).emit(WS_EVENTS.CHAT_MESSAGE, {
      userId: user.sub,
      username: user.username,
      text: body.text.slice(0, 200),
      at: Date.now(),
    });
  }

  /* -------------------- server helpers -------------------- */

  private broadcastState(code: string, state: any) {
    this.server
      .to(code)
      .emit(WS_EVENTS.ROOM_STATE, this.rooms.sanitizeForPlayer(state));
  }

  private startRoundTimer(code: string) {
    this.cancelTimer(code);
    const tick = async () => {
      const state = await this.rooms.mustGet(code).catch(() => null);
      if (!state) return;
      const round = state.rounds[state.currentRound];
      if (!round || round.status !== "active") return;
      const remaining = round.endsAt - Date.now();
      this.server.to(code).emit(WS_EVENTS.TIMER_TICK, {
        remainingMs: Math.max(0, remaining),
        roundIndex: round.index,
      });
      if (remaining <= 0) {
        await this.closeAndReveal(code);
      } else {
        this.timers.set(code, setTimeout(tick, 1000));
      }
    };
    this.timers.set(code, setTimeout(tick, 1000));
  }

  private async closeAndReveal(code: string) {
    this.cancelTimer(code);
    const state = await this.rooms.closeRound(code);
    const round = state.rounds[state.currentRound]!;
    const leaderboard = state.players
      .slice()
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((p) => ({
        userId: p.userId,
        username: p.username,
        score: p.totalScore,
      }));
    this.server.to(code).emit(WS_EVENTS.ROUND_ENDED, {
      roundIndex: round.index,
      location: round.location, // real coordinates revealed
      guesses: round.guesses,
      leaderboard,
    });
    // full (unsanitized) state is still useful for reveal animation
    this.server.to(code).emit(WS_EVENTS.ROOM_STATE, state);
  }

  private cancelTimer(code: string) {
    const t = this.timers.get(code);
    if (t) clearTimeout(t);
    this.timers.delete(code);
  }
}
