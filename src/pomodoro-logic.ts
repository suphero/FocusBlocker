import type { PomodoroState, PomodoroPhase } from "./types";

export interface PomodoroTransition {
  nextPhase: PomodoroPhase;
  completedSessions: number;
  shouldBlock: boolean; // true = enable blocking, false = disable
}

/**
 * Pure function: given the current state when a phase ends,
 * compute the next phase and updated session count.
 */
export function getNextPhase(state: PomodoroState): PomodoroTransition {
  const { phase, completedSessions, sessionsBeforeLong } = state;

  switch (phase) {
    case "focus": {
      const newCompleted = completedSessions + 1;
      if (newCompleted >= sessionsBeforeLong) {
        return { nextPhase: "longBreak", completedSessions: newCompleted, shouldBlock: false };
      }
      return { nextPhase: "shortBreak", completedSessions: newCompleted, shouldBlock: false };
    }
    case "shortBreak":
      if (state.autoStartFocus) {
        return { nextPhase: "focus", completedSessions, shouldBlock: true };
      }
      return { nextPhase: "idle", completedSessions, shouldBlock: false };

    case "longBreak":
      return { nextPhase: "idle", completedSessions: 0, shouldBlock: false };

    default: // "idle" — shouldn't happen, but be safe
      return { nextPhase: "idle", completedSessions: 0, shouldBlock: false };
  }
}

export function getPhaseDuration(state: PomodoroState): number {
  switch (state.phase) {
    case "focus": return state.focusDuration;
    case "shortBreak": return state.shortBreakDuration;
    case "longBreak": return state.longBreakDuration;
    default: return 0;
  }
}
