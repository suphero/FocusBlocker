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
