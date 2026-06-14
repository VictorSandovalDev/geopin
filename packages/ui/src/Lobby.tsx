"use client";

import * as React from "react";
import { Crown, Check } from "lucide-react";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { cn } from "./utils";

export interface LobbyPlayer {
  userId: string;
  username: string;
  avatarSeed: string;
  ready: boolean;
  isHost: boolean;
  connected: boolean;
}

export interface LobbyProps {
  players: LobbyPlayer[];
  capacity: number;
  meId?: string;
  className?: string;
}

export const Lobby: React.FC<LobbyProps> = ({
  players,
  capacity,
  meId,
  className,
}) => {
  const slots = Array.from({ length: capacity }, (_, i) => players[i] ?? null);

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-5 gap-3", className)}>
      {slots.map((p, i) => {
        if (!p) {
          return (
            <div
              key={`empty-${i}`}
              className="aspect-square rounded-xl border border-dashed border-border/60 flex items-center justify-center text-ink-dim text-xs"
            >
              open
            </div>
          );
        }
        const isMe = p.userId === meId;
        return (
          <div
            key={p.userId}
            className={cn(
              "aspect-square rounded-xl border bg-panel/80 p-3 flex flex-col items-center justify-center gap-2 relative",
              p.ready
                ? "border-brand-cyan/50 shadow-glow"
                : "border-border",
              !p.connected && "opacity-40",
            )}
          >
            {p.isHost && (
              <Crown className="absolute top-2 left-2 w-4 h-4 text-brand-gold" />
            )}
            {p.ready && (
              <Check className="absolute top-2 right-2 w-4 h-4 text-brand-cyan" />
            )}
            <Avatar seed={p.avatarSeed} size={48} ring={isMe} />
            <p className="text-sm font-medium text-ink truncate max-w-full">
              {p.username}
            </p>
            {isMe && <Badge tone="cyan">you</Badge>}
          </div>
        );
      })}
    </div>
  );
};
