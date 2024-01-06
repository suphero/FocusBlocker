function redirectIfBlocked(tab, blockedWebsites) {
  const tabUrl = new URL(tab.url);
  const isBlockedSite = blockedWebsites.some((website) =>
    tabUrl.host.includes(website)
  );

  if (isBlockedSite) {
    const blockedUrl = encodeURIComponent(tab.url);
    const redirectUrl =
      chrome.runtime.getURL("blocked.html") + "?url=" + blockedUrl;

    chrome.tabs.update(tab.id, { url: redirectUrl });
  }
}

// redirectIfUnblocked will be given a tab and will see if the tab is on the blocked.html site.
// If it is, it will redirect the tab to the original url which can be found in the query params.
function redirectIfUnblocked(tab) {
  const tabUrl = new URL(tab.url);
  const blockedExtensionUrl = chrome.runtime.getURL("blocked.html");
  const isBlockedSite = tabUrl.href.includes(blockedExtensionUrl);

  if (isBlockedSite) {
    const params = new URLSearchParams(tabUrl.search);
    const originalUrl = params.get("url");
    if (originalUrl) {
      const decodedUrl = decodeURIComponent(originalUrl);
      chrome.tabs.update(tab.id, { url: decodedUrl });
    }
  }
}

const onActivatedListener = async function (activeInfo) {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  redirectIfEnabled(tab);
};

const onUpdatedListener = async function (_tabId, _changeInfo, tab) {
  redirectIfEnabled(tab);
};

const redirectIfEnabled = async function (tab) {
  const result = await chrome.storage.local.get(["enabled", "websites"]);
  if (!result || !result.websites || !result.enabled) {
    return;
  }
  redirectIfBlocked(tab, result.websites);
};

chrome.tabs.onActivated.addListener(onActivatedListener);
chrome.tabs.onUpdated.addListener(onUpdatedListener);

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    chrome.storage.local.set({ enabled: false, websites: ["facebook.com", "twitter.com", "instagram.com", "youtube.com", "whatsapp.com"] });
  }
});

// chrome.runtime.onUninstalled.addListener(function () {
//   chrome.storage.local.clear();
// });

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

chrome.storage.onChanged.addListener(async function (changes) {
  if (changes.enabled) {
    if (changes.enabled.newValue) {
      const result = await chrome.storage.local.get(["websites"]);
      const tab = await getCurrentTab();
      redirectIfBlocked(tab, result.websites);
      
      chrome.action.setIcon({
        path: {
          "16": "images/enabled16.png",
          "32": "images/enabled32.png",
          "48": "images/enabled48.png",
          "128": "images/enabled128.png"
        }
      });
    } else {
      // Disabled focus mode, redirect sites back to their original unblocked state.
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          redirectIfUnblocked(tab);
        });
      });

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
