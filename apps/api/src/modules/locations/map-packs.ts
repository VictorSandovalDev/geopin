export interface MapPack {
  id: string;
  name: string;
  emoji: string;
  description: string;
  countries?: string[]; // ISO-2 country codes; empty/undefined → world
}

/** Built-in map packs. Extend by adding entries here. */
export const MAP_PACKS: MapPack[] = [
  {
    id: "world",
    emoji: "🌍",
    name: "World",
    description: "Every location in the dataset.",
  },
  {
    id: "colombia",
    emoji: "🇨🇴",
    name: "Colombia",
    description: "Cities and landmarks across Colombia.",
    countries: ["CO"],
  },
  {
    id: "argentina",
    emoji: "🇦🇷",
    name: "Argentina",
    description: "From Ushuaia to Salta.",
    countries: ["AR"],
  },
  {
    id: "latam",
    emoji: "🌎",
    name: "Latin America",
    description: "South + Central America + Mexico.",
    countries: ["AR", "BO", "BR", "CL", "CO", "CR", "CU", "DO", "EC", "GT", "HN", "MX", "NI", "PA", "PE", "PY", "SV", "UY", "VE"],
  },
  {
    id: "europe",
    emoji: "🇪🇺",
    name: "Europe",
    description: "Cities across the old continent.",
    countries: ["AT", "BE", "CH", "CZ", "DE", "DK", "ES", "FI", "FR", "GB", "GR", "HR", "HU", "IE", "IS", "IT", "NL", "NO", "PL", "PT", "RO", "SE", "TR"],
  },
  {
    id: "asia",
    emoji: "🌏",
    name: "Asia",
    description: "From Tokyo to Mumbai.",
    countries: ["AE", "CN", "ID", "IN", "JP", "KR", "MN", "MY", "PH", "SG", "TH", "VN"],
  },
  {
    id: "capitals",
    emoji: "🏛️",
    name: "Iconic Capitals",
    description: "Only the most famous world capitals.",
    countries: ["AR", "CO", "EG", "FR", "GB", "GR", "IN", "IT", "JP", "KR", "MX", "NL", "PT", "SE", "TH", "TR", "US"],
  },
];

export function findPack(id: string): MapPack | undefined {
  return MAP_PACKS.find((p) => p.id === id);
}
