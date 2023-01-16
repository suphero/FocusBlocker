function redirectIfBlocked(tab, blockedWebsites) {
  if (blockedWebsites.some(website => tab.url.includes(website))) {
    chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("blocked.html") });
  }
}

chrome.tabs.onUpdated.addListener(async function (_tabId, _changeInfo, tab) {
  const result = await chrome.storage.local.get(["enabled", "websites"]);
  if (!result || !result.websites || !result.enabled) {
    return;
  }
  redirectIfBlocked(tab, result.websites);
});

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    chrome.storage.local.set({ enabled: false, websites: ["facebook.com", "twitter.com", "instagram.com", "youtube.com", "whatsapp.com"] });
  }
});

// chrome.runtime.onUninstalled.addListener(function () {
//   chrome.storage.local.clear();
// });

chrome.storage.onChanged.addListener(async function (changes) {
  if (changes.enabled) {
    if (changes.enabled.newValue) {
      const result = await chrome.storage.local.get(["websites"]);
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          redirectIfBlocked(tab, result.websites);
        });
      });
      chrome.action.setIcon({
        path: {
          "16": "images/enabled16.png",
          "32": "images/enabled32.png",
          "48": "images/enabled48.png",
          "128": "images/enabled128.png"
        }
      });
    } else {
      chrome.action.setIcon({
        path: {
          "16": "images/disabled16.png",
          "32": "images/disabled32.png",
          "48": "images/disabled48.png",
          "128": "images/disabled128.png"
        }
      });
    }
  }
});
