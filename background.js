chrome.tabs.onUpdated.addListener(function (tabId, _changeInfo, tab) {
  chrome.storage.local.get(["enabled", "websites"], function (result) {
    if (!result || !result.websites || !result.enabled) {
      return;
    }
    let blockedWebsites = result.websites.split("\n");
    for (const element of blockedWebsites) {
      let website = element;
      if (tab.url.indexOf(website) !== -1) {
        chrome.tabs.update(tabId, { url: chrome.runtime.getURL("blocked.html") });
        console.log("This website is blocked.");
        return;
      }
    }
  });
});

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    chrome.storage.local.set({ enabled: false, websites: "facebook.com\ntwitter.com\ninstagram.com\nyoutube.com\nwhatsapp.com" });
  }
});

chrome.storage.onChanged.addListener(function (changes) {
  if (changes.enabled) {
    if (changes.enabled.newValue) {
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
