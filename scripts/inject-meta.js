#!/usr/bin/env node

/**
 * Meta Data Injection Script
 * 
 * This script fetches site settings from production Firestore and injects
 * them into src/index.html from src/index.html.template before building.
 * 
 * Usage: node scripts/inject-meta.js
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return envVars;
  } catch (error) {
    log('red', `❌ Error reading ${filePath}: ${error.message}`);
    process.exit(1);
  }
}

async function ensureGoogleCloudAuth() {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  try {
    // Check if Google Cloud Application Default Credentials are available
    await execAsync('gcloud auth application-default print-access-token', { timeout: 5000 });
    log('green', '✅ Google Cloud Application Default Credentials are available');
    return true;
  } catch (error) {
    log('yellow', '⚠️  Google Cloud Application Default Credentials not found');
    log('red', '❌ Google Cloud authentication required for Firestore access');
    log('blue', '💡 Please run the following command manually in a separate terminal:');
    log('blue', '   gcloud auth application-default login --no-launch-browser');
    log('yellow', '   Then press any key to continue...');
    
    // Wait for user to press a key
    process.stdin.setRawMode(true);
    process.stdin.resume();
    
    await new Promise(resolve => {
      process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve();
      });
    });

    // Check again if authentication is now available
    try {
      await execAsync('gcloud auth application-default print-access-token', { timeout: 5000 });
      log('green', '✅ Google Cloud authentication verified');
      return true;
    } catch (retryError) {
      log('red', '❌ Authentication still not available');
      log('yellow', '   Please ensure you completed the authentication process');
      process.exit(1);
    }
  }
}

async function initializeFirebase(envVars) {
  try {
    // Ensure Google Cloud authentication is available
    await ensureGoogleCloudAuth();

    // Initialize Firebase Admin SDK with project ID only
    // This should work if Google Cloud is authenticated
    admin.initializeApp({
      projectId: envVars.FIREBASE_PROJECT_ID
    });
    
    log('green', '✅ Firebase Admin SDK initialized successfully');
    return admin.firestore();
  } catch (error) {
    log('red', `❌ Error initializing Firebase: ${error.message}`);
    log('yellow', '   Please ensure you are authenticated with Google Cloud');
    process.exit(1);
  }
}

async function fetchSiteSettings(db) {
  try {
    log('blue', '📋 Fetching site settings from Firestore...');
    
    const settingsDoc = await db.collection('settings').doc('main-settings').get();
    
    if (!settingsDoc.exists) {
      log('red', '❌ Site settings document not found in Firestore');
      log('yellow', '   Please ensure the settings document exists at /settings/main-settings');
      process.exit(1);
    }
    
    const settings = settingsDoc.data();
    log('green', '✅ Site settings fetched successfully');
    
    return {
      siteName: settings.siteName || 'Tribecaconcepts',
      siteDescription: settings.siteDescription || 'MIYUKI NAGAI-GUBSER @ TribeCa conceptS',
      siteKeywords: Array.isArray(settings.siteKeywords) ? settings.siteKeywords.join(', ') : 'portfolio, art, abstract, paintings, visual, expression, mindmap, emotions, memories',
      faviconUrl: settings.faviconUrl || 'favicon.ico'
    };
  } catch (error) {
    log('red', `❌ Error fetching site settings: ${error.message}`);
    process.exit(1);
  }
}

function generateIndexFromTemplate(templatePath, siteSettings) {
  try {
    let content = fs.readFileSync(templatePath, 'utf8');
    
    // Replace all template variables with actual values
    content = content.replace(/{{SITE_NAME}}/g, siteSettings.siteName);
    content = content.replace(/{{SITE_DESCRIPTION}}/g, siteSettings.siteDescription);
    content = content.replace(/{{SITE_KEYWORDS}}/g, siteSettings.siteKeywords);
    content = content.replace(/{{FAVICON_URL}}/g, siteSettings.faviconUrl);
    
    return content;
  } catch (error) {
    log('red', `❌ Error reading template file ${templatePath}: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  log('blue', '🔧 Injecting meta data from Firestore into index.html...');
  
  // Paths
  const envFile = path.join(process.cwd(), '.env.production');
  const templateFile = path.join(process.cwd(), 'src/index.html.template');
  const indexFile = path.join(process.cwd(), 'src/index.html');
  
  // Check if .env.production exists
  if (!fs.existsSync(envFile)) {
    log('red', '❌ .env.production file not found');
    log('yellow', '   Please run ./scripts/setup-firebase.sh first');
    process.exit(1);
  }
  
  // Check if template file exists
  if (!fs.existsSync(templateFile)) {
    log('red', '❌ src/index.html.template file not found');
    process.exit(1);
  }
  
  // Load environment variables
  log('blue', '📋 Loading environment variables from .env.production...');
  const envVars = loadEnvFile(envFile);
  
  // Initialize Firebase Admin SDK
  const db = await initializeFirebase(envVars);
  
  // Fetch site settings from Firestore
  const siteSettings = await fetchSiteSettings(db);
  
  // Generate index.html from template
  log('blue', '📋 Generating index.html from template...');
  const indexContent = generateIndexFromTemplate(templateFile, siteSettings);
  
  // Write the index.html file
  try {
    fs.writeFileSync(indexFile, indexContent, 'utf8');
    log('green', '✅ index.html generated successfully with Firestore data');
    log('blue', `   📁 Updated: ${indexFile}`);
  } catch (error) {
    log('red', `❌ Error writing index.html file: ${error.message}`);
    process.exit(1);
  }
  
  // Show injected values
  log('blue', '📋 Injected meta data:');
  console.log(`   🏷️  Site Name: ${siteSettings.siteName}`);
  console.log(`   📝 Description: ${siteSettings.siteDescription.substring(0, 50)}...`);
  console.log(`   🔍 Keywords: ${siteSettings.siteKeywords.substring(0, 60)}...`);
  console.log(`   🎨 Favicon: ${siteSettings.faviconUrl}`);
  
  log('green', '🎉 Meta data injection completed successfully!');
  
  // Clean up Firebase connection
  await admin.app().delete();
}

// Run the script
main().catch(error => {
  log('red', `❌ Script failed: ${error.message}`);
  process.exit(1);
});