#!/bin/bash

# Complete Production Data Sync Script
# This script syncs both Firestore and Storage data from production to local emulator

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Complete Production Data Sync"
echo "================================="

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed${NC}"
    echo "Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if gsutil is installed
if ! command -v gsutil &> /dev/null; then
    echo -e "${YELLOW}⚠️  gsutil is not installed${NC}"
    echo "Storage sync will be skipped. To include storage:"
    echo "1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
    echo "2. Run: gcloud auth login"
    SKIP_STORAGE=true
else
    SKIP_STORAGE=false
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Firebase${NC}"
    echo "Please login first with: firebase login"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check completed${NC}"

echo ""
echo -e "${YELLOW}📋 This script will:${NC}"
echo "1. Export Firestore data from production"
if [ "$SKIP_STORAGE" = false ]; then
    echo "2. Download Storage files from production"
    echo "3. Start emulator with all production data"
else
    echo "2. Skip Storage sync (gsutil not available)"
    echo "3. Start emulator with Firestore data only"
fi

echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Step 1: Sync Firestore data
echo ""
echo -e "${BLUE}🔄 Step 1: Syncing Firestore data...${NC}"
./scripts/sync-production-data.sh &
FIRESTORE_PID=$!

# Step 2: Sync Storage data (if gsutil available)
if [ "$SKIP_STORAGE" = false ]; then
    echo ""
    echo -e "${BLUE}🔄 Step 2: Downloading Storage files...${NC}"
    ./scripts/sync-storage-data.sh
fi

# Wait for Firestore export to complete
wait $FIRESTORE_PID

# Step 3: Start emulator and upload storage files
if [ "$SKIP_STORAGE" = false ]; then
    echo ""
    echo -e "${BLUE}🔄 Step 3: Starting emulator and uploading storage files...${NC}"
    
    # Start emulator in background
    npm run emulator &
    EMULATOR_PID=$!
    
    # Wait for emulator to be ready
    echo -e "${YELLOW}⏳ Waiting for emulator to start...${NC}"
    sleep 10
    
    # Check if emulator is running
    if ! curl -s http://localhost:9199 > /dev/null 2>&1; then
        echo -e "${YELLOW}⏳ Emulator still starting, waiting longer...${NC}"
        sleep 10
    fi
    
    if curl -s http://localhost:9199 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Emulator is running${NC}"
        
        # Upload files to running emulator
        echo -e "${BLUE}📤 Uploading files to emulator...${NC}"
        node scripts/upload-to-emulator.js
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Files uploaded successfully${NC}"
        else
            echo -e "${YELLOW}⚠️  Some files may not have uploaded correctly${NC}"
        fi
        
        # Keep emulator running
        echo ""
        echo -e "${GREEN}🎉 Production data sync completed!${NC}"
        echo ""
        echo -e "${BLUE}📋 Summary:${NC}"
        echo "   ✅ Firestore data imported"
        echo "   ✅ Storage files uploaded to emulator"
        echo "   🚀 Emulator running with production data"
        echo ""
        echo -e "${YELLOW}💡 Access your app:${NC}"
        echo "   🌐 Website: http://localhost:5050"
        echo "   🔧 Admin: http://localhost:5050/admin"
        echo "   📊 Emulator UI: http://localhost:4000"
        echo ""
        echo -e "${BLUE}🛑 To stop: Press Ctrl+C${NC}"
        echo ""
        
        # Wait for emulator process
        wait $EMULATOR_PID
    else
        echo -e "${RED}❌ Emulator failed to start${NC}"
        kill $EMULATOR_PID 2>/dev/null || true
        exit 1
    fi
else
    echo ""
    echo -e "${GREEN}🎉 Firestore data sync completed!${NC}"
    echo ""
    echo -e "${YELLOW}🚀 Next steps:${NC}"
    echo "1. Start development: npm run emulator"
    echo "2. Your app will use production Firestore data"
    echo "3. Install gsutil for storage file sync"
fi

echo ""
echo -e "${BLUE}📝 Notes:${NC}"
echo "• Emulator data is saved to ./emulator_data/ for reuse"
echo "• Re-run this script to refresh with latest production data"
echo "• Storage files are cached locally - no internet needed after sync"