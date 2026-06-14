export const RANKING_QUEUE = "ranking";

export interface RecalcStatsJob {
  kind: "recalc-user";
  userId: string;
}

export interface RebuildLeaderboardJob {
  kind: "rebuild-leaderboard";
}

export type RankingJob = RecalcStatsJob | RebuildLeaderboardJob;
