"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, AuthUser, RoomState } from "@geopin/types";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (payload: AuthResponse) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: ({ accessToken, user }) =>
        set({ token: accessToken, user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: "geopin.auth" },
  ),
);

interface GameState {
  room: RoomState | null;
  remainingMs: number;
  roundEndLocation: { lat: number; lng: number } | null;
  guesses: Array<{
    userId: string;
    username: string;
    guess: { lat: number; lng: number };
    distanceKm: number;
    score: number;
  }>;
  setRoom: (room: RoomState | null) => void;
  setRemaining: (ms: number) => void;
  setReveal: (
    loc: { lat: number; lng: number } | null,
    guesses: GameState["guesses"],
  ) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  room: null,
  remainingMs: 0,
  roundEndLocation: null,
  guesses: [],
  setRoom: (room) => set({ room }),
  setRemaining: (remainingMs) => set({ remainingMs }),
  setReveal: (roundEndLocation, guesses) => set({ roundEndLocation, guesses }),
  reset: () =>
    set({ room: null, remainingMs: 0, roundEndLocation: null, guesses: [] }),
}));
