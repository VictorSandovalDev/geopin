import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LOCATION_DATASET } from "./locations.dataset";
import { findPack } from "./map-packs";
import type { Location, GameDifficulty } from "@geopin/types";

export interface PickOptions {
  difficulty?: GameDifficulty;
  /** Map pack id. If omitted → world. */
  packId?: string;
  /** Direct country filter. Takes precedence over packId. */
  countries?: string[];
}

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Pick N random locations, optionally filtered by country (via pack id).
   * Falls back to the static dataset if the DB has not been seeded.
   */
  async pickRandom(count: number, opts: PickOptions = {}): Promise<Location[]> {
    const difficulty = opts.difficulty ?? "normal";
    const normalized = difficulty.toUpperCase() as "EASY" | "NORMAL" | "HARD";

    // Resolve country filter — built-in packs live in code; custom packs in DB.
    let countries: string[] | undefined = opts.countries;
    if (!countries && opts.packId) {
      const builtIn = findPack(opts.packId);
      if (builtIn) {
        countries = builtIn.countries;
      } else {
        const custom = await this.prisma.mapPack
          .findUnique({ where: { id: opts.packId } })
          .catch(() => null);
        if (custom?.countries?.length) countries = custom.countries;
      }
    }

    const dbCount = await this.prisma.location.count();
    if (dbCount >= count) {
      const where: any = {};
      if (difficulty !== "normal") where.difficulty = normalized;
      if (countries?.length) where.country = { in: countries };

      let rows = await this.prisma.location.findMany({ where });
      // If not enough candidates with strict difficulty, relax it.
      if (rows.length < count && difficulty !== "normal") {
        rows = await this.prisma.location.findMany({
          where: countries?.length ? { country: { in: countries } } : {},
        });
      }
      if (rows.length >= count) {
        return shuffle(rows).slice(0, count).map(toLocation);
      }
    }

    // Dataset fallback
    let pool = LOCATION_DATASET.filter(
      (l) => difficulty === "normal" || l.difficulty === normalized,
    );
    if (countries?.length)
      pool = pool.filter((l) => l.country && countries!.includes(l.country));

    // Relax difficulty if pool is too small for the requested count
    if (pool.length < count) {
      pool = LOCATION_DATASET.filter(
        (l) => !countries?.length || (l.country && countries.includes(l.country)),
      );
    }

    return shuffle(pool)
      .slice(0, count)
      .map((l) => ({
        id: l.id,
        lat: l.lat,
        lng: l.lng,
        country: l.country,
        city: l.city,
        provider: l.provider,
        providerRef: l.providerRef,
      }));
  }

  async list(limit = 100): Promise<Location[]> {
    const rows = await this.prisma.location.findMany({ take: limit });
    if (rows.length) return rows.map(toLocation);
    return LOCATION_DATASET.slice(0, limit).map((l) => ({
      id: l.id,
      lat: l.lat,
      lng: l.lng,
      country: l.country,
      city: l.city,
      provider: l.provider,
    }));
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function toLocation(row: any): Location {
  return {
    id: row.id,
    lat: row.lat,
    lng: row.lng,
    country: row.country,
    city: row.city,
    provider: row.provider,
    providerRef: row.providerRef ?? undefined,
  };
}
