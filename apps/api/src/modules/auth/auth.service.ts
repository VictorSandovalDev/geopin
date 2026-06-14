import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto, LoginDto } from "./dto";
import type { AuthResponse } from "@geopin/types";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) throw new BadRequestException("email or username already taken");

    const passwordHash = await bcrypt.hash(dto.password, 11);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        username: dto.username,
        country: dto.country ?? null,
        passwordHash,
        stats: { create: {} },
      },
    });
    return this.sign(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const identifier = dto.identifier.toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: dto.identifier }],
      },
    });
    if (!user || !user.passwordHash)
      throw new UnauthorizedException("invalid credentials");

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("invalid credentials");
    return this.sign(user);
  }

  async guest(username?: string): Promise<AuthResponse> {
    const name = sanitizeGuestName(username);
    const email = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@guest.geopin`;
    const user = await this.prisma.user.create({
      data: {
        email,
        username: name,
        stats: { create: {} },
      },
    });
    return this.sign(user);
  }

  private async sign(user: {
    id: string;
    email: string;
    username: string;
    avatarSeed: string;
    isPremium: boolean;
    createdAt: Date;
  }): Promise<AuthResponse> {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      username: user.username,
    });
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarSeed: user.avatarSeed,
        isPremium: user.isPremium,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }
}

function sanitizeGuestName(raw?: string): string {
  const fallback = `guest_${Math.random().toString(36).slice(2, 6)}`;
  if (!raw) return fallback;
  const s = raw.replace(/[^a-zA-Z0-9_\-]/g, "").slice(0, 20);
  return s.length >= 3 ? s + "_" + Math.random().toString(36).slice(2, 4) : fallback;
}
