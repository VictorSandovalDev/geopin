"use client";

import * as React from "react";
import { Avatar } from "@geopin/ui";
import type { Player } from "@geopin/types";
import { useI18n } from "@/lib/i18n";

/** Convert an ISO-2 country code into its flag emoji. */
export function flagEmoji(cc?: string | null): string {
  if (!cc || cc.length !== 2) return "";
  return cc
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export interface PlayerBarProps {
  player: Player | null | undefined;
  maxScore: number;
  side?: "left" | "right";
  country?: string | null;
  highlight?: boolean;
}

/**
 * GeoGuessr-style player bar with HP-style score gauge. Supports left/right
 * anchoring with mirrored chevrons to visually point toward the action.
 */
export const PlayerBar: React.FC<PlayerBarProps> = ({
  player,
  maxScore,
  side = "left",
  country,
  highlight,
}) => {
  const { t } = useI18n();
  if (!player) {
    return (
      <div className="h-16 w-[140px] md:w-[280px] opacity-40 text-ink-dim text-sm flex items-center justify-center">
        {t("hud.awaiting")}
      </div>
    );
  }

  const pct = Math.min(100, (player.totalScore / Math.max(1, maxScore)) * 100);
  const gradient =
    side === "left"
      ? "from-emerald-400 via-emerald-300 to-lime-200"
      : "from-violet-500 via-fuchsia-400 to-amber-300";

  return (
    <div
      className={
        "relative flex items-center gap-3 pointer-events-auto " +
        (side === "right" ? "flex-row-reverse" : "")
      }
    >
      <div
        className={
          "relative rounded-full ring-2 shrink-0 " +
          (highlight ? "ring-brand-cyan" : "ring-white/40")
        }
      >
        <Avatar seed={player.avatarSeed || player.username} size={56} />
      </div>

      <div className="min-w-[130px] md:min-w-[240px] max-w-[320px]">
        <div
          className={
            "flex items-center gap-2 mb-1 " +
            (side === "right" ? "flex-row-reverse" : "")
          }
        >
          <span className="font-display font-bold uppercase tracking-wider text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)] text-sm md:text-base truncate max-w-[120px] md:max-w-none">
            {player.username}
          </span>
          {country && (
            <span className="text-lg drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]">
              {flagEmoji(country)}
            </span>
          )}
        </div>
        <div className="relative h-6 md:h-7 rounded-full border border-white/30 bg-black/40 backdrop-blur-md overflow-hidden shadow-lg">
          <div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${gradient} transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 50%)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono font-bold text-white tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] text-sm md:text-base">
              {player.totalScore.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --------------- Centered timer HUD ------------------ */

export interface CenterTimerProps {
  remainingMs: number;
  roundIndex: number;
  totalRounds: number;
}

export const CenterTimer: React.FC<CenterTimerProps> = ({
  remainingMs,
  roundIndex,
  totalRounds,
}) => {
  const { t } = useI18n();
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const critical = seconds <= 10;
  return (
    <div className="pointer-events-auto flex flex-col items-center gap-2">
      <div className="px-4 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center gap-2 text-xs uppercase tracking-widest text-white/80">
        <span>{t("hud.round")}</span>
        <span className="text-brand-cyan font-semibold">
          {roundIndex + 1}
        </span>
        <span className="text-white/50">/</span>
        <span>{totalRounds}</span>
      </div>
      <div
        className={
          "px-4 md:px-6 h-10 md:h-14 rounded-full border flex items-center justify-center min-w-[90px] md:min-w-[120px] " +
          "bg-black/60 backdrop-blur-md shadow-lift font-mono text-lg md:text-2xl tabular-nums font-bold " +
          (critical
            ? "border-red-500/60 text-red-300 animate-pulse"
            : "border-white/30 text-white")
        }
      >
        {mm}:{ss}
      </div>
    </div>
  );
};
