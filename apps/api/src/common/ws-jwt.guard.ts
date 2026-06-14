import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Socket } from "socket.io";

/**
 * Gateway guard that extracts a JWT from the socket handshake (auth.token
 * or Authorization header) and attaches the decoded user to `socket.data`.
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const client = ctx.switchToWs().getClient<Socket>();
    const token =
      (client.handshake.auth && (client.handshake.auth.token as string)) ||
      extractFromHeaders(client.handshake.headers.authorization);

    if (!token) return false;
    try {
      const payload = this.jwt.verify(token);
      (client.data as any).user = payload;
      return true;
    } catch {
      return false;
    }
  }
}

function extractFromHeaders(value?: string | string[]): string | null {
  if (!value) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw?.startsWith("Bearer ")) return raw.slice(7);
  return null;
}
