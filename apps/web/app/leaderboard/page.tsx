"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, CardTitle, Leaderboard, Badge } from "@geopin/ui";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import type { LeaderboardEntry } from "@geopin/types";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const me = useAuthStore((s) => s.user);
  const { t } = useI18n();

  useEffect(() => {
    api
      .get<LeaderboardEntry[]>("/users/leaderboard?limit=50")
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-10">
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
    </div>
  );
}
