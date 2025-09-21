# Legacy: Recipe Transformer (Firefox MV2)

This folder contains the legacy Firefox MV2 implementation and is retained for reference only. The actively maintained Chrome Manifest V3 extension lives in `../extension-chrome/`.

Convert recipe websites to clean JSON-LD with metric units for Mealie and other recipe management systems.

## Installation

### Method 1: Load as Temporary Add-on (Development)

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" on the left sidebar
3. Click "Load Temporary Add-on"
4. Navigate to this extension folder and select `manifest.json`
5. The extension will be loaded and appear in your extensions list

### Method 2: Install as Permanent Extension (not maintained)

1. Create a ZIP file containing all extension files:
   ```bash
   cd /home/nicolai/dev/RecipeFriend/extension
   zip -r recipe-transformer-extension.zip . -x "*.md" "icons/create-icons.html"
   ```
2. Follow Firefox's extension installation guide or submit to Firefox Add-ons store

## Setup

1. After installation, click the extension icon in the toolbar
2. If no API key is configured, click "Settings"
3. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
4. Paste the API key in the settings and click "Save API Key"
5. Test the connection to verify it works

## Usage

### Method 1: Extension Popup
1. Navigate to any recipe website
2. Click the Recipe Transformer extension icon
3. Click "Transform Recipe"
4. Wait for processing (2-3 seconds)
5. Click "Download JSON" to save the recipe

### Method 2: Keyboard Shortcut
1. Navigate to any recipe website
2. Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
3. A notification will appear when the recipe is ready

## Features

- **Automatic Recipe Detection**: Extension icon highlights on recipe pages
- **Metric Unit Conversion**: Converts cups, ounces, fahrenheit to grams, ml, celsius
- **Cross-Domain Storage**: API key works on all websites
- **JSON-LD Output**: Compatible with Mealie and other recipe managers
- **Keyboard Shortcuts**: Quick transformation with `Ctrl+Shift+R`
- **Privacy-Focused**: API key stored locally, recipes never sent to our servers

## File Structure

```
extension/
├── manifest.json          # Extension metadata
├── background.js          # Background service worker
├── content.js            # Content script (runs on web pages)
├── popup.html/.js        # Extension popup interface
├── options.html/.js      # Settings page
├── readability.js        # Mozilla's content extraction library
└── icons/               # Extension icons
```

## Icons

The extension needs icon files in PNG format. To generate them:

1. Open `icons/create-icons.html` in a web browser
2. Right-click each canvas and "Save image as":
   - Save 16x16 canvas as `icon-16.png`
   - Save 32x32 canvas as `icon-32.png` 
   - Save 48x48 canvas as `icon-48.png`
   - Save 128x128 canvas as `icon-128.png`
3. Place all PNG files in the `icons/` directory

## Troubleshooting

### Extension Won't Load
- Check that all required files are present
- Verify `manifest.json` syntax is valid
- Check Firefox Developer Console for errors

### API Connection Fails  
- Verify API key is correct
- Check internet connection
- Test API key in extension settings

### Recipe Not Detected
- Try refreshing the page
- Check if page actually contains a recipe
- Some sites may block content extraction

### Transform Fails
- Check if page content is accessible
- Verify API key is configured
- Some recipe formats may not be supported

## Privacy & Security

- API key is stored in Firefox's secure extension storage
- Keys are synced across your Firefox account (if sync is enabled)
- Recipe content is only sent to Google's Gemini API
- No data is collected or stored by this extension
- Source code is fully transparent and auditable

## Development (legacy)

To modify or debug the extension:

1. Load as temporary add-on (see installation above)
2. Make code changes
3. Click "Reload" in `about:debugging` to update
4. Check Browser Console and Extension Console for errors

## License

MIT License - see LICENSE file for details.