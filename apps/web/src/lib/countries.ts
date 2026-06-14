export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  region: "Americas" | "Europe" | "Asia" | "Oceania" | "Africa";
}

function flag(cc: string): string {
  return cc
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

/**
 * Common countries with good Street View coverage. Used to populate the
 * country multi-select when users create a custom map pack.
 */
const RAW: Array<Omit<CountryOption, "flag">> = [
  // Americas
  { code: "AR", name: "Argentina", region: "Americas" },
  { code: "BO", name: "Bolivia", region: "Americas" },
  { code: "BR", name: "Brazil", region: "Americas" },
  { code: "CA", name: "Canada", region: "Americas" },
  { code: "CL", name: "Chile", region: "Americas" },
  { code: "CO", name: "Colombia", region: "Americas" },
  { code: "CR", name: "Costa Rica", region: "Americas" },
  { code: "DO", name: "Dominican Rep.", region: "Americas" },
  { code: "EC", name: "Ecuador", region: "Americas" },
  { code: "GT", name: "Guatemala", region: "Americas" },
  { code: "HN", name: "Honduras", region: "Americas" },
  { code: "MX", name: "Mexico", region: "Americas" },
  { code: "NI", name: "Nicaragua", region: "Americas" },
  { code: "PA", name: "Panama", region: "Americas" },
  { code: "PE", name: "Peru", region: "Americas" },
  { code: "PY", name: "Paraguay", region: "Americas" },
  { code: "SV", name: "El Salvador", region: "Americas" },
  { code: "US", name: "United States", region: "Americas" },
  { code: "UY", name: "Uruguay", region: "Americas" },
  { code: "VE", name: "Venezuela", region: "Americas" },
  // Europe
  { code: "AT", name: "Austria", region: "Europe" },
  { code: "BE", name: "Belgium", region: "Europe" },
  { code: "CH", name: "Switzerland", region: "Europe" },
  { code: "CZ", name: "Czechia", region: "Europe" },
  { code: "DE", name: "Germany", region: "Europe" },
  { code: "DK", name: "Denmark", region: "Europe" },
  { code: "ES", name: "Spain", region: "Europe" },
  { code: "FI", name: "Finland", region: "Europe" },
  { code: "FR", name: "France", region: "Europe" },
  { code: "GB", name: "United Kingdom", region: "Europe" },
  { code: "GR", name: "Greece", region: "Europe" },
  { code: "HR", name: "Croatia", region: "Europe" },
  { code: "HU", name: "Hungary", region: "Europe" },
  { code: "IE", name: "Ireland", region: "Europe" },
  { code: "IS", name: "Iceland", region: "Europe" },
  { code: "IT", name: "Italy", region: "Europe" },
  { code: "NL", name: "Netherlands", region: "Europe" },
  { code: "NO", name: "Norway", region: "Europe" },
  { code: "PL", name: "Poland", region: "Europe" },
  { code: "PT", name: "Portugal", region: "Europe" },
  { code: "RO", name: "Romania", region: "Europe" },
  { code: "SE", name: "Sweden", region: "Europe" },
  { code: "TR", name: "Turkey", region: "Europe" },
  // Asia
  { code: "AE", name: "UAE", region: "Asia" },
  { code: "ID", name: "Indonesia", region: "Asia" },
  { code: "IN", name: "India", region: "Asia" },
  { code: "JP", name: "Japan", region: "Asia" },
  { code: "KR", name: "South Korea", region: "Asia" },
  { code: "MN", name: "Mongolia", region: "Asia" },
  { code: "MY", name: "Malaysia", region: "Asia" },
  { code: "PH", name: "Philippines", region: "Asia" },
  { code: "SG", name: "Singapore", region: "Asia" },
  { code: "TH", name: "Thailand", region: "Asia" },
  { code: "VN", name: "Vietnam", region: "Asia" },
  // Oceania
  { code: "AU", name: "Australia", region: "Oceania" },
  { code: "NZ", name: "New Zealand", region: "Oceania" },
  // Africa
  { code: "EG", name: "Egypt", region: "Africa" },
  { code: "KE", name: "Kenya", region: "Africa" },
  { code: "ZA", name: "South Africa", region: "Africa" },
];

export const COUNTRIES: CountryOption[] = RAW.map((c) => ({
  ...c,
  flag: flag(c.code),
})).sort((a, b) => a.name.localeCompare(b.name));
