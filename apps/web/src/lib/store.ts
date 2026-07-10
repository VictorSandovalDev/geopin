"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, AuthUser, RoomState } from "@geopin/types";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (payload: AuthResponse) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: ({ accessToken, user }) =>
        set({ token: accessToken, user }),
      updateUser: (patch) =>
        set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
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

/**
 * True once the persisted auth store has been rehydrated from localStorage.
 * Auth-gated pages must wait for this before redirecting — otherwise a hard
 * navigation bounces signed-in users to /auth because the first render still
 * sees token: null.
 */
export function useAuthHydrated(): boolean {
  const [hydrated, setHydrated] = useState(
    () => useAuthStore.persist?.hasHydrated?.() ?? false,
  );
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}

interface UiState {
  /** True while a round is actually on screen — hides the top nav. */
  immersive: boolean;
  setImmersive: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  immersive: false,
  setImmersive: (immersive) => set({ immersive }),
}));

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
