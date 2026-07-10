"use client";

import * as React from "react";
import { cn } from "./utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  seed: string;
  size?: number;
  ring?: boolean;
}

/* ------------------------------------------------------------------ */
/* Mii-style customizable avatar                                       */
/*                                                                     */
/* Seed format "av2:<skin>.<head>.<hair>.<hairColor>.<eyes>.<brows>    */
/* .<nose>.<mouth>.<extra>.<shirt>.<bg>". Older "av1:" seeds and any   */
/* legacy string map deterministically onto the same renderer, so      */
/* every account gets a face without migration.                        */
/* ------------------------------------------------------------------ */

export interface AvatarConfig {
  skin: number;
  head: number;
  hair: number;
  hairColor: number;
  eyes: number;
  brows: number;
  nose: number;
  mouth: number;
  extra: number;
  shirt: number;
  bg: number;
}

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

export const AVATAR_COUNTS = {
  skin: AVATAR_SKINS.length,
  head: 3,
  hair: 8,
  hairColor: AVATAR_HAIR_COLORS.length,
  eyes: 5,
  brows: 4,
  nose: 3,
  mouth: 5,
  extra: 7,
  shirt: AVATAR_SHIRTS.length,
  bg: AVATAR_BGS.length,
} as const;

export const AVATAR_CATEGORIES = Object.keys(
  AVATAR_COUNTS,
) as Array<keyof AvatarConfig>;

const ORDER: Array<keyof AvatarConfig> = [
  "skin",
  "head",
  "hair",
  "hairColor",
  "eyes",
  "brows",
  "nose",
  "mouth",
  "extra",
  "shirt",
  "bg",
];

export function buildAvatarSeed(c: AvatarConfig): string {
  return `av2:${ORDER.map((k) => c[k]).join(".")}`;
}

export function parseAvatarSeed(seed: string): AvatarConfig | null {
  if (seed.startsWith("av2:")) {
    const parts = seed.slice(4).split(".").map((n) => Number.parseInt(n, 10));
    if (parts.length < ORDER.length || parts.some((n) => Number.isNaN(n) || n < 0)) {
      return null;
    }
    const cfg = {} as AvatarConfig;
    ORDER.forEach((k, i) => {
      cfg[k] = parts[i]! % AVATAR_COUNTS[k];
    });
    return cfg;
  }
  if (seed.startsWith("av1:")) {
    // Old 5-field format: skin.eyes.mouth.hair.bg → map onto the new look.
    const parts = seed.slice(4).split(".").map((n) => Number.parseInt(n, 10));
    if (parts.length < 5 || parts.some((n) => Number.isNaN(n) || n < 0)) {
      return null;
    }
    return {
      skin: parts[0]! % AVATAR_COUNTS.skin,
      head: 0,
      hair: parts[3]! % AVATAR_COUNTS.hair,
      hairColor: parts[0]! % AVATAR_COUNTS.hairColor,
      eyes: parts[1]! % AVATAR_COUNTS.eyes,
      brows: 0,
      nose: 0,
      mouth: parts[2]! % AVATAR_COUNTS.mouth,
      extra: 0,
      shirt: parts[4]! % AVATAR_COUNTS.shirt,
      bg: parts[4]! % AVATAR_COUNTS.bg,
    };
  }
  return null;
}

/** Deterministic config from any legacy seed — every user gets a Mii. */
export function configFromLegacySeed(seed: string): AvatarConfig {
  const h = hashString(seed);
  const pick = (shift: number, k: keyof typeof AVATAR_COUNTS) =>
    (h >> shift) % AVATAR_COUNTS[k];
  return {
    skin: pick(0, "skin"),
    head: pick(2, "head"),
    hair: pick(4, "hair"),
    hairColor: pick(7, "hairColor"),
    eyes: pick(10, "eyes"),
    brows: pick(13, "brows"),
    nose: pick(15, "nose"),
    mouth: pick(17, "mouth"),
    extra: h % 3 === 0 ? pick(20, "extra") : 0,
    shirt: pick(23, "shirt"),
    bg: pick(26, "bg"),
  };
}

/* ------------------------------------------------------------------ */

export const Avatar: React.FC<AvatarProps> = ({
  seed,
  size = 40,
  ring,
  className,
  ...props
}) => {
  const config = React.useMemo(
    () => parseAvatarSeed(seed) ?? configFromLegacySeed(seed),
    [seed],
  );

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-full",
        ring && "ring-2 ring-brand-cyan/60 ring-offset-2 ring-offset-void",
        className,
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      <MiiSvg config={config} size={size} uid={seed} />
    </div>
  );
};

/* --------------------------- renderer ----------------------------- */

const MiiSvg: React.FC<{
  config: AvatarConfig;
  size: number;
  uid: string;
}> = ({ config, size }) => {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const [skin, skinShade] = AVATAR_SKINS[config.skin]!;
  const hairC = AVATAR_HAIR_COLORS[config.hairColor]!;
  const [shirt, shirtShade] = AVATAR_SHIRTS[config.shirt]!;
  const [bgA, bgB] = AVATAR_BGS[config.bg]!;

  // Head geometry per face shape: [rx, ry, jawY]
  const head =
    config.head === 1
      ? { rx: 11.6, ry: 14.6 } // oval
      : config.head === 2
        ? { rx: 13.8, ry: 13.2 } // wide
        : { rx: 12.8, ry: 13.8 }; // round

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`bg${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bgA} />
          <stop offset="100%" stopColor={bgB} />
        </linearGradient>
        <radialGradient id={`sk${id}`} cx="0.42" cy="0.32" r="0.9">
          <stop offset="0%" stopColor={skin} />
          <stop offset="88%" stopColor={skin} />
          <stop offset="100%" stopColor={skinShade} />
        </radialGradient>
        <linearGradient id={`sh${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={shirt} />
          <stop offset="100%" stopColor={shirtShade} />
        </linearGradient>
      </defs>

      <rect width="64" height="64" fill={`url(#bg${id})`} />

      {/* bust / shirt */}
      <path
        d="M12 64 Q12 49 23 47.5 L41 47.5 Q52 49 52 64 Z"
        fill={`url(#sh${id})`}
      />
      {/* collar shadow */}
      <path d="M26 47.5 L38 47.5 Q36 52 32 52 Q28 52 26 47.5 Z" fill={shirtShade} opacity="0.55" />

      {/* neck */}
      <rect x="28" y="38" width="8" height="10.5" rx="3" fill={skinShade} />

      {/* ears */}
      <circle cx={32 - head.rx - 0.6} cy="29.5" r="2.7" fill={skin} />
      <circle cx={32 + head.rx + 0.6} cy="29.5" r="2.7" fill={skin} />

      {/* head */}
      <ellipse cx="32" cy="27.5" rx={head.rx} ry={head.ry} fill={`url(#sk${id})`} />

      <Hair variant={config.hair} color={hairC} headRx={head.rx} headRy={head.ry} />
      <Brows variant={config.brows} color={hairC} />
      <Eyes variant={config.eyes} />
      <Nose variant={config.nose} shade={skinShade} />
      <Mouth variant={config.mouth} />
      <Extra variant={config.extra} hairColor={hairC} />
    </svg>
  );
};

/* Facial features — Mii faces read from simple, bold shapes. */

const EYE_Y = 27.5;
const EYE_LX = 27;
const EYE_RX = 37;

const Eyes: React.FC<{ variant: number }> = ({ variant }) => {
  const c = "#20242F";
  switch (variant) {
    case 1: // big round
      return (
        <g>
          <circle cx={EYE_LX} cy={EYE_Y} r="2.5" fill={c} />
          <circle cx={EYE_RX} cy={EYE_Y} r="2.5" fill={c} />
          <circle cx={EYE_LX + 0.8} cy={EYE_Y - 0.8} r="0.8" fill="#FFF" />
          <circle cx={EYE_RX + 0.8} cy={EYE_Y - 0.8} r="0.8" fill="#FFF" />
        </g>
      );
    case 2: // happy closed
      return (
        <g stroke={c} strokeWidth="1.9" strokeLinecap="round" fill="none">
          <path d={`M${EYE_LX - 2.4} ${EYE_Y + 0.7} q2.4 -3 4.8 0`} />
          <path d={`M${EYE_RX - 2.4} ${EYE_Y + 0.7} q2.4 -3 4.8 0`} />
        </g>
      );
    case 3: // sleepy
      return (
        <g>
          <path
            d={`M${EYE_LX - 2.2} ${EYE_Y - 0.4} a2.2 2.2 0 0 0 4.4 0 z`}
            fill="#20242F"
          />
          <path
            d={`M${EYE_RX - 2.2} ${EYE_Y - 0.4} a2.2 2.2 0 0 0 4.4 0 z`}
            fill="#20242F"
          />
        </g>
      );
    case 4: // side glance
      return (
        <g>
          <ellipse cx={EYE_LX} cy={EYE_Y} rx="2" ry="2.7" fill="#FFF" />
          <ellipse cx={EYE_RX} cy={EYE_Y} rx="2" ry="2.7" fill="#FFF" />
          <circle cx={EYE_LX + 1} cy={EYE_Y} r="1.3" fill={c} />
          <circle cx={EYE_RX + 1} cy={EYE_Y} r="1.3" fill={c} />
        </g>
      );
    default: // classic Mii ovals
      return (
        <g fill={c}>
          <ellipse cx={EYE_LX} cy={EYE_Y} rx="1.7" ry="2.7" />
          <ellipse cx={EYE_RX} cy={EYE_Y} rx="1.7" ry="2.7" />
        </g>
      );
  }
};

const Brows: React.FC<{ variant: number; color: string }> = ({
  variant,
  color,
}) => {
  const y = 22.4;
  switch (variant) {
    case 1: // angled (determined)
      return (
        <g stroke={color} strokeWidth="1.7" strokeLinecap="round">
          <line x1={EYE_LX - 2.6} y1={y - 0.7} x2={EYE_LX + 2.2} y2={y + 0.7} />
          <line x1={EYE_RX - 2.2} y1={y + 0.7} x2={EYE_RX + 2.6} y2={y - 0.7} />
        </g>
      );
    case 2: // arched
      return (
        <g stroke={color} strokeWidth="1.7" strokeLinecap="round" fill="none">
          <path d={`M${EYE_LX - 2.5} ${y + 0.6} q2.5 -2.4 5 0`} />
          <path d={`M${EYE_RX - 2.5} ${y + 0.6} q2.5 -2.4 5 0`} />
        </g>
      );
    case 3: // thick
      return (
        <g fill={color}>
          <rect x={EYE_LX - 2.8} y={y - 1.2} width="5.6" height="2.2" rx="1.1" />
          <rect x={EYE_RX - 2.8} y={y - 1.2} width="5.6" height="2.2" rx="1.1" />
        </g>
      );
    default: // straight
      return (
        <g stroke={color} strokeWidth="1.7" strokeLinecap="round">
          <line x1={EYE_LX - 2.5} y1={y} x2={EYE_LX + 2.5} y2={y} />
          <line x1={EYE_RX - 2.5} y1={y} x2={EYE_RX + 2.5} y2={y} />
        </g>
      );
  }
};

const Nose: React.FC<{ variant: number; shade: string }> = ({
  variant,
  shade,
}) => {
  switch (variant) {
    case 1: // rounded triangle
      return (
        <path d="M32 29.5 L34 33.3 Q32 34.4 30 33.3 Z" fill={shade} />
      );
    case 2: // subtle line
      return (
        <path
          d="M31.2 32.8 q0.8 0.9 1.6 0"
          stroke={shade}
          strokeWidth="1.3"
          strokeLinecap="round"
          fill="none"
        />
      );
    default: // button
      return <ellipse cx="32" cy="32.4" rx="1.5" ry="1.2" fill={shade} />;
  }
};

const Mouth: React.FC<{ variant: number }> = ({ variant }) => {
  const c = "#8C3A3A";
  switch (variant) {
    case 1: // open smile
      return (
        <g>
          <path d="M27.5 36 q4.5 5.5 9 0 z" fill="#7A2F35" />
          <path d="M29 36.4 q3 2.4 6 0 z" fill="#F08A9B" />
        </g>
      );
    case 2: // neutral
      return (
        <line x1="29" y1="37" x2="35" y2="37" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      );
    case 3: // "o"
      return <ellipse cx="32" cy="37.2" rx="2" ry="2.4" fill="#7A2F35" />;
    case 4: // smirk
      return (
        <path
          d="M28.5 36.6 q4 3 7 -0.8"
          stroke={c}
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      );
    default: // smile
      return (
        <path
          d="M28 36 q4 4 8 0"
          stroke={c}
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      );
  }
};

const Hair: React.FC<{
  variant: number;
  color: string;
  headRx: number;
  headRy: number;
}> = ({ variant, color, headRx, headRy }) => {
  const top = 27.5 - headRy; // top of the skull
  const l = 32 - headRx;
  const r = 32 + headRx;
  switch (variant) {
    case 1: // short crop
      return (
        <path
          d={`M${l - 0.4} 25 Q${l - 0.4} ${top - 1} 32 ${top - 1} Q${r + 0.4} ${top - 1} ${r + 0.4} 25 Q${r - 1} 18.5 32 18 Q${l + 1} 18.5 ${l - 0.4} 25 Z`}
          fill={color}
        />
      );
    case 2: // side part
      return (
        <path
          d={`M${l - 0.4} 26 Q${l - 0.4} ${top - 1.2} 32 ${top - 1.2} Q${r + 0.4} ${top - 1.2} ${r + 0.4} 26 Q${r + 0.4} 20 40 17.5 Q30 21.5 ${l - 0.4} 19.5 Z`}
          fill={color}
        />
      );
    case 3: // spiky
      return (
        <path
          d={`M${l - 0.5} 24 Q${l - 1} 16 25 ${top - 2} L26.5 17 L29 ${top - 3.4} L31.5 16.6 L34.5 ${top - 3.6} L37 16.8 L39.5 ${top - 2.4} Q${r + 1} 16 ${r + 0.5} 24 Q${r - 2} 18 32 17.6 Q${l + 2} 18 ${l - 0.5} 24 Z`}
          fill={color}
        />
      );
    case 4: // bowl cut
      return (
        <path
          d={`M${l - 1.2} 27 Q${l - 1.2} ${top - 1.5} 32 ${top - 1.5} Q${r + 1.2} ${top - 1.5} ${r + 1.2} 27 L${r - 0.6} 27 Q${r - 0.6} 22.5 32 22.5 Q${l + 0.6} 22.5 ${l + 0.6} 27 Z`}
          fill={color}
        />
      );
    case 5: // curly
      return (
        <g fill={color}>
          <circle cx={l + 1.5} cy="20.5" r="4.2" />
          <circle cx="26" cy="16.2" r="4.6" />
          <circle cx="32" cy="14.8" r="4.8" />
          <circle cx="38" cy="16.2" r="4.6" />
          <circle cx={r - 1.5} cy="20.5" r="4.2" />
        </g>
      );
    case 6: // long
      return (
        <path
          d={`M${l - 2.5} 44 Q${l - 3} 24 ${l + 2} ${top - 0.5} Q32 ${top - 2.5} ${r - 2} ${top - 0.5} Q${r + 3} 24 ${r + 2.5} 44 L${r - 2.5} 44 Q${r - 1} 30 ${r - 2} 23 Q32 19.5 ${l + 2} 23 Q${l + 1} 30 ${l + 2.5} 44 Z`}
          fill={color}
        />
      );
    case 7: // bun
      return (
        <g fill={color}>
          <circle cx="32" cy={top - 2.6} r="4" />
          <path
            d={`M${l - 0.4} 25 Q${l - 0.4} ${top - 1} 32 ${top - 1} Q${r + 0.4} ${top - 1} ${r + 0.4} 25 Q${r - 1} 19 32 18.5 Q${l + 1} 19 ${l - 0.4} 25 Z`}
          />
        </g>
      );
    default: // bald
      return (
        <ellipse cx="36.5" cy={top + 3.5} rx="4" ry="1.8" fill="#FFF" opacity="0.28" />
      );
  }
};

const Extra: React.FC<{ variant: number; hairColor: string }> = ({
  variant,
  hairColor,
}) => {
  switch (variant) {
    case 1: // round glasses
      return (
        <g stroke="#2A2E3A" strokeWidth="1.4" fill="none">
          <circle cx={EYE_LX} cy={EYE_Y} r="4" />
          <circle cx={EYE_RX} cy={EYE_Y} r="4" />
          <line x1={EYE_LX + 4} y1={EYE_Y} x2={EYE_RX - 4} y2={EYE_Y} />
        </g>
      );
    case 2: // square glasses
      return (
        <g stroke="#2A2E3A" strokeWidth="1.4" fill="none">
          <rect x={EYE_LX - 4} y={EYE_Y - 3.2} width="8" height="6.4" rx="1.6" />
          <rect x={EYE_RX - 4} y={EYE_Y - 3.2} width="8" height="6.4" rx="1.6" />
          <line x1={EYE_LX + 4} y1={EYE_Y - 1} x2={EYE_RX - 4} y2={EYE_Y - 1} />
        </g>
      );
    case 3: // sunglasses
      return (
        <g>
          <rect x={EYE_LX - 4} y={EYE_Y - 3} width="8" height="6" rx="2" fill="#181B24" />
          <rect x={EYE_RX - 4} y={EYE_Y - 3} width="8" height="6" rx="2" fill="#181B24" />
          <line
            x1={EYE_LX + 4}
            y1={EYE_Y - 1}
            x2={EYE_RX - 4}
            y2={EYE_Y - 1}
            stroke="#181B24"
            strokeWidth="1.6"
          />
          <ellipse cx={EYE_LX - 1} cy={EYE_Y - 1} rx="1.6" ry="0.9" fill="#FFF" opacity="0.3" />
          <ellipse cx={EYE_RX - 1} cy={EYE_Y - 1} rx="1.6" ry="0.9" fill="#FFF" opacity="0.3" />
        </g>
      );
    case 4: // mustache
      return (
        <path
          d="M27 34.8 Q29.5 33.2 32 34.6 Q34.5 33.2 37 34.8 Q34.5 36.6 32 35.6 Q29.5 36.6 27 34.8 Z"
          fill={hairColor}
        />
      );
    case 5: // beard
      return (
        <path
          d="M21.5 30 Q22 40.5 32 41.5 Q42 40.5 42.5 30 Q42.5 38 38 39.2 L38 37 Q35 38.6 32 38.6 Q29 38.6 26 37 L26 39.2 Q21.5 38 21.5 30 Z"
          fill={hairColor}
        />
      );
    case 6: // blush
      return (
        <g fill="#F08A9B" opacity="0.55">
          <ellipse cx="24" cy="32.5" rx="2.2" ry="1.3" />
          <ellipse cx="40" cy="32.5" rx="2.2" ry="1.3" />
        </g>
      );
    default:
      return null;
  }
};

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
