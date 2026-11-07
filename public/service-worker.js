// Iterate's MV3 service worker is intentionally lightweight.
// Durable project state belongs in IndexedDB; service workers may be suspended.
chrome.runtime.onInstalled.addListener(() => {
  // First-run initialization will be added alongside the storage layer.
});