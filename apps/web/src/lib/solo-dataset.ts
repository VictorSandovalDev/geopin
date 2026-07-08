import type { Location } from "@geopin/types";

/**
 * Curated seed dataset of well-known landmarks/cities with broad Street View
 * coverage. Grouped by country for easy filtering via map packs.
 * All coordinates are real — provider defaults to "synthetic" so the game
 * works with no external keys; Street View / Mapillary overlays if enabled.
 */
export const LOCATION_DATASET: Array<
  Location & { difficulty?: "EASY" | "NORMAL" | "HARD" }
> = [
  /* ─── Colombia (CO) ─── */
  { id: "co_bogota",     lat: 4.6482,   lng: -74.0836, country: "CO", city: "Bogotá",        provider: "synthetic", difficulty: "NORMAL" },
  { id: "co_medellin",   lat: 6.2442,   lng: -75.5812, country: "CO", city: "Medellín",      provider: "synthetic", difficulty: "NORMAL" },
  { id: "co_cartagena",  lat: 10.4236,  lng: -75.5478, country: "CO", city: "Cartagena",     provider: "synthetic", difficulty: "NORMAL" },
  { id: "co_cali",       lat: 3.4516,   lng: -76.5320, country: "CO", city: "Cali",          provider: "synthetic", difficulty: "NORMAL" },
  { id: "co_barran",     lat: 10.9685,  lng: -74.7813, country: "CO", city: "Barranquilla",  provider: "synthetic", difficulty: "NORMAL" },
  { id: "co_santamarta", lat: 11.2408,  lng: -74.1990, country: "CO", city: "Santa Marta",   provider: "synthetic", difficulty: "NORMAL" },
  { id: "co_pereira",    lat: 4.8133,   lng: -75.6961, country: "CO", city: "Pereira",       provider: "synthetic", difficulty: "NORMAL" },
  { id: "co_bucaraman",  lat: 7.1193,   lng: -73.1227, country: "CO", city: "Bucaramanga",   provider: "synthetic", difficulty: "NORMAL" },
  { id: "co_manizales",  lat: 5.0703,   lng: -75.5138, country: "CO", city: "Manizales",     provider: "synthetic", difficulty: "NORMAL" },
  { id: "co_ibague",     lat: 4.4389,   lng: -75.2322, country: "CO", city: "Ibagué",        provider: "synthetic", difficulty: "NORMAL" },
  { id: "co_villav",     lat: 4.1420,   lng: -73.6266, country: "CO", city: "Villavicencio", provider: "synthetic", difficulty: "NORMAL" },
  { id: "co_neiva",      lat: 2.9273,   lng: -75.2819, country: "CO", city: "Neiva",         provider: "synthetic", difficulty: "NORMAL" },
  { id: "co_cucuta",     lat: 7.8939,   lng: -72.5078, country: "CO", city: "Cúcuta",        provider: "synthetic", difficulty: "NORMAL" },
  { id: "co_armenia",    lat: 4.5339,   lng: -75.6811, country: "CO", city: "Armenia",       provider: "synthetic", difficulty: "HARD"   },
  { id: "co_popayan",    lat: 2.4448,   lng: -76.6147, country: "CO", city: "Popayán",       provider: "synthetic", difficulty: "HARD"   },
  { id: "co_pasto",      lat: 1.2136,   lng: -77.2811, country: "CO", city: "Pasto",         provider: "synthetic", difficulty: "HARD"   },
  { id: "co_tunja",      lat: 5.5353,   lng: -73.3678, country: "CO", city: "Tunja",         provider: "synthetic", difficulty: "HARD"   },
  { id: "co_monteria",   lat: 8.7500,   lng: -75.8814, country: "CO", city: "Montería",      provider: "synthetic", difficulty: "HARD"   },
  { id: "co_sincelejo",  lat: 9.3046,   lng: -75.3978, country: "CO", city: "Sincelejo",     provider: "synthetic", difficulty: "HARD"   },
  { id: "co_valledupar", lat: 10.4631,  lng: -73.2532, country: "CO", city: "Valledupar",    provider: "synthetic", difficulty: "HARD"   },
  { id: "co_riohacha",   lat: 11.5449,  lng: -72.9073, country: "CO", city: "Riohacha",      provider: "synthetic", difficulty: "HARD"   },
  { id: "co_florencia",  lat: 1.6144,   lng: -75.6062, country: "CO", city: "Florencia",     provider: "synthetic", difficulty: "HARD"   },
  { id: "co_tumaco",     lat: 1.7971,   lng: -78.7870, country: "CO", city: "Tumaco",        provider: "synthetic", difficulty: "HARD"   },
  { id: "co_quibdo",     lat: 5.6919,   lng: -76.6583, country: "CO", city: "Quibdó",        provider: "synthetic", difficulty: "HARD"   },
  { id: "co_buenav",     lat: 3.8801,   lng: -77.0313, country: "CO", city: "Buenaventura",  provider: "synthetic", difficulty: "HARD"   },
  { id: "co_letic",      lat: -4.2150,  lng: -69.9406, country: "CO", city: "Leticia",       provider: "synthetic", difficulty: "HARD"   },
  { id: "co_yopal",      lat: 5.3378,   lng: -72.3959, country: "CO", city: "Yopal",         provider: "synthetic", difficulty: "HARD"   },

  /* ─── Argentina (AR) ─── */
  { id: "ar_buenos",     lat: -34.6037, lng: -58.3816, country: "AR", city: "Buenos Aires",  provider: "synthetic", difficulty: "EASY"   },
  { id: "ar_cordoba",    lat: -31.4201, lng: -64.1888, country: "AR", city: "Córdoba",       provider: "synthetic", difficulty: "NORMAL" },
  { id: "ar_rosario",    lat: -32.9442, lng: -60.6505, country: "AR", city: "Rosario",       provider: "synthetic", difficulty: "NORMAL" },
  { id: "ar_mendoza",    lat: -32.8895, lng: -68.8458, country: "AR", city: "Mendoza",       provider: "synthetic", difficulty: "NORMAL" },
  { id: "ar_bariloche",  lat: -41.1335, lng: -71.3103, country: "AR", city: "Bariloche",     provider: "synthetic", difficulty: "NORMAL" },
  { id: "ar_ushuaia",    lat: -54.8019, lng: -68.3030, country: "AR", city: "Ushuaia",       provider: "synthetic", difficulty: "HARD"   },
  { id: "ar_salta",      lat: -24.7821, lng: -65.4232, country: "AR", city: "Salta",         provider: "synthetic", difficulty: "HARD"   },
  { id: "ar_mardel",     lat: -38.0055, lng: -57.5426, country: "AR", city: "Mar del Plata", provider: "synthetic", difficulty: "NORMAL" },

  /* ─── Mexico (MX) ─── */
  { id: "mx_cdmx",       lat: 19.4326,  lng: -99.1332, country: "MX", city: "Mexico City",   provider: "synthetic", difficulty: "NORMAL" },
  { id: "mx_guadalaj",   lat: 20.6597,  lng: -103.3496,country: "MX", city: "Guadalajara",   provider: "synthetic", difficulty: "NORMAL" },
  { id: "mx_cancun",     lat: 21.1619,  lng: -86.8515, country: "MX", city: "Cancún",        provider: "synthetic", difficulty: "NORMAL" },
  { id: "mx_oaxaca",     lat: 17.0732,  lng: -96.7266, country: "MX", city: "Oaxaca",        provider: "synthetic", difficulty: "NORMAL" },
  { id: "mx_merida",     lat: 20.9674,  lng: -89.5926, country: "MX", city: "Mérida",        provider: "synthetic", difficulty: "HARD"   },

  /* ─── Chile (CL) ─── */
  { id: "cl_santiago",   lat: -33.4489, lng: -70.6693, country: "CL", city: "Santiago",      provider: "synthetic", difficulty: "NORMAL" },
  { id: "cl_valpo",      lat: -33.0472, lng: -71.6127, country: "CL", city: "Valparaíso",    provider: "synthetic", difficulty: "NORMAL" },
  { id: "cl_patagonia",  lat: -50.9423, lng: -73.4068, country: "CL", city: "Patagonia",     provider: "synthetic", difficulty: "HARD"   },
  { id: "cl_antof",      lat: -23.6509, lng: -70.3975, country: "CL", city: "Antofagasta",   provider: "synthetic", difficulty: "HARD"   },

  /* ─── Peru (PE) ─── */
  { id: "pe_lima",       lat: -12.0464, lng: -77.0428, country: "PE", city: "Lima",          provider: "synthetic", difficulty: "NORMAL" },
  { id: "pe_cusco",      lat: -13.5319, lng: -71.9675, country: "PE", city: "Cusco",         provider: "synthetic", difficulty: "NORMAL" },
  { id: "pe_arequipa",   lat: -16.4090, lng: -71.5375, country: "PE", city: "Arequipa",      provider: "synthetic", difficulty: "HARD"   },

  /* ─── Brazil (BR) ─── */
  { id: "br_rio",        lat: -22.9519, lng: -43.2105, country: "BR", city: "Rio",           provider: "synthetic", difficulty: "EASY"   },
  { id: "br_saopaulo",   lat: -23.5505, lng: -46.6333, country: "BR", city: "São Paulo",     provider: "synthetic", difficulty: "NORMAL" },
  { id: "br_brasilia",   lat: -15.8267, lng: -47.9218, country: "BR", city: "Brasília",      provider: "synthetic", difficulty: "NORMAL" },
  { id: "br_salvador",   lat: -12.9714, lng: -38.5014, country: "BR", city: "Salvador",      provider: "synthetic", difficulty: "NORMAL" },
  { id: "br_manaus",     lat: -3.1190,  lng: -60.0217, country: "BR", city: "Manaus",        provider: "synthetic", difficulty: "HARD"   },

  /* ─── Europe ─── */
  { id: "eu_paris",      lat: 48.8584,  lng: 2.2945,   country: "FR", city: "Paris",         provider: "synthetic", difficulty: "EASY"   },
  { id: "eu_london",     lat: 51.5007,  lng: -0.1246,  country: "GB", city: "London",        provider: "synthetic", difficulty: "EASY"   },
  { id: "eu_berlin",     lat: 52.5163,  lng: 13.3777,  country: "DE", city: "Berlin",        provider: "synthetic", difficulty: "NORMAL" },
  { id: "eu_madrid",     lat: 40.4168,  lng: -3.7038,  country: "ES", city: "Madrid",        provider: "synthetic", difficulty: "NORMAL" },
  { id: "eu_barcelona",  lat: 41.3851,  lng: 2.1734,   country: "ES", city: "Barcelona",     provider: "synthetic", difficulty: "NORMAL" },
  { id: "eu_rome",       lat: 41.9028,  lng: 12.4964,  country: "IT", city: "Rome",          provider: "synthetic", difficulty: "NORMAL" },
  { id: "eu_amsterdam",  lat: 52.3676,  lng: 4.9041,   country: "NL", city: "Amsterdam",     provider: "synthetic", difficulty: "NORMAL" },
  { id: "eu_lisbon",     lat: 38.7223,  lng: -9.1393,  country: "PT", city: "Lisbon",        provider: "synthetic", difficulty: "NORMAL" },
  { id: "eu_athens",     lat: 37.9715,  lng: 23.7257,  country: "GR", city: "Athens",        provider: "synthetic", difficulty: "NORMAL" },
  { id: "eu_stockholm",  lat: 59.3293,  lng: 18.0686,  country: "SE", city: "Stockholm",     provider: "synthetic", difficulty: "NORMAL" },
  { id: "eu_reykjavik",  lat: 64.1466,  lng: -21.9426, country: "IS", city: "Reykjavík",     provider: "synthetic", difficulty: "HARD"   },
  { id: "eu_istanbul",   lat: 41.0086,  lng: 28.9802,  country: "TR", city: "Istanbul",      provider: "synthetic", difficulty: "NORMAL" },

  /* ─── Asia ─── */
  { id: "as_tokyo",      lat: 35.6595,  lng: 139.7004, country: "JP", city: "Tokyo",         provider: "synthetic", difficulty: "EASY"   },
  { id: "as_seoul",      lat: 37.5665,  lng: 126.9780, country: "KR", city: "Seoul",         provider: "synthetic", difficulty: "NORMAL" },
  { id: "as_bangkok",    lat: 13.7563,  lng: 100.5018, country: "TH", city: "Bangkok",       provider: "synthetic", difficulty: "NORMAL" },
  { id: "as_mumbai",     lat: 19.0760,  lng: 72.8777,  country: "IN", city: "Mumbai",        provider: "synthetic", difficulty: "NORMAL" },
  { id: "as_delhi",      lat: 28.6139,  lng: 77.2090,  country: "IN", city: "Delhi",         provider: "synthetic", difficulty: "NORMAL" },
  { id: "as_singapore",  lat: 1.3521,   lng: 103.8198, country: "SG", city: "Singapore",     provider: "synthetic", difficulty: "NORMAL" },
  { id: "as_dubai",      lat: 25.1972,  lng: 55.2744,  country: "AE", city: "Dubai",         provider: "synthetic", difficulty: "NORMAL" },
  { id: "as_ulaan",      lat: 47.8864,  lng: 106.9057, country: "MN", city: "Ulaanbaatar",   provider: "synthetic", difficulty: "HARD"   },

  /* ─── Other ─── */
  { id: "na_nyc",        lat: 40.7580,  lng: -73.9855, country: "US", city: "New York",      provider: "synthetic", difficulty: "EASY"   },
  { id: "na_sf",         lat: 37.7749,  lng: -122.4194,country: "US", city: "San Francisco", provider: "synthetic", difficulty: "EASY"   },
  { id: "na_chicago",    lat: 41.8781,  lng: -87.6298, country: "US", city: "Chicago",       provider: "synthetic", difficulty: "NORMAL" },
  { id: "na_vancouver",  lat: 49.2827,  lng: -123.1207,country: "CA", city: "Vancouver",     provider: "synthetic", difficulty: "NORMAL" },
  { id: "na_toronto",    lat: 43.6532,  lng: -79.3832, country: "CA", city: "Toronto",       provider: "synthetic", difficulty: "NORMAL" },
  { id: "oc_sydney",     lat: -33.8568, lng: 151.2153, country: "AU", city: "Sydney",        provider: "synthetic", difficulty: "EASY"   },
  { id: "oc_melbourne",  lat: -37.8136, lng: 144.9631, country: "AU", city: "Melbourne",     provider: "synthetic", difficulty: "NORMAL" },
  { id: "oc_wellin",     lat: -41.2865, lng: 174.7762, country: "NZ", city: "Wellington",    provider: "synthetic", difficulty: "HARD"   },
  { id: "af_capet",      lat: -33.9249, lng: 18.4241,  country: "ZA", city: "Cape Town",     provider: "synthetic", difficulty: "NORMAL" },
  { id: "af_nairobi",    lat: -1.2921,  lng: 36.8219,  country: "KE", city: "Nairobi",       provider: "synthetic", difficulty: "NORMAL" },
  { id: "af_cairo",      lat: 29.9792,  lng: 31.1342,  country: "EG", city: "Giza",          provider: "synthetic", difficulty: "NORMAL" },
];
