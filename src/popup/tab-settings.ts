import { getStorage, setStorage, STORAGE_DEFAULTS } from "../storage";
import type { StorageSchema } from "../types";
import { requirePassword, UNLOCK_DURATION } from "./password-modal";
import { hashPassword, generateSalt } from "../crypto-utils";
import { t } from "../i18n-utils";
import { showOnboarding } from "./onboarding";

let refreshBlockerChipsFn: (() => Promise<void>) | null = null;

// ── Password settings ────────────────────────────

let countdownInterval: ReturnType<typeof setInterval> | null = null;

async function initPasswordSettings(): Promise<void> {
  const data = await getStorage();
  const setBtn = document.getElementById("setPasswordBtn") as HTMLButtonElement;
  const removeBtn = document.getElementById("removePasswordBtn") as HTMLButtonElement;
  const form = document.getElementById("passwordSetupForm") as HTMLDivElement;

  updatePasswordUI(data.password.isEnabled);

  setBtn.addEventListener("click", () => {
    form.classList.toggle("open");
  });

  removeBtn.addEventListener("click", async () => {
    const allowed = await requirePassword();
    if (!allowed) return;

    await setStorage({
      password: { hash: null, salt: null, isEnabled: false, lastUnlockedAt: null },
    });
    updatePasswordUI(false);
  });

  document.getElementById("savePasswordBtn")?.addEventListener("click", async () => {
    const pw1 = (document.getElementById("newPassword1") as HTMLInputElement).value;
    const pw2 = (document.getElementById("newPassword2") as HTMLInputElement).value;
    const pwError = document.getElementById("pwSetupError") as HTMLDivElement;

    if (!pw1 || pw1.length < 4) {
      pwError.textContent = t("minChars");
      pwError.classList.remove("hidden");
      return;
    }
    if (pw1 !== pw2) {
      pwError.textContent = t("passwordsDontMatch");
      pwError.classList.remove("hidden");
      return;
    }

    const salt = generateSalt();
    const hash = await hashPassword(pw1, salt);
    await setStorage({
      password: { hash, salt, isEnabled: true, lastUnlockedAt: Date.now() },
    });

    pwError.classList.add("hidden");
    (document.getElementById("newPassword1") as HTMLInputElement).value = "";
    (document.getElementById("newPassword2") as HTMLInputElement).value = "";
    form.classList.remove("open");
    updatePasswordUI(true);
  });

  window.addEventListener("password-unlocked", () => startUnlockCountdown());
}

function updatePasswordUI(isEnabled: boolean): void {
  const setBtn = document.getElementById("setPasswordBtn") as HTMLButtonElement;
  const removeBtn = document.getElementById("removePasswordBtn") as HTMLButtonElement;

  if (isEnabled) {
    setBtn.textContent = t("changePassword");
    removeBtn.classList.remove("hidden");
  } else {
    setBtn.textContent = t("setPassword");
    removeBtn.classList.add("hidden");
  }

  startUnlockCountdown();
}

async function startUnlockCountdown(): Promise<void> {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  const el = document.getElementById("unlockCountdown") as HTMLDivElement;
  const data = await getStorage();

  if (!data.password.isEnabled || !data.password.lastUnlockedAt) {
    el.classList.add("hidden");
    return;
  }

  const tick = () => {
    const remaining = UNLOCK_DURATION - (Date.now() - data.password.lastUnlockedAt!);
    if (remaining <= 0) {
      el.textContent = t("locked");
      el.classList.remove("hidden", "unlock-countdown--active");
      el.classList.add("unlock-countdown--locked");
      clearInterval(countdownInterval!);
      countdownInterval = null;
      return;
    }

    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    el.textContent = `${t("unlocked")} \u2022 ${mins}:${secs.toString().padStart(2, "0")}`;
    el.classList.remove("hidden", "unlock-countdown--locked");
    el.classList.add("unlock-countdown--active");
  };

  tick();
  countdownInterval = setInterval(tick, 1000);
}

// ── Notification settings ───────────────────────

function updateNotifLabel(enabled: boolean): void {
  const label = document.getElementById("notifToggleLabel") as HTMLSpanElement;
  label.textContent = enabled ? t("remindersOn") : t("remindersOff");
  label.classList.toggle("active", enabled);
}

async function initNotificationSettings(): Promise<void> {
  const data = await getStorage();
  const notifCheckbox = document.getElementById("notifEnabled") as HTMLInputElement;
  const notifInterval = document.getElementById("notifInterval") as HTMLSelectElement;
  const notifIntervalRow = document.getElementById("notifIntervalRow") as HTMLDivElement;

  notifCheckbox.checked = data.notifications.enabled;
  notifInterval.value = String(data.notifications.intervalMinutes);
  updateNotifLabel(data.notifications.enabled);
  notifIntervalRow.classList.toggle("hidden", !data.notifications.enabled);

  notifCheckbox.addEventListener("change", async () => {
    const enabled = notifCheckbox.checked;
    updateNotifLabel(enabled);
    notifIntervalRow.classList.toggle("hidden", !enabled);
    await setStorage({ notifications: { enabled, intervalMinutes: Number(notifInterval.value) } });
  });

  notifInterval.addEventListener("change", async () => {
    await setStorage({
      notifications: { enabled: notifCheckbox.checked, intervalMinutes: Number(notifInterval.value) },
    });
  });
}

// ── Import / Export ─────────────────────────────

function showDataFeedback(message: string, success: boolean): void {
  const el = document.getElementById("dataFeedback") as HTMLDivElement;
  el.textContent = message;
  el.className = `data-feedback data-feedback--${success ? "success" : "error"}`;
  setTimeout(() => el.classList.add("hidden"), 3000);
}

async function exportSettings(): Promise<void> {
  try {
    const data = await getStorage();
    const exportData: Partial<StorageSchema> = {
      ...data,
      pomodoro: { ...data.pomodoro, phase: "idle", completedSessions: 0, endTime: null },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `focus-blocker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showDataFeedback(t("settingsExported"), true);
  } catch (error) {
    console.error("Failed to export settings:", error);
    showDataFeedback(t("exportFailed"), false);
  }
}

function isValidImport(data: unknown): data is Partial<StorageSchema> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return false;
  const obj = data as Record<string, unknown>;
  const knownKeys = Object.keys(STORAGE_DEFAULTS);
  return knownKeys.some((key) => key in obj);
}

async function importSettings(file: File): Promise<void> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!isValidImport(data)) {
      showDataFeedback(t("invalidBackupFile"), false);
      return;
    }

    const merged = { ...STORAGE_DEFAULTS, ...data };
    merged.pomodoro = { ...merged.pomodoro, phase: "idle", completedSessions: 0, endTime: null };

    await setStorage(merged);

    if (refreshBlockerChipsFn) {
      await refreshBlockerChipsFn();
    }

    // Re-sync toggle UI on blocker tab
    const enabled = merged.enabled;
    const checkbox = document.getElementById("enabled") as HTMLInputElement | null;
    if (checkbox) {
      checkbox.checked = enabled;
      const label = document.getElementById("toggleLabel") as HTMLSpanElement | null;
      if (label) {
        label.textContent = enabled ? t("focusModeOn") : t("focusModeOff");
        label.classList.toggle("active", enabled);
      }
    }

    showDataFeedback(t("settingsImported"), true);
  } catch (error) {
    console.error("Failed to import settings:", error);
    showDataFeedback(t("invalidJsonFile"), false);
  }
}

function initDataActions(): void {
  const exportBtn = document.getElementById("exportBtn") as HTMLButtonElement;
  const importBtn = document.getElementById("importBtn") as HTMLButtonElement;
  const importFile = document.getElementById("importFile") as HTMLInputElement;

  exportBtn.addEventListener("click", exportSettings);
  importBtn.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", () => {
    const file = importFile.files?.[0];
    if (file) {
      importSettings(file);
      importFile.value = "";
    }
  });
}

// ── Public init ─────────────────────────────────

export async function initSettingsTab(refreshBlockerChips: () => Promise<void>): Promise<void> {
  refreshBlockerChipsFn = refreshBlockerChips;

  initDataActions();
  initNotificationSettings();
  await initPasswordSettings();

  document.getElementById("showOnboardingBtn")?.addEventListener("click", showOnboarding);
}
