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

export interface CityAnchor {
  lat: number;
  lng: number;
}

/**
 * City anchors per country. Most random samples are taken near one of these
 * centers (with a few km of jitter and a small panorama search radius) so
 * rounds land on urban streets instead of the rural highways that dominate
 * a uniform bbox sample. Countries without anchors fall back to bbox-only.
 */
export const COUNTRY_CITIES: Record<string, CityAnchor[]> = {
  CO: [
    { lat: 4.711, lng: -74.072 },   // Bogotá
    { lat: 6.244, lng: -75.581 },   // Medellín
    { lat: 3.452, lng: -76.532 },   // Cali
    { lat: 10.969, lng: -74.781 },  // Barranquilla
    { lat: 10.391, lng: -75.479 },  // Cartagena
    { lat: 7.894, lng: -72.508 },   // Cúcuta
    { lat: 7.119, lng: -73.123 },   // Bucaramanga
    { lat: 4.808, lng: -75.690 },   // Pereira
    { lat: 11.240, lng: -74.199 },  // Santa Marta
    { lat: 4.439, lng: -75.232 },   // Ibagué
    { lat: 5.070, lng: -75.514 },   // Manizales
    { lat: 4.142, lng: -73.627 },   // Villavicencio
    { lat: 1.214, lng: -77.278 },   // Pasto
    { lat: 8.748, lng: -75.881 },   // Montería
    { lat: 2.936, lng: -75.289 },   // Neiva
    { lat: 4.535, lng: -75.676 },   // Armenia
    { lat: 2.444, lng: -76.615 },   // Popayán
    { lat: 10.465, lng: -73.260 },  // Valledupar
    { lat: 5.535, lng: -73.367 },   // Tunja
    { lat: 9.305, lng: -75.398 },   // Sincelejo
  ],
  AR: [
    { lat: -34.604, lng: -58.382 }, // Buenos Aires
    { lat: -31.420, lng: -64.188 }, // Córdoba
    { lat: -32.945, lng: -60.650 }, // Rosario
    { lat: -32.889, lng: -68.845 }, // Mendoza
    { lat: -34.921, lng: -57.954 }, // La Plata
    { lat: -38.005, lng: -57.542 }, // Mar del Plata
    { lat: -24.783, lng: -65.412 }, // Salta
    { lat: -26.808, lng: -65.217 }, // San Miguel de Tucumán
    { lat: -38.951, lng: -68.059 }, // Neuquén
    { lat: -41.134, lng: -71.310 }, // Bariloche
    { lat: -54.802, lng: -68.303 }, // Ushuaia
    { lat: -27.469, lng: -58.830 }, // Corrientes
  ],
  MX: [
    { lat: 19.433, lng: -99.133 },  // Ciudad de México
    { lat: 20.660, lng: -103.349 }, // Guadalajara
    { lat: 25.686, lng: -100.316 }, // Monterrey
    { lat: 19.041, lng: -98.206 },  // Puebla
    { lat: 32.514, lng: -117.038 }, // Tijuana
    { lat: 21.122, lng: -101.683 }, // León
    { lat: 20.967, lng: -89.593 },  // Mérida
    { lat: 20.588, lng: -100.390 }, // Querétaro
    { lat: 21.161, lng: -86.851 },  // Cancún
    { lat: 17.073, lng: -96.726 },  // Oaxaca
    { lat: 28.632, lng: -106.069 }, // Chihuahua
    { lat: 19.174, lng: -96.134 },  // Veracruz
  ],
  BR: [
    { lat: -23.551, lng: -46.633 }, // São Paulo
    { lat: -22.907, lng: -43.173 }, // Rio de Janeiro
    { lat: -15.794, lng: -47.883 }, // Brasília
    { lat: -12.977, lng: -38.501 }, // Salvador
    { lat: -3.732, lng: -38.527 },  // Fortaleza
    { lat: -19.917, lng: -43.935 }, // Belo Horizonte
    { lat: -3.119, lng: -60.022 },  // Manaus
    { lat: -25.429, lng: -49.271 }, // Curitiba
    { lat: -8.048, lng: -34.877 },  // Recife
    { lat: -30.035, lng: -51.218 }, // Porto Alegre
    { lat: -1.456, lng: -48.502 },  // Belém
    { lat: -27.595, lng: -48.548 }, // Florianópolis
  ],
  CL: [
    { lat: -33.449, lng: -70.669 }, // Santiago
    { lat: -33.046, lng: -71.620 }, // Valparaíso
    { lat: -36.827, lng: -73.050 }, // Concepción
    { lat: -23.651, lng: -70.398 }, // Antofagasta
    { lat: -29.903, lng: -71.252 }, // La Serena
    { lat: -38.736, lng: -72.590 }, // Temuco
    { lat: -41.469, lng: -72.943 }, // Puerto Montt
    { lat: -20.214, lng: -70.152 }, // Iquique
    { lat: -53.163, lng: -70.917 }, // Punta Arenas
  ],
  PE: [
    { lat: -12.046, lng: -77.043 }, // Lima
    { lat: -16.409, lng: -71.537 }, // Arequipa
    { lat: -8.112, lng: -79.029 },  // Trujillo
    { lat: -13.532, lng: -71.967 }, // Cusco
    { lat: -6.771, lng: -79.841 },  // Chiclayo
    { lat: -5.195, lng: -80.633 },  // Piura
    { lat: -3.749, lng: -73.254 },  // Iquitos
    { lat: -12.065, lng: -75.205 }, // Huancayo
  ],
  EC: [
    { lat: -0.180, lng: -78.468 },  // Quito
    { lat: -2.190, lng: -79.887 },  // Guayaquil
    { lat: -2.900, lng: -79.006 },  // Cuenca
    { lat: -1.254, lng: -78.623 },  // Ambato
    { lat: -0.968, lng: -80.709 },  // Manta
    { lat: -3.993, lng: -79.204 },  // Loja
  ],
  VE: [
    { lat: 10.480, lng: -66.904 },  // Caracas
    { lat: 10.654, lng: -71.640 },  // Maracaibo
    { lat: 10.162, lng: -68.008 },  // Valencia
    { lat: 10.068, lng: -69.347 },  // Barquisimeto
    { lat: 10.235, lng: -67.591 },  // Maracay
    { lat: 8.582, lng: -71.157 },   // Mérida
  ],
  UY: [
    { lat: -34.901, lng: -56.164 }, // Montevideo
    { lat: -31.383, lng: -57.961 }, // Salto
    { lat: -32.322, lng: -58.076 }, // Paysandú
    { lat: -34.909, lng: -54.958 }, // Punta del Este
    { lat: -30.902, lng: -55.551 }, // Rivera
  ],
  BO: [
    { lat: -16.490, lng: -68.146 }, // La Paz
    { lat: -17.784, lng: -63.181 }, // Santa Cruz
    { lat: -17.394, lng: -66.157 }, // Cochabamba
    { lat: -19.036, lng: -65.259 }, // Sucre
    { lat: -21.531, lng: -64.729 }, // Tarija
  ],
  PY: [
    { lat: -25.264, lng: -57.576 }, // Asunción
    { lat: -25.510, lng: -54.616 }, // Ciudad del Este
    { lat: -27.331, lng: -55.866 }, // Encarnación
  ],
  CR: [
    { lat: 9.928, lng: -84.091 },   // San José
    { lat: 10.016, lng: -84.212 },  // Alajuela
    { lat: 9.864, lng: -83.920 },   // Cartago
    { lat: 10.635, lng: -85.437 },  // Liberia
  ],
  CU: [
    { lat: 23.113, lng: -82.366 },  // La Habana
    { lat: 20.020, lng: -75.827 },  // Santiago de Cuba
    { lat: 21.379, lng: -77.917 },  // Camagüey
  ],
  DO: [
    { lat: 18.486, lng: -69.931 },  // Santo Domingo
    { lat: 19.451, lng: -70.697 },  // Santiago de los Caballeros
    { lat: 18.582, lng: -68.404 },  // Punta Cana
    { lat: 19.790, lng: -70.687 },  // Puerto Plata
  ],
  GT: [
    { lat: 14.634, lng: -90.507 },  // Ciudad de Guatemala
    { lat: 14.835, lng: -91.518 },  // Quetzaltenango
    { lat: 14.557, lng: -90.733 },  // Antigua Guatemala
  ],
  HN: [
    { lat: 14.072, lng: -87.192 },  // Tegucigalpa
    { lat: 15.504, lng: -88.025 },  // San Pedro Sula
    { lat: 15.760, lng: -86.789 },  // La Ceiba
  ],
  NI: [
    { lat: 12.115, lng: -86.236 },  // Managua
    { lat: 12.435, lng: -86.878 },  // León
    { lat: 11.930, lng: -85.956 },  // Granada
  ],
  PA: [
    { lat: 8.983, lng: -79.519 },   // Ciudad de Panamá
    { lat: 9.359, lng: -79.900 },   // Colón
    { lat: 8.427, lng: -82.431 },   // David
  ],
  SV: [
    { lat: 13.693, lng: -89.218 },  // San Salvador
    { lat: 13.995, lng: -89.556 },  // Santa Ana
    { lat: 13.483, lng: -88.177 },  // San Miguel
  ],
  US: [
    { lat: 40.713, lng: -74.006 },  // New York
    { lat: 34.052, lng: -118.244 }, // Los Angeles
    { lat: 41.878, lng: -87.630 },  // Chicago
    { lat: 29.760, lng: -95.370 },  // Houston
    { lat: 33.448, lng: -112.074 }, // Phoenix
    { lat: 39.953, lng: -75.164 },  // Philadelphia
    { lat: 37.775, lng: -122.419 }, // San Francisco
    { lat: 47.606, lng: -122.332 }, // Seattle
    { lat: 25.762, lng: -80.192 },  // Miami
    { lat: 39.739, lng: -104.990 }, // Denver
    { lat: 42.360, lng: -71.058 },  // Boston
    { lat: 33.749, lng: -84.388 },  // Atlanta
    { lat: 29.951, lng: -90.072 },  // New Orleans
    { lat: 36.170, lng: -115.140 }, // Las Vegas
    { lat: 38.907, lng: -77.037 },  // Washington DC
  ],
  CA: [
    { lat: 43.653, lng: -79.383 },  // Toronto
    { lat: 45.502, lng: -73.567 },  // Montreal
    { lat: 49.283, lng: -123.121 }, // Vancouver
    { lat: 51.045, lng: -114.057 }, // Calgary
    { lat: 45.421, lng: -75.697 },  // Ottawa
    { lat: 53.546, lng: -113.494 }, // Edmonton
    { lat: 46.813, lng: -71.208 },  // Quebec City
    { lat: 49.895, lng: -97.138 },  // Winnipeg
    { lat: 44.649, lng: -63.575 },  // Halifax
  ],
  FR: [
    { lat: 48.857, lng: 2.352 },    // Paris
    { lat: 43.296, lng: 5.370 },    // Marseille
    { lat: 45.764, lng: 4.836 },    // Lyon
    { lat: 43.605, lng: 1.444 },    // Toulouse
    { lat: 43.710, lng: 7.262 },    // Nice
    { lat: 47.218, lng: -1.554 },   // Nantes
    { lat: 48.573, lng: 7.752 },    // Strasbourg
    { lat: 44.838, lng: -0.579 },   // Bordeaux
    { lat: 50.629, lng: 3.057 },    // Lille
  ],
  ES: [
    { lat: 40.417, lng: -3.704 },   // Madrid
    { lat: 41.385, lng: 2.173 },    // Barcelona
    { lat: 39.470, lng: -0.377 },   // Valencia
    { lat: 37.389, lng: -5.984 },   // Sevilla
    { lat: 41.649, lng: -0.888 },   // Zaragoza
    { lat: 36.721, lng: -4.421 },   // Málaga
    { lat: 43.263, lng: -2.935 },   // Bilbao
    { lat: 37.177, lng: -3.598 },   // Granada
    { lat: 43.362, lng: -8.412 },   // A Coruña
  ],
  DE: [
    { lat: 52.520, lng: 13.405 },   // Berlin
    { lat: 53.551, lng: 9.994 },    // Hamburg
    { lat: 48.135, lng: 11.582 },   // Munich
    { lat: 50.937, lng: 6.960 },    // Cologne
    { lat: 50.111, lng: 8.682 },    // Frankfurt
    { lat: 48.776, lng: 9.183 },    // Stuttgart
    { lat: 51.228, lng: 6.773 },    // Düsseldorf
    { lat: 51.340, lng: 12.375 },   // Leipzig
    { lat: 51.051, lng: 13.738 },   // Dresden
  ],
  IT: [
    { lat: 41.903, lng: 12.496 },   // Rome
    { lat: 45.464, lng: 9.190 },    // Milan
    { lat: 40.852, lng: 14.268 },   // Naples
    { lat: 45.070, lng: 7.687 },    // Turin
    { lat: 38.116, lng: 13.362 },   // Palermo
    { lat: 43.770, lng: 11.256 },   // Florence
    { lat: 44.494, lng: 11.343 },   // Bologna
    { lat: 41.117, lng: 16.872 },   // Bari
  ],
  GB: [
    { lat: 51.507, lng: -0.128 },   // London
    { lat: 52.487, lng: -1.890 },   // Birmingham
    { lat: 53.481, lng: -2.243 },   // Manchester
    { lat: 55.865, lng: -4.258 },   // Glasgow
    { lat: 55.953, lng: -3.188 },   // Edinburgh
    { lat: 53.408, lng: -2.992 },   // Liverpool
    { lat: 53.801, lng: -1.549 },   // Leeds
    { lat: 51.455, lng: -2.588 },   // Bristol
    { lat: 51.482, lng: -3.179 },   // Cardiff
    { lat: 54.597, lng: -5.930 },   // Belfast
  ],
  NL: [
    { lat: 52.368, lng: 4.904 },    // Amsterdam
    { lat: 51.924, lng: 4.478 },    // Rotterdam
    { lat: 52.070, lng: 4.300 },    // The Hague
    { lat: 52.091, lng: 5.121 },    // Utrecht
    { lat: 51.442, lng: 5.469 },    // Eindhoven
    { lat: 53.219, lng: 6.567 },    // Groningen
  ],
  PT: [
    { lat: 38.722, lng: -9.139 },   // Lisbon
    { lat: 41.158, lng: -8.629 },   // Porto
    { lat: 41.545, lng: -8.427 },   // Braga
    { lat: 40.203, lng: -8.410 },   // Coimbra
    { lat: 37.019, lng: -7.930 },   // Faro
  ],
  SE: [
    { lat: 59.329, lng: 18.069 },   // Stockholm
    { lat: 57.709, lng: 11.975 },   // Gothenburg
    { lat: 55.605, lng: 13.004 },   // Malmö
    { lat: 59.859, lng: 17.639 },   // Uppsala
    { lat: 63.826, lng: 20.263 },   // Umeå
  ],
  GR: [
    { lat: 37.984, lng: 23.727 },   // Athens
    { lat: 40.640, lng: 22.944 },   // Thessaloniki
    { lat: 38.246, lng: 21.735 },   // Patras
    { lat: 35.339, lng: 25.144 },   // Heraklion
  ],
  TR: [
    { lat: 41.008, lng: 28.978 },   // Istanbul
    { lat: 39.933, lng: 32.860 },   // Ankara
    { lat: 38.423, lng: 27.143 },   // Izmir
    { lat: 36.897, lng: 30.713 },   // Antalya
    { lat: 40.195, lng: 29.060 },   // Bursa
    { lat: 37.066, lng: 37.378 },   // Gaziantep
  ],
  PL: [
    { lat: 52.230, lng: 21.012 },   // Warsaw
    { lat: 50.065, lng: 19.945 },   // Kraków
    { lat: 51.760, lng: 19.457 },   // Łódź
    { lat: 51.108, lng: 17.038 },   // Wrocław
    { lat: 52.407, lng: 16.930 },   // Poznań
    { lat: 54.352, lng: 18.647 },   // Gdańsk
  ],
  IE: [
    { lat: 53.349, lng: -6.260 },   // Dublin
    { lat: 51.899, lng: -8.474 },   // Cork
    { lat: 53.271, lng: -9.062 },   // Galway
    { lat: 52.668, lng: -8.630 },   // Limerick
  ],
  CZ: [
    { lat: 50.076, lng: 14.437 },   // Prague
    { lat: 49.196, lng: 16.608 },   // Brno
    { lat: 49.821, lng: 18.263 },   // Ostrava
    { lat: 49.739, lng: 13.374 },   // Plzeň
  ],
  AT: [
    { lat: 48.208, lng: 16.373 },   // Vienna
    { lat: 47.071, lng: 15.440 },   // Graz
    { lat: 48.306, lng: 14.286 },   // Linz
    { lat: 47.810, lng: 13.055 },   // Salzburg
    { lat: 47.269, lng: 11.404 },   // Innsbruck
  ],
  BE: [
    { lat: 50.850, lng: 4.352 },    // Brussels
    { lat: 51.220, lng: 4.402 },    // Antwerp
    { lat: 51.054, lng: 3.725 },    // Ghent
    { lat: 50.633, lng: 5.567 },    // Liège
    { lat: 51.209, lng: 3.225 },    // Bruges
  ],
  CH: [
    { lat: 47.377, lng: 8.541 },    // Zurich
    { lat: 46.205, lng: 6.143 },    // Geneva
    { lat: 47.559, lng: 7.589 },    // Basel
    { lat: 46.948, lng: 7.447 },    // Bern
    { lat: 46.520, lng: 6.632 },    // Lausanne
  ],
  DK: [
    { lat: 55.676, lng: 12.568 },   // Copenhagen
    { lat: 56.163, lng: 10.204 },   // Aarhus
    { lat: 55.403, lng: 10.402 },   // Odense
    { lat: 57.048, lng: 9.919 },    // Aalborg
  ],
  FI: [
    { lat: 60.170, lng: 24.938 },   // Helsinki
    { lat: 61.498, lng: 23.761 },   // Tampere
    { lat: 60.452, lng: 22.267 },   // Turku
    { lat: 65.012, lng: 25.465 },   // Oulu
  ],
  NO: [
    { lat: 59.913, lng: 10.752 },   // Oslo
    { lat: 60.393, lng: 5.324 },    // Bergen
    { lat: 63.430, lng: 10.395 },   // Trondheim
    { lat: 58.970, lng: 5.733 },    // Stavanger
    { lat: 69.649, lng: 18.956 },   // Tromsø
  ],
  IS: [
    { lat: 64.147, lng: -21.942 },  // Reykjavík
    { lat: 65.688, lng: -18.111 },  // Akureyri
  ],
  HR: [
    { lat: 45.815, lng: 15.982 },   // Zagreb
    { lat: 43.508, lng: 16.440 },   // Split
    { lat: 45.327, lng: 14.442 },   // Rijeka
    { lat: 44.119, lng: 15.232 },   // Zadar
    { lat: 42.650, lng: 18.094 },   // Dubrovnik
  ],
  HU: [
    { lat: 47.498, lng: 19.040 },   // Budapest
    { lat: 47.532, lng: 21.627 },   // Debrecen
    { lat: 46.253, lng: 20.148 },   // Szeged
    { lat: 46.073, lng: 18.232 },   // Pécs
  ],
  RO: [
    { lat: 44.427, lng: 26.103 },   // Bucharest
    { lat: 46.771, lng: 23.624 },   // Cluj-Napoca
    { lat: 45.749, lng: 21.227 },   // Timișoara
    { lat: 47.159, lng: 27.587 },   // Iași
    { lat: 45.657, lng: 25.601 },   // Brașov
    { lat: 44.180, lng: 28.635 },   // Constanța
  ],
  JP: [
    { lat: 35.677, lng: 139.766 },  // Tokyo
    { lat: 34.694, lng: 135.502 },  // Osaka
    { lat: 35.012, lng: 135.768 },  // Kyoto
    { lat: 35.181, lng: 136.906 },  // Nagoya
    { lat: 43.062, lng: 141.354 },  // Sapporo
    { lat: 33.590, lng: 130.402 },  // Fukuoka
    { lat: 34.386, lng: 132.456 },  // Hiroshima
    { lat: 38.268, lng: 140.870 },  // Sendai
    { lat: 26.212, lng: 127.679 },  // Naha
  ],
  KR: [
    { lat: 37.567, lng: 126.978 },  // Seoul
    { lat: 35.180, lng: 129.075 },  // Busan
    { lat: 37.456, lng: 126.705 },  // Incheon
    { lat: 35.871, lng: 128.601 },  // Daegu
    { lat: 36.351, lng: 127.385 },  // Daejeon
    { lat: 35.160, lng: 126.851 },  // Gwangju
  ],
  IN: [
    { lat: 28.614, lng: 77.209 },   // Delhi
    { lat: 19.076, lng: 72.878 },   // Mumbai
    { lat: 12.972, lng: 77.594 },   // Bengaluru
    { lat: 13.083, lng: 80.270 },   // Chennai
    { lat: 22.573, lng: 88.364 },   // Kolkata
    { lat: 17.385, lng: 78.487 },   // Hyderabad
    { lat: 26.912, lng: 75.787 },   // Jaipur
    { lat: 23.023, lng: 72.571 },   // Ahmedabad
  ],
  TH: [
    { lat: 13.756, lng: 100.502 },  // Bangkok
    { lat: 18.788, lng: 98.985 },   // Chiang Mai
    { lat: 7.879, lng: 98.398 },    // Phuket
    { lat: 16.442, lng: 102.836 },  // Khon Kaen
    { lat: 12.924, lng: 100.882 },  // Pattaya
  ],
  SG: [
    { lat: 1.352, lng: 103.820 },   // Singapore
  ],
  AE: [
    { lat: 25.204, lng: 55.270 },   // Dubai
    { lat: 24.454, lng: 54.377 },   // Abu Dhabi
    { lat: 25.346, lng: 55.421 },   // Sharjah
  ],
  MN: [
    { lat: 47.886, lng: 106.906 },  // Ulaanbaatar
  ],
  ID: [
    { lat: -6.209, lng: 106.846 },  // Jakarta
    { lat: -7.258, lng: 112.752 },  // Surabaya
    { lat: -6.917, lng: 107.619 },  // Bandung
    { lat: 3.595, lng: 98.672 },    // Medan
    { lat: -8.670, lng: 115.212 },  // Denpasar
    { lat: -7.797, lng: 110.371 },  // Yogyakarta
  ],
  MY: [
    { lat: 3.139, lng: 101.687 },   // Kuala Lumpur
    { lat: 5.415, lng: 100.330 },   // George Town
    { lat: 1.493, lng: 103.741 },   // Johor Bahru
    { lat: 5.980, lng: 116.073 },   // Kota Kinabalu
  ],
  PH: [
    { lat: 14.599, lng: 120.984 },  // Manila
    { lat: 10.317, lng: 123.891 },  // Cebu
    { lat: 7.191, lng: 125.455 },   // Davao
    { lat: 16.402, lng: 120.596 },  // Baguio
  ],
  VN: [
    { lat: 21.028, lng: 105.854 },  // Hanoi
    { lat: 10.823, lng: 106.630 },  // Ho Chi Minh City
    { lat: 16.048, lng: 108.206 },  // Da Nang
    { lat: 16.464, lng: 107.591 },  // Hue
    { lat: 10.045, lng: 105.747 },  // Can Tho
  ],
  AU: [
    { lat: -33.869, lng: 151.209 }, // Sydney
    { lat: -37.814, lng: 144.963 }, // Melbourne
    { lat: -27.470, lng: 153.026 }, // Brisbane
    { lat: -31.951, lng: 115.860 }, // Perth
    { lat: -34.929, lng: 138.601 }, // Adelaide
    { lat: -28.017, lng: 153.400 }, // Gold Coast
    { lat: -35.281, lng: 149.128 }, // Canberra
    { lat: -42.882, lng: 147.324 }, // Hobart
    { lat: -12.464, lng: 130.846 }, // Darwin
  ],
  NZ: [
    { lat: -36.849, lng: 174.764 }, // Auckland
    { lat: -41.287, lng: 174.776 }, // Wellington
    { lat: -43.532, lng: 172.636 }, // Christchurch
    { lat: -37.787, lng: 175.279 }, // Hamilton
    { lat: -45.879, lng: 170.503 }, // Dunedin
    { lat: -45.031, lng: 168.663 }, // Queenstown
  ],
  ZA: [
    { lat: -26.204, lng: 28.047 },  // Johannesburg
    { lat: -33.925, lng: 18.424 },  // Cape Town
    { lat: -29.858, lng: 31.022 },  // Durban
    { lat: -25.748, lng: 28.188 },  // Pretoria
    { lat: -33.961, lng: 25.615 },  // Gqeberha
    { lat: -29.085, lng: 26.160 },  // Bloemfontein
  ],
  KE: [
    { lat: -1.292, lng: 36.822 },   // Nairobi
    { lat: -4.043, lng: 39.668 },   // Mombasa
    { lat: -0.092, lng: 34.768 },   // Kisumu
    { lat: -0.303, lng: 36.080 },   // Nakuru
  ],
  EG: [
    { lat: 30.044, lng: 31.236 },   // Cairo
    { lat: 31.200, lng: 29.919 },   // Alexandria
    { lat: 25.687, lng: 32.640 },   // Luxor
  ],
};

/** Flat pool of every city anchor, used by the world pack. */
const WORLD_CITY_POOL: Array<{ country: string | null; city: CityAnchor }> =
  Object.entries(COUNTRY_CITIES).flatMap(([country, cities]) =>
    cities.map((city) => ({ country, city })),
  );

/** Share of samples anchored to a city (the rest sample the whole bbox). */
const CITY_BIAS = 0.85;
/** Max jitter around a city center, km — keeps samples urban/suburban. */
const CITY_JITTER_KM = 6;
/** Panorama search radius for city samples, km. Small on purpose: a big
 * radius would snap city misses onto the nearest intercity highway. */
const CITY_SEARCH_RADIUS_KM = 3;

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

/** Uniform random point within `radiusKm` of a city center. */
function randomCoordNearCity(
  city: CityAnchor,
  radiusKm: number,
): { lat: number; lng: number } {
  const distKm = radiusKm * Math.sqrt(Math.random());
  const theta = Math.random() * 2 * Math.PI;
  const dLat = (distKm * Math.cos(theta)) / 111.32;
  const dLng =
    (distKm * Math.sin(theta)) /
    (111.32 * Math.max(0.2, Math.cos((city.lat * Math.PI) / 180)));
  return { lat: city.lat + dLat, lng: city.lng + dLng };
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
      // Prefer sampling near a known city so rounds land on urban streets
      // instead of the rural highways that dominate a uniform bbox sample.
      const cityPool = entry.country
        ? (COUNTRY_CITIES[entry.country] ?? []).map((city) => ({
            country: entry.country,
            city,
          }))
        : WORLD_CITY_POOL;
      const picked =
        cityPool.length > 0 && Math.random() < CITY_BIAS
          ? cityPool[Math.floor(Math.random() * cityPool.length)]!
          : null;
      const coord = picked
        ? randomCoordNearCity(picked.city, CITY_JITTER_KM)
        : randomCoord(entry.bbox);
      const pano = await findPanorama(
        sv,
        coord,
        picked ? CITY_SEARCH_RADIUS_KM : radiusKm,
      );
      if (!pano || usedPanoIds.has(pano.panoId)) continue;

      // Country gate: when a pack restricts countries, reverse-geocode the
      // panorama to verify it's actually inside one of them. The bbox check
      // alone leaks across borders (e.g. CO → VE/EC/PA).
      let resolvedCountry = picked?.country ?? entry.country;
      if (allowedCountries) {
        const cc = await panoramaCountry(geocoder, pano.lat, pano.lng);
        if (!cc) {
          // Geocoder unavailable — fall back to trusting the sampled anchor.
          // Better than skipping every result if Geocoding API is disabled.
          resolvedCountry = picked?.country ?? entry.country;
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
