/**
 * Shared avatar color palettes. Deliberately NOT a "use client" module so
 * both server and client code (Avatar3DConfig, the SVG/3D renderers) can
 * read them — dotting into a client module from a server component throws.
 */

/** [base, shade] — Mii-ish natural tones. */
export const AVATAR_SKINS: Array<[string, string]> = [
  ["#FFDDBF", "#F2B98C"],
  ["#F3C99F", "#DBA672"],
  ["#DDA76F", "#BE8449"],
  ["#B57F49", "#96602F"],
  ["#8D5A2B", "#6E4118"],
  ["#63401C", "#4A2C0F"],
];

export const AVATAR_HAIR_COLORS: string[] = [
  "#2B2117", // black-brown
  "#5C3B1E", // brown
  "#8C5A2B", // chestnut
  "#D8A54C", // blonde
  "#B84A2B", // red
  "#8E8E96", // grey
  "#3E66C4", // blue (fun)
  "#C44AA0", // pink (fun)
];

/** Classic Mii shirt colors. */
export const AVATAR_SHIRTS: Array<[string, string]> = [
  ["#E23B3B", "#B02525"], // red
  ["#F5843B", "#C95F1D"], // orange
  ["#F7D648", "#D3AF1E"], // yellow
  ["#7CC93C", "#569423"], // green
  ["#3FBFAD", "#2A8F81"], // teal
  ["#4A7DE0", "#3158AE"], // blue
  ["#9C5BD6", "#7139A8"], // purple
  ["#F27BB4", "#D14E90"], // pink
  ["#FFFFFF", "#C9CFDC"], // white
  ["#3A3F4C", "#23262F"], // dark
];

export const AVATAR_BGS: Array<[string, string]> = [
  ["#E9EEF6", "#C7D2E4"], // Mii plaza grey
  ["#9BE8FF", "#4AB8DF"], // sky
  ["#FFE29B", "#F5B84C"], // gold
  ["#C9F49B", "#83CF5A"], // mint
  ["#F5B8D9", "#E273B2"], // pink
  ["#C6B5F7", "#8B6BE0"], // violet
  ["#1A2240", "#0B0F22"], // night
];
