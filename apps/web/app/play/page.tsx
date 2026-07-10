"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Logo,
  Lobby,
  Badge,
  GamePanel,
  Timer,
  Leaderboard,
  useToast,
  Input,
} from "@geopin/ui";
import {
  WS_EVENTS,
  type LatLng,
  type RoomState,
  type Location,
  type RoundEndedPayload,
  type GameEndedPayload,
  type MapPack,
} from "@geopin/types";
import {
  useAuthStore,
  useAuthHydrated,
  useGameStore,
  useUiStore,
} from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { formatDistance } from "@/lib/haversine";
import { api } from "@/lib/api";
import { pickRandomPanoramas } from "@/lib/random-streetview";
import { SOLO_PACKS } from "@/lib/solo";
import { PlayerBar, CenterTimer } from "@/components/HUD";
import { CreatePackModal } from "@/components/CreatePackModal";
import { Swords, Copy, Check, Plus } from "lucide-react";

const GuessMapLeaflet = dynamic(
  () => import("@/components/GuessMap").then((m) => m.GuessMap),
  { ssr: false },
);
const GuessMapGoogle = dynamic(
  () => import("@/components/GuessMapGoogle").then((m) => m.GuessMapGoogle),
  { ssr: false },
);
const StreetView = dynamic(
  () => import("@/components/StreetView").then((m) => m.StreetView),
  { ssr: false },
);

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

export default function PlayPage() {
  return (
    <Suspense fallback={null}>
      <PlayPageInner />
    </Suspense>
  );
}

function PlayPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomQuery = searchParams.get("room");

  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const room = useGameStore((s) => s.room);
  const setRoom = useGameStore((s) => s.setRoom);
  const remainingMs = useGameStore((s) => s.remainingMs);
  const setRemaining = useGameStore((s) => s.setRemaining);
  const roundEndLocation = useGameStore((s) => s.roundEndLocation);
  const guesses = useGameStore((s) => s.guesses);
  const setReveal = useGameStore((s) => s.setReveal);
  const reset = useGameStore((s) => s.reset);

  const [guess, setGuess] = useState<LatLng | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [joinCode, setJoinCode] = useState(roomQuery ?? "");
  const [copied, setCopied] = useState(false);
  const [finalLb, setFinalLb] = useState<GameEndedPayload | null>(null);
  const [packs, setPacks] = useState<MapPack[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string>("world");
  const [showCreatePack, setShowCreatePack] = useState(false);
  const toast = useToast();
  const { t } = useI18n();

  const reloadPacks = useCallback(() => {
    api
      .get<MapPack[]>("/packs", token ?? undefined)
      .then(setPacks)
      // API unreachable → fall back to the built-in packs so the host can
      // still pick a region instead of staring at an empty grid.
      .catch(() => setPacks(SOLO_PACKS));
  }, [token]);

  useEffect(() => {
    reloadPacks();
  }, [reloadPacks]);

  const hydrated = useAuthHydrated();
  useEffect(() => {
    if (hydrated && !token) router.replace("/auth");
  }, [hydrated, token, router]);

  /* ---------- socket wiring ---------- */
  useEffect(() => {
    if (!token) return;
    const s = getSocket(token);
    if (!s.connected) s.connect();

    s.on(WS_EVENTS.ROOM_STATE, (state: RoomState) => {
      setRoom(state);
      // Host restarted the match ("play again") — every client leaves the
      // final screen and lands back in the lobby together.
      if (state.status === "lobby") setFinalLb(null);
    });
    s.on(WS_EVENTS.TIMER_TICK, (p: { remainingMs: number }) => {
      setRemaining(p.remainingMs);
    });
    s.on(WS_EVENTS.ROUND_STARTED, () => {
      setGuess(null);
      setReveal(null, []);
    });
    s.on(WS_EVENTS.ROUND_ENDED, (p: RoundEndedPayload) => {
      setReveal({ lat: p.location.lat, lng: p.location.lng }, p.guesses);
    });
    s.on(WS_EVENTS.GAME_ENDED, (p: GameEndedPayload) => {
      setFinalLb(p);
    });
    s.on(WS_EVENTS.ERROR, (e: any) => {
      if (e?.code === "invalid_token") {
        // Stale/expired session — clear it and bounce to login instead of
        // getting stuck on /play with a dead socket.
        toast.push({
          tone: "danger",
          title: t("play.sessionExpired"),
          description: t("play.signInAgain"),
        });
        disconnectSocket();
        reset();
        useAuthStore.getState().clear();
        router.replace("/auth");
        return;
      }
      toast.push({ tone: "danger", title: t("play.error"), description: e?.code });
    });

    return () => {
      s.off(WS_EVENTS.ROOM_STATE);
      s.off(WS_EVENTS.TIMER_TICK);
      s.off(WS_EVENTS.ROUND_STARTED);
      s.off(WS_EVENTS.ROUND_ENDED);
      s.off(WS_EVENTS.GAME_ENDED);
      s.off(WS_EVENTS.ERROR);
    };
  }, [token, setRoom, setRemaining, setReveal, toast, reset, router, t]);

  useEffect(() => {
    return () => {
      disconnectSocket();
      reset();
    };
  }, [reset]);

  // Full-screen (no nav) only while a match is actually being played.
  const inMatch = !!room && room.status === "playing" && !finalLb;
  const setImmersive = useUiStore((s) => s.setImmersive);
  useEffect(() => {
    setImmersive(inMatch);
    return () => setImmersive(false);
  }, [inMatch, setImmersive]);

  const currentRound = room?.rounds[room.currentRound];
  const isPlaying = room?.status === "playing" && currentRound?.status === "active";
  const isReveal = currentRound?.status === "reveal";
  const alreadyGuessed = useMemo(
    () => !!currentRound?.guesses.find((g) => g.userId === user?.id),
    [currentRound, user?.id],
  );
  const isHost = room?.hostId === user?.id;

  const handleCreate = useCallback(() => {
    if (!token) return;
    setConnecting(true);
    const s = getSocket(token);
    if (!s.connected) s.connect();
    s.emit(WS_EVENTS.JOIN_ROOM, { code: null }, () => setConnecting(false));
  }, [token]);

  const handleJoin = useCallback(() => {
    if (!token || !joinCode.trim()) return;
    setConnecting(true);
    const s = getSocket(token);
    if (!s.connected) s.connect();
    s.emit(
      WS_EVENTS.JOIN_ROOM,
      { code: joinCode.trim().toUpperCase() },
      () => setConnecting(false),
    );
  }, [token, joinCode]);

  const [preparing, setPreparing] = useState(false);
  const handleStart = useCallback(async () => {
    const s = getSocket(token);
    const pack = packs.find((p) => p.id === selectedPackId);
    const rounds = room?.config.rounds ?? 5;

    if (!GOOGLE_KEY) {
      // No Google key → backend falls back to curated dataset.
      s.emit(WS_EVENTS.START_GAME, { packId: selectedPackId });
      return;
    }

    setPreparing(true);
    try {
      const locations = await pickRandomPanoramas({
        countries: pack?.countries ?? null,
        count: rounds,
        apiKey: GOOGLE_KEY,
      });

      if (locations.length < rounds) {
        toast.push({
          tone: "warning",
          title: t("play.partialTitle"),
          description: t("play.partialDesc", {
            got: locations.length,
            total: rounds,
          }),
        });
      }

      s.emit(WS_EVENTS.START_GAME, {
        packId: selectedPackId,
        locations: locations.length ? locations : undefined,
      });
    } catch (err) {
      toast.push({
        tone: "danger",
        title: t("play.couldNotPick"),
        description: (err as Error).message,
      });
      s.emit(WS_EVENTS.START_GAME, { packId: selectedPackId });
    } finally {
      setPreparing(false);
    }
  }, [token, selectedPackId, packs, room?.config.rounds, toast, t]);

  const handleGuess = useCallback(() => {
    if (!guess) return;
    const s = getSocket(token);
    s.emit(WS_EVENTS.SUBMIT_GUESS, { guess });
  }, [guess, token]);

  const handleNext = useCallback(() => {
    const s = getSocket(token);
    s.emit(WS_EVENTS.NEXT_ROUND);
  }, [token]);

  const handlePlayAgain = useCallback(() => {
    const s = getSocket(token);
    s.emit(WS_EVENTS.PLAY_AGAIN);
  }, [token]);

  const handleLeave = useCallback(() => {
    const s = getSocket(token);
    s.emit(WS_EVENTS.LEAVE_ROOM);
    reset();
    setFinalLb(null);
  }, [token, reset]);

  const copyCode = useCallback(async () => {
    if (!room?.code) return;
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [room?.code]);

  /* ---------- renders ---------- */

  if (!hydrated || !token || !user) return null;

  // End of game
  if (finalLb) {
    return (
      <FinalScreen
        payload={finalLb}
        isHost={isHost}
        onPlayAgain={handlePlayAgain}
        onLeave={handleLeave}
      />
    );
  }

  // Pre-room (no room joined yet)
  if (!room) {
    return (
      <div className="max-w-3xl mx-auto py-10 flex flex-col gap-4">
      <Link
        href="/solo"
        className="block rounded-2xl border border-brand-gold/40 bg-brand-gold/5 hover:bg-brand-gold/10 hover:border-brand-gold/60 transition p-4 flex items-center justify-between gap-4"
      >
        <div>
          <div className="font-display font-semibold text-ink">
            {t("solo.soloCardTitle")}
          </div>
          <div className="text-sm text-ink-muted">{t("solo.soloCardDesc")}</div>
        </div>
        <span className="shrink-0 px-4 h-10 rounded-xl bg-brand-gold/15 border border-brand-gold/40 text-brand-gold text-sm font-medium flex items-center">
          {t("solo.soloCardBtn")} →
        </span>
      </Link>
      <div className="grid md:grid-cols-2 gap-4">
        <Card glow>
          <CardHeader>
            <CardTitle>{t("play.createTitle")}</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <p className="text-ink-muted text-sm">
              {t("play.createDesc")}
            </p>
            <Button size="lg" onClick={handleCreate} loading={connecting}>
              {t("play.createBtn")}
            </Button>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("play.joinTitle")}</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <Input
              label={t("play.code")}
              placeholder={t("play.codePlaceholder")}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            />
            <Button
              size="lg"
              variant="secondary"
              onClick={handleJoin}
              loading={connecting}
              disabled={!joinCode.trim()}
            >
              {t("play.joinBtn")}
            </Button>
          </CardBody>
        </Card>
      </div>
      </div>
    );
  }

  // Lobby
  if (room.status === "lobby") {
    return (
      <div className="max-w-4xl mx-auto py-10 flex flex-col gap-6 animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Logo size={28} /> {t("play.lobby")}
              <Badge tone="cyan" dot>
                {room.players.length}/10
              </Badge>
            </CardTitle>
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-border text-sm font-mono hover:border-brand-cyan/50"
            >
              {copied ? <Check className="w-4 h-4 text-brand-cyan" /> : <Copy className="w-4 h-4" />}
              {room.code}
            </button>
          </CardHeader>
          <CardBody>
            <Lobby players={room.players} capacity={10} meId={user.id} />
          </CardBody>
        </Card>

        {isHost && (
          <Card>
            <CardHeader>
              <CardTitle>{t("play.mapPack")}</CardTitle>
              <Badge tone="violet">{t("play.hostPick")}</Badge>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {packs.map((pack) => {
                  const active = pack.id === selectedPackId;
                  const mine = pack.ownerId === user.id;
                  return (
                    <button
                      key={pack.id}
                      onClick={() => setSelectedPackId(pack.id)}
                      className={
                        "relative p-3 rounded-xl border text-left transition " +
                        (active
                          ? "border-brand-cyan/60 bg-brand-cyan/5 shadow-glow"
                          : "border-border hover:border-brand-cyan/30 hover:bg-panel/60")
                      }
                    >
                      {pack.isCustom && (
                        <span
                          className={
                            "absolute top-2 right-2 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded " +
                            (mine
                              ? "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30"
                              : "bg-brand-violet/10 text-brand-violet border border-brand-violet/30")
                          }
                        >
                          {mine ? "mine" : "custom"}
                        </span>
                      )}
                      <div className="text-2xl mb-1">{pack.emoji}</div>
                      <div className="font-medium text-sm text-ink">
                        {pack.name}
                      </div>
                      <div className="text-[11px] text-ink-dim line-clamp-2">
                        {pack.description}
                      </div>
                    </button>
                  );
                })}
                <button
                  onClick={() => setShowCreatePack(true)}
                  className="p-3 rounded-xl border-2 border-dashed border-border hover:border-brand-cyan/50 hover:bg-brand-cyan/5 transition flex flex-col items-center justify-center gap-1 text-ink-muted hover:text-brand-cyan min-h-[92px]"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-sm font-medium">{t("play.createPack")}</span>
                  <span className="text-[11px] text-ink-dim">
                    {t("play.createPackSub")}
                  </span>
                </button>
              </div>
            </CardBody>
          </Card>
        )}

        <CreatePackModal
          open={showCreatePack}
          onClose={() => setShowCreatePack(false)}
          onCreated={(pack) => {
            setPacks((prev) => [pack, ...prev]);
            setSelectedPackId(pack.id);
          }}
        />

        {!isHost && (
          <div className="text-center text-sm text-ink-muted">
            {t("play.selectedPack")}{" "}
            <span className="text-brand-cyan font-medium">
              {packs.find((p) => p.id === room.config.packId)?.name ??
                t("play.world")}
            </span>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          {isHost ? (
            <Button
              size="lg"
              onClick={handleStart}
              loading={preparing}
              leftIcon={<Swords className="w-4 h-4" />}
            >
              {preparing
                ? t("play.picking")
                : `${t("play.startGame")} (${room.config.rounds} ${t("play.rounds")} · ${room.config.roundSeconds}s · ${packs.find((p) => p.id === selectedPackId)?.emoji ?? ""} ${packs.find((p) => p.id === selectedPackId)?.name ?? t("play.world")})`}
            </Button>
          ) : (
            <Badge tone="violet" dot>
              {t("play.waitingHost")}
            </Badge>
          )}
          <Button size="lg" variant="ghost" onClick={handleLeave}>
            {t("play.leave")}
          </Button>
        </div>
      </div>
    );
  }

  // Playing / Reveal
  const showTruth = isReveal && roundEndLocation;
  const actualLocation: Location | undefined =
    currentRound?.location && (showTruth
      ? { ...currentRound.location, lat: roundEndLocation!.lat, lng: roundEndLocation!.lng }
      : currentRound.location);

  const maxScore = room.config.rounds * 5000;
  const me = room.players.find((p) => p.userId === user.id) ?? null;
  const opponent =
    room.players
      .filter((p) => p.userId !== user.id)
      .sort((a, b) => b.totalScore - a.totalScore)[0] ?? null;

  return (
    <div className="fixed inset-0 overflow-hidden bg-void">
      {/* Full-bleed Street View */}
      <div className="absolute inset-0 z-0">
        {actualLocation && (
          <StreetView
            key={actualLocation.id}
            location={actualLocation}
            allowPan={room.config.allowPan}
            allowZoom={room.config.allowZoom}
          />
        )}
      </div>

      {/* Top HUD */}
      <div className="absolute top-0 inset-x-0 z-20 p-2 md:p-4 flex items-start justify-between gap-2 md:gap-4 pointer-events-none">
        <PlayerBar
          player={me}
          maxScore={maxScore}
          side="left"
          highlight
        />
        <CenterTimer
          remainingMs={remainingMs}
          roundIndex={room.currentRound}
          totalRounds={room.config.rounds}
        />
        {/* Opponent gauge only fits on wider screens */}
        <div className="hidden md:block">
          <PlayerBar player={opponent} maxScore={maxScore} side="right" />
        </div>
      </div>

      {/* Leave button */}
      <button
        onClick={handleLeave}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto mt-[110px] md:hidden px-3 h-7 rounded-full bg-black/50 border border-white/20 text-white/70 text-xs hover:text-white"
      >
        {t("play.leave")}
      </button>

      {/* Unified mini-map widget — handles guessing, locked, and reveal states. */}
      <GuessBox
        guess={guess}
        setGuess={setGuess}
        onGuess={handleGuess}
        onNext={handleNext}
        roundIndex={room.currentRound}
        mode={
          isReveal
            ? "reveal"
            : alreadyGuessed
              ? "locked"
              : isPlaying
                ? "guessing"
                : "idle"
        }
        truth={isReveal ? roundEndLocation : null}
        guesses={guesses}
        meId={user.id}
        isHost={isHost}
      />
    </div>
  );
}

/* --------------------- Mini-map + CTA — unified widget ------------------- */

type GuessBoxMode = "idle" | "guessing" | "locked" | "reveal";

interface GuessBoxProps {
  guess: LatLng | null;
  setGuess: (g: LatLng) => void;
  onGuess: () => void;
  onNext: () => void;
  roundIndex: number;
  mode: GuessBoxMode;
  truth: LatLng | null;
  guesses: Array<{
    userId: string;
    username: string;
    guess: { lat: number; lng: number };
    distanceKm: number;
    score: number;
  }>;
  meId: string;
  isHost: boolean;
}

const GuessBox: React.FC<GuessBoxProps> = ({
  guess,
  setGuess,
  onGuess,
  onNext,
  roundIndex,
  mode,
  truth,
  guesses,
  meId,
  isHost,
}) => {
  const { t } = useI18n();
  const [hovering, setHovering] = useState(false);

  const isReveal = mode === "reveal";
  const isGuessing = mode === "guessing";
  const isLocked = mode === "locked";

  // Widget grows on hover (desktop) or first touch (mobile) while guessing,
  // and auto-grows during reveal. Clamped so it never overflows small phones.
  const wide = isReveal || (isGuessing && hovering);
  const width = wide
    ? "min(640px, calc(100vw - 24px))"
    : "min(340px, calc(100vw - 24px))";
  const height = wide ? "min(420px, 48dvh)" : "min(220px, 30dvh)";

  const mine = guesses.find((g) => g.userId === meId);
  const guessForMap = mine?.guess ?? guess ?? null;

  return (
    <div
      className="absolute bottom-3 right-3 md:bottom-6 md:right-6 z-30 pointer-events-auto flex flex-col gap-2"
      style={{ width, transition: "width 260ms ease-out" }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onTouchStart={() => setHovering(true)}
    >
      <div
        className={
          "relative rounded-2xl overflow-hidden shadow-lift border-2 " +
          (isReveal
            ? "border-brand-cyan shadow-glow"
            : "border-white/30")
        }
        style={{ height, transition: "height 260ms ease-out" }}
      >
        {GOOGLE_KEY ? (
          <GuessMapGoogle
            apiKey={GOOGLE_KEY}
            roundKey={isReveal ? `rv-${roundIndex}` : roundIndex}
            guess={guessForMap}
            truth={isReveal ? truth : null}
            otherGuesses={
              isReveal
                ? guesses
                    .filter((g) => g.userId !== meId)
                    .map((g) => ({
                      lat: g.guess.lat,
                      lng: g.guess.lng,
                      username: g.username,
                    }))
                : undefined
            }
            onGuessChange={setGuess}
            disabled={!isGuessing}
          />
        ) : (
          <GuessMapLeaflet
            guess={guessForMap}
            truth={isReveal ? truth : null}
            otherGuesses={
              isReveal
                ? guesses
                    .filter((g) => g.userId !== meId)
                    .map((g) => ({
                      lat: g.guess.lat,
                      lng: g.guess.lng,
                      username: g.username,
                    }))
                : undefined
            }
            onGuessChange={setGuess}
            disabled={!isGuessing}
          />
        )}

        {/* Reveal distance/score HUD inside the map */}
        {isReveal && (
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-md border border-brand-cyan/50 rounded-xl px-3 py-2 flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-ink-muted">
                {t("play.distance")}
              </span>
              <span className="font-mono text-lg text-white font-bold">
                {mine ? formatDistance(mine.distanceKm) : "—"}
              </span>
            </div>
            <div className="bg-black/70 backdrop-blur-md border border-brand-cyan/50 rounded-xl px-3 py-2 flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-ink-muted">
                {t("play.score")}
              </span>
              <span className="font-mono text-lg text-brand-cyan font-bold">
                {mine ? mine.score.toLocaleString() : "0"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* CTA button */}
      {isGuessing && (
        <button
          onClick={onGuess}
          disabled={!guess}
          className={
            "h-14 rounded-2xl font-display font-bold text-lg tracking-wider uppercase transition-all shadow-lift " +
            (guess
              ? "bg-gradient-to-b from-emerald-400 to-emerald-600 text-void hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0"
              : "bg-black/40 border border-white/20 text-white/50 cursor-not-allowed")
          }
        >
          {guess ? t("play.guess") : t("play.dropPin")}
        </button>
      )}

      {isLocked && (
        <div className="h-14 rounded-2xl bg-black/60 backdrop-blur-md border border-brand-cyan/40 text-brand-cyan flex items-center justify-center gap-3 font-display uppercase tracking-wider text-sm">
          <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
          {t("play.guessLocked")}
        </div>
      )}

      {isReveal && (
        <>
          {isHost ? (
            <button
              onClick={onNext}
              className="h-14 rounded-2xl font-display font-bold text-lg tracking-wider uppercase transition-all shadow-lift bg-gradient-to-b from-emerald-400 to-emerald-600 text-void hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0"
            >
              {t("play.nextRound")}
            </button>
          ) : (
            <div className="h-14 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-white/70 flex items-center justify-center uppercase text-sm tracking-wider">
              {t("play.waitingHostDots")}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* --------------------- Reveal overlay (full screen) ----------------- */

const RevealOverlay: React.FC<{
  guesses: Array<{
    userId: string;
    username: string;
    guess: { lat: number; lng: number };
    distanceKm: number;
    score: number;
  }>;
  truth: LatLng | null;
  lastGuess: LatLng | null;
  meId: string;
  isHost: boolean;
  onNext: () => void;
  roundIndex: number;
  otherPlayers: Array<{ userId: string; username: string }>;
}> = ({ guesses, truth, lastGuess, meId, isHost, onNext, roundIndex }) => {
  const mine = guesses.find((g) => g.userId === meId);
  const myGuessForMap =
    mine?.guess ?? lastGuess ?? null;
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 md:p-10 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-5xl h-full max-h-[80vh] grid md:grid-cols-[1fr_320px] gap-4">
        {/* Big map */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-brand-cyan/60 shadow-glow">
          {GOOGLE_KEY ? (
            <GuessMapGoogle
              apiKey={GOOGLE_KEY}
              roundKey={`reveal-${roundIndex}`}
              guess={myGuessForMap}
              truth={truth}
              otherGuesses={guesses
                .filter((g) => g.userId !== meId)
                .map((g) => ({
                  lat: g.guess.lat,
                  lng: g.guess.lng,
                  username: g.username,
                }))}
              disabled
            />
          ) : (
            <GuessMapLeaflet
              guess={myGuessForMap}
              truth={truth}
              otherGuesses={guesses
                .filter((g) => g.userId !== meId)
                .map((g) => ({
                  lat: g.guess.lat,
                  lng: g.guess.lng,
                  username: g.username,
                }))}
              disabled
            />
          )}
        </div>

        {/* Side panel: results + next */}
        <div className="flex flex-col gap-3 bg-panel/90 backdrop-blur-xl border border-border rounded-2xl p-4">
          <h2 className="font-display text-xl text-ink">Round reveal</h2>
          {mine ? (
            <div className="bg-void/60 rounded-xl p-3">
              <p className="text-xs uppercase tracking-wider text-ink-muted">
                your score
              </p>
              <p className="font-mono text-3xl text-brand-cyan font-bold tabular-nums">
                {mine.score.toLocaleString()}
              </p>
              <p className="text-xs text-ink-dim">
                {formatDistance(mine.distanceKm)} away
              </p>
            </div>
          ) : (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              No guess — 0 points
            </div>
          )}
          <div className="flex-1 overflow-auto flex flex-col gap-1.5">
            {guesses
              .slice()
              .sort((a, b) => b.score - a.score)
              .map((g) => (
                <div
                  key={g.userId}
                  className={
                    "flex justify-between text-sm py-1 px-2 rounded-lg " +
                    (g.userId === meId
                      ? "bg-brand-cyan/10 text-brand-cyan"
                      : "text-ink-muted")
                  }
                >
                  <span>{g.username}</span>
                  <span className="font-mono">
                    {formatDistance(g.distanceKm)} ·{" "}
                    <span className="text-ink">
                      {g.score.toLocaleString()}
                    </span>
                  </span>
                </div>
              ))}
          </div>
          {isHost ? (
            <button
              onClick={onNext}
              className="h-12 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 text-void font-display font-bold uppercase tracking-wider hover:brightness-110"
            >
              Next round →
            </button>
          ) : (
            <div className="h-12 rounded-xl bg-black/40 border border-white/20 flex items-center justify-center text-ink-muted text-sm">
              waiting for host…
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------ */

const RevealPanel: React.FC<{
  guesses: Array<{
    userId: string;
    username: string;
    distanceKm: number;
    score: number;
  }>;
  meId: string;
  isHost: boolean;
  onNext: () => void;
}> = ({ guesses, meId, isHost, onNext }) => {
  const mine = guesses.find((g) => g.userId === meId);
  return (
    <GamePanel tone="magenta" className="animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg">Round reveal</h3>
        {mine ? (
          <Badge tone="cyan">{mine.score.toLocaleString()} pts</Badge>
        ) : (
          <Badge tone="danger">no guess</Badge>
        )}
      </div>
      <div className="flex flex-col gap-1.5 text-sm">
        {guesses
          .slice()
          .sort((a, b) => b.score - a.score)
          .map((g) => (
            <div
              key={g.userId}
              className="flex justify-between tabular-nums text-ink-muted"
            >
              <span className={g.userId === meId ? "text-brand-cyan" : ""}>
                {g.username}
              </span>
              <span className="font-mono">
                {formatDistance(g.distanceKm)} · {g.score.toLocaleString()}
              </span>
            </div>
          ))}
      </div>
      {isHost && (
        <Button className="mt-4" onClick={onNext} fullWidth>
          Next round →
        </Button>
      )}
    </GamePanel>
  );
};

const FinalScreen: React.FC<{
  payload: GameEndedPayload;
  isHost: boolean;
  onPlayAgain: () => void;
  onLeave: () => void;
}> = ({ payload, isHost, onPlayAgain, onLeave }) => {
  const { t } = useI18n();
  const winner = payload.leaderboard[0];
  return (
    <div className="max-w-xl mx-auto py-16 animate-fade-in">
      <Card glow>
        <CardHeader>
          <CardTitle>{t("play.gameOver")}</CardTitle>
          <Badge tone="gold">{t("play.finalStandings")}</Badge>
        </CardHeader>
        <CardBody className="flex flex-col gap-5">
          {winner && (
            <div className="text-center py-6 border-b border-border">
              <p className="text-xs text-ink-muted uppercase tracking-wider">
                {t("play.winner")}
              </p>
              <p className="font-display text-3xl text-gradient-brand mt-2">
                {winner.username}
              </p>
              <p className="text-brand-cyan font-mono mt-1">
                {winner.score.toLocaleString()} {t("play.pts")}
              </p>
            </div>
          )}
          <Leaderboard
            items={payload.leaderboard.map((e, i) => ({
              rank: i + 1,
              userId: e.userId,
              username: e.username,
              score: e.score,
            }))}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={onLeave}>
              {t("play.backToMenu")}
            </Button>
            <Link href="/leaderboard">
              <Button variant="secondary">{t("play.globalRanking")}</Button>
            </Link>
            {isHost ? (
              <Button onClick={onPlayAgain}>{t("play.playAgain")}</Button>
            ) : (
              <Badge tone="violet" dot>
                {t("play.waitingHost")}
              </Badge>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
