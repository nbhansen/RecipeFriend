# Recipe Transformer - Production Release Guide

A Firefox browser extension that converts recipe websites into clean JSON-LD format with automatic metric unit conversion. Perfect for importing recipes into Mealie or other recipe management systems.

## 🌟 Features

- **Smart Recipe Detection**: Automatically detects recipe pages and highlights the extension icon
- **AI-Powered Extraction**: Uses Google Gemini API for intelligent recipe parsing
- **Metric Conversion**: Converts imperial measurements to metric (cups→grams, °F→°C)
- **Clean JSON-LD Output**: Schema.org compliant recipe format
- **Cross-Domain Storage**: Configure once, works on all recipe websites
- **Keyboard Shortcuts**: Quick transformation with `Ctrl+Shift+R`
- **Privacy-Focused**: Recipes processed locally, never stored on our servers

## 🚀 Quick Start

### Prerequisites
- Firefox browser (version 55 or higher)
- Google Gemini API key (free from [Google AI Studio](https://makersuite.google.com/app/apikey))

### Installation

#### Option A: Development Installation (Recommended for testing)
```bash
# Clone the repository
git clone https://github.com/nbhansen/RecipeFriend.git
cd RecipeFriend/extension

# Run setup and tests
./setup.sh
./test.sh

# Load in Firefox
# 1. Open Firefox → about:debugging
# 2. Click "This Firefox" → "Load Temporary Add-on"
# 3. Select manifest.json from the extension directory
```

#### Option B: Package for Distribution
```bash
cd extension/
./package.sh
# Install the generated ZIP file in Firefox
```

### Configuration
1. Click the Recipe Transformer extension icon
2. Go to Settings
3. Enter your Gemini API key
4. Click "Test Connection" to verify

## 📖 How to Use

1. **Navigate** to any recipe website (AllRecipes, BBC Food, Food Network, etc.)
2. **Click** the extension icon (it highlights on recipe pages)
3. **Wait** for AI processing (usually 5-10 seconds)
4. **Download** the JSON-LD file automatically

### Keyboard Shortcut
Press `Ctrl+Shift+R` on any recipe page for instant transformation.

## 🔧 Unit Conversion Reference

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
| °F to °C | (°F - 32) × 5/9 |

## 🛠️ Development

### File Structure
```
extension/
├── manifest.json           # Extension configuration
├── background.js          # Background service worker
├── content.js             # Content script for page interaction
├── popup.html/js          # Extension popup interface
├── options.html/js        # Settings page
├── readability.js         # Mozilla's content extraction library
├── error-handling.js      # Enhanced error handling
├── setup.sh              # Setup script
├── test.sh               # Test suite
├── package.sh            # Packaging script
└── icons/                # Extension icons
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-48.png
    └── icon-128.png
```

### Testing
```bash
# Run the complete test suite
./test.sh

# Manual testing checklist:
# ✓ Extension loads without errors
# ✓ Icon highlights on recipe pages
# ✓ API key validation works
# ✓ Recipe transformation succeeds
# ✓ File download works
# ✓ Error messages are user-friendly
```

### Manifest Versions
- `manifest.json` - Manifest V2 (Firefox compatible)
- `manifest-v3.json` - Manifest V3 (Chrome compatible)
- `background-v3.js` - Service worker for Manifest V3

## 🐛 Troubleshooting

### Common Issues

#### "No recipe detected"
- Ensure the page has finished loading
- Try refreshing the page
- Some recipe sites may not be supported

#### "API key invalid"
- Verify your Gemini API key in settings
- Check you have API quota remaining
- Ensure stable internet connection

#### "Network error"
- Check your internet connection
- Verify firewall isn't blocking requests
- Try again in a few minutes

#### Extension not loading
- Check Firefox version (55+ required)
- Look for errors in Browser Console (F12)
- Try reinstalling the extension

### Debug Mode
1. Open Firefox Developer Tools (F12)
2. Go to Console tab
3. Look for "Recipe Transformer" messages
4. Report any errors with context

## 🔒 Privacy & Security

- **No Data Collection**: We don't collect or store any personal data
- **Local Processing**: Recipes are processed on your device
- **API Key Security**: Stored locally in browser storage
- **HTTPS Only**: All API communications are encrypted

### API Key Best Practices
- Keep your API key private
- Monitor your API usage in Google Cloud Console
- Set up billing alerts for quota management
- Regenerate keys if compromised

## 📝 Changelog

### Version 1.0.0 (Current)
- Initial release
- Firefox Manifest V2 support
- Google Gemini AI integration
- Automatic metric conversion
- Schema.org JSON-LD output
- Cross-domain storage
- Keyboard shortcuts

### Planned Features
- Chrome support (Manifest V3)
- Multiple AI provider support
- Custom conversion preferences
- Direct Mealie integration
- Batch processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Run the test suite: `./test.sh`
4. Submit a pull request

### Code Style
- Use meaningful variable names
- Add comments for complex logic
- Follow existing code patterns
- Update tests for new features

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/nbhansen/RecipeFriend/issues)
- **Documentation**: This README and code comments
- **API Documentation**: [Google Gemini API](https://ai.google.dev/docs)

---

Made with ❤️ for the home cooking community
