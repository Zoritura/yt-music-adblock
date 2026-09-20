# YT Music AdBlock

A lightweight browser extension for YouTube Music that removes ad data before the app can use it and hides any ads that still slip through.

This extension is aimed at Chromium-based browsers such as Opera GX and Chrome. The goal is simple: keep music playback clean while avoiding the common ad banners, overlays, and tracking requests that show up in YouTube Music.

## What it does

- strips ad-related fields from YouTube Music API responses before they reach the player
- hides ad banners, popups, and overlay elements in the page
- clicks the skip button when one is available
- mutes and advances the video if an ad is still playing
- tracks how many ads were stopped and shows the count in the extension badge

## Why this project exists

YouTube Music still loads ad metadata and UI elements even when playback is otherwise mostly ad-free. This extension intercepts that data and applies a quick DOM fallback so ads are less likely to interrupt the listening experience.

## Install

1. Open your browser's extension page.
2. Enable Developer Mode.
3. Choose Load unpacked.
4. Select this project folder.
5. Open YouTube Music and use the extension toggle in the popup.

## Files

- `background.js` handles the badge and block counter
- `content.js` watches for ad states in the page and removes visible ad elements
- `inject.js` patches network responses before the page reads them
- `popup.js` powers the extension toggle in the popup
- `rules.json` contains the declarative network rules for extra filtering

## Notes

This is a small extension built for personal use, but it is organized well enough to modify or expand if you want to tune the ad-detection rules for your browser or region.

