"use client";

import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import type { Location } from "@geopin/types";

/**
 * Bounding boxes per ISO-2 country. Used to generate random candidate
 * coordinates; the Street View Service then snaps to the nearest real
 * panorama within a radius.
 *
 * Land-biased: bboxes are tightened to skip obvious ocean when possible.
 * You can extend this list — any missing country falls back to the
 * continental bbox of its pack.
 */
export const COUNTRY_BBOX: Record<string, BBox> = {
  CO: { north: 12.5,  south: -4.2,  east: -66.8, west: -79.0 },
  AR: { north: -21.8, south: -55.1, east: -53.6, west: -73.6 },
  MX: { north: 32.7,  south: 14.5,  east: -86.7, west: -118.4 },
  BR: { north: 5.3,   south: -33.8, east: -34.8, west: -74.0 },
  CL: { north: -17.5, south: -55.9, east: -66.4, west: -75.6 },
  PE: { north: -0.1,  south: -18.4, east: -68.7, west: -81.4 },
  EC: { north: 1.4,   south: -5.0,  east: -75.2, west: -81.0 },
  VE: { north: 12.2,  south: 0.7,   east: -59.8, west: -73.4 },
  UY: { north: -30.1, south: -34.9, east: -53.1, west: -58.4 },
  BO: { north: -9.7,  south: -22.9, east: -57.5, west: -69.6 },
  PY: { north: -19.3, south: -27.6, east: -54.2, west: -62.7 },
  CR: { north: 11.2,  south: 8.0,   east: -82.6, west: -85.9 },
  CU: { north: 23.3,  south: 19.8,  east: -74.1, west: -84.9 },
  DO: { north: 19.9,  south: 17.5,  east: -68.3, west: -72.0 },
  GT: { north: 17.8,  south: 13.7,  east: -88.2, west: -92.2 },
  HN: { north: 16.5,  south: 12.9,  east: -83.2, west: -89.4 },
  NI: { north: 15.0,  south: 10.7,  east: -83.1, west: -87.7 },
  PA: { north: 9.6,   south: 7.2,   east: -77.2, west: -83.0 },
  SV: { north: 14.4,  south: 13.2,  east: -87.7, west: -90.1 },
  US: { north: 49.0,  south: 25.0,  east: -67.0, west: -124.7 },
  CA: { north: 60.0,  south: 43.0,  east: -52.6, west: -141.0 },

  FR: { north: 51.1,  south: 42.3,  east: 8.2,   west: -5.1 },
  ES: { north: 43.8,  south: 36.0,  east: 4.3,   west: -9.3 },
  DE: { north: 55.1,  south: 47.3,  east: 15.0,  west: 5.9 },
  IT: { north: 47.1,  south: 36.6,  east: 18.5,  west: 6.6 },
  GB: { north: 58.7,  south: 49.9,  east: 1.8,   west: -8.1 },
  NL: { north: 53.5,  south: 50.7,  east: 7.2,   west: 3.4 },
  PT: { north: 42.2,  south: 37.0,  east: -6.2,  west: -9.5 },
  SE: { north: 69.0,  south: 55.3,  east: 24.2,  west: 11.0 },
  GR: { north: 41.7,  south: 34.8,  east: 28.2,  west: 19.4 },
  TR: { north: 42.1,  south: 36.0,  east: 44.8,  west: 26.0 },
  PL: { north: 54.8,  south: 49.0,  east: 24.1,  west: 14.1 },
  IE: { north: 55.4,  south: 51.4,  east: -5.4,  west: -10.5 },
  CZ: { north: 51.0,  south: 48.6,  east: 18.9,  west: 12.1 },
  AT: { north: 49.0,  south: 46.4,  east: 17.2,  west: 9.5 },
  BE: { north: 51.5,  south: 49.5,  east: 6.4,   west: 2.5 },
  CH: { north: 47.8,  south: 45.8,  east: 10.5,  west: 5.9 },
  DK: { north: 57.8,  south: 54.6,  east: 15.2,  west: 8.0 },
  FI: { north: 70.1,  south: 59.9,  east: 31.6,  west: 20.6 },
  NO: { north: 71.2,  south: 58.0,  east: 31.1,  west: 4.6 },
  IS: { north: 66.6,  south: 63.3,  east: -13.5, west: -24.5 },
  HR: { north: 46.6,  south: 42.4,  east: 19.5,  west: 13.5 },
  HU: { north: 48.6,  south: 45.7,  east: 22.9,  west: 16.1 },
  RO: { north: 48.3,  south: 43.6,  east: 29.7,  west: 20.3 },

  JP: { north: 45.5,  south: 24.3,  east: 145.8, west: 123.0 },
  KR: { north: 38.6,  south: 33.1,  east: 131.9, west: 125.0 },
  IN: { north: 35.5,  south: 8.1,   east: 97.4,  west: 68.1 },
  TH: { north: 20.5,  south: 5.6,   east: 105.6, west: 97.3 },
  SG: { north: 1.5,   south: 1.2,   east: 104.1, west: 103.6 },
  AE: { north: 26.1,  south: 22.6,  east: 56.4,  west: 51.5 },
  MN: { north: 52.1,  south: 41.6,  east: 119.9, west: 87.7 },
  CN: { north: 53.6,  south: 18.2,  east: 134.8, west: 73.5 },
  ID: { north: 6.1,   south: -11.0, east: 141.0, west: 95.0 },
  MY: { north: 7.4,   south: 0.9,   east: 119.3, west: 99.6 },
  PH: { north: 21.1,  south: 4.6,   east: 126.6, west: 116.9 },
  VN: { north: 23.4,  south: 8.4,   east: 109.5, west: 102.1 },

  AU: { north: -10.7, south: -43.6, east: 153.6, west: 113.2 },
  NZ: { north: -34.4, south: -46.6, east: 178.5, west: 166.4 },

  ZA: { north: -22.1, south: -34.8, east: 32.9,  west: 16.5 },
  KE: { north: 5.0,   south: -4.7,  east: 41.9,  west: 33.9 },
  EG: { north: 31.7,  south: 22.0,  east: 36.9,  west: 24.7 },
};

export interface BBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export const WORLD_BBOX: BBox = { north: 70, south: -55, east: 180, west: -180 };

/**
 * Lazy bootstrap for the Maps JS API. v2 of @googlemaps/js-api-loader replaced
 * the Loader class with `setOptions` + `importLibrary`. We call setOptions
 * once and let importLibrary resolve from cache on subsequent calls.
 *
 * We also load the geocoding library so we can verify each panorama's country
 * — needed because Colombia's bbox overlaps Venezuela/Ecuador/Peru/Brazil/
 * Panama and Street View has dense coverage on the wrong side of the border.
 */
let optionsConfigured = false;
async function ensureMapsLoaded(apiKey: string): Promise<void> {
  if (!optionsConfigured) {
    setOptions({ key: apiKey, v: "weekly" });
    optionsConfigured = true;
  }
  await Promise.all([importLibrary("streetView"), importLibrary("geocoding")]);
}

/**
 * Reverse-geocode a coordinate to its ISO-2 country code. Returns null on
 * failure (e.g. Geocoding API not enabled) — callers should treat that as
 * "no validation possible" and fall through to less strict checks.
 */
async function panoramaCountry(
  geocoder: google.maps.Geocoder,
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const res = await geocoder.geocode({ location: { lat, lng } });
    for (const r of res.results) {
      const country = r.address_components.find((c) =>
        c.types.includes("country"),
      );
      if (country?.short_name) return country.short_name.toUpperCase();
    }
    return null;
  } catch {
    return null;
  }
}

function randomCoord(bbox: BBox): { lat: number; lng: number } {
  return {
    lat: bbox.south + Math.random() * (bbox.north - bbox.south),
    lng: bbox.west + Math.random() * (bbox.east - bbox.west),
  };
}

/**
 * Ask Google for the nearest outdoor panorama within `radiusKm` of the given
 * coord. Resolves with the real panorama location + panoId, or null if none.
 */
function findPanorama(
  sv: google.maps.StreetViewService,
  loc: { lat: number; lng: number },
  radiusKm: number,
): Promise<{ lat: number; lng: number; panoId: string } | null> {
  return new Promise((resolve) => {
    sv.getPanorama(
      {
        location: loc,
        radius: radiusKm * 1000,
        // GOOGLE = only official car/trekker captures. Excludes user-
        // contributed photospheres (selfies, interiors, close-ups of
        // monuments) that otherwise make the game feel weird.
        source: google.maps.StreetViewSource.GOOGLE,
        preference: google.maps.StreetViewPreference.NEAREST,
      },
      (data, status) => {
        // Drop panoramas with no navigation links — they tend to be isolated
        // single-shot captures inside tunnels / dead-ends, not fun to play.
        if (
          status === "OK" &&
          data?.location?.latLng &&
          (data.links?.length ?? 0) > 0
        ) {
          resolve({
            lat: data.location.latLng.lat(),
            lng: data.location.latLng.lng(),
            panoId: data.location.pano ?? "",
          });
        } else {
          resolve(null);
        }
      },
    );
  });
}

/**
 * Pick `count` random panoramas inside the given set of country bboxes.
 * Uses bounded retries per slot — if a country is mostly ocean/desert we
 * might need to try many random points before finding one with coverage.
 */
export async function pickRandomPanoramas(opts: {
  countries: string[] | null; // null → world
  count: number;
  apiKey: string;
  radiusKm?: number;
  maxAttemptsPerSlot?: number;
}): Promise<Location[]> {
  const {
    countries,
    count,
    apiKey,
    // 25 km is the sweet spot — small enough that the panorama almost always
    // sits inside the country whose bbox produced the random coord, but big
    // enough to catch coverage in places without dense Street View.
    radiusKm = 25,
    maxAttemptsPerSlot = 18,
  } = opts;

  await ensureMapsLoaded(apiKey);
  const sv = new google.maps.StreetViewService();
  const geocoder = new google.maps.Geocoder();

  // Only sample countries we have a bbox for. Falling back to WORLD_BBOX for
  // unknown countries would leak locations from anywhere on Earth into a
  // restricted pack — better to just skip those countries.
  const bboxes: Array<{ country: string | null; bbox: BBox }> =
    !countries || countries.length === 0
      ? [{ country: null, bbox: WORLD_BBOX }]
      : countries
          .filter((cc) => COUNTRY_BBOX[cc])
          .map((cc) => ({ country: cc, bbox: COUNTRY_BBOX[cc]! }));
  if (bboxes.length === 0) bboxes.push({ country: null, bbox: WORLD_BBOX });

  const allowedCountries = countries && countries.length > 0
    ? new Set(countries.map((c) => c.toUpperCase()))
    : null;

  const results: Location[] = [];
  const usedPanoIds = new Set<string>();

  const findOne = async (): Promise<Location | null> => {
    for (let attempt = 0; attempt < maxAttemptsPerSlot; attempt++) {
      const entry = bboxes[Math.floor(Math.random() * bboxes.length)]!;
      const coord = randomCoord(entry.bbox);
      const pano = await findPanorama(sv, coord, radiusKm);
      if (!pano || usedPanoIds.has(pano.panoId)) continue;

      // Country gate: when a pack restricts countries, reverse-geocode the
      // panorama to verify it's actually inside one of them. The bbox check
      // alone leaks across borders (e.g. CO → VE/EC/PA).
      let resolvedCountry = entry.country;
      if (allowedCountries) {
        const cc = await panoramaCountry(geocoder, pano.lat, pano.lng);
        if (!cc) {
          // Geocoder unavailable — fall back to trusting the bbox. Better than
          // skipping every result if the user hasn't enabled Geocoding API.
          resolvedCountry = entry.country;
        } else if (!allowedCountries.has(cc)) {
          continue; // wrong country, retry
        } else {
          resolvedCountry = cc;
        }
      }

      usedPanoIds.add(pano.panoId);
      return {
        id: `gsv_${pano.panoId || `${pano.lat},${pano.lng}`}`,
        lat: pano.lat,
        lng: pano.lng,
        country: resolvedCountry ?? undefined,
        provider: "google",
        providerRef: pano.panoId,
      };
    }
    return null;
  };

  // Parallelize up to 5 lookups at a time for speed.
  while (results.length < count) {
    const remaining = count - results.length;
    const batch = await Promise.all(
      Array.from({ length: Math.min(5, remaining) }, () => findOne()),
    );
    for (const r of batch) if (r) results.push(r);
    // Give up if we can't keep finding new ones
    if (batch.every((r) => r === null)) break;
  }

  return results;
}
