const onSave = () => {
  const enabled = document.getElementById("enabled").checked;
  const websites = document.getElementById("websites").value;
  const distinctWebsites = [...new Set(websites.split("\n"))].join("\n");
  chrome.storage.local.set({ enabled, websites: distinctWebsites }, () => {
    window.close();
  });
}

const init = async () => {
  const { enabled, websites } = await chrome.storage.local.get(["enabled", "websites"]);
  document.getElementById("enabled").checked = enabled || false;
  document.getElementById("websites").innerHTML = websites || '';
  document.getElementById("save").addEventListener("click", onSave);
}

document.addEventListener("DOMContentLoaded", init);
