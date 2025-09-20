# Recipe Transformer (Firefox Extension)

Convert recipe web pages into clean schema.org/Recipe JSON‑LD with metric units (grams/ml/°C). This repo contains a working Firefox extension; Chrome (Manifest V3) is partially prepared.

## What it does

- Extracts main content from a recipe page using Mozilla Readability
- Sends the title and text to Google Gemini to produce JSON‑LD
- Applies simple, explicit metric conversion rules (cups → g/ml, °F → °C, etc.)
- Lets you download the result as a JSON file named after the recipe
- Stores your API key locally in browser sync storage

## Repository layout

- `extension/`
  - `manifest.json` (Firefox MV2), `manifest-v3.json` (Chrome MV3)
  - `background.js`, `background-v3.js` (AI call, icon state, commands)
  - `content.js` (page extraction, recipe detection)
  - `popup.html`/`popup.js` (manual transform, preview, download)
  - `options.html`/`options.js` (Gemini API key, prefs)
  - `readability.js` (vendored Mozilla Readability)
  - `icons/` (PNG icons; generator `create-icons.html`)
  - `setup.sh`, `package.sh`, `test-extension.sh`
- `archive/` (old bookmarklet prototype)
- Project docs: `README.md`, `SPEC.md`, `PROJECT_STATUS.md`

## How it works (data flow)

1. `content.js` runs on all pages. It injects `readability.js`, detects if the page looks like a recipe, and notifies background to set the icon title.
2. When you click the popup or press Ctrl+Shift+R:
	- `content.js` extracts `{ title, textContent, url }` via Readability.
	- `background.js` fetches `geminiApiKey` from `browser.storage.sync` and calls the Gemini API with a prompt that requests JSON‑LD and metric conversions.
	- The popup shows a short preview and a Download button.

Storage keys (sync storage): `geminiApiKey`, `autoDetect`, `showNotifications`, `defaultFormat`, `installDate`, `recipeCount`.

## Install (development, Firefox)

1. Generate icons (one-time): open `extension/icons/create-icons.html` and save the four canvases as `icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png` into `extension/icons/`.
	- Optional helper: from `extension/`, run `./setup.sh` to check/generate icons and validate `manifest.json`.
2. Load the extension temporarily in Firefox:
	- Go to `about:debugging` → This Firefox → Load Temporary Add‑on → select `extension/manifest.json`.

## Configure API key

1. Click the extension icon → Settings.
2. Paste your Google Gemini API key and Save.
3. Use “Test Connection” to quickly verify the key.

## Use

1. Navigate to a recipe page.
2. Click the extension icon → “Transform Recipe”.
3. Download the JSON file, then import into your recipe manager (e.g., Mealie).
4. Keyboard shortcut: Ctrl+Shift+R on a recipe page.

## Package for distribution (ZIP)

From `extension/`:

```sh
./package.sh
```

Creates `dist/recipe-transformer-extension.zip` excluding dev files.

## Permissions and privacy

- Permissions: `activeTab`, `storage` (plus host permissions for http/https; MV3 also lists `notifications`).
- API key is stored in `browser.storage.sync` (local to your browser profile; can sync if browser sync is enabled).
- The page text is sent directly from your browser to Google’s Gemini API. No server in this project receives it.

## Troubleshooting

- Extension won’t load: verify icons exist and `manifest.json` is valid JSON. `extension/setup.sh` can help.
- “API key not configured”: add the key in Settings.
- “Invalid API key” / 401–403: re-check the key; try the “Test Connection” button.
- “No recipe detected”: some pages don’t match heuristics; you can still try Transform.
- “Content extraction failed”: some sites block or heavily obfuscate content.
- Output isn’t valid JSON: try again; the background attempts to extract JSON from the model response.

## Chrome / Manifest V3 notes

- `extension/manifest-v3.json` and `background-v3.js` are included. MV3 service worker currently points to `background.js`; you can point it to `background-v3.js` or consolidate both into a single file that uses a small `browser`/`chrome` compatibility shim (already present in `background-v3.js`).
- MV3 has slightly different `web_accessible_resources` and notification permission handling. Chrome support hasn’t been fully exercised here.

## Known limitations

- Recipe detection is heuristic; false positives/negatives can occur.
- The model may return extra text; JSON parsing uses a simple extraction fallback.
- Some sites (paywalls/anti-scraping) may prevent reliable extraction.
- Disabled-state icons are implemented for MV2; MV3 currently uses the same icons for both states.

## Maintenance notes

- Main logic lives in `extension/`: start with `content.js`, `background.js`, `popup.js`, `options.js`.
- Readability is vendored (`readability.js`); update carefully and pin the source/version in commit messages when bumping.
- `test-extension.sh` performs basic structure and manifest checks; `test.sh` is a placeholder.

