import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { aggregateStats, pruneOldStats } from "../stats-utils";
import type { StatsData } from "../types";

describe("aggregateStats", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-23T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return empty for no data", () => {
    const stats: StatsData = { daily: {} };
    expect(aggregateStats(stats, "today")).toEqual({});
  });

  it("should aggregate today's stats", () => {
    const stats: StatsData = {
      daily: {
        "2026-02-23": { "facebook.com": 5, "x.com": 3 },
        "2026-02-22": { "facebook.com": 10 },
      },
    };
    const result = aggregateStats(stats, "today");
    expect(result).toEqual({ "facebook.com": 5, "x.com": 3 });
  });

  it("should aggregate weekly stats (last 7 days)", () => {
    const stats: StatsData = {
      daily: {
        "2026-02-23": { "facebook.com": 2 },
        "2026-02-22": { "facebook.com": 3 },
        "2026-02-20": { "x.com": 1 },
        "2026-02-17": { "facebook.com": 5 },
        "2026-02-15": { "youtube.com": 10 }, // out of range
      },
    };
    const result = aggregateStats(stats, "week");
    expect(result).toEqual({ "facebook.com": 10, "x.com": 1 });
  });

  it("should aggregate monthly stats (last 30 days)", () => {
    const stats: StatsData = {
      daily: {
        "2026-02-23": { "facebook.com": 1 },
        "2026-02-01": { "x.com": 2 },
        "2026-01-25": { "youtube.com": 3 },
        "2026-01-20": { "reddit.com": 99 }, // out of range
      },
    };
    const result = aggregateStats(stats, "month");
    expect(result).toEqual({ "facebook.com": 1, "x.com": 2, "youtube.com": 3 });
  });

  it("should sum counts across multiple days for the same domain", () => {
    const stats: StatsData = {
      daily: {
        "2026-02-23": { "facebook.com": 1 },
        "2026-02-22": { "facebook.com": 2 },
        "2026-02-21": { "facebook.com": 3 },
      },
    };
    const result = aggregateStats(stats, "week");
    expect(result["facebook.com"]).toBe(6);
  });
});

describe("pruneOldStats", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-23T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should keep entries within retention period", () => {
    const stats: StatsData = {
      daily: {
        "2026-02-23": { "facebook.com": 5 },
        "2026-01-23": { "x.com": 3 },
      },
    };
    const pruned = pruneOldStats(stats, 90);
    expect(Object.keys(pruned.daily)).toHaveLength(2);
  });

  it("should remove entries older than retention period", () => {
    const stats: StatsData = {
      daily: {
        "2026-02-23": { "facebook.com": 5 },
        "2025-11-01": { "x.com": 3 }, // older than 90 days
        "2025-10-15": { "youtube.com": 1 }, // older than 90 days
      },
    };
    const pruned = pruneOldStats(stats, 90);
    expect(Object.keys(pruned.daily)).toHaveLength(1);
    expect(pruned.daily["2026-02-23"]).toBeDefined();
  });

  it("should return empty for all old data", () => {
    const stats: StatsData = {
      daily: {
        "2025-01-01": { "facebook.com": 5 },
      },
    };
    const pruned = pruneOldStats(stats, 90);
    expect(Object.keys(pruned.daily)).toHaveLength(0);
  });

  it("should handle empty data", () => {
    const stats: StatsData = { daily: {} };
    const pruned = pruneOldStats(stats, 90);
    expect(pruned.daily).toEqual({});
  });
});
