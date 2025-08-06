#!/bin/bash

# Setup script for Recipe Transformer Extension
# Generates icons and validates installation

echo "🔧 Setting up Recipe Transformer Extension..."

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo "❌ Error: Please run this script from the extension directory"
    exit 1
fi

# Create icons directory if it doesn't exist
mkdir -p icons

# Check if icons already exist
echo "Checking for existing icons..."
required_icons=("icon-16.png" "icon-32.png" "icon-48.png" "icon-128.png")
missing_icons=()

for icon in "${required_icons[@]}"; do
    if [ ! -f "icons/$icon" ]; then
        missing_icons+=("$icon")
    fi
done

if [ ${#missing_icons[@]} -gt 0 ]; then
    echo "Missing icon files detected. Opening icon generator..."
    echo "Please save each canvas as PNG files in the icons/ directory:"
    echo "  - 16x16 canvas → icon-16.png"
    echo "  - 32x32 canvas → icon-32.png" 
    echo "  - 48x48 canvas → icon-48.png"
    echo "  - 128x128 canvas → icon-128.png"
    
    if command -v firefox >/dev/null 2>&1; then
        firefox icons/create-icons.html
    elif command -v google-chrome >/dev/null 2>&1; then
        google-chrome icons/create-icons.html
    else
        echo "Please open icons/create-icons.html in your browser and save the PNG files"
    fi
    
    echo ""
    echo "Waiting for icon generation..."
    echo "Press ENTER when you have saved all PNG files in the icons/ directory"
    read -r
else
    echo "All icons found - skipping generation"
fi

# Validate icons exist
echo "🔍 Validating icons..."
required_icons=("icon-16.png" "icon-32.png" "icon-48.png" "icon-128.png")
missing_icons=()

for icon in "${required_icons[@]}"; do
    if [ ! -f "icons/$icon" ]; then
        missing_icons+=("$icon")
    fi
done

if [ ${#missing_icons[@]} -gt 0 ]; then
    echo "❌ Missing icon files:"
    printf '   - %s\n' "${missing_icons[@]}"
    echo ""
    echo "Please generate the missing icons and run this script again."
    exit 1
fi

echo "✅ All icons generated successfully!"

# Validate manifest.json
echo "🔍 Validating manifest.json..."
if ! python3 -m json.tool manifest.json >/dev/null 2>&1; then
    echo "❌ manifest.json is not valid JSON"
    exit 1
fi

echo "✅ manifest.json is valid"

# Check for readability.js
if [ ! -f "readability.js" ]; then
    echo "❌ Missing readability.js file"
    exit 1
fi

echo "✅ All required files present"

echo ""
echo "🎉 Extension setup complete!"
echo ""
echo "Next steps:"
echo "1. Open Firefox and go to about:debugging"
echo "2. Click 'This Firefox' → 'Load Temporary Add-on'"
echo "3. Select manifest.json from this directory"
echo "4. Get a Gemini API key from https://makersuite.google.com/app/apikey"
echo "5. Configure the API key in extension settings"
echo ""
echo "To package for distribution, run: ./package.sh"
