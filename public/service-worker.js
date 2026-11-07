// Iterate's service worker is intentionally lightweight.
// Interview generation runs in the open extension workspace. This worker handles
// notification clicks; it does not claim to keep network requests alive after tab closure.
chrome.notifications.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL("index.html");
  const tabs = await chrome.tabs.query({ url });
  if (tabs.length && tabs[0].id !== undefined) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    if (tabs[0].windowId !== undefined) await chrome.windows.update(tabs[0].windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url });
  }
});
