# RecipeFriend – Recipe Transformer (Chrome MV3)

Convert recipe web pages into clean schema.org/Recipe JSON‑LD with metric units (grams/ml/°C). This repo includes a working Chrome Manifest V3 extension in `extension-chrome/` and a legacy Firefox MV2 build in `extension/` (kept for reference).

## Highlights

- Mozilla Readability extraction on-page
- Gemini 2.5 Flash JSON‑only output with robust parsing
- Metric conversions (cups → g/ml, °F → °C, etc.)
- Popup: preview + download; Options: API key + preferences
- New Diagnostics and Recent history in the popup

## Repo layout

- `extension-chrome/` – Primary MV3 extension
  - `manifest.json`, `background-v3.js`, `content.js`, `popup.*`, `options.*`, `readability.js`, `lib/browser-polyfill.min.js`
- `archive/extension-mv2/` – Legacy Firefox MV2 (reference only)
- `archive/` – Old bookmarklet prototype

## Load in Chrome (development)

1. Open chrome://extensions and enable Developer mode.
2. Click “Load unpacked” and select `extension-chrome/`.
3. Click the toolbar icon to open the popup.

## Configure API key

1. In the popup, click “Settings”.
2. Paste your Gemini API key (from Google AI Studio) and Save.
3. Optionally click “Test Connection”.

## Use it

1. Navigate to a recipe page (https://…).
2. Click “Transform Recipe” in the popup.
3. Review the preview; click “Download JSON”.
4. Keyboard shortcut: Ctrl+Shift+R also triggers a transform.

## Debugging tips

- Popup console: right‑click the popup → Inspect.
- Service worker: chrome://extensions → Details → “Service worker” → Inspect.
- Content script: open the page DevTools → Console.
- You can also click “Diagnostics” in the popup to run: ping → check → extract → transform, with step logs.

Common issues:
- “This page is not supported” → Chrome Web Store and chrome:// pages are restricted; use a normal site.
- “Content script not loaded” → Refresh the page and reopen the popup.
- “No text content found … (finishReason: MAX_TOKENS)” → The extension now truncates inputs, increases output budget, and retries with a concise prompt.

## Permissions & privacy

- Permissions: activeTab, tabs, storage, notifications, downloads; host permissions for http/https.
- API key is stored in browser sync storage.
- Page text is sent directly to Google’s API from your browser. No other server is involved.

## License

MIT – see `LICENSE`.

## Notes on the legacy folder

The `extension/` folder contains the earlier Firefox MV2 build. It’s no longer the primary target. Keep it around only if you need to reference prior code or port to Firefox MV3 later.