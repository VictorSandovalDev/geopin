"use client";

import * as React from "react";
import { Avatar } from "./Avatar";
import { cn } from "./utils";

export interface LeaderboardItem {
  rank: number;
  userId: string;
  username: string;
  avatarSeed?: string;
  score: number;
  country?: string | null;
}

export interface LeaderboardProps {
  items: LeaderboardItem[];
  highlightUserId?: string;
  compact?: boolean;
  className?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  items,
  highlightUserId,
  compact,
  className,
}) => {
  return (
    <div className={cn("flex flex-col divide-y divide-border/60", className)}>
      {items.map((item) => {
        const isMe = item.userId === highlightUserId;
        return (
          <div
            key={item.userId}
            className={cn(
              "flex items-center gap-3 py-2.5 px-3 transition-colors",
              isMe && "bg-brand-cyan/5 ring-1 ring-brand-cyan/30 rounded-lg",
            )}
          >
            <RankBadge rank={item.rank} />
            <Avatar
              seed={item.avatarSeed ?? item.username}
              size={compact ? 28 : 36}
              ring={isMe}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-ink truncate">{item.username}</p>
                {item.country && (
                  <span className="text-[10px] text-ink-dim">{item.country}</span>
                )}
              </div>
            </div>
            <div className="font-mono text-sm text-brand-cyan tabular-nums">
              {item.score.toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
  const medal =
    rank === 1
      ? "bg-grad-gold text-void"
      : rank === 2
        ? "bg-gradient-to-br from-zinc-200 to-zinc-400 text-void"
        : rank === 3
          ? "bg-gradient-to-br from-amber-700 to-orange-900 text-white"
          : "bg-panel text-ink-muted";
  return (
    <div
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center font-display font-semibold text-sm tabular-nums",
        medal,
      )}
    >
      {rank}
    </div>
  );
};
