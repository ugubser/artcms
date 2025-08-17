#!/bin/bash

# Upload Storage Files to Running Emulator
# This script uploads already downloaded storage files to the running Firebase emulator

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📤 Upload Storage Files to Emulator"
echo "==================================="

# Check if emulator is running
echo -e "${BLUE}🔍 Checking emulator status...${NC}"

if ! curl -s http://localhost:9199 > /dev/null 2>&1; then
    echo -e "${RED}❌ Firebase Storage emulator is not running${NC}"
    echo ""
    echo -e "${YELLOW}💡 To start the emulator:${NC}"
    echo "   npm run emulator"
    echo ""
    echo -e "${YELLOW}💡 Or use the complete sync script:${NC}"
    echo "   ./scripts/sync-all-production-data.sh"
    exit 1
fi

echo -e "${GREEN}✅ Storage emulator is running${NC}"

# Check if files have been downloaded
if [ ! -d "./storage" ]; then
    echo -e "${RED}❌ No downloaded storage files found${NC}"
    echo ""
    echo -e "${YELLOW}💡 To download files first:${NC}"
    echo "   ./scripts/sync-storage-data.sh"
    echo ""
    echo -e "${YELLOW}💡 Or use the complete sync script:${NC}"
    echo "   ./scripts/sync-all-production-data.sh"
    exit 1
fi

# Count files to upload
FILE_COUNT=$(find ./storage -name "*" -type f | wc -l)
if [ "$FILE_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No files found to upload${NC}"
    exit 0
fi

echo -e "${BLUE}📋 Found $FILE_COUNT files to upload${NC}"

# Upload files
echo ""
echo -e "${BLUE}📤 Uploading files to emulator...${NC}"
node scripts/upload-to-emulator.js

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Upload completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}💡 Your images should now work properly:${NC}"
    echo "   🌐 Website: http://localhost:5050"
    echo "   🔧 Admin: http://localhost:5050/admin"
    echo "   📊 Emulator UI: http://localhost:4000"
else
    echo ""
    echo -e "${RED}❌ Upload failed${NC}"
    exit 1
fi