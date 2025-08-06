#!/bin/bash

# Package Recipe Transformer Firefox Extension

echo "📦 Packaging Recipe Transformer Extension..."

# Create package directory
mkdir -p ../dist

# Create ZIP file excluding development files
zip -r ../dist/recipe-transformer-extension.zip . \
    -x "*.md" \
    -x "*.sh" \
    -x "icons/create-icons.html" \
    -x "__pycache__/*" \
    -x ".DS_Store" \
    -x "Thumbs.db"

echo "✅ Extension packaged as: ../dist/recipe-transformer-extension.zip"
echo ""
echo "To install in Firefox:"
echo "1. Open about:debugging"
echo "2. Click 'This Firefox'"
echo "3. Click 'Load Temporary Add-on'"
echo "4. Select manifest.json from this directory"
echo ""
echo "Don't forget to:"
echo "1. Generate icons using icons/create-icons.html"
echo "2. Get a Gemini API key from https://makersuite.google.com/app/apikey"