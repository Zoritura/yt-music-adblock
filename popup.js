document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggle');
  const countEl = document.getElementById('count');
  const resetBtn = document.getElementById('reset');
  const statusEl = document.getElementById('status');
  const dotEl = document.getElementById('statusDot');

  function render(enabled, total) {
    toggle.checked = enabled;
    countEl.textContent = total;
    statusEl.textContent = enabled ? 'Active' : 'Paused';
    dotEl.classList.toggle('off', !enabled);
  }

  chrome.storage.local.get({ enabled: true, totalBlocked: 0 }, (res) => {
    render(res.enabled, res.totalBlocked);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    chrome.storage.local.get({ enabled: true, totalBlocked: 0 }, (res) => {
      render(res.enabled, res.totalBlocked);
    });
  });

  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.storage.local.set({ enabled });
    statusEl.textContent = enabled ? 'Active' : 'Paused';
    dotEl.classList.toggle('off', !enabled);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'toggle', enabled }, () => {
          void chrome.runtime.lastError;
        });
      }
    });
  });

  resetBtn.addEventListener('click', () => {
    chrome.storage.local.set({ totalBlocked: 0 });
    chrome.action.setBadgeText({ text: '' });
  });
});
