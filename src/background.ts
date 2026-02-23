import { isDomainBlocked, isValidHttpUrl } from "./url-utils";

function redirectIfBlocked(tab: chrome.tabs.Tab, blockedWebsites: string[]): void {
  if (!tab.url || !tab.id) return;

  const tabUrl = new URL(tab.url);
  const isBlockedSite = blockedWebsites.some((website) =>
    isDomainBlocked(tabUrl.host, website),
  );

  if (isBlockedSite) {
    const blockedUrl = encodeURIComponent(tab.url);
    const redirectUrl =
      chrome.runtime.getURL("blocked.html") + "?url=" + blockedUrl;

    chrome.tabs.update(tab.id, { url: redirectUrl });
  }
}

function redirectIfUnblocked(tab: chrome.tabs.Tab): void {
  if (!tab.url || !tab.id) return;

  const tabUrl = new URL(tab.url);
  const blockedExtensionUrl = chrome.runtime.getURL("blocked.html");
  const isBlockedSite = tabUrl.href.includes(blockedExtensionUrl);

  if (isBlockedSite) {
    const params = new URLSearchParams(tabUrl.search);
    const originalUrl = params.get("url");
    if (originalUrl) {
      const decodedUrl = decodeURIComponent(originalUrl);
      if (isValidHttpUrl(decodedUrl)) {
        chrome.tabs.update(tab.id, { url: decodedUrl });
      }
    }
  }
}

const onActivatedListener = async (activeInfo: chrome.tabs.OnActivatedInfo): Promise<void> => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  redirectIfEnabled(tab);
};

const onUpdatedListener = async (
  _tabId: number,
  _changeInfo: chrome.tabs.OnUpdatedInfo,
  tab: chrome.tabs.Tab,
): Promise<void> => {
  redirectIfEnabled(tab);
};

const redirectIfEnabled = async (tab: chrome.tabs.Tab): Promise<void> => {
  try {
    const result = await chrome.storage.local.get(["enabled", "websites"]);
    if (!result || !result.websites || !result.enabled) {
      return;
    }
    redirectIfBlocked(tab, result.websites as string[]);
  } catch (error) {
    console.error("Failed to read storage:", error);
  }
};

chrome.tabs.onActivated.addListener(onActivatedListener);
chrome.tabs.onUpdated.addListener(onUpdatedListener);

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    try {
      await chrome.storage.local.set({
        enabled: false,
        websites: ["facebook.com", "x.com", "instagram.com", "youtube.com", "whatsapp.com"],
      });
    } catch (error) {
      console.error("Failed to set default settings:", error);
    }
  }
});

async function getCurrentTab(): Promise<chrome.tabs.Tab | undefined> {
  const queryOptions = { active: true, lastFocusedWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

chrome.storage.onChanged.addListener(async (changes) => {
  if (changes.enabled) {
    if (changes.enabled.newValue) {
      try {
        const result = await chrome.storage.local.get(["websites"]);
        const tab = await getCurrentTab();
        if (tab) {
          redirectIfBlocked(tab, result.websites as string[]);
        }
      } catch (error) {
        console.error("Failed to read websites from storage:", error);
      }

      chrome.action.setIcon({
        path: {
          "16": "images/enabled16.png",
          "32": "images/enabled32.png",
          "48": "images/enabled48.png",
          "128": "images/enabled128.png",
        },
      });
    } else {
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
          "128": "images/disabled128.png",
        },
      });
    }
  }
});
