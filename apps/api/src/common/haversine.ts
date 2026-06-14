import { MAX_ROUND_SCORE } from "@geopin/types";

const EARTH_RADIUS_KM = 6371;

export interface LatLng {
  lat: number;
  lng: number;
}

/** Great-circle distance between two points on Earth in kilometers. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * GeoGuessr-style decay scoring. The map scale tunes how fast the score
 * drops off — roughly 2000 km for "world" maps.
 *
 *   score = MAX * exp(-distanceKm / mapScaleKm)
 *
 * A 0 km guess yields MAX_ROUND_SCORE; a guess across the world trends to 0.
 */
export function scoreFromDistance(
  distanceKm: number,
  mapScaleKm = 2000,
): number {
  if (distanceKm < 0.05) return MAX_ROUND_SCORE;
  const raw = MAX_ROUND_SCORE * Math.exp(-distanceKm / mapScaleKm);
  return Math.max(0, Math.round(raw));
}
