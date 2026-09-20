(function () {
  'use strict';

  let enabled = true;

  window.addEventListener('__ytmab_toggle', (event) => {
    enabled = !!(event.detail && event.detail.enabled);
  });

  const AD_KEYS = new Set([
    'adPlacements',
    'playerAds',
    'adSlots',
    'adBreakHeartbeatParams',
    'adBreakServiceUrl',
    'playerLegacyDesktopWatchAdsRenderer',
    'adSignalsInfo',
    'enabledEngageTypes',
    'adTargeting'
  ]);

  function stripAds(node, depth) {
    if (!enabled || depth > 50 || node === null || typeof node !== 'object') return node;
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        stripAds(node[i], depth + 1);
      }
      return node;
    }

    for (const key of Object.keys(node)) {
      if (AD_KEYS.has(key)) {
        delete node[key];
      } else {
        stripAds(node[key], depth + 1);
      }
    }

    return node;
  }

  function notifyStripped() {
    window.dispatchEvent(new CustomEvent('__ytmab_ad_stripped'));
  }

  const TARGET_PATTERNS = [
    '/youtubei/v1/player',
    '/youtubei/v1/next',
    '/youtubei/v1/browse',
    '/youtubei/v1/music/',
    '/youtubei/v1/reel',
    '/youtubei/v1/att/'
  ];

  function isTarget(url) {
    return typeof url === 'string' && TARGET_PATTERNS.some((pattern) => url.includes(pattern));
  }

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const request = args[0];
    const url = typeof request === 'string' ? request : (request && request.url) || '';
    const response = await originalFetch.apply(this, args);

    if (!enabled || !isTarget(url)) return response;

    try {
      const cloned = response.clone();
      const data = await cloned.json();
      const before = JSON.stringify(data).length;
      stripAds(data, 0);
      const after = JSON.stringify(data).length;

      if (after !== before) {
        notifyStripped();
      }

      return new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } catch (error) {
      return response;
    }
  };

  const OriginalXHR = window.XMLHttpRequest;
  function PatchedXHR() {
    const xhr = new OriginalXHR();
    const originalOpen = xhr.open.bind(xhr);

    xhr.open = function (method, url, ...rest) {
      xhr.__ytmab_url = url;
      return originalOpen(method, url, ...rest);
    };

    xhr.addEventListener('readystatechange', function () {
      if (xhr.readyState === 4 && enabled && isTarget(xhr.__ytmab_url)) {
        try {
          const data = JSON.parse(xhr.responseText);
          const before = xhr.responseText.length;
          stripAds(data, 0);
          const stripped = JSON.stringify(data);

          if (stripped.length !== before) {
            notifyStripped();
          }

          Object.defineProperty(xhr, 'responseText', { value: stripped, configurable: true });
          Object.defineProperty(xhr, 'response', { value: stripped, configurable: true });
        } catch (error) {
          // not JSON, or it was already consumed
        }
      }
    });

    return xhr;
  }

  PatchedXHR.prototype = OriginalXHR.prototype;
  window.XMLHttpRequest = PatchedXHR;

  const originalSendBeacon = navigator.sendBeacon ? navigator.sendBeacon.bind(navigator) : null;
  if (originalSendBeacon) {
    navigator.sendBeacon = function (url, data) {
      if (enabled && typeof url === 'string' && (url.includes('/api/stats/ads') || url.includes('/pagead/') || url.includes('/ptracking'))) {
        return true;
      }
      return originalSendBeacon(url, data);
    };
  }
})();
