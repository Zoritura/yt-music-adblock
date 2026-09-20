(function () {
  'use strict';

  let enabled = true;
  let adWasShowing = false;

  chrome.storage.local.get({ enabled: true }, (res) => {
    enabled = res.enabled;
    dispatchToggle(enabled);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.enabled) {
      enabled = changes.enabled.newValue;
      dispatchToggle(enabled);
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'toggle') {
      enabled = !!msg.enabled;
      dispatchToggle(enabled);
    }
  });

  function dispatchToggle(val) {
    window.dispatchEvent(new CustomEvent('__ytmab_toggle', { detail: { enabled: val } }));
  }

  window.addEventListener('__ytmab_ad_stripped', () => {
    chrome.runtime.sendMessage({ type: 'adBlocked' });
  });

  const SKIP_SELECTORS = [
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    '.ytp-skip-ad-button',
    '.ytp-ad-skip-button-container button'
  ];

  const HIDE_SELECTORS = [
    'ytmusic-mealbar-promo-renderer',
    'ytmusic-statement-banner-renderer',
    'ytmusic-companion-slot',
    'yt-mealbar-promo-renderer',
    '.ytp-ad-overlay-container',
    '.ytp-ad-image-overlay',
    'ytmusic-popup-container tp-yt-paper-dialog[has-ad]'
  ];

  function clickSkipButtons() {
    for (const sel of SKIP_SELECTORS) {
      const btn = document.querySelector(sel);
      if (btn) {
        try {
          btn.click();
        } catch (error) {
          // ignore browser-specific click errors
        }
      }
    }
  }

  function removeAdElements() {
    for (const sel of HIDE_SELECTORS) {
      document.querySelectorAll(sel).forEach((el) => el.remove());
    }
  }

  function isAdShowing() {
    const body = document.body;
    if (!body) return false;

    if (body.classList.contains('ad-showing') || body.classList.contains('ad-interrupting')) {
      return true;
    }

    const playerBar = document.querySelector('ytmusic-player-bar');
    if (playerBar && playerBar.hasAttribute('ad-showing')) return true;

    const player = document.querySelector('#movie_player, ytmusic-player');
    if (player && player.classList && player.classList.contains('ad-showing')) return true;

    return false;
  }

  function handleAdPlayback() {
    const video = document.querySelector('video');
    if (!video) return;

    const showing = isAdShowing();
    if (showing) {
      video.muted = true;
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
        video.currentTime = video.duration;
      }
      try {
        video.playbackRate = 16;
      } catch (error) {
        // ignore if the browser disallows rate changes
      }
      clickSkipButtons();
      if (!adWasShowing) {
        chrome.runtime.sendMessage({ type: 'adBlocked' });
      }
    } else {
      if (video.muted) video.muted = false;
      if (video.playbackRate !== 1) {
        try {
          video.playbackRate = 1;
        } catch (error) {
          // ignore if the browser disallows rate changes
        }
      }
    }

    adWasShowing = showing;
  }

  function tick() {
    if (!enabled) return;
    handleAdPlayback();
    removeAdElements();
  }

  const observer = new MutationObserver(tick);

  function start() {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'ad-showing', 'has-ad']
    });

    setInterval(tick, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
