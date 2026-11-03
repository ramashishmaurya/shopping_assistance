// ShopMind AI — Background Service Worker

// Enable side panel to open when user clicks the extension action icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Error setting panel behavior:", error));

// Listen for tab updates to refresh data if user switches product page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
    chrome.runtime.sendMessage({ type: "TAB_UPDATED", tabId: tabId, url: tab.url }).catch(() => {
      // Side panel may not be open, ignore errors
    });
  }
});
