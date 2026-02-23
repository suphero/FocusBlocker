import { initBlockerTab, refreshBlockerChips } from "./popup/tab-blocker";
import { initPomodoroTab } from "./popup/tab-pomodoro";
import { initScheduleTab } from "./popup/tab-schedule";
import { initCategoriesTab } from "./popup/tab-categories";
import { initStatsTab } from "./popup/tab-stats";

function initTabs(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>(".tab-btn");
  const panels = document.querySelectorAll<HTMLDivElement>(".tab-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      if (!target) return;

      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(`tab-${target}`)?.classList.add("active");

      if (target === "blocker") {
        refreshBlockerChips();
      }
    });
  });
}

async function init(): Promise<void> {
  initTabs();

  await Promise.all([
    initBlockerTab(),
    initPomodoroTab(),
    initScheduleTab(),
    initCategoriesTab(),
    initStatsTab(),
  ]);
}

document.addEventListener("DOMContentLoaded", init);
