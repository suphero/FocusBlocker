import type { StorageSchema, PomodoroState, PasswordState, StatsData } from "./types";

// ── Current schema version ──────────────────────

const CURRENT_SCHEMA_VERSION = 2;

// ── Default values ──────────────────────────────

const DEFAULT_POMODORO: PomodoroState = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLong: 4,
  autoStartBreaks: true,
  autoStartFocus: false,
  phase: "idle",
  completedSessions: 0,
  endTime: null,
};

const DEFAULT_PASSWORD: PasswordState = {
  hash: null,
  salt: null,
  isEnabled: false,
  lastUnlockedAt: null,
};

const DEFAULT_STATS: StatsData = {
  daily: {},
};

export const STORAGE_DEFAULTS: StorageSchema = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  enabled: false,
  websites: ["facebook.com", "x.com", "instagram.com", "youtube.com", "whatsapp.com"],
  enabledBy: null,
  pomodoro: DEFAULT_POMODORO,
  schedules: [],
  scheduleEnabled: false,
  password: DEFAULT_PASSWORD,
  categories: [],
  stats: DEFAULT_STATS,
};

// ── Storage helpers ─────────────────────────────

export async function getStorage(): Promise<StorageSchema> {
  const result = await chrome.storage.local.get(null);
  return { ...STORAGE_DEFAULTS, ...result } as StorageSchema;
}

export async function setStorage(data: Partial<StorageSchema>): Promise<void> {
  await chrome.storage.local.set(data);
}

// ── Effective block list ────────────────────────

export function getEffectiveBlockList(data: StorageSchema): string[] {
  const sites = new Set<string>(data.websites);
  for (const cat of data.categories) {
    if (cat.enabled) {
      for (const site of cat.websites) {
        sites.add(site);
      }
    }
  }
  return Array.from(sites);
}

// ── Migration ───────────────────────────────────

export async function migrateStorage(reason: string): Promise<void> {
  const result = await chrome.storage.local.get(null) as Partial<StorageSchema>;

  if (reason === "install") {
    // Fresh install — set all defaults
    await chrome.storage.local.set(STORAGE_DEFAULTS);
    return;
  }

  // Upgrade from v1 (legacy) to v2
  if (!result.schemaVersion || result.schemaVersion < CURRENT_SCHEMA_VERSION) {
    const migrated: Partial<StorageSchema> = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      enabledBy: result.enabledBy ?? null,
      pomodoro: result.pomodoro ?? DEFAULT_POMODORO,
      schedules: result.schedules ?? [],
      scheduleEnabled: result.scheduleEnabled ?? false,
      password: result.password ?? DEFAULT_PASSWORD,
      categories: result.categories ?? [],
      stats: result.stats ?? DEFAULT_STATS,
    };
    await chrome.storage.local.set(migrated);
  }
}
