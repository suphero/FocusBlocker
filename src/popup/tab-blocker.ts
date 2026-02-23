import { extractDomain } from "../url-utils";
import { getStorage, setStorage } from "../storage";
import type { BlockMode } from "../types";
import { requirePassword } from "./password-modal";
import type { Category } from "../types";
import { t } from "../i18n-utils";

let websites: string[] = [];
let categories: Category[] = [];
let blockMode: BlockMode = "blacklist";
let whitelist: string[] = [];

function renderChips(): void {
  const container = document.getElementById("chipList") as HTMLDivElement;
  container.innerHTML = "";

  const enabledCategories = categories.filter((c) => c.enabled);
  const hasAnySites = websites.length > 0 || enabledCategories.some((c) => c.websites.length > 0);

  if (!hasAnySites) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = t("noWebsitesBlocked");
    container.appendChild(empty);
    return;
  }

  // Individual websites (removable)
  for (const site of websites) {
    const chip = document.createElement("span");
    chip.className = "chip";

    const label = document.createTextNode(site);
    chip.appendChild(label);

    const removeBtn = document.createElement("button");
    removeBtn.className = "chip-remove";
    removeBtn.textContent = "\u00d7";
    removeBtn.title = t("removeSite", site);
    removeBtn.addEventListener("click", () => removeWebsite(site));
    chip.appendChild(removeBtn);

    container.appendChild(chip);
  }

  // Category websites (read-only, skip duplicates already in websites[])
  const individualSet = new Set(websites);
  for (const cat of enabledCategories) {
    for (const site of cat.websites) {
      if (individualSet.has(site)) continue;

      const chip = document.createElement("span");
      chip.className = "chip chip-category";
      chip.title = cat.name;

      const icon = document.createElement("span");
      icon.className = "chip-category-icon";
      icon.textContent = cat.icon;
      chip.appendChild(icon);

      const label = document.createTextNode(site);
      chip.appendChild(label);

      container.appendChild(chip);
    }
  }
}

function renderWhitelistChips(): void {
  const container = document.getElementById("whitelistChipList") as HTMLDivElement;
  container.innerHTML = "";

  if (whitelist.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = t("noWebsitesAllowed");
    container.appendChild(empty);
    return;
  }

  for (const site of whitelist) {
    const chip = document.createElement("span");
    chip.className = "chip";

    const label = document.createTextNode(site);
    chip.appendChild(label);

    const removeBtn = document.createElement("button");
    removeBtn.className = "chip-remove";
    removeBtn.textContent = "\u00d7";
    removeBtn.title = t("removeSite", site);
    removeBtn.addEventListener("click", () => removeWhitelistSite(site));
    chip.appendChild(removeBtn);

    container.appendChild(chip);
  }
}

async function addWhitelistSite(input: string): Promise<void> {
  const domain = extractDomain(input);
  if (!domain) return;
  if (whitelist.includes(domain)) return;

  whitelist.push(domain);
  renderWhitelistChips();
  await setStorage({ whitelist });

  const whitelistInput = document.getElementById("whitelistInput") as HTMLInputElement;
  whitelistInput.value = "";
  whitelistInput.focus();
}

async function removeWhitelistSite(domain: string): Promise<void> {
  const allowed = await requirePassword();
  if (!allowed) return;

  whitelist = whitelist.filter((w) => w !== domain);
  renderWhitelistChips();
  await setStorage({ whitelist });
}

function switchMode(mode: BlockMode): void {
  blockMode = mode;

  const blacklistBtn = document.getElementById("blacklistModeBtn") as HTMLButtonElement;
  const whitelistBtn = document.getElementById("whitelistModeBtn") as HTMLButtonElement;
  const blacklistSection = document.getElementById("blacklistSection") as HTMLDivElement;
  const whitelistSection = document.getElementById("whitelistSection") as HTMLDivElement;

  blacklistBtn.classList.toggle("active", mode === "blacklist");
  whitelistBtn.classList.toggle("active", mode === "whitelist");
  blacklistSection.classList.toggle("hidden", mode !== "blacklist");
  whitelistSection.classList.toggle("hidden", mode !== "whitelist");
}

async function addWebsite(input: string): Promise<void> {
  const domain = extractDomain(input);
  if (!domain) return;
  if (websites.includes(domain)) return;

  websites.push(domain);
  renderChips();
  await saveWebsites();

  const siteInput = document.getElementById("siteInput") as HTMLInputElement;
  siteInput.value = "";
  siteInput.focus();
}

async function removeWebsite(domain: string): Promise<void> {
  const allowed = await requirePassword();
  if (!allowed) return;

  websites = websites.filter((w) => w !== domain);
  renderChips();
  await saveWebsites();
}

async function saveWebsites(): Promise<void> {
  try {
    await setStorage({ websites });
  } catch (error) {
    console.error("Failed to save websites:", error);
  }
}

function updateToggleLabel(enabled: boolean): void {
  const label = document.getElementById("toggleLabel") as HTMLSpanElement;
  label.textContent = enabled ? t("focusModeOn") : t("focusModeOff");
  label.classList.toggle("active", enabled);
}

async function onToggleChange(checkbox: HTMLInputElement): Promise<void> {
  const enabled = checkbox.checked;

  // Require password to turn OFF
  if (!enabled) {
    const allowed = await requirePassword();
    if (!allowed) {
      checkbox.checked = true; // revert
      return;
    }
  }

  updateToggleLabel(enabled);
  try {
    await setStorage({ enabled, enabledBy: enabled ? "manual" : null });
  } catch (error) {
    console.error("Failed to save toggle:", error);
  }
}

export async function refreshBlockerChips(): Promise<void> {
  try {
    const data = await getStorage();
    websites = data.websites || [];
    categories = data.categories || [];
    whitelist = data.whitelist || [];
    blockMode = data.blockMode || "blacklist";
    renderChips();
    renderWhitelistChips();
    switchMode(blockMode);
  } catch (error) {
    console.error("Failed to refresh blocker chips:", error);
  }
}

export async function initBlockerTab(): Promise<void> {
  try {
    const data = await getStorage();
    const enabled = data.enabled;
    (document.getElementById("enabled") as HTMLInputElement).checked = enabled;
    updateToggleLabel(enabled);
    websites = data.websites || [];
    categories = data.categories || [];
    blockMode = data.blockMode || "blacklist";
    whitelist = data.whitelist || [];
    renderChips();
    renderWhitelistChips();
    switchMode(blockMode);
  } catch (error) {
    console.error("Failed to load blocker settings:", error);
  }

  const enabledCheckbox = document.getElementById("enabled") as HTMLInputElement;
  enabledCheckbox.addEventListener("change", () => {
    onToggleChange(enabledCheckbox);
  });

  // Mode toggle
  document.getElementById("blacklistModeBtn")!.addEventListener("click", async () => {
    switchMode("blacklist");
    await setStorage({ blockMode: "blacklist" });
  });
  document.getElementById("whitelistModeBtn")!.addEventListener("click", async () => {
    switchMode("whitelist");
    await setStorage({ blockMode: "whitelist" });
  });

  // Blacklist add site
  const siteInput = document.getElementById("siteInput") as HTMLInputElement;
  siteInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addWebsite(siteInput.value);
    }
  });

  document.getElementById("addBtn")!.addEventListener("click", () => {
    addWebsite(siteInput.value);
  });

  // Whitelist add site
  const whitelistInput = document.getElementById("whitelistInput") as HTMLInputElement;
  whitelistInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addWhitelistSite(whitelistInput.value);
    }
  });

  document.getElementById("whitelistAddBtn")!.addEventListener("click", () => {
    addWhitelistSite(whitelistInput.value);
  });
}
