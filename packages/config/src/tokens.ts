/**
 * GeoPin design tokens. Importable by runtime code (theming, SVG generators)
 * and mirrored inside tailwind-preset.cjs so Tailwind utilities match 1:1.
 */

export const colors = {
  /* Core brand */
  void: "#080B1A",
  abyss: "#0E1329",
  deep: "#141B33",
  panel: "#1A2240",
  surface: "#232C4F",
  border: "#2E3960",

  /* Neon accents (brand signatures) */
  cyan: "#22E9FF",
  cyanSoft: "#5AF0FF",
  violet: "#8B5CF6",
  magenta: "#FF3CAC",
  lime: "#A3F700",

  /* Feedback */
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  gold: "#FFC93C",

  /* Text */
  textPrimary: "#F2F5FF",
  textMuted: "#9AA3C7",
  textDim: "#5F6892",
} as const;

export const gradients = {
  brand: "linear-gradient(135deg, #22E9FF 0%, #8B5CF6 60%, #FF3CAC 100%)",
  night: "radial-gradient(circle at 20% 10%, #1A2240 0%, #080B1A 60%)",
  aurora:
    "conic-gradient(from 140deg at 50% 50%, #22E9FF, #8B5CF6, #FF3CAC, #22E9FF)",
  gold: "linear-gradient(135deg, #FFD96B 0%, #FFC93C 50%, #E67A00 100%)",
} as const;

export const radii = {
  sm: "6px",
  md: "10px",
  lg: "16px",
  xl: "22px",
  pill: "9999px",
} as const;

export const shadows = {
  glow: "0 0 32px rgba(34, 233, 255, 0.35)",
  glowMagenta: "0 0 32px rgba(255, 60, 172, 0.35)",
  card: "0 10px 30px rgba(0,0,0,0.35)",
  lift: "0 20px 60px rgba(0,0,0,0.45)",
} as const;

export const fonts = {
  display: `"Space Grotesk", "Inter", system-ui, sans-serif`,
  body: `"Inter", system-ui, -apple-system, sans-serif`,
  mono: `"JetBrains Mono", ui-monospace, monospace`,
} as const;

export const tokens = { colors, gradients, radii, shadows, fonts };
export type Tokens = typeof tokens;
