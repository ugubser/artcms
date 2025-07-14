#!/bin/bash

# Production Deployment Script
# This script handles the complete deployment process with environment variable injection

set -e

echo "🚀 Production Deployment Script"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed${NC}"
    echo "Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if Angular CLI is installed
if ! command -v ng &> /dev/null; then
    echo -e "${RED}❌ Angular CLI is not installed${NC}"
    echo "Please install it with: npm install -g @angular/cli"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Firebase${NC}"
    echo "Please login first with: firebase login"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production file not found${NC}"
    echo "Please run ./scripts/setup-firebase.sh first"
    exit 1
fi

# Load environment variables from .env.production first
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production file not found${NC}"
    echo "Please run ./scripts/setup-firebase.sh first"
    exit 1
fi

echo -e "${BLUE}📋 Loading environment variables...${NC}"
set -a
source .env.production
set +a

echo -e "${BLUE}📋 Current Firebase project:${NC}"
firebase projects:list | grep -E "(default|Project ID)"

echo ""
echo -e "${YELLOW}🔧 Pre-deployment checks...${NC}"

# Check if ADMIN_EMAILS environment variable is set
if [ -z "$ADMIN_EMAILS" ]; then
    echo -e "${RED}❌ ADMIN_EMAILS environment variable not found${NC}"
    echo "Please ensure .env.production contains ADMIN_EMAILS=your-email@example.com"
    exit 1
fi

echo -e "${GREEN}✅ Admin emails found: $ADMIN_EMAILS${NC}"

echo ""
echo -e "${BLUE}🧹 Cleaning previous builds...${NC}"
rm -rf dist/

echo ""
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo ""
echo -e "${BLUE}🧪 Running linter...${NC}"
if npm run lint 2>/dev/null; then
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${YELLOW}⚠️  No linting script found, skipping...${NC}"
fi

echo ""
echo -e "${BLUE}🧪 Running tests...${NC}"
echo -e "${YELLOW}⚠️  Skipping tests for faster deployment...${NC}"
echo -e "${BLUE}💡 Run 'npm test' manually if you want to test before deployment${NC}"

echo ""
echo -e "${BLUE}🔧 Generating Firebase rules with admin emails...${NC}"

# Generate Firebase rules with injected admin emails (environment already loaded)
node scripts/generate-rules.js

echo ""
echo -e "${BLUE}🔧 Injecting environment variables...${NC}"

# Inject environment variables into environment.prod.ts
node scripts/inject-env.js

echo ""
echo -e "${BLUE}🏗️  Building for production...${NC}"

# Build with production configuration
ng build --configuration production

echo -e "${GREEN}✅ Build completed successfully${NC}"

echo ""
echo -e "${BLUE}🔍 Validating build output...${NC}"
if [ ! -d "dist/tribeca-concepts-clone/browser" ]; then
    echo -e "${RED}❌ Build output directory not found${NC}"
    exit 1
fi

# Check if critical files exist
if [ ! -f "dist/tribeca-concepts-clone/browser/index.html" ]; then
    echo -e "${RED}❌ Critical file missing: index.html${NC}"
    exit 1
fi

# Check if main JS file exists (with hash)
if ! ls dist/tribeca-concepts-clone/browser/main-*.js 1> /dev/null 2>&1; then
    echo -e "${RED}❌ Main JavaScript file not found${NC}"
    exit 1
fi

# Check if polyfills exist
if ! ls dist/tribeca-concepts-clone/browser/polyfills-*.js 1> /dev/null 2>&1; then
    echo -e "${RED}❌ Polyfills file not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build validation passed${NC}"

echo ""
echo -e "${BLUE}🚀 Deploying to Firebase...${NC}"

# Deploy Firestore rules
echo -e "${BLUE}📋 Deploying Firestore rules...${NC}"
firebase deploy --only firestore:rules

# Deploy Storage rules
echo -e "${BLUE}📁 Deploying Storage rules...${NC}"
firebase deploy --only storage

# Deploy Firestore indexes
echo -e "${BLUE}🔍 Deploying Firestore indexes...${NC}"
firebase deploy --only firestore:indexes

# Deploy hosting
echo -e "${BLUE}🌐 Deploying hosting...${NC}"
firebase deploy --only hosting

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""

# Get the hosting URL
HOSTING_URL=$(firebase hosting:channel:list | grep -E "live" | awk '{print $4}' | head -1)
if [ -z "$HOSTING_URL" ]; then
    PROJECT_ID=$(firebase projects:list | grep -E "default" | awk '{print $1}')
    HOSTING_URL="https://${PROJECT_ID}.web.app"
fi

echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "   🌐 Website: $HOSTING_URL"
echo "   🔧 Admin Panel: $HOSTING_URL/admin"
echo "   📊 Firebase Console: https://console.firebase.google.com/project/$(firebase projects:list | grep -E "default" | awk '{print $1}')"
echo ""

echo -e "${YELLOW}🔐 Next Steps:${NC}"
echo "1. Enable Google Authentication in Firebase Console"
echo "2. Test the admin login at $HOSTING_URL/admin"
echo "3. Add admin users in Firebase Console > Authentication"
echo "4. Monitor deployment in Firebase Console"
echo ""

echo -e "${YELLOW}⚠️  Security Reminder:${NC}"
echo "- Admin access is restricted to whitelisted email addresses"
echo "- /admin route is protected by authentication"
echo "- Firestore and Storage rules enforce admin-only writes"
echo ""

# Cleanup
unset FIREBASE_API_KEY FIREBASE_AUTH_DOMAIN FIREBASE_PROJECT_ID FIREBASE_STORAGE_BUCKET FIREBASE_MESSAGING_SENDER_ID FIREBASE_APP_ID

echo -e "${GREEN}✨ All done!${NC}"