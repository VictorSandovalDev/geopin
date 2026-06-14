import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MAP_PACKS, findPack } from "../locations/map-packs";
import type { CreatePackDto } from "./dto";
import type { MapPack as MapPackDto } from "@geopin/types";

@Injectable()
export class PacksService {
  constructor(private readonly prisma: PrismaService) {}

  /** Resolve a pack's country filter by id — built-in or DB-backed. */
  async getCountries(id: string): Promise<string[] | undefined> {
    const builtIn = findPack(id);
    if (builtIn) return builtIn.countries;
    const custom = await this.prisma.mapPack.findUnique({ where: { id } });
    if (!custom) return undefined;
    return custom.countries;
  }

  /** List visible packs for the given user: built-in + public customs + mine. */
  async list(userId?: string): Promise<MapPackDto[]> {
    const customs = await this.prisma.mapPack.findMany({
      where: {
        OR: userId
          ? [{ isPublic: true }, { ownerId: userId }]
          : [{ isPublic: true }],
      },
      orderBy: { createdAt: "desc" },
    });

    const customsDto: MapPackDto[] = customs.map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      description: c.description,
      countries: c.countries,
      ownerId: c.ownerId ?? undefined,
      isPublic: c.isPublic,
      isCustom: true,
    }));

    const builtInsDto: MapPackDto[] = MAP_PACKS.map((p) => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      description: p.description,
      countries: p.countries,
      isCustom: false,
    }));

    return [...builtInsDto, ...customsDto];
  }

  async create(userId: string, dto: CreatePackDto): Promise<MapPackDto> {
    const countries = dto.countries.map((c) => c.toUpperCase());
    const slug = `${userId.slice(0, 6)}_${Date.now().toString(36)}`;

    const row = await this.prisma.mapPack.create({
      data: {
        slug,
        name: dto.name.trim(),
        emoji: (dto.emoji ?? "🗺️").trim().slice(0, 8),
        description: (dto.description ?? "").trim(),
        countries,
        isPublic: !!dto.isPublic,
        ownerId: userId,
      },
    });

    return {
      id: row.id,
      name: row.name,
      emoji: row.emoji,
      description: row.description,
      countries: row.countries,
      ownerId: row.ownerId ?? undefined,
      isPublic: row.isPublic,
      isCustom: true,
    };
  }

  async delete(userId: string, packId: string): Promise<void> {
    const existing = await this.prisma.mapPack.findUnique({
      where: { id: packId },
    });
    if (!existing) throw new NotFoundException();
    if (existing.ownerId !== userId) throw new ForbiddenException();
    await this.prisma.mapPack.delete({ where: { id: packId } });
  }
}
