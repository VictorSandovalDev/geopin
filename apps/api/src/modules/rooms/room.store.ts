import { Inject, Injectable } from "@nestjs/common";
import { Redis } from "ioredis";
import { REDIS_CLIENT } from "../../common/redis.provider";
import type { RoomState } from "@geopin/types";

const KEY = (code: string) => `room:${code}`;
const DB_KEY = (code: string) => `room:db:${code}`; // persisted gameId
const TTL_SECONDS = 60 * 60 * 4; // 4h

/**
 * Redis-backed room registry. Keeps room JSON as a single key — atomicity is
 * handled by Socket.IO rooms + event ordering; we only use short-lived Lua
 * scripts for the timer. Simple, good enough for thousands of rooms per node.
 */
@Injectable()
export class RoomStore {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get(code: string): Promise<RoomState | null> {
    const raw = await this.redis.get(KEY(code));
    return raw ? (JSON.parse(raw) as RoomState) : null;
  }

  async save(state: RoomState): Promise<void> {
    await this.redis.set(KEY(state.code), JSON.stringify(state), "EX", TTL_SECONDS);
  }

  async delete(code: string): Promise<void> {
    await this.redis.del(KEY(code), DB_KEY(code));
  }

  async setGameId(code: string, gameId: string): Promise<void> {
    await this.redis.set(DB_KEY(code), gameId, "EX", TTL_SECONDS);
  }

  async getGameId(code: string): Promise<string | null> {
    return this.redis.get(DB_KEY(code));
  }
}
