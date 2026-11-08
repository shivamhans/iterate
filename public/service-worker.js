// Lightweight Manifest V3 worker for notification interactions.
// AI requests run in the open workspace; this worker does not keep network jobs alive.
chrome.notifications.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
});
