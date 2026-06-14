"use client";

import * as React from "react";
import { cn } from "./utils";

type Tone = "neutral" | "cyan" | "violet" | "magenta" | "gold" | "success" | "danger";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

const tones: Record<Tone, string> = {
  neutral: "bg-surface/60 text-ink-muted border-border",
  cyan: "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/40",
  violet: "bg-brand-violet/10 text-brand-violet border-brand-violet/40",
  magenta: "bg-brand-magenta/10 text-brand-magenta border-brand-magenta/40",
  gold: "bg-brand-gold/10 text-brand-gold border-brand-gold/40",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  danger: "bg-red-500/10 text-red-400 border-red-500/30",
};

export const Badge: React.FC<BadgeProps> = ({
  className,
  tone = "neutral",
  dot,
  children,
  ...props
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full border text-[11px] font-medium uppercase tracking-wider",
      tones[tone],
      className,
    )}
    {...props}
  >
    {dot && (
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full animate-pulse-ring",
          "bg-current",
        )}
      />
    )}
    {children}
  </span>
);
