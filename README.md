# Recipe Transformer

A Firefox browser extension that converts recipe websites into clean JSON-LD format with automatic metric unit conversion. Designed for importing recipes into Mealie or other recipe management systems.

## Features

- **Automatic Unit Conversion**: Converts imperial measurements (cups, fahrenheit, ounces) to metric (grams, ml, celsius)
- **AI-Powered Extraction**: Uses Google Gemini API to parse recipe content intelligently
- **Cross-Domain Storage**: API key configuration persists across all websites
- **Smart Detection**: Extension icon highlights on recipe pages
- **Keyboard Shortcuts**: Quick transformation with Ctrl+Shift+R
- **Clean Downloads**: JSON files automatically named after the recipe
- **Privacy-Focused**: Processing happens locally, recipes never stored on servers

## Installation

### Method A: Development Installation
1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" → "Load Temporary Add-on"
3. Select `extension/manifest.json` from this repository
4. Extension appears in your toolbar

### Method B: Package for Distribution
```bash
cd extension/
./package.sh
# Install the generated ZIP file in Firefox
```

## Setup

### 1. Generate API Key
1. Get a free Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click the Recipe Transformer extension icon
3. Click "Settings" → Enter your API key → "Save API Key"
4. Click "Test Connection" to verify

### 2. Icon Generation
Icons are required for the extension to function properly:
1. Open `extension/icons/create-icons.html` in your browser
2. Right-click each canvas and "Save image as":
   - 16x16 canvas → `icon-16.png`
   - 32x32 canvas → `icon-32.png`
   - 48x48 canvas → `icon-48.png`
   - 128x128 canvas → `icon-128.png`
3. Save all PNG files in the `extension/icons/` directory

## Usage

### Transform Any Recipe
1. **Navigate** to any recipe website (BBC Food, AllRecipes, Food Network, etc.)
2. **Click** the highlighted Recipe Transformer extension icon
3. **Transform** by clicking "Transform Recipe" button
4. **Download** the JSON file (automatically named after the recipe)

### Keyboard Shortcut
- Press `Ctrl+Shift+R` on any recipe page for instant transformation
- Notification appears when recipe is ready

### Import to Mealie
1. Copy the downloaded JSON content
2. In Mealie: Recipes → Create → Paste JSON
3. All measurements are now in metric with proper formatting

## Unit Conversion Rules

The extension converts imperial measurements to metric:

| Imperial | Metric Conversion |
|----------|------------------|
| Cups (flour) | 120g per cup |
| Cups (sugar) | 200g per cup |
| Cups (liquid) | 240ml per cup |
| Tablespoons | 15ml each |
| Teaspoons | 5ml each |
| Ounces (weight) | × 28.35 for grams |
| Pounds | × 453.6 for grams |
| Fahrenheit | (F-32)×5/9 for Celsius |
| Fluid ounces | 30ml each |
| Stick of butter | 113g |
| Large egg | 50g |

Cooking terms like "room temperature", "divided", "chopped" are preserved.

## Repository Structure

```
RecipeFriend/
├── README.md                    # This file
├── LICENSE                      # MIT license
├── SPEC.md                     # Original project specification
├── recipe-transformer.html     # Legacy bookmarklet version (deprecated)
└── extension/                  # Firefox Extension
    ├── manifest.json           # Extension configuration
    ├── background.js           # API calls and background logic
    ├── content.js             # Recipe extraction from web pages
    ├── popup.html/.js         # Extension popup interface
    ├── options.html/.js       # Settings and configuration
    ├── readability.js         # Mozilla's content extraction library
    ├── icons/                 # Extension icons and generator
    ├── README.md              # Extension-specific documentation
    └── package.sh             # Build script
```

## Troubleshooting

### Extension Won't Load
- Check all required files are present
- Verify `manifest.json` syntax is valid
- Generate PNG icons using `icons/create-icons.html`

### API Connection Fails
- Verify Gemini API key is correct
- Test connection in extension settings
- Check your internet connection

### Recipe Not Detected
- Try refreshing the page
- Check if page actually contains structured recipe content
- Some sites may block content extraction

### Transform Fails
- Verify API key is configured in settings
- Check Firefox Developer Console for errors
- Some recipe formats may not be compatible

## Privacy & Security

- **Local Storage**: API keys stored securely in Firefox extension storage
- **No Data Collection**: We don't collect, store, or transmit your recipes
- **Direct API Calls**: Recipe content only sent directly to Google's Gemini API
- **Open Source**: Full source code available for audit
- **Sync Support**: API keys sync across your Firefox account (if enabled)

## Development

### Prerequisites
- Firefox Developer Edition (recommended)
- Google Gemini API key
- Basic knowledge of browser extensions

### Setup Development Environment
```bash
git clone <repository-url>
cd RecipeFriend/extension/
# Follow installation steps above
```

### Making Changes
1. Edit extension files
2. Go to `about:debugging` in Firefox
3. Click "Reload" next to the extension
4. Test changes

### Debug Console
- **Extension Console**: `about:debugging` → Extension → "Inspect"
- **Content Script**: Browser Developer Tools → Console
- **Background Script**: Extension Console

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## Support

- **Issues**: [GitHub Issues](https://github.com/your-username/RecipeFriend/issues)
- **Feature Requests**: Open an issue with the "enhancement" label
- **Documentation**: Check the `extension/README.md` for technical details

## Roadmap

- [ ] Chrome extension support
- [ ] Direct Mealie API integration
- [ ] Batch recipe processing
- [ ] Custom unit conversion rules
- [ ] Recipe preview editing
- [ ] Multiple AI provider support