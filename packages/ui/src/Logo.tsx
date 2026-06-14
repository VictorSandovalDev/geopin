"use client";

import * as React from "react";
import { cn } from "./utils";

export interface LogoProps {
  size?: number;
  showWord?: boolean;
  className?: string;
}

/**
 * GeoPin brand mark — generated inline as SVG so there's no dependency on
 * external design files. A stylized pin arc around a globe meridian.
 */
export const Logo: React.FC<LogoProps> = ({
  size = 40,
  showWord = false,
  className,
}) => (
  <div className={cn("inline-flex items-center gap-2", className)}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="GeoPin logo"
    >
      <defs>
        <linearGradient id="gp-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22E9FF" />
          <stop offset="60%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#FF3CAC" />
        </linearGradient>
        <filter id="gp-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {/* glow */}
      <circle cx="32" cy="28" r="14" fill="url(#gp-g)" opacity="0.3" filter="url(#gp-blur)" />
      {/* pin body */}
      <path
        d="M32 6 C21 6 13 14.5 13 25.5 C13 39 32 58 32 58 C32 58 51 39 51 25.5 C51 14.5 43 6 32 6 Z"
        fill="url(#gp-g)"
      />
      {/* meridian line */}
      <path
        d="M15 25.5 Q32 35 49 25.5"
        stroke="#080B1A"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* equator */}
      <ellipse
        cx="32"
        cy="25.5"
        rx="18"
        ry="6"
        fill="none"
        stroke="#080B1A"
        strokeWidth="2.2"
      />
      {/* pin dot */}
      <circle cx="32" cy="25.5" r="4.5" fill="#080B1A" />
      <circle cx="32" cy="25.5" r="2" fill="#22E9FF" />
    </svg>
    {showWord && (
      <span className="font-display text-xl font-bold tracking-tight bg-grad-brand bg-clip-text text-transparent">
        GeoPin
      </span>
    )}
  </div>
);
