import { isDomainBlocked, isValidHttpUrl } from "./url-utils";
import { getStorage, setStorage, getEffectiveBlockList, migrateStorage } from "./storage";
import { pruneOldStats } from "./stats-utils";
import { isWithinSchedule } from "./schedule-utils";
import { getNextPhase } from "./pomodoro-logic";

function redirectIfBlocked(tab: chrome.tabs.Tab, blockedWebsites: string[]): void {
  if (!tab.url || !tab.id) return;

  const tabUrl = new URL(tab.url);
  const blockedDomain = blockedWebsites.find((website) =>
    isDomainBlocked(tabUrl.host, website),
  );

  if (blockedDomain) {
    const blockedUrl = encodeURIComponent(tab.url);
    const redirectUrl =
      chrome.runtime.getURL("blocked.html") + "?url=" + blockedUrl;

    chrome.tabs.update(tab.id, { url: redirectUrl });

    // Track stat (fire-and-forget)
    trackBlockedStat(blockedDomain);
  }
}

async function trackBlockedStat(domain: string): Promise<void> {
  try {
    const data = await getStorage();
    const today = new Date().toISOString().slice(0, 10);
    const daily = { ...data.stats.daily };
    if (!daily[today]) daily[today] = {};
    daily[today] = { ...daily[today], [domain]: (daily[today][domain] || 0) + 1 };
    await setStorage({ stats: { daily } });
  } catch (error) {
    console.error("Failed to track stat:", error);
  }
}

function redirectIfUnblocked(tab: chrome.tabs.Tab): void {
  if (!tab.url || !tab.id) return;

  const tabUrl = new URL(tab.url);
  const blockedExtensionUrl = chrome.runtime.getURL("blocked.html");
  const isBlockedSite = tabUrl.href.includes(blockedExtensionUrl);

  if (isBlockedSite) {
    const params = new URLSearchParams(tabUrl.search);
    const originalUrl = params.get("url");
    if (originalUrl) {
      const decodedUrl = decodeURIComponent(originalUrl);
      if (isValidHttpUrl(decodedUrl)) {
        chrome.tabs.update(tab.id, { url: decodedUrl });
      }
    }
  }
}

const onActivatedListener = async (activeInfo: chrome.tabs.OnActivatedInfo): Promise<void> => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  redirectIfEnabled(tab);
};

const onUpdatedListener = async (
  _tabId: number,
  _changeInfo: chrome.tabs.OnUpdatedInfo,
  tab: chrome.tabs.Tab,
): Promise<void> => {
  redirectIfEnabled(tab);
};

const redirectIfEnabled = async (tab: chrome.tabs.Tab): Promise<void> => {
  try {
    const data = await getStorage();
    if (!data.enabled) return;
    const blockList = getEffectiveBlockList(data);
    if (blockList.length === 0) return;
    redirectIfBlocked(tab, blockList);
  } catch (error) {
    console.error("Failed to read storage:", error);
  }
};

chrome.tabs.onActivated.addListener(onActivatedListener);
chrome.tabs.onUpdated.addListener(onUpdatedListener);

// ── Installation & migration ────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    await migrateStorage(details.reason);
  } catch (error) {
    console.error("Failed to migrate storage:", error);
  }

  // Set up alarms
  chrome.alarms.create("stats-prune", { periodInMinutes: 1440 }); // 24 hours
  chrome.alarms.create("schedule-check", { periodInMinutes: 1 }); // every minute
});

// ── Message handlers ────────────────────────────

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "pomodoro-skip") {
    handlePomodoroEnd();
  }
});

// ── Alarm handlers ──────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "stats-prune") {
    try {
      const data = await getStorage();
      const pruned = pruneOldStats(data.stats);
      await setStorage({ stats: pruned });
    } catch (error) {
      console.error("Failed to prune stats:", error);
    }
  }

  if (alarm.name === "schedule-check") {
    await handleScheduleCheck();
  }

  if (alarm.name === "pomodoro-end") {
    await handlePomodoroEnd();
  }

  if (alarm.name === "pomodoro-tick") {
    await handlePomodoroTick();
  }
});

async function handlePomodoroEnd(): Promise<void> {
  try {
    const data = await getStorage();
    if (data.pomodoro.phase === "idle") return;

    const transition = getNextPhase(data.pomodoro);
    const nextPhase = transition.nextPhase;
    const completedSessions = transition.completedSessions;

    // Notification
    const messages: Record<string, { title: string; message: string }> = {
      shortBreak: { title: "Focus Complete!", message: "Time for a short break." },
      longBreak: { title: "Great work!", message: "Time for a long break. You've earned it!" },
      focus: { title: "Break Over!", message: "Time to focus again." },
      idle: { title: "Session Complete!", message: "All sessions done. Great work!" },
    };
    const msg = messages[nextPhase] || messages.idle;
    chrome.notifications.create("pomodoro-" + Date.now(), {
      type: "basic",
      iconUrl: "images/logo128.png",
      title: msg.title,
      message: msg.message,
    });

    if (nextPhase === "idle") {
      // Session complete — clear alarms and stop blocking
      chrome.alarms.clear("pomodoro-end");
      chrome.alarms.clear("pomodoro-tick");
      chrome.action.setBadgeText({ text: "" });

      await setStorage({
        pomodoro: { ...data.pomodoro, phase: "idle", completedSessions: 0, endTime: null },
        enabled: false,
        enabledBy: null,
      });
      return;
    }

    // Start next phase
    const duration = nextPhase === "focus"
      ? data.pomodoro.focusDuration
      : nextPhase === "shortBreak"
        ? data.pomodoro.shortBreakDuration
        : data.pomodoro.longBreakDuration;

    const endTime = Date.now() + duration * 60 * 1000;

    chrome.alarms.create("pomodoro-end", { delayInMinutes: duration });

    await setStorage({
      pomodoro: { ...data.pomodoro, phase: nextPhase, completedSessions, endTime },
      enabled: transition.shouldBlock,
      enabledBy: transition.shouldBlock ? "pomodoro" : null,
    });
  } catch (error) {
    console.error("Failed to handle pomodoro end:", error);
  }
}

async function handlePomodoroTick(): Promise<void> {
  try {
    const data = await getStorage();
    if (data.pomodoro.phase === "idle" || data.pomodoro.endTime === null) {
      chrome.action.setBadgeText({ text: "" });
      return;
    }

    const remaining = Math.max(0, data.pomodoro.endTime - Date.now());
    const minutes = Math.ceil(remaining / 60000);
    chrome.action.setBadgeText({ text: `${minutes}m` });
    chrome.action.setBadgeBackgroundColor({
      color: data.pomodoro.phase === "focus" ? "#d93025" : "#4caf50",
    });
  } catch (error) {
    console.error("Failed to update pomodoro badge:", error);
  }
}

async function handleScheduleCheck(): Promise<void> {
  try {
    const data = await getStorage();
    if (!data.scheduleEnabled) return;

    // Pomodoro takes priority — don't override it
    if (data.enabledBy === "pomodoro") return;

    const now = new Date();
    const shouldBeEnabled = isWithinSchedule(data.schedules, now);

    if (shouldBeEnabled && !data.enabled) {
      // Schedule wants blocking ON, and it's currently OFF
      // Only activate if not manually turned off
      if (data.enabledBy !== "manual") {
        await setStorage({ enabled: true, enabledBy: "schedule" });
      }
    } else if (!shouldBeEnabled && data.enabled && data.enabledBy === "schedule") {
      // Schedule window ended, and we're the ones who turned it on
      await setStorage({ enabled: false, enabledBy: null });
    }
  } catch (error) {
    console.error("Failed to check schedule:", error);
  }
}

// ── Icon sync on service worker startup ─────────

async function syncIcon(): Promise<void> {
  try {
    const data = await getStorage();
    const iconSet = data.enabled ? "enabled" : "disabled";
    chrome.action.setIcon({
      path: {
        "16": `images/${iconSet}16.png`,
        "32": `images/${iconSet}32.png`,
        "48": `images/${iconSet}48.png`,
        "128": `images/${iconSet}128.png`,
      },
    });
  } catch (error) {
    console.error("Failed to sync icon:", error);
  }
}
syncIcon();

// ── Icon & unblock on toggle ────────────────────

async function getCurrentTab(): Promise<chrome.tabs.Tab | undefined> {
  const queryOptions = { active: true, lastFocusedWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

chrome.storage.onChanged.addListener(async (changes) => {
  if (changes.enabled) {
    if (changes.enabled.newValue) {
      try {
        const data = await getStorage();
        const blockList = getEffectiveBlockList(data);
        const tab = await getCurrentTab();
        if (tab) {
          redirectIfBlocked(tab, blockList);
        }
      } catch (error) {
        console.error("Failed to read storage:", error);
      }

      chrome.action.setIcon({
        path: {
          "16": "images/enabled16.png",
          "32": "images/enabled32.png",
          "48": "images/enabled48.png",
          "128": "images/enabled128.png",
        },
      });
    } else {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          redirectIfUnblocked(tab);
        });
      });

      chrome.action.setIcon({
        path: {
          "16": "images/disabled16.png",
          "32": "images/disabled32.png",
          "48": "images/disabled48.png",
          "128": "images/disabled128.png",
        },
      });
    }
  }
});
