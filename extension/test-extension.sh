#!/bin/bash

# Comprehensive test script for Recipe Transformer Extension
# Validates all components before release

set -e  # Exit on any error

echo "Testing Recipe Transformer Extension..."
echo "======================================"

# Test 1: File Structure Validation
echo "1. Checking file structure..."

required_files=(
    "manifest.json"
    "background.js"
    "content.js"
    "popup.html"
    "popup.js"
    "options.html"
    "options.js"
    "readability.js"
    "error-handling.js"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ Missing: $file"
        exit 1
    fi
done

# Test 2: Icon Validation
echo ""
echo "2. Checking icons..."

required_icons=(
    "icons/icon-16.png"
    "icons/icon-32.png"
    "icons/icon-48.png"
    "icons/icon-128.png"
)

for icon in "${required_icons[@]}"; do
    if [ -f "$icon" ]; then
        echo "  ✓ $icon"
    else
        echo "  ✗ Missing: $icon"
        exit 1
    fi
done

# Test 3: JSON Validation
echo ""
echo "3. Validating JSON files..."

if command -v python3 >/dev/null 2>&1; then
    if python3 -m json.tool manifest.json >/dev/null 2>&1; then
        echo "  ✓ manifest.json is valid JSON"
    else
        echo "  ✗ manifest.json is invalid JSON"
        exit 1
    fi
else
    echo "  ! Python3 not available - skipping JSON validation"
fi

# Test 4: JavaScript Syntax Check
echo ""
echo "4. Checking JavaScript syntax..."

js_files=(
    "background.js"
    "content.js"
    "popup.js"
    "options.js"
    "error-handling.js"
)

if command -v node >/dev/null 2>&1; then
    for js_file in "${js_files[@]}"; do
        if node -c "$js_file" 2>/dev/null; then
            echo "  ✓ $js_file syntax OK"
        else
            echo "  ✗ $js_file has syntax errors"
            exit 1
        fi
    done
else
    echo "  ! Node.js not available - skipping syntax check"
fi

# Test 5: Manifest Validation
echo ""
echo "5. Validating manifest.json..."

# Check required manifest fields
if grep -q '"manifest_version"' manifest.json; then
    echo "  ✓ manifest_version present"
else
    echo "  ✗ manifest_version missing"
    exit 1
fi

if grep -q '"name"' manifest.json; then
    echo "  ✓ name present"
else
    echo "  ✗ name missing"
    exit 1
fi

if grep -q '"version"' manifest.json; then
    echo "  ✓ version present"
else
    echo "  ✗ version missing"
    exit 1
fi

# Test 6: Permission Validation
echo ""
echo "6. Checking permissions..."

required_permissions=(
    "activeTab"
    "storage"
)

for perm in "${required_permissions[@]}"; do
    if grep -q "\"$perm\"" manifest.json; then
        echo "  ✓ $perm permission"
    else
        echo "  ✗ Missing permission: $perm"
        exit 1
    fi
done

# Test 7: Icon References
echo ""
echo "7. Validating icon references..."

# Check if manifest references match actual files
if grep -q '"icons"' manifest.json; then
    echo "  ✓ Icons section present in manifest"
    
    # Check specific icon references
    for size in 16 32 48 128; do
        if grep -q "icon-${size}.png" manifest.json; then
            echo "  ✓ ${size}px icon referenced"
        else
            echo "  ! ${size}px icon not referenced in manifest"
        fi
    done
else
    echo "  ✗ Icons section missing from manifest"
    exit 1
fi

# Test 8: File Size Check
echo ""
echo "8. Checking file sizes..."

total_size=0
for file in "${required_files[@]}" "${required_icons[@]}"; do
    if [ -f "$file" ]; then
        size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo 0)
        total_size=$((total_size + size))
    fi
done

total_mb=$((total_size / 1024 / 1024))
echo "  Total extension size: ${total_mb}MB"

if [ $total_size -gt 10485760 ]; then  # 10MB
    echo "  ! Extension size is quite large (${total_mb}MB)"
else
    echo "  ✓ Extension size reasonable"
fi

# Test 9: Package Creation Test
echo ""
echo "9. Testing package creation..."

if [ -f "package.sh" ]; then
    echo "  ✓ package.sh exists"
    if [ -x "package.sh" ]; then
        echo "  ✓ package.sh is executable"
    else
        echo "  ! package.sh not executable (chmod +x package.sh)"
    fi
else
    echo "  ! package.sh missing"
fi

# Test 10: Web Accessible Resources
echo ""
echo "10. Checking web accessible resources..."

if grep -q '"web_accessible_resources"' manifest.json; then
    echo "  ✓ web_accessible_resources defined"
    if grep -q 'readability.js' manifest.json; then
        echo "  ✓ readability.js marked as web accessible"
    else
        echo "  ✗ readability.js not marked as web accessible"
        exit 1
    fi
else
    echo "  ✗ web_accessible_resources missing"
    exit 1
fi

echo ""
echo "======================================"
echo "All tests passed! Extension is ready for testing."
echo ""
echo "Next steps:"
echo "1. Load extension in Firefox (about:debugging)"
echo "2. Test on real recipe websites"
echo "3. Verify API key configuration works"
echo "4. Test transformation functionality"
echo "5. Check error handling with invalid inputs"
echo ""
echo "To package for distribution: ./package.sh"
