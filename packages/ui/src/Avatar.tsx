"use client";

import * as React from "react";
import { cn } from "./utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  seed: string;
  size?: number;
  ring?: boolean;
}

/**
 * Procedurally generated SVG avatar — no external assets needed.
 * Deterministic from `seed`, so every user gets a stable identity.
 */
export const Avatar: React.FC<AvatarProps> = ({
  seed,
  size = 40,
  ring,
  className,
  ...props
}) => {
  const hash = React.useMemo(() => hashString(seed), [seed]);
  const palette = React.useMemo(() => paletteFromHash(hash), [hash]);
  const shapeSeed = hash % 4;

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
    </div>
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
