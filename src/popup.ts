import { extractDomain } from "./url-utils";

let websites: string[] = [];

function renderChips(): void {
  const container = document.getElementById("chipList") as HTMLDivElement;
  container.innerHTML = "";

  if (websites.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No websites blocked yet.";
    container.appendChild(empty);
    return;
  }

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
}

function addWebsite(input: string): void {
  const domain = extractDomain(input);
  if (!domain) return;
  if (websites.includes(domain)) return;

  websites.push(domain);
  renderChips();

  const siteInput = document.getElementById("siteInput") as HTMLInputElement;
  siteInput.value = "";
  siteInput.focus();
}

function removeWebsite(domain: string): void {
  websites = websites.filter((w) => w !== domain);
  renderChips();
}

function updateToggleLabel(enabled: boolean): void {
  const label = document.getElementById("toggleLabel") as HTMLSpanElement;
  label.textContent = enabled ? "Focus Mode: ON" : "Focus Mode: OFF";
  label.classList.toggle("active", enabled);
}

const onSave = async (): Promise<void> => {
  const enabled = (document.getElementById("enabled") as HTMLInputElement).checked;
  try {
    await chrome.storage.local.set({ enabled, websites });

    const saveBtn = document.getElementById("save") as HTMLButtonElement;
    saveBtn.textContent = "Saved!";
    saveBtn.classList.add("saved");

    setTimeout(() => window.close(), 1500);
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
};

const init = async (): Promise<void> => {
  try {
    const result = await chrome.storage.local.get(["enabled", "websites"]);
    const enabled = (result.enabled as boolean) || false;
    (document.getElementById("enabled") as HTMLInputElement).checked = enabled;
    updateToggleLabel(enabled);
    websites = (result.websites as string[]) || [];
    renderChips();
  } catch (error) {
    console.error("Failed to load settings:", error);
  }

  const enabledCheckbox = document.getElementById("enabled") as HTMLInputElement;
  enabledCheckbox.addEventListener("change", () => {
    updateToggleLabel(enabledCheckbox.checked);
  });

  document.getElementById("save")!.addEventListener("click", onSave);

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
};

document.addEventListener("DOMContentLoaded", init);
