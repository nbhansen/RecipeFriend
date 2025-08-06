# Recipe Transformer

A browser extension that converts recipe websites into clean JSON-LD format with automatic metric unit conversion. Designed for importing recipes into Mealie or other recipe management systems.

## Features

- **Automatic Unit Conversion**: Converts imperial measurements (cups, fahrenheit, ounces) to metric (grams, ml, celsius)
- **AI-Powered Extraction**: Uses Google Gemini API to parse recipe content intelligently
- **Cross-Domain Storage**: API key works on all websites without repeated setup
- **Smart Detection**: Extension icon highlights on recipe pages
- **Keyboard Shortcuts**: Quick transformation with Ctrl+Shift+R
- **Clean Downloads**: JSON files automatically named after the recipe
- **Privacy-Focused**: Processing happens locally, recipes never stored on servers

## Installation

### Firefox (Recommended)

1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" → "Load Temporary Add-on"
4. Select `extension/manifest.json` from the downloaded repository
5. Extension appears in your toolbar

### Chrome/Chromium

Use the Manifest V3 version:
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `extension-mv3/` directory

## Setup

### 1. Generate Icons (First Time Only)
```bash
cd extension/
./setup.sh
```

### 2. Configure API Key
1. Get a free Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click the Recipe Transformer extension icon
3. Click "Settings" → Enter your API key → "Save API Key"
4. Click "Test Connection" to verify

## Usage

### Transform Any Recipe
1. Navigate to any recipe website
2. Click the Recipe Transformer extension icon
3. Click "Transform Recipe"
4. Download the generated JSON file

### Keyboard Shortcut
Press `Ctrl+Shift+R` on any recipe page for quick transformation.

## Unit Conversion Rules

| Imperial | Metric Conversion |
|----------|------------------|
| 1 cup flour | 120g |
| 1 cup sugar | 200g |
| 1 cup liquid | 240ml |
| 1 tablespoon | 15ml |
| 1 teaspoon | 5ml |
| 1 ounce | 28.35g |
| 1 pound | 453.6g |
| 1 stick butter | 113g |
| °F | (°F-32)×5/9 = °C |

## Output Format

The extension generates JSON-LD following schema.org/Recipe specification:

```json
{
  "@context": "https://schema.org/",
  "@type": "Recipe",
  "name": "Recipe Name",
  "description": "Recipe description",
  "recipeIngredient": [
    "250g flour",
    "500ml milk"
  ],
  "recipeInstructions": [
    {
      "@type": "HowToStep",
      "text": "Mix ingredients together"
    }
  ],
  "cookTime": "PT30M",
  "prepTime": "PT15M",
  "totalTime": "PT45M",
  "recipeYield": "4 servings"
}
```

## Troubleshooting

### Extension Icon Doesn't Appear
- Ensure all icon files are present in `extension/icons/`
- Run `./setup.sh` to validate installation

### API Key Issues
- Verify your API key at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Use "Test Connection" in extension settings

### Recipe Not Detected
- Extension works best on dedicated recipe websites
- Try refreshing the page
- Check browser console for errors

### Transformation Fails
- Ensure stable internet connection
- Verify API key is valid and has quota remaining
- Some complex recipe formats may not be supported

## Development

### Project Structure
```
extension/
├── manifest.json          # Extension configuration
├── background.js         # Background script for API calls
├── content.js           # Content script for page interaction
├── popup.html/js        # Extension popup interface
├── options.html/js      # Settings page
├── readability.js       # Content extraction library
├── error-handling.js    # Error handling utilities
└── icons/              # Extension icons
```

### Building
```bash
cd extension/
./package.sh
```

### Testing
```bash
cd extension/
./test-extension.sh
```

## Privacy

- Recipe content is sent to Google Gemini API for processing
- No recipe data is stored on our servers
- API keys are stored locally in browser storage
- Processing happens client-side where possible

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and feature requests, please use the GitHub issue tracker.

## Changelog

See CHANGELOG.md for version history and changes.
