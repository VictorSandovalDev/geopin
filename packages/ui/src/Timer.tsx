"use client";

import * as React from "react";
import { cn } from "./utils";

export interface TimerProps {
  remainingMs: number;
  totalMs: number;
  className?: string;
}

/** Radial countdown timer rendered as pure SVG. */
export const Timer: React.FC<TimerProps> = ({ remainingMs, totalMs, className }) => {
  const pct = Math.max(0, Math.min(1, remainingMs / totalMs));
  const critical = pct < 0.2;
  const r = 26;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <div className={cn("relative w-16 h-16", className)}>
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={r}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="32"
          cy="32"
          r={r}
          stroke={critical ? "#EF4444" : "#22E9FF"}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray 1s linear" }}
        />
      </svg>
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center font-mono font-bold tabular-nums",
          critical ? "text-red-400" : "text-brand-cyan",
        )}
      >
        {seconds}
      </div>
    </div>
  );
};
