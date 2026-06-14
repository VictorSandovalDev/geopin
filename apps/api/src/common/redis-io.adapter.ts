import { IoAdapter } from "@nestjs/platform-socket.io";
import { INestApplicationContext } from "@nestjs/common";
import { ServerOptions } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";

/**
 * Socket.IO adapter that pipes pub/sub traffic through Redis, so multiple
 * API instances stay in sync on room events.
 */
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor?: ReturnType<typeof createAdapter>;

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(url: string): Promise<void> {
    const pubClient = new Redis(url, { maxRetriesPerRequest: null });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.ping(), subClient.ping()]);
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  override createIOServer(port: number, options?: ServerOptions): any {
    const origin = (process.env.API_CORS_ORIGIN ?? "http://localhost:3000")
      .split(",")
      .map((s) => s.trim());
    const server = super.createIOServer(port, {
      ...options,
      cors: { origin, credentials: true },
      transports: ["websocket"],
    });
    if (this.adapterConstructor) server.adapter(this.adapterConstructor);
    return server;
  }
}
