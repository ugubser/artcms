#!/usr/bin/env node

/**
 * Development Environment Variable Injection Script
 * 
 * This script creates the development environment.ts file from template
 * if it doesn't already exist. It will NOT overwrite an existing file
 * to preserve developer's local configuration.
 * 
 * Usage: node scripts/inject-env-dev.js
 */

const fs = require('fs');
const path = require('path');

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

function validateEnvironmentVariables(envVars) {
  const requiredVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID',
    'ADMIN_EMAILS'
  ];
  
  const missing = requiredVars.filter(varName => !envVars[varName]);
  
  if (missing.length > 0) {
    log('red', `❌ Missing required environment variables: ${missing.join(', ')}`);
    log('yellow', '   Please check your .env.production file');
    process.exit(1);
  }
  
  log('green', '✅ All required environment variables found');
}

function generateEnvironmentFromTemplate(templatePath, envVars) {
  try {
    let content = fs.readFileSync(templatePath, 'utf8');
    
    // Replace all template variables with actual values
    Object.keys(envVars).forEach(key => {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), envVars[key]);
    });
    
    return content;
  } catch (error) {
    log('red', `❌ Error reading template file ${templatePath}: ${error.message}`);
    process.exit(1);
  }
}

function main() {
  log('blue', '🔧 Checking development environment configuration...');
  
  // Paths
  const envFile = path.join(process.cwd(), '.env.production');
  const envTemplate = path.join(process.cwd(), 'src/environments/environment.ts.template');
  const envDevFile = path.join(process.cwd(), 'src/environments/environment.ts');
  
  // Check if development environment file already exists
  if (fs.existsSync(envDevFile)) {
    log('green', '✅ Development environment file already exists');
    log('blue', `   📁 Using existing: ${envDevFile}`);
    log('yellow', '💡 To regenerate, delete the file and run this script again');
    return;
  }
  
  // Check if .env.production exists
  if (!fs.existsSync(envFile)) {
    log('red', '❌ .env.production file not found');
    log('yellow', '   Please run ./scripts/setup-firebase.sh first');
    process.exit(1);
  }
  
  // Check if template file exists
  if (!fs.existsSync(envTemplate)) {
    log('red', '❌ src/environments/environment.ts.template file not found');
    process.exit(1);
  }
  
  // Load environment variables
  log('blue', '📋 Loading environment variables from .env.production...');
  const envVars = loadEnvFile(envFile);
  
  // Validate required variables
  validateEnvironmentVariables(envVars);
  
  // Generate development environment file from template
  log('blue', '📋 Generating development environment file...');
  const devContent = generateEnvironmentFromTemplate(envTemplate, envVars);
  
  // Write the development environment file
  try {
    fs.writeFileSync(envDevFile, devContent, 'utf8');
    log('green', '✅ Development environment file created successfully');
    log('blue', `   📁 Created: ${envDevFile}`);
    log('yellow', '💡 This file is now yours to customize for development');
  } catch (error) {
    log('red', `❌ Error writing environment file: ${error.message}`);
    process.exit(1);
  }
  
  // Show injected values (mask sensitive data)
  log('blue', '📋 Injected configuration:');
  console.log(`   🔑 API Key: ${envVars.FIREBASE_API_KEY.substring(0, 20)}...`);
  console.log(`   🌐 Auth Domain: ${envVars.FIREBASE_AUTH_DOMAIN}`);
  console.log(`   📦 Project ID: ${envVars.FIREBASE_PROJECT_ID}`);
  console.log(`   🗄️  Storage Bucket: ${envVars.FIREBASE_STORAGE_BUCKET}`);
  console.log(`   👥 Admin Emails: ${envVars.ADMIN_EMAILS}`);
  
  log('green', '🎉 Development environment setup completed!');
  log('blue', '💡 Note: This file will not be overwritten in future runs');
}

// Run the script
main();