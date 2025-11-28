#!/bin/bash

##############################################
# Locapay - Apply PWA to All HTML Files
# This script applies PWA modifications to all 109 HTML files
##############################################

echo "🚀 Starting PWA application to all HTML files..."
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Counter
total=0
modified=0
skipped=0
errors=0

# Find all HTML files
echo "📁 Scanning for HTML files..."
html_files=$(find . -maxdepth 1 -name "*.html" -not -name "index.html" -not -name "offline.html")
file_count=$(echo "$html_files" | wc -l | tr -d ' ')

echo "   Found $file_count HTML files to process (excluding index.html and offline.html)"
echo ""

# Process each file
for file in $html_files; do
    ((total++))
    filename=$(basename "$file")

    # Check if file already has PWA modifications
    if grep -q "PWA Manifest" "$file"; then
        echo -e "${YELLOW}○${NC} $filename - Already has PWA (skipping)"
        ((skipped++))
        continue
    fi

    echo -e "${GREEN}✓${NC} Processing $filename..."

    # Create backup
    cp "$file" "${file}.backup"

    # Apply modifications using perl (more reliable than sed on macOS)

    # 1. Add PWA Manifest tags after msapplication-TileImage
    perl -i -pe 's|(.*<meta name="msapplication-TileImage".*>)|\1\n\n    <!-- PWA Manifest -->\n    <link rel="manifest" href="manifest.json">\n    <meta name="theme-color" content="#3474d4">\n    <meta name="apple-mobile-web-app-capable" content="yes">\n    <meta name="apple-mobile-web-app-status-bar-style" content="default">\n    <meta name="apple-mobile-web-app-title" content="Locapay">\n    <link rel="apple-touch-icon" sizes="192x192" href="assets/images/pwa-icons/icon-192x192.png">|' "$file"

    # 2. Add PWA CSS after responsive.css
    perl -i -pe 's|(.*<link rel="stylesheet" href="assets/css/responsive\.css".*>)|\1\n\n    <!-- PWA Custom Styles -->\n    <link rel="stylesheet" href="assets/css/pwa-custom.css" />|' "$file"

    # 3. Add PWA Install Button after Header Cart End comment
    perl -0777 -i -pe 's|(<!-- Header Cart End -->)|\1\n                                <!-- PWA Install Button -->\n                                <button id="pwa-install-btn" class="ec-header-btn pwa-install-btn" style="display: none;" title="Installer l'"'"'application">\n                                    <div class="header-icon">\n                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">\n                                            <path d="M19 9H15V3H9V9H5L12 16L19 9ZM5 18V20H19V18H5Z"/>\n                                        </svg>\n                                    </div>\n                                </button>\n                                <!-- PWA Install Button End -->|g' "$file"

    # 4. Add PWA Scripts before </body>
    perl -i -pe 's|(<script src="assets/js/main\.js"></script>)|\1\n\n    <!-- PWA Scripts -->\n    <script src="assets/js/pwa.js"></script>\n    <script src="assets/js/wishlist-manager.js"></script>|' "$file"

    # Verify modifications were applied
    if grep -q "PWA Manifest" "$file" && grep -q "pwa.js" "$file"; then
        ((modified++))
        # Remove backup if successful
        rm "${file}.backup"
    else
        echo -e "   ${RED}✗${NC} Failed to modify $filename (restored from backup)"
        mv "${file}.backup" "$file"
        ((errors++))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Total files processed: $total"
echo -e "   ${GREEN}Modified: $modified${NC}"
echo -e "   ${YELLOW}Skipped (already has PWA): $skipped${NC}"
echo -e "   ${RED}Errors: $errors${NC}"
echo ""

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ PWA successfully applied to all HTML files!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test the PWA: python3 -m http.server 8000"
    echo "2. Open: http://localhost:8000"
    echo "3. Check Chrome DevTools > Application > Service Workers"
    echo "4. Deploy to production with HTTPS"
else
    echo -e "${RED}⚠️  Some files failed to update. Check error messages above.${NC}"
fi

echo ""
echo "For detailed instructions, see PWA-README.md"
