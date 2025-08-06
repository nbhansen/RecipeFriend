#!/bin/bash

# Test script for Recipe Transformer Extension
# Validates installation and basic functionality

echo "🧪 Recipe Transformer Extension Test Suite"
echo "=========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run tests
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -n "Testing $test_name... "
    
    if eval "$test_command" &>/dev/null; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Test 1: Check if we're in the right directory
run_test "Extension directory" "[ -f 'manifest.json' ]"

# Test 2: Validate manifest.json syntax
run_test "Manifest JSON syntax" "python3 -m json.tool manifest.json"

# Test 3: Check required files exist
run_test "Background script exists" "[ -f 'background.js' ]"
run_test "Content script exists" "[ -f 'content.js' ]"
run_test "Popup HTML exists" "[ -f 'popup.html' ]"
run_test "Popup JS exists" "[ -f 'popup.js' ]"
run_test "Options HTML exists" "[ -f 'options.html' ]"
run_test "Options JS exists" "[ -f 'options.js' ]"
run_test "Readability library exists" "[ -f 'readability.js' ]"

# Test 4: Check all required icons exist
run_test "Icon 16x16 exists" "[ -f 'icons/icon-16.png' ]"
run_test "Icon 32x32 exists" "[ -f 'icons/icon-32.png' ]"
run_test "Icon 48x48 exists" "[ -f 'icons/icon-48.png' ]"
run_test "Icon 128x128 exists" "[ -f 'icons/icon-128.png' ]"

# Test 5: Validate HTML files
if command -v tidy &> /dev/null; then
    run_test "Popup HTML validity" "tidy -q -e popup.html"
    run_test "Options HTML validity" "tidy -q -e options.html"
else
    echo -e "${YELLOW}⚠️  HTML validation skipped (tidy not installed)${NC}"
fi

# Test 6: Basic JavaScript syntax check
if command -v node &> /dev/null; then
    run_test "Background JS syntax" "node -c background.js"
    run_test "Content JS syntax" "node -c content.js"
    run_test "Popup JS syntax" "node -c popup.js"
    run_test "Options JS syntax" "node -c options.js"
else
    echo -e "${YELLOW}⚠️  JavaScript syntax check skipped (Node.js not installed)${NC}"
fi

# Test 7: Check file permissions
run_test "Setup script executable" "[ -x 'setup.sh' ]"
run_test "Package script executable" "[ -x 'package.sh' ]"

# Test 8: Validate icon file sizes (approximate)
echo ""
echo "🖼️  Icon File Analysis:"
for size in 16 32 48 128; do
    icon_file="icons/icon-${size}.png"
    if [ -f "$icon_file" ]; then
        file_size=$(stat -f%z "$icon_file" 2>/dev/null || stat -c%s "$icon_file" 2>/dev/null)
        if [ -n "$file_size" ]; then
            echo "   Icon ${size}x${size}: ${file_size} bytes"
        fi
    fi
done

# Test 9: Check for common issues
echo ""
echo "🔍 Common Issues Check:"

# Check for TODO/FIXME comments
todo_count=$(grep -r "TODO\|FIXME\|XXX" . --exclude-dir=.git --exclude="*.md" --exclude="test.sh" | wc -l)
if [ "$todo_count" -gt 0 ]; then
    echo -e "   ${YELLOW}⚠️  Found $todo_count TODO/FIXME comments${NC}"
else
    echo -e "   ${GREEN}✅ No TODO/FIXME comments found${NC}"
fi

# Check for console.log statements (should be minimal in production)
console_count=$(grep -r "console\." . --include="*.js" --exclude="readability.js" | wc -l)
if [ "$console_count" -gt 5 ]; then
    echo -e "   ${YELLOW}⚠️  Found $console_count console statements (consider removing for production)${NC}"
else
    echo -e "   ${GREEN}✅ Reasonable number of console statements${NC}"
fi

# Test 10: Package test
echo ""
echo "📦 Package Test:"
if [ -f "package.sh" ]; then
    ./package.sh > /dev/null 2>&1
    if [ -f "../dist/recipe-transformer-extension.zip" ]; then
        echo -e "   ${GREEN}✅ Package creation successful${NC}"
        # Check package contents
        zip_files=$(unzip -l "../dist/recipe-transformer-extension.zip" | wc -l)
        echo "   Package contains $((zip_files - 3)) files"
    else
        echo -e "   ${RED}❌ Package creation failed${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  Package script not found${NC}"
fi

# Summary
echo ""
echo "📊 Test Summary:"
echo "=================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! Extension is ready for installation.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Load extension in Firefox (about:debugging)"
    echo "2. Configure Gemini API key"
    echo "3. Test on a recipe website"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Please fix the issues before deploying.${NC}"
    exit 1
fi
