/**
 * Shared types used by both the Next.js frontend and the NestJS backend.
 * Keep this file dependency-free (no runtime imports) so it can be consumed
 * from anywhere without dragging the rest of the monorepo graph.
 */

export type LatLng = {
  lat: number;
  lng: number;
};

export type GameDifficulty = "easy" | "normal" | "hard";

export type RoundStatus = "idle" | "active" | "guessing" | "reveal" | "done";

export type GameStatus =
  | "lobby"
  | "starting"
  | "playing"
  | "between_rounds"
  | "finished"
  | "aborted";

export interface Location {
  id: string;
  lat: number;
  lng: number;
  country?: string;
  city?: string;
  provider?: "mapillary" | "google" | "synthetic";
  /** Mapillary image id or Google panoId */
  providerRef?: string;
}

export interface RoundGuess {
  userId: string;
  username: string;
  guess: LatLng;
  distanceKm: number;
  score: number;
  submittedAt: number;
}

export interface Round {
  index: number;
  location: Location;
  startedAt: number;
  endsAt: number;
  status: RoundStatus;
  guesses: RoundGuess[];
}

export interface Player {
  userId: string;
  username: string;
  avatarSeed: string;
  totalScore: number;
  connected: boolean;
  ready: boolean;
  isHost: boolean;
}

export interface RoomState {
  code: string;
  hostId: string;
  players: Player[];
  status: GameStatus;
  config: {
    rounds: number;
    roundSeconds: number;
    difficulty: GameDifficulty;
    allowPan: boolean;
    allowZoom: boolean;
    allowMove: boolean;
    packId: string;
    /** Scoring scale — diagonal of the played region in km. */
    mapSizeKm?: number;
  };
  currentRound: number;
  rounds: Round[];
  createdAt: number;
}

/* ---------- WebSocket event contracts ---------- */

export const WS_EVENTS = {
  // Client → Server
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  SET_READY: "set_ready",
  START_GAME: "start_game",
  SUBMIT_GUESS: "submit_guess",
  NEXT_ROUND: "next_round",
  PLAY_AGAIN: "play_again",
  CHAT: "chat",

  // Server → Client
  ROOM_STATE: "room_state",
  ROUND_STARTED: "round_started",
  ROUND_ENDED: "round_ended",
  GAME_ENDED: "game_ended",
  PLAYER_JOINED: "player_joined",
  PLAYER_LEFT: "player_left",
  TIMER_TICK: "timer_tick",
  ERROR: "error",
  CHAT_MESSAGE: "chat_message",
} as const;

export type WsEvent = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];

export interface JoinRoomPayload {
  code: string;
}

export interface SubmitGuessPayload {
  guess: LatLng;
}

export interface StartGamePayload {
  rounds?: number;
  roundSeconds?: number;
  difficulty?: GameDifficulty;
  /** Map pack id (e.g. "world", "colombia", "europe"). */
  packId?: string;
  /**
   * Pre-picked locations (from Google Street View Service) — when provided,
   * the backend uses these instead of sampling from its dataset. This is how
   * we get truly random, un-memorable panoramas every game.
   */
  locations?: Location[];
}

export interface MapPack {
  id: string;
  name: string;
  emoji: string;
  description: string;
  countries?: string[];
  /** True for user-created packs; false/absent for bundled presets. */
  isCustom?: boolean;
  /** Present on custom packs — owner can delete. */
  ownerId?: string;
  /** Whether a custom pack is visible to other users. */
  isPublic?: boolean;
}

export interface CreateMapPackRequest {
  name: string;
  description?: string;
  emoji?: string;
  countries: string[];
  isPublic?: boolean;
}

export interface ChatPayload {
  text: string;
}

export interface RoundEndedPayload {
  roundIndex: number;
  location: Location;
  guesses: RoundGuess[];
  leaderboard: Array<{ userId: string; username: string; score: number }>;
}

export interface GameEndedPayload {
  winnerId: string;
  leaderboard: Array<{ userId: string; username: string; score: number }>;
}

/* ---------- REST API DTOs ---------- */

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatarSeed: string;
  isPremium: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarSeed: string;
  country: string | null;
  totalScore: number;
  gamesPlayed: number;
  averageScore: number;
}

export interface UserProfile extends AuthUser {
  country: string | null;
  stats: {
    gamesPlayed: number;
    totalScore: number;
    averageScore: number;
    bestScore: number;
    perfectGuesses: number;
  };
}

/* ---------- Constants ---------- */

export const MAX_ROUND_SCORE = 5000;
/**
 * Reference map size (km) for scoring — roughly the diagonal of the world.
 * Smaller packs pass their own size so scoring stays demanding regionally.
 */
export const WORLD_MAP_SIZE_KM = 14916;
export const DEFAULT_ROUNDS = 5;
export const DEFAULT_ROUND_SECONDS = 120;
export const MAX_PLAYERS_PER_ROOM = 10;
export const MIN_PLAYERS_PER_ROOM = 1;
