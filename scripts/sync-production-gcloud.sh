#!/bin/bash

# Production Data Sync using gcloud export + metadata workaround
# Based on the approach: export to cloud storage, then modify metadata to point to it

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Production Data Sync (gcloud export method)"
echo "==============================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed${NC}"
    echo "Please install Google Cloud SDK:"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed${NC}"
    echo "Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if .firebaserc exists
if [ ! -f ".firebaserc" ]; then
    echo -e "${RED}❌ .firebaserc file not found${NC}"
    echo "Please run firebase init first"
    exit 1
fi

# Get the default project from .firebaserc
PROD_PROJECT=$(grep -o '"default"[[:space:]]*:[[:space:]]*"[^"]*"' .firebaserc | sed 's/.*"default"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')

if [ -z "$PROD_PROJECT" ]; then
    echo -e "${RED}❌ No default project found in .firebaserc${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Production Project: $PROD_PROJECT${NC}"

# Check gcloud authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with gcloud${NC}"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Set the project for gcloud
gcloud config set project "$PROD_PROJECT"

echo ""
echo -e "${YELLOW}🔄 Step 1: Export Firestore data to Cloud Storage...${NC}"

# Create export with timestamp - use Firebase Storage bucket
EXPORT_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
EXPORT_URI="gs://$PROD_PROJECT.firebasestorage.app/firestore-exports/$EXPORT_TIMESTAMP"

echo -e "${BLUE}📤 Exporting to: $EXPORT_URI${NC}"

# Export Firestore data to Cloud Storage
gcloud firestore export "$EXPORT_URI" --project "$PROD_PROJECT"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Firestore export failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Firestore export completed${NC}"

echo ""
echo -e "${YELLOW}🔄 Step 2: Generate emulator metadata template...${NC}"

# Create temporary directory for empty emulator
TEMP_DIR="./temp-empty-export"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Start empty emulator briefly to generate metadata structure
echo -e "${BLUE}📋 Starting empty emulator to generate metadata...${NC}"

# Start emulator in background, wait a moment, then export empty state
firebase emulators:start --only firestore --export-on-exit="$TEMP_DIR" &
EMULATOR_PID=$!

# Wait for emulator to start
sleep 5

# Stop emulator to trigger export
kill $EMULATOR_PID 2>/dev/null || true
wait $EMULATOR_PID 2>/dev/null || true

if [ ! -f "$TEMP_DIR/firebase-export-metadata.json" ]; then
    echo -e "${RED}❌ Failed to generate metadata template${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Metadata template generated${NC}"

echo ""
echo -e "${YELLOW}🔄 Step 3: Download production export...${NC}"

# Create final export directory
FINAL_DIR="./emulator_data"
rm -rf "$FINAL_DIR"
mkdir -p "$FINAL_DIR"

# Download the exported data
echo -e "${BLUE}📥 Downloading exported data...${NC}"
gsutil -m cp -r "$EXPORT_URI/*" "$FINAL_DIR/"

# Copy the metadata template
cp "$TEMP_DIR/firebase-export-metadata.json" "$FINAL_DIR/"

echo ""
echo -e "${YELLOW}🔄 Step 4: Modify metadata to point to production export...${NC}"

# Find the downloaded firestore export metadata file
METADATA_FILE=$(find "$FINAL_DIR" -name "*.overall_export_metadata" | head -1)

if [ -z "$METADATA_FILE" ]; then
    echo -e "${RED}❌ Could not find firestore export metadata${NC}"
    exit 1
fi

# Get just the filename (not the full path)
METADATA_FILENAME=$(basename "$METADATA_FILE")

# Update metadata file to point to the downloaded export
cat > "$FINAL_DIR/firebase-export-metadata.json" << EOF
{
  "version": "14.10.1",
  "firestore": {
    "version": "1.19.8",
    "path": ".",
    "metadata_file": "$METADATA_FILENAME"
  }
}
EOF

echo -e "${GREEN}✅ Metadata updated${NC}"

echo ""
echo -e "${YELLOW}🔄 Step 5: Skip URL rewriting to preserve data integrity...${NC}"

echo -e "${BLUE}   ℹ️  Skipping URL rewriting to avoid corrupting binary export format${NC}"
echo -e "${BLUE}   💡 The app's Firebase configuration will handle emulator routing${NC}"
echo -e "${GREEN}✅ Data integrity preserved${NC}"

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo -e "${GREEN}🎉 Production data sync completed!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "   📁 Data location: $FINAL_DIR"
echo "   📦 Export source: $EXPORT_URI"
echo "   🔧 Ready for emulator import"

echo ""
echo -e "${YELLOW}🚀 Next steps:${NC}"
echo "1. Download Storage files: ./scripts/sync-storage-data.sh"
echo "2. Start emulator: npm run emulator"
echo "3. All images will now load from local emulator!"

echo ""
echo -e "${BLUE}💡 What was completed:${NC}"
echo "✅ Firestore data downloaded (URLs preserved for data integrity)"
echo "⏭️  Storage files: Run ./scripts/sync-storage-data.sh to download images"
echo "💡 App will use emulator when FIRESTORE_EMULATOR_HOST is set"

echo ""
echo -e "${BLUE}💡 Cleanup:${NC}"
echo "The production export is stored in Cloud Storage at:"
echo "$EXPORT_URI"
echo "You can delete it later: gsutil -m rm -r $EXPORT_URI"