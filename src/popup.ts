const onSave = (): void => {
  const enabled = (document.getElementById("enabled") as HTMLInputElement).checked;
  const rawWebsites = (document.getElementById("websites") as HTMLTextAreaElement).value.split("\n");
  const websites = [...new Set(rawWebsites)];
  chrome.storage.local.set({ enabled, websites }, () => {
    window.close();
  });
};

const init = async (): Promise<void> => {
  const result = await chrome.storage.local.get(["enabled", "websites"]);
  (document.getElementById("enabled") as HTMLInputElement).checked = (result.enabled as boolean) || false;
  const websites = result.websites as string[] | undefined;
  (document.getElementById("websites") as HTMLTextAreaElement).value = websites
    ? websites.join("\n")
    : "";
  document.getElementById("save")!.addEventListener("click", onSave);
};

document.addEventListener("DOMContentLoaded", init);
