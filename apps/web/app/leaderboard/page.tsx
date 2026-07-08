"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, CardTitle, Leaderboard, Badge } from "@geopin/ui";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { SOLO_PACKS, getBestScore, getHistory, type SoloHistoryEntry } from "@/lib/solo";
import type { LeaderboardEntry } from "@geopin/types";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [bests, setBests] = useState<Array<{ pack: string; score: number }>>([]);
  const [history, setHistory] = useState<SoloHistoryEntry[]>([]);
  const me = useAuthStore((s) => s.user);
  const { t, lang } = useI18n();

  useEffect(() => {
    api
      .get<LeaderboardEntry[]>("/users/leaderboard?limit=50")
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));

    setBests(
      SOLO_PACKS.map((p) => ({
        pack: `${p.emoji} ${p.name}`,
        score: getBestScore(p.id),
      })).filter((b) => b.score > 0),
    );
    setHistory(getHistory().slice(0, 10));
  }, []);

  const packLabel = (id: string) => {
    const p = SOLO_PACKS.find((x) => x.id === id);
    return p ? `${p.emoji} ${p.name}` : id;
  };

  return (
    <div className="max-w-3xl mx-auto py-10 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("leaderboard.title")}</CardTitle>
          <Badge tone="cyan">{t("leaderboard.top")}</Badge>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-ink-muted py-8 text-center">{t("leaderboard.loading")}</div>
          ) : entries.length === 0 ? (
            <div className="text-ink-muted py-8 text-center">
              {t("leaderboard.empty")}
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
              highlightUserId={me?.id}
            />
          )}
        </CardBody>
      </Card>

      {bests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("leaderboard.soloBests")}</CardTitle>
            <Badge tone="gold">{t("leaderboard.thisDevice")}</Badge>
          </CardHeader>
          <CardBody className="flex flex-col gap-1.5">
            {bests
              .sort((a, b) => b.score - a.score)
              .map((b) => (
                <div
                  key={b.pack}
                  className="flex justify-between text-sm py-1.5 px-3 rounded-lg bg-void/40"
                >
                  <span className="text-ink">{b.pack}</span>
                  <span className="font-mono text-brand-cyan font-bold">
                    {b.score.toLocaleString()}
                  </span>
                </div>
              ))}
          </CardBody>
        </Card>
      )}

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("leaderboard.recentGames")}</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-1.5">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex justify-between items-center text-sm py-1.5 px-3 rounded-lg bg-void/40"
              >
                <span className="text-ink-muted">
                  {packLabel(h.packId)}
                  <span className="text-ink-dim">
                    {" "}· {h.rounds} {t("play.rounds")}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-[11px] text-ink-dim">
                    {new Date(h.date).toLocaleDateString(lang)}
                  </span>
                  <span className="font-mono text-ink font-semibold">
                    {h.total.toLocaleString()}
                  </span>
                </span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
