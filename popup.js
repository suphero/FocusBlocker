const onSave = () => {
  const enabled = document.getElementById("enabled").checked;
  const rawWebsites = document.getElementById("websites").value.split("\n");
  const websites = [...new Set(rawWebsites)];
  chrome.storage.local.set({ enabled, websites }, () => {
    window.close();
  });
}

const init = async () => {
  const { enabled, websites } = await chrome.storage.local.get(["enabled", "websites"]);
  document.getElementById("enabled").checked = enabled || false;
  document.getElementById("websites").value = websites ? websites.join("\n") : '';
  document.getElementById("save").addEventListener("click", onSave);
}

document.addEventListener("DOMContentLoaded", init);
