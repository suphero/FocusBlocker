import type { StatsData } from "./types";

export type StatsPeriod = "today" | "week" | "month";

function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function aggregateStats(stats: StatsData, period: StatsPeriod): Record<string, number> {
  const now = new Date();
  const days = period === "today" ? 1 : period === "week" ? 7 : 30;
  const result: Record<string, number> = {};

  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = getDateKey(d);
    const dayData = stats.daily[key];
    if (dayData) {
      for (const [domain, count] of Object.entries(dayData)) {
        result[domain] = (result[domain] || 0) + count;
      }
    }
  }

  return result;
}

export function pruneOldStats(stats: StatsData, retentionDays: number = 90): StatsData {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - retentionDays);
  const cutoffKey = getDateKey(cutoff);

  const pruned: Record<string, Record<string, number>> = {};
  for (const [dateKey, data] of Object.entries(stats.daily)) {
    if (dateKey >= cutoffKey) {
      pruned[dateKey] = data;
    }
  }

  return { daily: pruned };
}
