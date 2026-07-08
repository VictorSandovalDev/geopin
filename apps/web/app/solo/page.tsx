"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Badge,
  Logo,
} from "@geopin/ui";
import type { LatLng, Location } from "@geopin/types";
import { MAX_ROUND_SCORE } from "@geopin/types";
import { useI18n } from "@/lib/i18n";
import { haversineKm, formatDistance } from "@/lib/haversine";
import {
  SOLO_PACKS,
  SOLO_DEFAULTS,
  scoreFromDistance,
  pickSoloLocations,
  getBestScore,
  recordGame,
  type SoloRoundResult,
} from "@/lib/solo";
import { CenterTimer } from "@/components/HUD";
import { Play, RotateCcw, Home, Trophy, MapPin, Timer as TimerIcon, Crosshair } from "lucide-react";

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

const ROUND_CHOICES = [3, 5, 10];
const TIME_CHOICES = [30, 60, 120, 0]; // 0 → no timer

type Phase = "setup" | "loading" | "playing" | "reveal" | "finished";

export default function SoloPage() {
  const { t } = useI18n();

  const [packId, setPackId] = useState(SOLO_DEFAULTS.packId);
  const [rounds, setRounds] = useState(SOLO_DEFAULTS.rounds);
  const [roundSeconds, setRoundSeconds] = useState(SOLO_DEFAULTS.roundSeconds);

  const [phase, setPhase] = useState<Phase>("setup");
  const [locations, setLocations] = useState<Location[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [results, setResults] = useState<SoloRoundResult[]>([]);
  const [guess, setGuess] = useState<LatLng | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [best, setBest] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => setBest(getBestScore(packId)), [packId, phase]);

  const pack = useMemo(
    () => SOLO_PACKS.find((p) => p.id === packId) ?? SOLO_PACKS[0]!,
    [packId],
  );
  const location = locations[roundIndex] ?? null;
  const totalScore = results.reduce((s, r) => s + r.score, 0);

  /* ---------- round timer ---------- */
  const deadlineRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const finishRound = useCallback(
    (finalGuess: LatLng | null) => {
      const loc = locations[roundIndex];
      if (!loc || phaseRef.current !== "playing") return;
      const distanceKm = finalGuess ? haversineKm(finalGuess, loc) : null;
      const score = distanceKm != null ? scoreFromDistance(distanceKm) : 0;
      setResults((prev) => [
        ...prev,
        { location: loc, guess: finalGuess, distanceKm, score },
      ]);
      deadlineRef.current = null;
      setPhase("reveal");
    },
    [locations, roundIndex],
  );

  // Keep the latest guess reachable from the timer without re-arming it.
  const guessRef = useRef<LatLng | null>(null);
  guessRef.current = guess;

  useEffect(() => {
    if (phase !== "playing" || roundSeconds === 0) return;
    deadlineRef.current = Date.now() + roundSeconds * 1000;
    setRemainingMs(roundSeconds * 1000);
    const id = setInterval(() => {
      const left = (deadlineRef.current ?? 0) - Date.now();
      setRemainingMs(Math.max(0, left));
      if (left <= 0) {
        clearInterval(id);
        finishRound(guessRef.current);
      }
    }, 250);
    return () => clearInterval(id);
  }, [phase, roundIndex, roundSeconds, finishRound]);

  /* ---------- flow ---------- */

  const startGame = useCallback(async () => {
    setPhase("loading");
    setLoadError(null);
    try {
      const locs = await pickSoloLocations({
        countries: pack.countries ?? null,
        count: rounds,
        apiKey: GOOGLE_KEY,
      });
      if (!locs.length) throw new Error("no locations");
      setLocations(locs);
      setResults([]);
      setRoundIndex(0);
      setGuess(null);
      setIsNewBest(false);
      setPhase("playing");
    } catch {
      setLoadError(t("solo.loadError"));
      setPhase("setup");
    }
  }, [pack, rounds, t]);

  const nextRound = useCallback(() => {
    if (roundIndex + 1 >= locations.length) {
      const total = results.reduce((s, r) => s + r.score, 0);
      const newBest = recordGame({
        date: new Date().toISOString(),
        packId,
        rounds: locations.length,
        total,
      });
      setIsNewBest(newBest);
      setPhase("finished");
    } else {
      setRoundIndex((i) => i + 1);
      setGuess(null);
      setPhase("playing");
    }
  }, [roundIndex, locations.length, results, packId]);

  const backToSetup = useCallback(() => {
    setPhase("setup");
    setLocations([]);
    setResults([]);
    setRoundIndex(0);
    setGuess(null);
  }, []);

  /* ---------- screens ---------- */

  if (phase === "setup" || phase === "loading") {
    return (
      <SetupScreen
        packId={packId}
        setPackId={setPackId}
        rounds={rounds}
        setRounds={setRounds}
        roundSeconds={roundSeconds}
        setRoundSeconds={setRoundSeconds}
        best={best}
        loading={phase === "loading"}
        error={loadError}
        onStart={startGame}
      />
    );
  }

  if (phase === "finished") {
    return (
      <FinalScreen
        results={results}
        total={totalScore}
        packName={`${pack.emoji} ${pack.name}`}
        isNewBest={isNewBest}
        best={Math.max(best, totalScore)}
        onPlayAgain={startGame}
        onChangeSettings={backToSetup}
      />
    );
  }

  const lastResult = results[results.length - 1] ?? null;
  const isReveal = phase === "reveal";

  return (
    <div className="fixed inset-0 overflow-hidden bg-void">
      {/* Full-bleed panorama */}
      <div className="absolute inset-0 z-0">
        {location && (
          // Keyed by location so each round mounts a fresh panorama — updating
          // an existing StreetViewPanorama in place can silently keep the old
          // scene.
          <StreetView key={location.id} location={location} allowPan allowZoom />
        )}
      </div>

      {/* Top HUD */}
      <div className="absolute top-0 inset-x-0 z-20 p-4 flex items-start justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 bg-black/50 backdrop-blur-md border border-white/20 rounded-full pl-4 pr-5 h-12">
          <Trophy className="w-4 h-4 text-brand-gold" />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-widest text-white/60">
              {t("solo.totalScore")}
            </span>
            <span className="font-mono font-bold text-white tabular-nums">
              {totalScore.toLocaleString()}
            </span>
          </div>
        </div>

        {roundSeconds > 0 && !isReveal ? (
          <CenterTimer
            remainingMs={remainingMs}
            roundIndex={roundIndex}
            totalRounds={locations.length}
          />
        ) : (
          <div className="px-4 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center gap-2 text-xs uppercase tracking-widest text-white/80">
            <span>{t("hud.round")}</span>
            <span className="text-brand-cyan font-semibold">{roundIndex + 1}</span>
            <span className="text-white/50">/</span>
            <span>{locations.length}</span>
          </div>
        )}

        <Link
          href="/"
          className="pointer-events-auto px-4 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white/70 text-sm hover:text-white flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span className="hidden md:inline">{t("solo.quit")}</span>
        </Link>
      </div>

      {/* Mini-map widget */}
      <SoloGuessBox
        guess={isReveal ? (lastResult?.guess ?? null) : guess}
        setGuess={setGuess}
        onGuess={() => finishRound(guess)}
        onNext={nextRound}
        roundIndex={roundIndex}
        isReveal={isReveal}
        truth={isReveal && location ? { lat: location.lat, lng: location.lng } : null}
        result={isReveal ? lastResult : null}
        isLastRound={roundIndex + 1 >= locations.length}
        locationLabel={
          isReveal && location?.city
            ? `${location.city}${location.country ? `, ${location.country}` : ""}`
            : null
        }
      />
    </div>
  );
}

/* ───────────────────────── Setup screen ───────────────────────── */

function SetupScreen(props: {
  packId: string;
  setPackId: (id: string) => void;
  rounds: number;
  setRounds: (n: number) => void;
  roundSeconds: number;
  setRoundSeconds: (n: number) => void;
  best: number;
  loading: boolean;
  error: string | null;
  onStart: () => void;
}) {
  const { t } = useI18n();
  const {
    packId, setPackId, rounds, setRounds,
    roundSeconds, setRoundSeconds, best, loading, error, onStart,
  } = props;

  return (
    <div className="max-w-4xl mx-auto py-10 flex flex-col gap-6 animate-fade-in px-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl md:text-4xl font-bold flex items-center gap-3">
          <Logo size={36} /> {t("solo.title")}
        </h1>
        {best > 0 && (
          <Badge tone="gold" dot>
            {t("solo.bestScore")}: {best.toLocaleString()}
          </Badge>
        )}
      </div>
      <p className="text-ink-muted -mt-3">{t("solo.subtitle")}</p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-cyan" /> {t("play.mapPack")}
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SOLO_PACKS.map((pack) => {
              const active = pack.id === packId;
              return (
                <button
                  key={pack.id}
                  onClick={() => setPackId(pack.id)}
                  className={
                    "p-3 rounded-xl border text-left transition " +
                    (active
                      ? "border-brand-cyan/60 bg-brand-cyan/5 shadow-glow"
                      : "border-border hover:border-brand-cyan/30 hover:bg-panel/60")
                  }
                >
                  <div className="text-2xl mb-1">{pack.emoji}</div>
                  <div className="font-medium text-sm text-ink">{pack.name}</div>
                  <div className="text-[11px] text-ink-dim line-clamp-2">
                    {pack.description}
                  </div>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-brand-cyan" /> {t("solo.roundsLabel")}
            </CardTitle>
          </CardHeader>
          <CardBody className="flex gap-2">
            {ROUND_CHOICES.map((n) => (
              <ChoiceChip key={n} active={rounds === n} onClick={() => setRounds(n)}>
                {n}
              </ChoiceChip>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TimerIcon className="w-5 h-5 text-brand-cyan" /> {t("solo.timeLabel")}
            </CardTitle>
          </CardHeader>
          <CardBody className="flex gap-2">
            {TIME_CHOICES.map((s) => (
              <ChoiceChip
                key={s}
                active={roundSeconds === s}
                onClick={() => setRoundSeconds(s)}
              >
                {s === 0 ? "∞" : s >= 60 ? `${s / 60} min` : `${s}s`}
              </ChoiceChip>
            ))}
          </CardBody>
        </Card>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-center pt-2">
        <Button
          size="lg"
          onClick={onStart}
          loading={loading}
          leftIcon={<Play className="w-4 h-4" />}
        >
          {loading ? t("play.picking") : t("solo.start")}
        </Button>
        <Link href="/play">
          <Button size="lg" variant="secondary">
            {t("solo.multiplayerInstead")}
          </Button>
        </Link>
      </div>
    </div>
  );
}

const ChoiceChip: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={
      "px-5 h-11 rounded-xl border font-mono font-semibold transition " +
      (active
        ? "border-brand-cyan/60 bg-brand-cyan/10 text-brand-cyan shadow-glow"
        : "border-border text-ink-muted hover:border-brand-cyan/30")
    }
  >
    {children}
  </button>
);

/* ───────────────────── Mini-map + CTA widget ───────────────────── */

function SoloGuessBox(props: {
  guess: LatLng | null;
  setGuess: (g: LatLng) => void;
  onGuess: () => void;
  onNext: () => void;
  roundIndex: number;
  isReveal: boolean;
  truth: LatLng | null;
  result: SoloRoundResult | null;
  isLastRound: boolean;
  locationLabel: string | null;
}) {
  const { t } = useI18n();
  const {
    guess, setGuess, onGuess, onNext,
    roundIndex, isReveal, truth, result, isLastRound, locationLabel,
  } = props;
  const [hovering, setHovering] = useState(false);

  const wide = isReveal || hovering;
  const width = wide ? "min(640px, 90vw)" : "min(340px, 80vw)";
  const height = wide ? "min(420px, 45vh)" : 220;

  return (
    <div
      className="absolute bottom-6 right-6 z-30 pointer-events-auto flex flex-col gap-2"
      style={{ width, transition: "width 260ms ease-out" }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        className={
          "relative rounded-2xl overflow-hidden shadow-lift border-2 " +
          (isReveal ? "border-brand-cyan shadow-glow" : "border-white/30")
        }
        style={{ height, transition: "height 260ms ease-out" }}
      >
        {GOOGLE_KEY ? (
          <GuessMapGoogle
            apiKey={GOOGLE_KEY}
            roundKey={isReveal ? `rv-${roundIndex}` : roundIndex}
            guess={guess}
            truth={truth}
            onGuessChange={setGuess}
            disabled={isReveal}
          />
        ) : (
          <GuessMapLeaflet
            guess={guess}
            truth={truth}
            onGuessChange={setGuess}
            disabled={isReveal}
          />
        )}

        {isReveal && result && (
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-md border border-brand-cyan/50 rounded-xl px-3 py-2 flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-ink-muted">
                {t("play.distance")}
              </span>
              <span className="font-mono text-lg text-white font-bold">
                {result.distanceKm != null
                  ? formatDistance(result.distanceKm)
                  : "—"}
              </span>
              {locationLabel && (
                <span className="text-[11px] text-brand-gold">{locationLabel}</span>
              )}
            </div>
            <div className="bg-black/70 backdrop-blur-md border border-brand-cyan/50 rounded-xl px-3 py-2 flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-ink-muted">
                {t("play.score")}
              </span>
              <span className="font-mono text-lg text-brand-cyan font-bold">
                {result.score.toLocaleString()}
              </span>
              <ScoreBar score={result.score} />
            </div>
          </div>
        )}
      </div>

      {!isReveal ? (
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
      ) : (
        <button
          onClick={onNext}
          className="h-14 rounded-2xl font-display font-bold text-lg tracking-wider uppercase transition-all shadow-lift bg-gradient-to-b from-emerald-400 to-emerald-600 text-void hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0"
        >
          {isLastRound ? t("solo.seeResults") : t("play.nextRound")}
        </button>
      )}
    </div>
  );
}

const ScoreBar: React.FC<{ score: number }> = ({ score }) => {
  const pct = Math.min(100, (score / MAX_ROUND_SCORE) * 100);
  return (
    <div className="w-24 h-1.5 rounded-full bg-white/15 overflow-hidden mt-1">
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-cyan to-emerald-400 transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

/* ───────────────────────── Final screen ───────────────────────── */

function FinalScreen(props: {
  results: SoloRoundResult[];
  total: number;
  packName: string;
  isNewBest: boolean;
  best: number;
  onPlayAgain: () => void;
  onChangeSettings: () => void;
}) {
  const { t } = useI18n();
  const { results, total, packName, isNewBest, best, onPlayAgain, onChangeSettings } = props;
  const maxTotal = results.length * MAX_ROUND_SCORE;

  return (
    <div className="max-w-xl mx-auto py-16 animate-fade-in px-4">
      <Card glow>
        <CardHeader>
          <CardTitle>{t("play.gameOver")}</CardTitle>
          <Badge tone="cyan">{packName}</Badge>
        </CardHeader>
        <CardBody className="flex flex-col gap-5">
          <div className="text-center py-6 border-b border-border">
            {isNewBest && (
              <Badge tone="gold" dot>
                {t("solo.newBest")}
              </Badge>
            )}
            <p className="font-display text-5xl text-gradient-brand mt-3 font-bold tabular-nums">
              {total.toLocaleString()}
            </p>
            <p className="text-ink-muted text-sm mt-1">
              {t("solo.outOf", { max: maxTotal.toLocaleString() })}
            </p>
            <p className="text-brand-gold font-mono text-sm mt-2">
              {t("solo.bestScore")}: {best.toLocaleString()}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            {results.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm py-1.5 px-3 rounded-lg bg-void/40"
              >
                <span className="text-ink-muted">
                  {t("hud.round")} {i + 1}
                  {r.location.city && (
                    <span className="text-ink-dim"> · {r.location.city}</span>
                  )}
                </span>
                <span className="font-mono">
                  {r.distanceKm != null ? (
                    <span className="text-ink-dim">
                      {formatDistance(r.distanceKm)} ·{" "}
                    </span>
                  ) : (
                    <span className="text-red-400">{t("solo.noGuessShort")} · </span>
                  )}
                  <span className="text-brand-cyan font-bold">
                    {r.score.toLocaleString()}
                  </span>
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end flex-wrap">
            <Link href="/">
              <Button variant="ghost">{t("play.backToMenu")}</Button>
            </Link>
            <Button variant="secondary" onClick={onChangeSettings} leftIcon={<RotateCcw className="w-4 h-4" />}>
              {t("solo.changeSettings")}
            </Button>
            <Button onClick={onPlayAgain} leftIcon={<Play className="w-4 h-4" />}>
              {t("play.playAgain")}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
