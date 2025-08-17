#!/usr/bin/env node

/**
 * Upload Production Storage Files to Firebase Emulator
 * 
 * This script uploads downloaded production files to the running Firebase Storage emulator.
 * The emulator will then properly manage and persist these files.
 * 
 * Usage: node scripts/upload-to-emulator.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
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

function loadFirebaseConfig() {
  try {
    // Read development environment configuration
    const envPath = path.join(process.cwd(), 'src/environments/environment.ts');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Extract firebase config and admin emails from the TypeScript file
    const firebaseConfigMatch = envContent.match(/firebase:\s*{([^}]+)}/s);
    const adminEmailsMatch = envContent.match(/adminEmails:\s*['"`]([^'"`]+)['"`]/);
    
    if (!firebaseConfigMatch) {
      throw new Error('Could not parse firebase config from environment.ts');
    }
    
    // Parse the firebase config properties
    const firebaseConfigText = firebaseConfigMatch[1];
    const apiKeyMatch = firebaseConfigText.match(/apiKey:\s*["'`]([^"'`]+)["'`]/);
    const authDomainMatch = firebaseConfigText.match(/authDomain:\s*["'`]([^"'`]+)["'`]/);
    const projectIdMatch = firebaseConfigText.match(/projectId:\s*["'`]([^"'`]+)["'`]/);
    const storageBucketMatch = firebaseConfigText.match(/storageBucket:\s*["'`]([^"'`]+)["'`]/);
    const messagingSenderIdMatch = firebaseConfigText.match(/messagingSenderId:\s*["'`]([^"'`]+)["'`]/);
    const appIdMatch = firebaseConfigText.match(/appId:\s*["'`]([^"'`]+)["'`]/);
    
    const adminEmails = adminEmailsMatch ? adminEmailsMatch[1].split(',').map(email => email.trim()) : [];
    
    return {
      firebase: {
        apiKey: apiKeyMatch ? apiKeyMatch[1] : 'demo-api-key',
        authDomain: authDomainMatch ? authDomainMatch[1] : 'demo-project.firebaseapp.com',
        projectId: projectIdMatch ? projectIdMatch[1] : 'demo-project',
        storageBucket: storageBucketMatch ? storageBucketMatch[1] : 'demo-project.appspot.com',
        messagingSenderId: messagingSenderIdMatch ? messagingSenderIdMatch[1] : '123456789',
        appId: appIdMatch ? appIdMatch[1] : 'demo-app-id'
      },
      adminEmails: adminEmails
    };
  } catch (error) {
    log('yellow', `⚠️  Could not read environment config: ${error.message}`);
    log('yellow', '   Using fallback configuration...');
    return {
      firebase: {
        apiKey: 'demo-api-key',
        authDomain: 'tribecaconcepts-9c.firebaseapp.com',
        projectId: 'tribecaconcepts-9c',
        storageBucket: 'tribecaconcepts-9c.firebasestorage.app',
        messagingSenderId: '123456789',
        appId: 'demo-app-id'
      },
      adminEmails: ['urs@gubser.ch', 'ugubser@gmail.com']
    };
  }
}

async function initializeFirebaseAdmin() {
  const config = loadFirebaseConfig();
  
  // Configure for emulator
  process.env['FIREBASE_STORAGE_EMULATOR_HOST'] = 'localhost:9199';
  
  // Clear any existing Firebase instances
  try {
    await admin.app().delete();
  } catch (e) {
    // App doesn't exist, which is fine
  }
  
  // Initialize Firebase Admin SDK
  admin.initializeApp({
    projectId: config.firebase.projectId,
    storageBucket: config.firebase.storageBucket
  });
  
  log('green', '✅ Firebase Admin SDK initialized for emulator');
  return { config };
}

async function findDownloadedFiles() {
  const downloadDir = './storage';
  
  if (!fs.existsSync(downloadDir)) {
    log('red', '❌ No downloaded files found. Please run ./scripts/sync-storage-data.sh first');
    process.exit(1);
  }
  
  const files = [];
  
  function scanDirectory(dir, basePath = '') {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      const relativePath = basePath ? path.join(basePath, item.name) : item.name;
      
      if (item.isDirectory()) {
        scanDirectory(fullPath, relativePath);
      } else if (item.isFile()) {
        files.push({
          localPath: fullPath,
          storagePath: relativePath,
          size: fs.statSync(fullPath).size
        });
      }
    }
  }
  
  scanDirectory(downloadDir);
  return files;
}

async function uploadFileToEmulator(file) {
  try {
    log('blue', `🔄 Uploading: ${file.storagePath}`);
    
    // Read file content
    const fileContent = fs.readFileSync(file.localPath);
    
    // Determine content type from file extension
    const getContentType = (filename) => {
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg', 
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.avif': 'image/avif',
        '.svg': 'image/svg+xml'
      };
      return mimeTypes[ext] || 'image/jpeg'; // Default to jpeg
    };
    
    // Get bucket and create file reference
    const bucket = admin.storage().bucket();
    const file_ref = bucket.file(file.storagePath);
    
    // Upload file with proper metadata using Admin SDK
    await file_ref.save(fileContent, {
      metadata: {
        contentType: getContentType(file.storagePath)
      }
    });
    
    log('green', `✅ Uploaded: ${file.storagePath} (${(file.size / 1024).toFixed(1)} KB)`);
    return true;
  } catch (error) {
    log('red', `❌ Failed to upload ${file.storagePath}: ${error.message}`);
    return false;
  }
}

async function main() {
  log('blue', '🚀 Uploading production files to Firebase Storage emulator...');
  
  // Check if emulator is running using http.get
  try {
    await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:9199', (res) => {
        // Any response means emulator is running (even 501 Not Implemented)
        resolve(res);
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
    
    log('green', '✅ Storage emulator is accessible');
  } catch (error) {
    log('red', '❌ Firebase Storage emulator is not running');
    log('yellow', '   Please start the emulator first: npm run emulator');
    log('blue', `   Debug: ${error.message}`);
    process.exit(1);
  }
  
  // Initialize Firebase Admin SDK
  const { config } = await initializeFirebaseAdmin();
  
  // Find downloaded files
  log('blue', '📋 Scanning for downloaded files...');
  const files = await findDownloadedFiles();
  
  if (files.length === 0) {
    log('yellow', '⚠️  No files found to upload');
    log('blue', '   Run ./scripts/sync-storage-data.sh to download files first');
    process.exit(0);
  }
  
  log('green', `✅ Found ${files.length} files to upload`);
  
  // Upload files
  let successCount = 0;
  let failCount = 0;
  
  for (const file of files) {
    const success = await uploadFileToEmulator(file);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  // Summary
  log('blue', '📋 Upload Summary:');
  console.log(`   ✅ Successfully uploaded: ${successCount} files`);
  if (failCount > 0) {
    console.log(`   ❌ Failed uploads: ${failCount} files`);
  }
  
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  console.log(`   💾 Total size uploaded: ${(totalSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`   🌐 Storage bucket: ${config.storageBucket}`);
  
  if (successCount > 0) {
    log('green', '🎉 Files uploaded to emulator successfully!');
    log('blue', '💡 The emulator will now persist these files across restarts');
  }
  
  if (failCount > 0) {
    log('yellow', '⚠️  Some uploads failed. Check the error messages above.');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log('red', `❌ Script failed: ${error.message}`);
  process.exit(1);
});