"use client";

import type { LatLng, Location, MapPack } from "@geopin/types";
import { MAX_ROUND_SCORE } from "@geopin/types";
import { LOCATION_DATASET } from "./solo-dataset";
import { pickRandomPanoramas } from "./random-streetview";

/**
 * Client-side solo engine. Everything here runs without the backend so the
 * game is playable with just the static site (plus the Google key when set).
 */

/** Mirror of the backend scoring curve — exponential decay over distance. */
export function scoreFromDistance(distanceKm: number, mapScaleKm = 2000): number {
  if (distanceKm < 0.05) return MAX_ROUND_SCORE;
  const raw = MAX_ROUND_SCORE * Math.exp(-distanceKm / mapScaleKm);
  return Math.max(0, Math.round(raw));
}

/** Built-in packs, mirrored from the API so solo works offline. */
export const SOLO_PACKS: MapPack[] = [
  { id: "world", emoji: "🌍", name: "World", description: "Anywhere on Earth." },
  { id: "colombia", emoji: "🇨🇴", name: "Colombia", description: "Cities and landmarks across Colombia.", countries: ["CO"] },
  { id: "argentina", emoji: "🇦🇷", name: "Argentina", description: "From Ushuaia to Salta.", countries: ["AR"] },
  { id: "latam", emoji: "🌎", name: "Latin America", description: "South + Central America + Mexico.", countries: ["AR", "BO", "BR", "CL", "CO", "CR", "CU", "DO", "EC", "GT", "HN", "MX", "NI", "PA", "PE", "PY", "SV", "UY", "VE"] },
  { id: "europe", emoji: "🇪🇺", name: "Europe", description: "Cities across the old continent.", countries: ["AT", "BE", "CH", "CZ", "DE", "DK", "ES", "FI", "FR", "GB", "GR", "HR", "HU", "IE", "IS", "IT", "NL", "NO", "PL", "PT", "RO", "SE", "TR"] },
  { id: "asia", emoji: "🌏", name: "Asia", description: "From Tokyo to Mumbai.", countries: ["AE", "CN", "ID", "IN", "JP", "KR", "MN", "MY", "PH", "SG", "TH", "VN"] },
  { id: "usa", emoji: "🇺🇸", name: "USA & Canada", description: "North of the Rio Grande.", countries: ["US", "CA"] },
  { id: "oceania", emoji: "🦘", name: "Oceania", description: "Australia and New Zealand.", countries: ["AU", "NZ"] },
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Sample `count` locations from the offline curated dataset. */
export function pickOfflineLocations(
  countries: string[] | null,
  count: number,
): Location[] {
  const pool = countries?.length
    ? LOCATION_DATASET.filter((l) => l.country && countries.includes(l.country))
    : LOCATION_DATASET;
  const source = pool.length >= count ? pool : LOCATION_DATASET;
  return shuffle(source)
    .slice(0, count)
    .map(({ id, lat, lng, country, city, provider, providerRef }) => ({
      id, lat, lng, country, city, provider, providerRef,
    }));
}

/**
 * Pick locations for a solo game. Prefers live random Street View panoramas
 * (needs the Google key); falls back to the curated offline dataset.
 */
export async function pickSoloLocations(opts: {
  countries: string[] | null;
  count: number;
  apiKey: string;
}): Promise<Location[]> {
  const { countries, count, apiKey } = opts;
  if (apiKey) {
    try {
      const live = await pickRandomPanoramas({ countries, count, apiKey });
      if (live.length >= count) return live;
      // Partial coverage — top up from the offline dataset.
      return [...live, ...pickOfflineLocations(countries, count - live.length)];
    } catch {
      /* fall through to offline */
    }
  }
  return pickOfflineLocations(countries, count);
}

/* ---------- Solo game state ---------- */

export interface SoloRoundResult {
  location: Location;
  guess: LatLng | null;
  distanceKm: number | null;
  score: number;
}

export interface SoloConfig {
  packId: string;
  rounds: number;
  /** 0 disables the timer (relax mode). */
  roundSeconds: number;
  moveAllowed: boolean;
}

export const SOLO_DEFAULTS: SoloConfig = {
  packId: "world",
  rounds: 5,
  roundSeconds: 120,
  moveAllowed: true,
};

/* ---------- Personal bests (localStorage) ---------- */

const BEST_KEY = "geopin.solo.best";
const HISTORY_KEY = "geopin.solo.history";

export interface SoloHistoryEntry {
  date: string; // ISO
  packId: string;
  rounds: number;
  total: number;
}

export function getBestScore(packId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const all = JSON.parse(window.localStorage.getItem(BEST_KEY) ?? "{}");
    return typeof all[packId] === "number" ? all[packId] : 0;
  } catch {
    return 0;
  }
}

/** Records the finished game; returns true if it's a new personal best. */
export function recordGame(entry: SoloHistoryEntry): boolean {
  if (typeof window === "undefined") return false;
  let isBest = false;
  try {
    const all = JSON.parse(window.localStorage.getItem(BEST_KEY) ?? "{}");
    if (entry.total > (all[entry.packId] ?? 0)) {
      all[entry.packId] = entry.total;
      isBest = true;
    }
    window.localStorage.setItem(BEST_KEY, JSON.stringify(all));

    const history: SoloHistoryEntry[] = JSON.parse(
      window.localStorage.getItem(HISTORY_KEY) ?? "[]",
    );
    history.unshift(entry);
    window.localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history.slice(0, 50)),
    );
  } catch {
    /* storage unavailable — non-fatal */
  }
  return isBest;
}

export function getHistory(): SoloHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}
