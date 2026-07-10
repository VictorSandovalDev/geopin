import { MAX_ROUND_SCORE, WORLD_MAP_SIZE_KM } from "@geopin/types";

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
 * GeoGuessr-style decay scoring, scaled to the size of the played region:
 *
 *   score = MAX * exp(-10 * distanceKm / mapSizeKm)
 *
 * With the world size (~14 916 km) a 500 km miss is worth ~3 575 and a
 * 2 500 km miss ~935. Country packs pass their own (much smaller) size so
 * regional games stay demanding — being 500 km off inside Colombia
 * (~1 600 km) yields ~220 instead of the old ~3 890.
 */
export function scoreFromDistance(
  distanceKm: number,
  mapSizeKm = WORLD_MAP_SIZE_KM,
): number {
  if (distanceKm < 0.05) return MAX_ROUND_SCORE;
  const size = Math.min(Math.max(mapSizeKm, 200), WORLD_MAP_SIZE_KM);
  const raw = MAX_ROUND_SCORE * Math.exp((-10 * distanceKm) / size);
  return Math.max(0, Math.round(raw));
}

/**
 * Scoring scale for a set of round locations: the largest pairwise distance
 * approximates the diagonal of the played region. Falls back to world size
 * when there aren't enough points to measure.
 */
export function mapSizeFromLocations(points: LatLng[]): number {
  if (points.length < 2) return WORLD_MAP_SIZE_KM;
  let max = 0;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      max = Math.max(max, haversineKm(points[i]!, points[j]!));
    }
  }
  // A tight cluster still deserves a playable curve; ~1.5× spread gives
  // headroom since N samples underestimate the true region size.
  return Math.min(Math.max(max * 1.5, 200), WORLD_MAP_SIZE_KM);
}
