import { describe, it, expect } from "vitest";
import { getNextPhase } from "../pomodoro-logic";
import type { PomodoroState } from "../types";

function makeState(overrides: Partial<PomodoroState> = {}): PomodoroState {
  return {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLong: 4,
    autoStartBreaks: true,
    autoStartFocus: false,
    phase: "idle",
    completedSessions: 0,
    endTime: null,
    ...overrides,
  };
}

describe("getNextPhase", () => {
  it("focus -> shortBreak (sessions < sessionsBeforeLong)", () => {
    const state = makeState({ phase: "focus", completedSessions: 0, sessionsBeforeLong: 4 });
    const result = getNextPhase(state);
    expect(result.nextPhase).toBe("shortBreak");
    expect(result.completedSessions).toBe(1);
    expect(result.shouldBlock).toBe(false);
  });

  it("focus -> shortBreak (2nd session)", () => {
    const state = makeState({ phase: "focus", completedSessions: 1, sessionsBeforeLong: 4 });
    const result = getNextPhase(state);
    expect(result.nextPhase).toBe("shortBreak");
    expect(result.completedSessions).toBe(2);
  });

  it("focus -> longBreak (last session)", () => {
    const state = makeState({ phase: "focus", completedSessions: 3, sessionsBeforeLong: 4 });
    const result = getNextPhase(state);
    expect(result.nextPhase).toBe("longBreak");
    expect(result.completedSessions).toBe(4);
    expect(result.shouldBlock).toBe(false);
  });

  it("shortBreak -> idle (autoStartFocus=false)", () => {
    const state = makeState({ phase: "shortBreak", completedSessions: 1, autoStartFocus: false });
    const result = getNextPhase(state);
    expect(result.nextPhase).toBe("idle");
    expect(result.completedSessions).toBe(1);
    expect(result.shouldBlock).toBe(false);
  });

  it("shortBreak -> focus (autoStartFocus=true)", () => {
    const state = makeState({ phase: "shortBreak", completedSessions: 1, autoStartFocus: true });
    const result = getNextPhase(state);
    expect(result.nextPhase).toBe("focus");
    expect(result.completedSessions).toBe(1);
    expect(result.shouldBlock).toBe(true);
  });

  it("longBreak -> idle (always resets sessions)", () => {
    const state = makeState({ phase: "longBreak", completedSessions: 4 });
    const result = getNextPhase(state);
    expect(result.nextPhase).toBe("idle");
    expect(result.completedSessions).toBe(0);
    expect(result.shouldBlock).toBe(false);
  });

  it("idle -> idle (safety fallback)", () => {
    const state = makeState({ phase: "idle" });
    const result = getNextPhase(state);
    expect(result.nextPhase).toBe("idle");
    expect(result.completedSessions).toBe(0);
  });

  it("should handle sessionsBeforeLong=1 (immediate long break)", () => {
    const state = makeState({ phase: "focus", completedSessions: 0, sessionsBeforeLong: 1 });
    const result = getNextPhase(state);
    expect(result.nextPhase).toBe("longBreak");
    expect(result.completedSessions).toBe(1);
  });
});
