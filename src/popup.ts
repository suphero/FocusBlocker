import { sanitizeWebsiteList } from "./url-utils";

const onSave = async (): Promise<void> => {
  const enabled = (document.getElementById("enabled") as HTMLInputElement).checked;
  const rawWebsites = (document.getElementById("websites") as HTMLTextAreaElement).value.split("\n");
  const websites = sanitizeWebsiteList(rawWebsites);
  try {
    await chrome.storage.local.set({ enabled, websites });
    window.close();
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
};

const init = async (): Promise<void> => {
  try {
    const result = await chrome.storage.local.get(["enabled", "websites"]);
    (document.getElementById("enabled") as HTMLInputElement).checked = (result.enabled as boolean) || false;
    const websites = result.websites as string[] | undefined;
    (document.getElementById("websites") as HTMLTextAreaElement).value = websites
      ? websites.join("\n")
      : "";
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
  document.getElementById("save")!.addEventListener("click", onSave);
};

document.addEventListener("DOMContentLoaded", init);
