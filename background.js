// background.js — service worker. Tracks enabled state + blocked-ad
// counter in chrome.storage.local, and keeps the toolbar badge in sync.

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ enabled: true, totalBlocked: 0 }, (res) => {
    chrome.storage.local.set({ enabled: res.enabled, totalBlocked: res.totalBlocked });
    updateBadge(res.totalBlocked);
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get({ totalBlocked: 0 }, (res) => updateBadge(res.totalBlocked));
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === 'adBlocked') {
    chrome.storage.local.get({ totalBlocked: 0 }, (res) => {
      const total = res.totalBlocked + 1;
      chrome.storage.local.set({ totalBlocked: total });
      updateBadge(total);
    });
  }
});

function updateBadge(total) {
  const text = total > 999 ? '999+' : String(total || '');
  chrome.action.setBadgeText({ text: total ? text : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#e11d48' });
}
