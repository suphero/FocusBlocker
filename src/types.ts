// ── Pomodoro Timer ──────────────────────────────

export type PomodoroPhase = "idle" | "focus" | "shortBreak" | "longBreak";

export interface PomodoroState {
  focusDuration: number; // minutes, default 25
  shortBreakDuration: number; // minutes, default 5
  longBreakDuration: number; // minutes, default 15
  sessionsBeforeLong: number; // default 4
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  // Runtime state (persisted for service worker restarts)
  phase: PomodoroPhase;
  completedSessions: number; // resets after long break
  endTime: number | null; // epoch ms when current phase ends
}

// ── Schedule ────────────────────────────────────

export interface Schedule {
  id: string;
  label: string;
  days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // "HH:MM" 24h format
  endTime: string; // "HH:MM" 24h format
  enabled: boolean;
}

// ── Password ────────────────────────────────────

export interface PasswordState {
  hash: string | null;
  salt: string | null;
  isEnabled: boolean;
  lastUnlockedAt: number | null; // epoch ms
}

// ── Categories ──────────────────────────────────

export interface Category {
  id: string;
  name: string;
  icon: string; // emoji
  websites: string[];
  enabled: boolean;
  isBuiltIn: boolean;
}

// ── Statistics ──────────────────────────────────

export interface StatsData {
  daily: Record<string, Record<string, number>>;
  // e.g. { "2026-02-23": { "facebook.com": 5, "x.com": 3 } }
}

// ── Enabled-by tracking ─────────────────────────

export type EnabledBy = "manual" | "schedule" | "pomodoro" | null;

// ── Full Storage Schema ─────────────────────────

export interface StorageSchema {
  schemaVersion: number;

  // Core
  enabled: boolean;
  websites: string[];
  enabledBy: EnabledBy;

  // Features
  pomodoro: PomodoroState;
  schedules: Schedule[];
  scheduleEnabled: boolean;
  password: PasswordState;
  categories: Category[];
  stats: StatsData;
}
