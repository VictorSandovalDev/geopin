"use client";

import * as React from "react";
import { cn } from "./utils";

/**
 * The glass panel shell used for in-game HUD widgets (timer, round indicator,
 * leaderboard). Kept deliberately generic so game pages can compose custom HUDs.
 */
export interface GamePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "default" | "cyan" | "magenta";
  compact?: boolean;
}

const toneClass = {
  default: "border-border",
  cyan: "border-brand-cyan/40 shadow-glow",
  magenta: "border-brand-magenta/40 shadow-glow-magenta",
};

export const GamePanel: React.FC<GamePanelProps> = ({
  tone = "default",
  compact,
  className,
  ...props
}) => (
  <div
    className={cn(
      "rounded-2xl border bg-panel/80 backdrop-blur-xl",
      toneClass[tone],
      compact ? "p-3" : "p-4",
      className,
    )}
    {...props}
  />
);
