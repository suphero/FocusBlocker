import { getStorage, setStorage } from "../storage";
import { aggregateStats, type StatsPeriod } from "../stats-utils";

let currentPeriod: StatsPeriod = "today";

function renderStats(aggregated: Record<string, number>): void {
  const container = document.getElementById("statsContent") as HTMLDivElement;
  container.innerHTML = "";

  const entries = Object.entries(aggregated).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  // Total count
  const totalEl = document.createElement("div");
  totalEl.className = "stats-total";
  totalEl.textContent = `${total} block${total !== 1 ? "s" : ""}`;
  container.appendChild(totalEl);

  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No blocked attempts yet.";
    container.appendChild(empty);
    return;
  }

  const maxCount = entries[0][1];

  for (const [domain, count] of entries) {
    const row = document.createElement("div");
    row.className = "stat-row";

    const domainEl = document.createElement("span");
    domainEl.className = "stat-domain";
    domainEl.textContent = domain;

    const barContainer = document.createElement("div");
    barContainer.className = "stat-bar-container";

    const bar = document.createElement("div");
    bar.className = "stat-bar";
    bar.style.width = `${(count / maxCount) * 100}%`;
    barContainer.appendChild(bar);

    const countEl = document.createElement("span");
    countEl.className = "stat-count";
    countEl.textContent = String(count);

    row.appendChild(domainEl);
    row.appendChild(barContainer);
    row.appendChild(countEl);
    container.appendChild(row);
  }
}

function updatePeriodButtons(): void {
  document.querySelectorAll(".stats-period-btn").forEach((btn) => {
    btn.classList.toggle("active", (btn as HTMLElement).dataset.period === currentPeriod);
  });
}

async function loadAndRender(): Promise<void> {
  try {
    const data = await getStorage();
    const aggregated = aggregateStats(data.stats, currentPeriod);
    renderStats(aggregated);
  } catch (error) {
    console.error("Failed to load stats:", error);
  }
}

async function resetStats(): Promise<void> {
  if (!confirm("Reset all statistics?")) return;
  try {
    await setStorage({ stats: { daily: {} } });
    await loadAndRender();
  } catch (error) {
    console.error("Failed to reset stats:", error);
  }
}

export async function initStatsTab(): Promise<void> {
  document.querySelectorAll(".stats-period-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentPeriod = (btn as HTMLElement).dataset.period as StatsPeriod;
      updatePeriodButtons();
      loadAndRender();
    });
  });

  document.getElementById("resetStats")?.addEventListener("click", resetStats);

  await loadAndRender();
}

