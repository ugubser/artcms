#!/bin/bash

# Production Storage Sync Script
# This script downloads production Firebase Storage files for use with local emulator

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📁 Production Storage Sync Script"
echo "=================================="

# Check if gsutil is installed (part of Google Cloud SDK)
if ! command -v gsutil &> /dev/null; then
    echo -e "${RED}❌ gsutil is not installed${NC}"
    echo "Please install Google Cloud SDK:"
    echo "  https://cloud.google.com/sdk/docs/install"
    echo "Then run: gcloud auth login"
    exit 1
fi

# Check if .firebaserc exists
if [ ! -f ".firebaserc" ]; then
    echo -e "${RED}❌ .firebaserc file not found${NC}"
    echo "Please run firebase init first"
    exit 1
fi

# Get the default project from .firebaserc (should be production)
PROD_PROJECT=$(grep -o '"default"[[:space:]]*:[[:space:]]*"[^"]*"' .firebaserc | sed 's/.*"default"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')

if [ -z "$PROD_PROJECT" ]; then
    echo -e "${RED}❌ No default project found in .firebaserc${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Production Project: $PROD_PROJECT${NC}"

# Determine storage bucket (Firebase Storage uses .firebasestorage.app)
STORAGE_BUCKET="${PROD_PROJECT}.firebasestorage.app"

# Also try the legacy .appspot.com format if the new one doesn't work
LEGACY_BUCKET="${PROD_PROJECT}.appspot.com"

# Create Firebase Storage download directory (outside emulator_data to avoid deletion)
# Download to persistent storage/ directory
LOCAL_STORAGE_DIR="./storage"
EMULATOR_STORAGE_DIR="$LOCAL_STORAGE_DIR"
mkdir -p "$EMULATOR_STORAGE_DIR"

echo ""
echo -e "${YELLOW}🔄 Syncing Firebase Storage from production...${NC}"
echo -e "${BLUE}📦 Source: gs://$STORAGE_BUCKET${NC}"
echo -e "${BLUE}📁 Destination: $EMULATOR_STORAGE_DIR${NC}"

# Check if bucket exists and is accessible (try both formats)
BUCKET_TO_USE=""
BUCKET_FOR_EMULATOR=""
if gsutil ls "gs://$STORAGE_BUCKET" &> /dev/null; then
    BUCKET_TO_USE="$STORAGE_BUCKET"
    BUCKET_FOR_EMULATOR="$STORAGE_BUCKET"
    echo -e "${GREEN}✅ Found Firebase Storage bucket: gs://$STORAGE_BUCKET${NC}"
elif gsutil ls "gs://$LEGACY_BUCKET" &> /dev/null; then
    BUCKET_TO_USE="$LEGACY_BUCKET"
    BUCKET_FOR_EMULATOR="$STORAGE_BUCKET"  # Use new format for emulator structure
    echo -e "${GREEN}✅ Found legacy storage bucket: gs://$LEGACY_BUCKET${NC}"
    echo -e "${BLUE}💡 Using $STORAGE_BUCKET for emulator directory structure${NC}"
else
    echo -e "${RED}❌ Cannot access storage buckets:${NC}"
    echo "  - gs://$STORAGE_BUCKET"
    echo "  - gs://$LEGACY_BUCKET"
    echo ""
    echo "Please check:"
    echo "1. You're authenticated: gcloud auth login"
    echo "2. You have access to the project: gcloud config set project $PROD_PROJECT"
    echo "3. The storage bucket exists"
    echo ""
    echo "To list available buckets: gsutil ls"
    exit 1
fi

# Sync storage data to proper emulator structure
echo -e "${BLUE}🔄 Downloading files from gs://$BUCKET_TO_USE...${NC}"
gsutil -m rsync -r -d "gs://$BUCKET_TO_USE" "$EMULATOR_STORAGE_DIR"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Storage sync completed${NC}"
    
    # Count downloaded files
    FILE_COUNT=$(find "$EMULATOR_STORAGE_DIR" -type f | wc -l)
    echo -e "${BLUE}📊 Downloaded $FILE_COUNT files${NC}"
    
    # Show storage usage
    STORAGE_SIZE=$(du -sh "$EMULATOR_STORAGE_DIR" | cut -f1)
    echo -e "${BLUE}💾 Total size: $STORAGE_SIZE${NC}"
    
else
    echo -e "${RED}❌ Storage sync failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Storage sync completed!${NC}"
echo "Files are now available in persistent storage directory:"
echo "📁 Storage directory: $LOCAL_STORAGE_DIR"
echo "📁 Files: $EMULATOR_STORAGE_DIR"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "1. Start the Firebase emulator: npm run emulator"
echo "2. Upload files to emulator: ./scripts/upload-storage-to-emulator.sh"
echo "3. Files will be available in the emulator"
echo ""
echo -e "${BLUE}🔧 Storage structure:${NC}"
echo "   storage/ (persistent, protected from emulator export)"
echo "   ├── portfolio/"
echo "   ├── about/"
echo "   └── ..."
echo ""
echo -e "${GREEN}✅ Files protected from emulator export/import cycles${NC}"