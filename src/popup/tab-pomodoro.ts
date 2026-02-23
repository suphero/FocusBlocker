import { getStorage, setStorage } from "../storage";
import type { PomodoroPhase, PomodoroState } from "../types";
import { t } from "../i18n-utils";

let phase: PomodoroPhase = "idle";
let endTime: number | null = null;
let completedSessions = 0;
let sessionsBeforeLong = 4;
let focusDuration = 25;
let shortBreakDuration = 5;
let longBreakDuration = 15;
let countdownInterval: ReturnType<typeof setInterval> | null = null;

function getPhaseLabel(p: PomodoroPhase): string {
  switch (p) {
    case "idle": return t("timerReady");
    case "focus": return t("timerFocus");
    case "shortBreak": return t("timerShortBreak");
    case "longBreak": return t("timerLongBreak");
  }
}

function getPhaseDuration(p: PomodoroPhase): number {
  switch (p) {
    case "focus": return focusDuration;
    case "shortBreak": return shortBreakDuration;
    case "longBreak": return longBreakDuration;
    default: return 0;
  }
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateDisplay(): void {
  const timerText = document.getElementById("timerText") as HTMLDivElement;
  const phaseLabel = document.getElementById("phaseLabel") as HTMLDivElement;
  const progressRing = document.getElementById("progressRing") as HTMLDivElement;

  phaseLabel.textContent = getPhaseLabel(phase);

  if (phase === "idle" || endTime === null) {
    timerText.textContent = `${String(focusDuration).padStart(2, "0")}:00`;
    progressRing.style.setProperty("--progress", "0");
    return;
  }

  const remaining = endTime - Date.now();
  const totalDuration = getPhaseDuration(phase) * 60 * 1000;
  const elapsed = totalDuration - remaining;
  const progress = Math.min(1, Math.max(0, elapsed / totalDuration));

  timerText.textContent = formatTime(remaining);
  progressRing.style.setProperty("--progress", String(progress));

  if (remaining <= 0) {
    // Timer ended — background.ts handles the transition via alarm
    // We just show 00:00 and wait for storage update
    timerText.textContent = "00:00";
    progressRing.style.setProperty("--progress", "1");
  }
}

function renderSessionDots(): void {
  const container = document.getElementById("sessionDots") as HTMLDivElement;
  container.innerHTML = "";

  for (let i = 0; i < sessionsBeforeLong; i++) {
    const dot = document.createElement("span");
    dot.className = "session-dot";
    if (i < completedSessions) {
      dot.classList.add("completed");
    }
    container.appendChild(dot);
  }
}

function updateButtons(): void {
  const startBtn = document.getElementById("pomodoroStart") as HTMLButtonElement;
  const skipBtn = document.getElementById("pomodoroSkip") as HTMLButtonElement;
  const resetBtn = document.getElementById("pomodoroReset") as HTMLButtonElement;

  if (phase === "idle") {
    startBtn.textContent = t("startFocus");
    startBtn.disabled = false;
    skipBtn.disabled = true;
    resetBtn.disabled = true;
  } else {
    startBtn.textContent = t("running");
    startBtn.disabled = true;
    skipBtn.disabled = false;
    resetBtn.disabled = false;
  }
}

function startCountdown(): void {
  stopCountdown();
  updateDisplay();
  countdownInterval = setInterval(updateDisplay, 1000);
}

function stopCountdown(): void {
  if (countdownInterval !== null) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

async function startFocus(): Promise<void> {
  const end = Date.now() + focusDuration * 60 * 1000;

  phase = "focus";
  endTime = end;

  try {
    // Create alarms for background.ts to handle
    chrome.alarms.create("pomodoro-end", { delayInMinutes: focusDuration });
    chrome.alarms.create("pomodoro-tick", { periodInMinutes: 1 });

    await setStorage({
      pomodoro: {
        focusDuration,
        shortBreakDuration,
        longBreakDuration,
        sessionsBeforeLong,
        autoStartBreaks: true,
        autoStartFocus: false,
        phase: "focus",
        completedSessions,
        endTime: end,
      },
      enabled: true,
      enabledBy: "pomodoro",
    });
  } catch (error) {
    console.error("Failed to start pomodoro:", error);
    return;
  }

  updateButtons();
  startCountdown();
}

async function skipPhase(): Promise<void> {
  try {
    chrome.alarms.clear("pomodoro-end");
    chrome.runtime.sendMessage({ type: "pomodoro-skip" });
  } catch (error) {
    console.error("Failed to skip phase:", error);
  }
}

async function resetPomodoro(): Promise<void> {
  stopCountdown();
  phase = "idle";
  endTime = null;
  completedSessions = 0;

  try {
    chrome.alarms.clear("pomodoro-end");
    chrome.alarms.clear("pomodoro-tick");
    chrome.action.setBadgeText({ text: "" });

    await setStorage({
      pomodoro: {
        focusDuration,
        shortBreakDuration,
        longBreakDuration,
        sessionsBeforeLong,
        autoStartBreaks: true,
        autoStartFocus: false,
        phase: "idle",
        completedSessions: 0,
        endTime: null,
      },
    });
  } catch (error) {
    console.error("Failed to reset pomodoro:", error);
  }

  updateDisplay();
  updateButtons();
  renderSessionDots();
}

export async function initPomodoroTab(): Promise<void> {
  try {
    const data = await getStorage();
    const pom = data.pomodoro;
    phase = pom.phase;
    endTime = pom.endTime;
    completedSessions = pom.completedSessions;
    sessionsBeforeLong = pom.sessionsBeforeLong;
    focusDuration = pom.focusDuration;
    shortBreakDuration = pom.shortBreakDuration;
    longBreakDuration = pom.longBreakDuration;
  } catch (error) {
    console.error("Failed to load pomodoro settings:", error);
  }

  updateDisplay();
  updateButtons();
  renderSessionDots();

  if (phase !== "idle" && endTime !== null) {
    startCountdown();
  }

  document.getElementById("pomodoroStart")?.addEventListener("click", startFocus);
  document.getElementById("pomodoroSkip")?.addEventListener("click", skipPhase);
  document.getElementById("pomodoroReset")?.addEventListener("click", resetPomodoro);

  // Listen for storage changes (from background.ts alarm transitions)
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.pomodoro) {
      const pom = changes.pomodoro.newValue as PomodoroState;
      phase = pom.phase;
      endTime = pom.endTime;
      completedSessions = pom.completedSessions;

      updateDisplay();
      updateButtons();
      renderSessionDots();

      if (phase !== "idle" && endTime !== null) {
        startCountdown();
      } else {
        stopCountdown();
      }
    }
  });
}
