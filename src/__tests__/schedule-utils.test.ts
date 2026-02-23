import { describe, it, expect } from "vitest";
import { isWithinSchedule } from "../schedule-utils";
import type { Schedule } from "../types";

function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    id: "test",
    label: "Test",
    days: [1, 2, 3, 4, 5], // weekdays
    startTime: "09:00",
    endTime: "17:00",
    enabled: true,
    ...overrides,
  };
}

describe("isWithinSchedule", () => {
  it("should return false for empty schedules", () => {
    const now = new Date("2026-02-23T10:00:00"); // Monday
    expect(isWithinSchedule([], now)).toBe(false);
  });

  it("should match when within a normal schedule window", () => {
    const schedule = makeSchedule(); // weekdays 09:00-17:00
    const monday10am = new Date("2026-02-23T10:00:00"); // Monday
    expect(isWithinSchedule([schedule], monday10am)).toBe(true);
  });

  it("should not match outside schedule hours", () => {
    const schedule = makeSchedule();
    const monday8am = new Date("2026-02-23T08:00:00"); // Monday, before 09:00
    expect(isWithinSchedule([schedule], monday8am)).toBe(false);
  });

  it("should not match at exact end time (exclusive)", () => {
    const schedule = makeSchedule();
    const monday5pm = new Date("2026-02-23T17:00:00"); // Monday, exactly 17:00
    expect(isWithinSchedule([schedule], monday5pm)).toBe(false);
  });

  it("should match at exact start time (inclusive)", () => {
    const schedule = makeSchedule();
    const monday9am = new Date("2026-02-23T09:00:00"); // Monday
    expect(isWithinSchedule([schedule], monday9am)).toBe(true);
  });

  it("should not match on days not in schedule", () => {
    const schedule = makeSchedule({ days: [1, 2, 3, 4, 5] }); // weekdays only
    const sunday10am = new Date("2026-02-22T10:00:00"); // Sunday
    expect(isWithinSchedule([schedule], sunday10am)).toBe(false);
  });

  it("should skip disabled schedules", () => {
    const schedule = makeSchedule({ enabled: false });
    const monday10am = new Date("2026-02-23T10:00:00");
    expect(isWithinSchedule([schedule], monday10am)).toBe(false);
  });

  it("should handle cross-midnight schedules (22:00-06:00)", () => {
    const schedule = makeSchedule({
      startTime: "22:00",
      endTime: "06:00",
      days: [0, 1, 2, 3, 4, 5, 6], // every day
    });

    // 23:00 — within range
    const at23 = new Date("2026-02-23T23:00:00");
    expect(isWithinSchedule([schedule], at23)).toBe(true);

    // 02:00 — within range (after midnight)
    const at02 = new Date("2026-02-24T02:00:00");
    expect(isWithinSchedule([schedule], at02)).toBe(true);

    // 10:00 — outside range
    const at10 = new Date("2026-02-23T10:00:00");
    expect(isWithinSchedule([schedule], at10)).toBe(false);

    // 06:00 — at end time (exclusive)
    const at06 = new Date("2026-02-23T06:00:00");
    expect(isWithinSchedule([schedule], at06)).toBe(false);
  });

  it("should match if any schedule matches", () => {
    const morning = makeSchedule({ id: "morning", startTime: "09:00", endTime: "12:00" });
    const evening = makeSchedule({ id: "evening", startTime: "18:00", endTime: "22:00" });

    const at10 = new Date("2026-02-23T10:00:00"); // Monday
    expect(isWithinSchedule([morning, evening], at10)).toBe(true);

    const at15 = new Date("2026-02-23T15:00:00"); // Monday, gap
    expect(isWithinSchedule([morning, evening], at15)).toBe(false);

    const at19 = new Date("2026-02-23T19:00:00"); // Monday
    expect(isWithinSchedule([morning, evening], at19)).toBe(true);
  });
});
