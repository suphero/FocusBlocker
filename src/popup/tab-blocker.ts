import { extractDomain } from "../url-utils";
import { getStorage, setStorage } from "../storage";
import { requirePassword, UNLOCK_DURATION } from "./password-modal";
import { hashPassword, generateSalt } from "../crypto-utils";
import type { Category } from "../types";

let websites: string[] = [];
let categories: Category[] = [];

function renderChips(): void {
  const container = document.getElementById("chipList") as HTMLDivElement;
  container.innerHTML = "";

  const enabledCategories = categories.filter((c) => c.enabled);
  const hasAnySites = websites.length > 0 || enabledCategories.some((c) => c.websites.length > 0);

  if (!hasAnySites) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No websites blocked yet.";
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
    removeBtn.title = "Remove " + site;
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
  label.textContent = enabled ? "Focus Mode: ON" : "Focus Mode: OFF";
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
    renderChips();
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
    renderChips();
  } catch (error) {
    console.error("Failed to load blocker settings:", error);
  }

  const enabledCheckbox = document.getElementById("enabled") as HTMLInputElement;
  enabledCheckbox.addEventListener("change", () => {
    onToggleChange(enabledCheckbox);
  });

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

  // Password setup
  await initPasswordSettings();
}

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
      pwError.textContent = "Minimum 4 characters";
      pwError.classList.remove("hidden");
      return;
    }
    if (pw1 !== pw2) {
      pwError.textContent = "Passwords don't match";
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
}

function updatePasswordUI(isEnabled: boolean): void {
  const setBtn = document.getElementById("setPasswordBtn") as HTMLButtonElement;
  const removeBtn = document.getElementById("removePasswordBtn") as HTMLButtonElement;

  if (isEnabled) {
    setBtn.textContent = "Change Password";
    removeBtn.classList.remove("hidden");
  } else {
    setBtn.textContent = "Set Password";
    removeBtn.classList.add("hidden");
  }

  startUnlockCountdown();
}

// ── Unlock countdown ────────────────────────────

let countdownInterval: ReturnType<typeof setInterval> | null = null;

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
      el.textContent = "Locked";
      el.classList.remove("hidden", "unlock-countdown--active");
      el.classList.add("unlock-countdown--locked");
      clearInterval(countdownInterval!);
      countdownInterval = null;
      return;
    }

    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    el.textContent = `Unlocked \u2022 ${mins}:${secs.toString().padStart(2, "0")}`;
    el.classList.remove("hidden", "unlock-countdown--locked");
    el.classList.add("unlock-countdown--active");
  };

  tick();
  countdownInterval = setInterval(tick, 1000);
}
