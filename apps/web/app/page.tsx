"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Logo,
  Badge,
  Avatar,
  Leaderboard,
} from "@geopin/ui";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { SOLO_PACKS } from "@/lib/solo";
import { useI18n } from "@/lib/i18n";
import type { LeaderboardEntry, MapPack } from "@geopin/types";
const Globe3D = dynamic(
  () => import("@/components/Globe3D").then((m) => m.Globe3D),
  { ssr: false },
);
const StreetView = dynamic(
  () => import("@/components/StreetView").then((m) => m.StreetView),
  { ssr: false },
);

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

/** Photogenic, well-covered spots for the home-page live demo. */
const DEMO_SPOTS = [
  { id: "demo_cartagena", lat: 10.42364, lng: -75.55098 }, // Cartagena old town
  { id: "demo_tokyo", lat: 35.65951, lng: 139.70049 },     // Shibuya
  { id: "demo_nyc", lat: 40.75797, lng: -73.98554 },       // Times Square
  { id: "demo_paris", lat: 48.85837, lng: 2.29448 },       // Eiffel Tower
  { id: "demo_baires", lat: -34.63451, lng: -58.36309 },   // La Boca
];

import {
  Zap,
  Globe2,
  Users,
  Trophy,
  Swords,
  MapPin,
  Target,
  Sparkles,
  ArrowRight,
  Clock,
  Gauge,
} from "lucide-react";

export default function HomePage() {
  const [packs, setPacks] = useState<MapPack[]>([]);
  const [top, setTop] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    api
      .get<MapPack[]>("/packs")
      .then((p) => setPacks(p.filter((x) => !x.isCustom).slice(0, 7)))
      // API offline → show the built-in solo packs so the section still renders.
      .catch(() => setPacks(SOLO_PACKS.slice(0, 7)));
    api
      .get<LeaderboardEntry[]>("/users/leaderboard?limit=5")
      .then(setTop)
      .catch(() => {});
  }, []);

  return (
    // overflow-x-clip: the decorative hero/CTA blobs extend past the
    // viewport and otherwise add horizontal scroll on phones.
    <div className="flex flex-col gap-28 md:gap-36 py-8 overflow-x-clip">
      <Hero />
      <LivePreview />
      <HowItWorks />
      <PacksShowcase packs={packs} />
      <Features />
      <TopRanking entries={top} />
      <FinalCta />
      <Footer />
    </div>
  );
}

/* ─────────────────────── HERO ─────────────────────── */

function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative grid md:grid-cols-2 gap-12 items-center">
      {/* floating blobs */}
      <div className="absolute -top-20 -left-20 w-[520px] h-[520px] rounded-full bg-brand-cyan/20 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-[520px] h-[520px] rounded-full bg-brand-magenta/20 blur-[120px] pointer-events-none" />

      <div className="relative flex flex-col gap-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <Badge tone="cyan" dot>
            {t("home.hero.liveBeta")}
          </Badge>
          <Badge tone="violet">{t("home.hero.multiplayer")}</Badge>
          <Badge tone="gold">{t("home.hero.poweredBy")}</Badge>
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
          <span className="text-gradient-brand">{t("home.hero.titleA")}</span>
          <br />
          <span>{t("home.hero.titleB")}</span>
        </h1>

        <p className="text-ink-muted text-lg max-w-md leading-relaxed">
          {t("home.hero.description")}
        </p>

        <div className="flex flex-wrap gap-3">
          <Link href="/solo">
            <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              {t("home.hero.playNow")}
            </Button>
          </Link>
          <Link href="/play">
            <Button size="lg" variant="secondary" leftIcon={<Users className="w-4 h-4" />}>
              {t("home.hero.multiplayerBtn")}
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button size="lg" variant="ghost">
              {t("home.hero.seeRanking")}
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-6 pt-4">
          <Stat label={t("home.hero.statRounds")} value="∞" />
          <Divider />
          <Stat label={t("home.hero.statAvg")} value={t("home.hero.statAvgValue")} />
          <Divider />
          <Stat label={t("home.hero.statPlayers")} value="10" />
        </div>
      </div>

      <div className="relative aspect-square">
        <div className="absolute inset-0 bg-grad-aurora opacity-30 blur-3xl rounded-full animate-float pointer-events-none" />
        <div className="relative flex items-center justify-center h-full">
          <Globe3D />
        </div>
      </div>
    </section>
  );
}

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="font-display text-xl font-bold text-ink">{value}</span>
    <span className="text-[11px] uppercase tracking-wider text-ink-dim">
      {label}
    </span>
  </div>
);

const Divider = () => <span className="w-px h-8 bg-border" />;

/* ────────────────── LIVE PREVIEW MOCK ────────────────── */

function LivePreview() {
  const { t } = useI18n();
  // Pick the spot after mount so the static build and hydration agree.
  const [spot, setSpot] = useState<(typeof DEMO_SPOTS)[number] | null>(null);
  useEffect(() => {
    setSpot(DEMO_SPOTS[Math.floor(Math.random() * DEMO_SPOTS.length)]!);
  }, []);

  return (
    <section className="relative">
      <SectionHeader
        eyebrow={t("home.preview.eyebrow")}
        title={t("home.preview.title")}
        subtitle={t("home.preview.subtitle")}
      />

      <div className="relative aspect-[16/10] md:aspect-[16/9] rounded-3xl overflow-hidden border border-border shadow-lift bg-grad-night">
        {/* Real, draggable Street View — this IS the game. */}
        <div className="absolute inset-0">
          {GOOGLE_KEY && spot ? (
            <StreetView
              key={spot.id}
              location={spot}
              allowPan
              allowZoom={false}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(120deg, #1A2240 0%, #141B33 40%, #232C4F 100%)",
              }}
            />
          )}
        </div>

        {/* Top HUD (decorative, lets clicks through to the panorama) */}
        <div className="absolute top-0 inset-x-0 p-3 md:p-4 flex items-start justify-between gap-2 md:gap-4 pointer-events-none">
          <MockPlayerBar side="left" name="VICTOR" score={6400} color="emerald" />
          <div className="hidden sm:flex flex-col items-center gap-2">
            <div className="px-3 h-7 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/80">
              <span>{t("hud.round")}</span>
              <span className="text-brand-cyan font-semibold">3</span>
              <span className="text-white/50">/</span>
              <span>5</span>
            </div>
            <div className="px-6 h-12 rounded-full border border-white/30 bg-black/60 backdrop-blur-md shadow-lift font-mono text-xl tabular-nums font-bold text-white">
              01:42
            </div>
          </div>
          <div className="hidden md:block">
            <MockPlayerBar side="right" name="LINA" score={4200} color="violet" />
          </div>
        </div>

        {/* drag hint */}
        {GOOGLE_KEY && (
          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 pointer-events-none">
            <div className="px-3 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white/80 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
              {t("home.preview.dragHint")}
            </div>
          </div>
        )}

        {/* Mini-map + GUESS (decorative) */}
        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 w-44 md:w-72 flex-col gap-2 pointer-events-none hidden sm:flex">
          <div className="relative h-24 md:h-40 rounded-xl border-2 border-white/40 overflow-hidden shadow-lift">
            <svg viewBox="0 0 300 160" className="w-full h-full">
              <rect width="300" height="160" fill="#F4F7FC" />
              <rect x="60" y="38" width="72" height="44" rx="3" fill="#E2E9F4" />
              <rect x="164" y="58" width="92" height="42" rx="3" fill="#E2E9F4" />
              <rect x="28" y="98" width="62" height="34" rx="3" fill="#E2E9F4" />
              <line x1="0" y1="90" x2="300" y2="90" stroke="#CBD5E6" strokeWidth="3" />
              <line x1="150" y1="0" x2="150" y2="160" stroke="#CBD5E6" strokeWidth="3" />
              <line x1="96" y1="72" x2="174" y2="96" stroke="#22B8DD" strokeWidth="2.5" strokeDasharray="5,4" />
            </svg>
            <div className="absolute left-[30%] top-[42%]">
              <div className="w-3.5 h-3.5 rounded-full bg-brand-cyan ring-2 ring-white shadow" />
            </div>
            <div className="absolute left-[56%] top-[57%]">
              <div className="w-3.5 h-3.5 rounded-full bg-brand-gold ring-2 ring-white shadow" />
            </div>
          </div>
          <div className="h-10 md:h-12 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 text-void font-display font-bold text-sm tracking-widest uppercase flex items-center justify-center shadow-lift">
            GUESS
          </div>
        </div>
      </div>
    </section>
  );
}

const MockPlayerBar: React.FC<{
  name: string;
  score: number;
  side: "left" | "right";
  color: "emerald" | "violet";
}> = ({ name, score, side, color }) => {
  const gradient =
    color === "emerald"
      ? "from-emerald-400 via-emerald-300 to-lime-200"
      : "from-violet-500 via-fuchsia-400 to-amber-300";
  const pct = Math.min(100, (score / 25000) * 100);
  return (
    <div
      className={
        "flex items-center gap-3 " + (side === "right" ? "flex-row-reverse" : "")
      }
    >
      <Avatar seed={name} size={44} />
      <div className="min-w-[180px]">
        <div
          className={
            "text-xs font-bold tracking-wider text-white mb-1 " +
            (side === "right" ? "text-right" : "")
          }
        >
          {name}
        </div>
        <div className="relative h-5 rounded-full border border-white/30 bg-black/40 overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${gradient}`}
            style={{ width: `${pct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-mono font-bold text-white tabular-nums">
              {score.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ────────────────── HOW IT WORKS ────────────────── */

function HowItWorks() {
  const { t } = useI18n();
  const steps = [
    {
      icon: Globe2,
      title: t("home.how.s1t"),
      body: t("home.how.s1b"),
    },
    {
      icon: MapPin,
      title: t("home.how.s2t"),
      body: t("home.how.s2b"),
    },
    {
      icon: Target,
      title: t("home.how.s3t"),
      body: t("home.how.s3b"),
    },
  ];

  return (
    <section>
      <SectionHeader
        eyebrow={t("home.how.eyebrow")}
        title={t("home.how.title")}
        subtitle={t("home.how.subtitle")}
      />
      <div className="grid md:grid-cols-3 gap-4">
        {steps.map((s, i) => (
          <Card key={s.title} className="relative overflow-hidden">
            <CardBody className="flex flex-col gap-3 p-6">
              <span className="font-display text-7xl font-bold text-gradient-brand opacity-60 absolute -top-2 -right-1 pointer-events-none select-none">
                {i + 1}
              </span>
              <s.icon className="w-8 h-8 text-brand-cyan" />
              <h3 className="font-display text-xl font-semibold text-ink">
                {s.title}
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                {s.body}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ────────────────── PACKS SHOWCASE ────────────────── */

function PacksShowcase({ packs }: { packs: MapPack[] }) {
  const { t } = useI18n();
  if (!packs.length) return null;
  return (
    <section>
      <SectionHeader
        eyebrow={t("home.packs.eyebrow")}
        title={t("home.packs.title")}
        subtitle={t("home.packs.subtitle")}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {packs.map((p) => (
          <Link key={p.id} href="/solo">
            <Card interactive className="h-full">
              <CardBody className="flex flex-col gap-2 p-4 h-full">
                <div className="text-3xl">{p.emoji}</div>
                <h3 className="font-display font-semibold text-ink">{p.name}</h3>
                <p className="text-xs text-ink-muted line-clamp-2 flex-1">
                  {p.description}
                </p>
                {p.countries && p.countries.length > 0 && (
                  <p className="text-[10px] uppercase tracking-wider text-brand-cyan">
                    {p.countries.length} {t("home.packs.countries")}
                  </p>
                )}
              </CardBody>
            </Card>
          </Link>
        ))}
        <Link href="/solo">
          <Card
            interactive
            className="h-full border-dashed border-brand-cyan/40 bg-brand-cyan/5"
          >
            <CardBody className="flex flex-col items-center justify-center gap-2 p-6 h-full text-center">
              <Sparkles className="w-6 h-6 text-brand-cyan" />
              <h3 className="font-display font-semibold text-brand-cyan">
                {t("home.packs.buildTitle")}
              </h3>
              <p className="text-xs text-ink-muted">
                {t("home.packs.buildBody")}
              </p>
            </CardBody>
          </Card>
        </Link>
      </div>
    </section>
  );
}

/* ────────────────── FEATURES ────────────────── */

function Features() {
  const { t } = useI18n();
  const FEATURES = [
    { icon: Zap, title: t("home.features.f1t"), body: t("home.features.f1b") },
    { icon: Users, title: t("home.features.f2t"), body: t("home.features.f2b") },
    { icon: Gauge, title: t("home.features.f3t"), body: t("home.features.f3b") },
    { icon: Sparkles, title: t("home.features.f4t"), body: t("home.features.f4b") },
    { icon: Clock, title: t("home.features.f5t"), body: t("home.features.f5b") },
    { icon: Trophy, title: t("home.features.f6t"), body: t("home.features.f6b") },
  ];
  return (
    <section>
      <SectionHeader
        eyebrow={t("home.features.eyebrow")}
        title={t("home.features.title")}
        subtitle={t("home.features.subtitle")}
      />
      <div className="grid md:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <Card key={f.title} interactive className="h-full">
            <CardBody className="p-6 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center">
                <f.icon className="w-5 h-5 text-brand-cyan" />
              </div>
              <h3 className="font-display font-semibold text-lg text-ink">
                {f.title}
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                {f.body}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ────────────────── TOP RANKING ────────────────── */

function TopRanking({ entries }: { entries: LeaderboardEntry[] }) {
  const { t } = useI18n();
  return (
    <section className="grid md:grid-cols-[1.2fr_1fr] gap-8 items-center">
      <div className="flex flex-col gap-4">
        <Badge tone="gold">{t("home.ranking.badge")}</Badge>
        <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          <span className="text-gradient-brand">{t("home.ranking.titleHi")}</span>
          {t("home.ranking.titleRest")}
        </h2>
        <p className="text-ink-muted max-w-md">
          {t("home.ranking.description")}
        </p>
        <div>
          <Link href="/leaderboard">
            <Button variant="secondary" rightIcon={<ArrowRight className="w-4 h-4" />}>
              {t("home.ranking.full")}
            </Button>
          </Link>
        </div>
      </div>

      <Card glow>
        <CardBody className="p-0">
          {entries.length === 0 ? (
            <div className="py-12 px-6 text-center text-ink-muted text-sm">
              {t("home.ranking.empty")}
            </div>
          ) : (
            <Leaderboard
              items={entries.map((e) => ({
                rank: e.rank,
                userId: e.userId,
                username: e.username,
                avatarSeed: e.avatarSeed,
                score: e.totalScore,
                country: e.country,
              }))}
            />
          )}
        </CardBody>
      </Card>
    </section>
  );
}

/* ────────────────── FINAL CTA ────────────────── */

function FinalCta() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  return (
    <section>
      <div className="relative overflow-hidden rounded-3xl border border-border p-10 md:p-16 text-center">
        <div className="absolute inset-0 bg-grad-brand opacity-10" />
        <div className="absolute -top-40 -left-40 w-[400px] h-[400px] rounded-full bg-brand-cyan/30 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-brand-magenta/30 blur-[120px]" />

        <div className="relative flex flex-col items-center gap-6">
          <Swords className="w-10 h-10 text-brand-cyan" />
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
            {t("home.cta.titleA")}
            <span className="text-gradient-brand">{t("home.cta.titleHi")}</span>
            {t("home.cta.titleB")}
          </h2>
          <p className="text-ink-muted max-w-lg text-lg">
            {t("home.cta.description")}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/solo">
              <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                {t("home.cta.play")}
              </Button>
            </Link>
            <Link href="/play">
              <Button size="lg" variant="secondary">
                {t("home.hero.multiplayerBtn")}
              </Button>
            </Link>
            {!user && (
              <Link href="/auth">
                <Button size="lg" variant="ghost">
                  {t("home.cta.create")}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────── FOOTER ────────────────── */

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border pt-8 pb-4 text-xs text-ink-dim flex flex-col md:flex-row justify-between gap-4">
      <div className="flex items-center gap-2">
        <Logo size={22} />
        <span className="font-display font-semibold text-ink">GeoPin</span>
        <span>© {new Date().getFullYear()}</span>
      </div>
      <div className="flex gap-4">
        <Link href="/solo" className="hover:text-brand-cyan">
          {t("solo.playSolo")}
        </Link>
        <Link href="/play" className="hover:text-brand-cyan">
          {t("home.footer.play")}
        </Link>
        <Link href="/leaderboard" className="hover:text-brand-cyan">
          {t("home.footer.leaderboard")}
        </Link>
        <span>{t("home.footer.maps")}</span>
      </div>
    </footer>
  );
}

/* ────────────────── COMMON ────────────────── */

const SectionHeader: React.FC<{
  eyebrow: string;
  title: string;
  subtitle?: string;
}> = ({ eyebrow, title, subtitle }) => (
  <div className="flex flex-col items-center text-center gap-3 mb-8">
    <Badge tone="cyan">{eyebrow}</Badge>
    <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight max-w-2xl">
      {title}
    </h2>
    {subtitle && (
      <p className="text-ink-muted max-w-xl leading-relaxed">{subtitle}</p>
    )}
  </div>
);
