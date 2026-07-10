"use client";

import * as React from "react";
import { cn } from "./utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  seed: string;
  size?: number;
  ring?: boolean;
}

/* ------------------------------------------------------------------ */
/* Customizable avatar config                                          */
/*                                                                     */
/* A seed of the form "av1:<skin>.<eyes>.<mouth>.<hair>.<bg>" renders  */
/* the customizable 3D-shaded character below. Any other seed keeps    */
/* the legacy procedural look, so old accounts don't change.           */
/* ------------------------------------------------------------------ */

export interface AvatarConfig {
  skin: number;
  eyes: number;
  mouth: number;
  hair: number;
  bg: number;
}

export const AVATAR_SKINS: Array<[string, string]> = [
  ["#FFD8B8", "#E8A87C"], // light
  ["#EAB98F", "#C68B59"], // tan
  ["#B07B4F", "#8A5A32"], // brown
  ["#7C4A26", "#5A3118"], // dark
  ["#9BE8FF", "#22B8DD"], // cyan bot
  ["#C6A9FF", "#8B5CF6"], // violet bot
  ["#B9F76E", "#7CC93C"], // alien
  ["#FF9ED2", "#FF3CAC"], // pink bot
];

export const AVATAR_BGS: Array<[string, string]> = [
  ["#22E9FF", "#8B5CF6"],
  ["#FFC93C", "#FF3CAC"],
  ["#8B5CF6", "#141B33"],
  ["#A3F700", "#22B8DD"],
  ["#FF3CAC", "#FFC93C"],
  ["#141B33", "#22E9FF"],
];

export const AVATAR_COUNTS = {
  skin: AVATAR_SKINS.length,
  eyes: 5,
  mouth: 5,
  hair: 6,
  bg: AVATAR_BGS.length,
} as const;

export function parseAvatarSeed(seed: string): AvatarConfig | null {
  if (!seed.startsWith("av1:")) return null;
  const parts = seed.slice(4).split(".").map((n) => Number.parseInt(n, 10));
  if (parts.length < 5 || parts.some((n) => Number.isNaN(n) || n < 0)) {
    return null;
  }
  return {
    skin: parts[0]! % AVATAR_COUNTS.skin,
    eyes: parts[1]! % AVATAR_COUNTS.eyes,
    mouth: parts[2]! % AVATAR_COUNTS.mouth,
    hair: parts[3]! % AVATAR_COUNTS.hair,
    bg: parts[4]! % AVATAR_COUNTS.bg,
  };
}

export function buildAvatarSeed(c: AvatarConfig): string {
  return `av1:${c.skin}.${c.eyes}.${c.mouth}.${c.hair}.${c.bg}`;
}

/** Deterministic config from any legacy seed — used as editor start point. */
export function configFromLegacySeed(seed: string): AvatarConfig {
  const h = hashString(seed);
  return {
    skin: h % AVATAR_COUNTS.skin,
    eyes: (h >> 3) % AVATAR_COUNTS.eyes,
    mouth: (h >> 6) % AVATAR_COUNTS.mouth,
    hair: (h >> 9) % AVATAR_COUNTS.hair,
    bg: (h >> 12) % AVATAR_COUNTS.bg,
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
  const config = React.useMemo(() => parseAvatarSeed(seed), [seed]);
  const hash = React.useMemo(() => hashString(seed), [seed]);

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
      {config ? (
        <CharacterSvg config={config} size={size} uid={seed} />
      ) : (
        <LegacySvg hash={hash} size={size} seed={seed} />
      )}
    </div>
  );
};

/* --------------------- 3D-shaded character ------------------------ */

const CharacterSvg: React.FC<{
  config: AvatarConfig;
  size: number;
  uid: string;
}> = ({ config, size, uid }) => {
  // Gradient ids must be unique per instance or browsers reuse the first
  // one mounted on the page.
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const [skinLight, skinDark] = AVATAR_SKINS[config.skin]!;
  const [bgA, bgB] = AVATAR_BGS[config.bg]!;
  const hairColor = "#1D2333";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`avatar-${uid}`}
    >
      <defs>
        <linearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={bgA} />
          <stop offset="100%" stopColor={bgB} />
        </linearGradient>
        {/* Off-center radial gradient = fake studio light = 3D ball look */}
        <radialGradient id={`sk${id}`} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0%" stopColor={skinLight} />
          <stop offset="100%" stopColor={skinDark} />
        </radialGradient>
        <radialGradient id={`sh${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#000" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="64" height="64" fill={`url(#bg${id})`} />
      {/* ground shadow */}
      <ellipse cx="32" cy="57" rx="16" ry="4" fill={`url(#sh${id})`} />
      {/* head */}
      <circle cx="32" cy="34" r="20" fill={`url(#sk${id})`} />
      {/* specular highlight */}
      <ellipse cx="25" cy="25" rx="6" ry="4" fill="#FFFFFF" opacity="0.35" />

      <Hair variant={config.hair} color={hairColor} id={id} />
      <Eyes variant={config.eyes} />
      <Mouth variant={config.mouth} />
    </svg>
  );
};

const Eyes: React.FC<{ variant: number }> = ({ variant }) => {
  const eye = "#141B33";
  switch (variant) {
    case 1: // happy arcs
      return (
        <g stroke={eye} strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path d="M22 33 q3.5 -4 7 0" />
          <path d="M35 33 q3.5 -4 7 0" />
        </g>
      );
    case 2: // sleepy
      return (
        <g stroke={eye} strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path d="M22 32 q3.5 3 7 0" />
          <path d="M35 32 q3.5 3 7 0" />
        </g>
      );
    case 3: // wink
      return (
        <g>
          <circle cx="25.5" cy="32" r="2.6" fill={eye} />
          <path
            d="M35 32 q3.5 -3 7 0"
            stroke={eye}
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      );
    case 4: // shades
      return (
        <g>
          <rect x="19" y="28" width="12" height="8" rx="3" fill="#10131F" />
          <rect x="33" y="28" width="12" height="8" rx="3" fill="#10131F" />
          <line x1="31" y1="31" x2="33" y2="31" stroke="#10131F" strokeWidth="2" />
          <ellipse cx="23" cy="30.5" rx="2.4" ry="1.2" fill="#FFF" opacity="0.35" />
          <ellipse cx="37" cy="30.5" rx="2.4" ry="1.2" fill="#FFF" opacity="0.35" />
        </g>
      );
    default: // round
      return (
        <g fill={eye}>
          <circle cx="25.5" cy="32" r="2.6" />
          <circle cx="38.5" cy="32" r="2.6" />
          <circle cx="26.4" cy="31.1" r="0.9" fill="#FFF" />
          <circle cx="39.4" cy="31.1" r="0.9" fill="#FFF" />
        </g>
      );
  }
};

const Mouth: React.FC<{ variant: number }> = ({ variant }) => {
  const c = "#141B33";
  switch (variant) {
    case 1: // open smile
      return (
        <g>
          <path d="M25 40 q7 8 14 0 z" fill="#5A2430" />
          <path d="M27 40.5 q5 3.5 10 0 z" fill="#FF7B9C" />
        </g>
      );
    case 2: // neutral
      return (
        <line x1="27" y1="42" x2="37" y2="42" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
      );
    case 3: // surprised
      return <ellipse cx="32" cy="42.5" rx="3.4" ry="4" fill="#5A2430" />;
    case 4: // smirk
      return (
        <path
          d="M27 42 q6 4 11 -1"
          stroke={c}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      );
    default: // smile
      return (
        <path
          d="M25 40 q7 6 14 0"
          stroke={c}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      );
  }
};

const Hair: React.FC<{ variant: number; color: string; id: string }> = ({
  variant,
  color,
  id,
}) => {
  switch (variant) {
    case 1: // flat top
      return (
        <path
          d="M14 30 a20 20 0 0 1 36 0 q-1 -9 -18 -9 t-18 9z"
          fill={color}
        />
      );
    case 2: // spiky
      return (
        <path
          d="M14 30 q0 -8 5 -11 l1 5 4 -7 3 5 5 -7 5 7 3 -5 4 7 1 -5 q5 3 5 11 a20 20 0 0 0 -36 0z"
          fill={color}
        />
      );
    case 3: // curly
      return (
        <g fill={color}>
          <circle cx="18" cy="26" r="5.5" />
          <circle cx="25" cy="21" r="6" />
          <circle cx="33" cy="19.5" r="6" />
          <circle cx="41" cy="22" r="6" />
          <circle cx="46" cy="27" r="5" />
        </g>
      );
    case 4: // cap
      return (
        <g>
          <path d="M13.5 30 a20 20 0 0 1 37 0z" fill="#22B8DD" />
          <path d="M12 30 h30 a3 3 0 0 1 0 6 l-8 -3 h-22 q-2 -1.5 0 -3z" fill="#1490B4" />
          <circle cx="32" cy="17" r="2.6" fill="#FFC93C" />
        </g>
      );
    case 5: // headphones
      return (
        <g>
          <path
            d="M15 32 a17 17 0 0 1 34 0"
            stroke="#10131F"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="11" y="29" width="7" height="12" rx="3.5" fill="#22E9FF" />
          <rect x="46" y="29" width="7" height="12" rx="3.5" fill="#22E9FF" />
        </g>
      );
    default: // none (bald shine)
      return <ellipse cx="36" cy="19.5" rx="5" ry="2.4" fill="#FFF" opacity="0.25" />;
  }
};

/* --------------------------- legacy look --------------------------- */

const LegacySvg: React.FC<{ hash: number; size: number; seed: string }> = ({
  hash,
  size,
  seed,
}) => {
  const palette = paletteFromHash(hash);
  const shapeSeed = hash % 4;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`avatar-${seed}`}
    >
      <defs>
        <linearGradient id={`bg-${hash}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette[0]} />
          <stop offset="100%" stopColor={palette[1]} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" fill={`url(#bg-${hash})`} />
      {renderShape(shapeSeed, palette[2]!)}
    </svg>
  );
};

function renderShape(seed: number, color: string) {
  switch (seed) {
    case 0:
      return <circle cx="32" cy="32" r="14" fill={color} />;
    case 1:
      return (
        <polygon points="32,14 52,48 12,48" fill={color} />
      );
    case 2:
      return <rect x="18" y="18" width="28" height="28" rx="6" fill={color} />;
    default:
      return (
        <path
          d="M16 40 C16 24, 48 24, 48 40 S16 56, 16 40Z"
          fill={color}
        />
      );
  }
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function paletteFromHash(hash: number): [string, string, string] {
  const palettes: Array<[string, string, string]> = [
    ["#22E9FF", "#8B5CF6", "#FF3CAC"],
    ["#FFC93C", "#FF3CAC", "#22E9FF"],
    ["#A3F700", "#22E9FF", "#141B33"],
    ["#8B5CF6", "#22E9FF", "#FFC93C"],
    ["#FF3CAC", "#FFC93C", "#8B5CF6"],
    ["#22E9FF", "#A3F700", "#FF3CAC"],
  ];
  return palettes[hash % palettes.length]!;
}
