#!/usr/bin/env node

// Script to generate Firebase rules with injected admin emails from environment variables
// This ensures admin emails are consistently applied across all Firebase security rules

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

// Get admin emails from environment variable
const adminEmails = process.env.ADMIN_EMAILS || '';
const emailArray = adminEmails.split(',').map(email => email.trim()).filter(email => email);

if (emailArray.length === 0) {
  log('red', '❌ No admin emails found in ADMIN_EMAILS environment variable');
  process.exit(1);
}

log('blue', '📧 Admin emails found: ' + emailArray.join(', '));

// Format emails for Firebase rules
const formattedEmails = emailArray.map(email => `'${email}'`).join(',\n               ');

// Read template files
const rootDir = path.join(__dirname, '..');
const firestoreTemplatePath = path.join(rootDir, 'firestore.rules.template');
const storageTemplatePath = path.join(rootDir, 'storage.rules.template');

if (!fs.existsSync(firestoreTemplatePath)) {
  log('red', '❌ firestore.rules.template file not found');
  process.exit(1);
}

if (!fs.existsSync(storageTemplatePath)) {
  log('red', '❌ storage.rules.template file not found');
  process.exit(1);
}

// Generate rules from templates
let firestoreRules = fs.readFileSync(firestoreTemplatePath, 'utf8');
let storageRules = fs.readFileSync(storageTemplatePath, 'utf8');

// Replace placeholder with formatted emails
firestoreRules = firestoreRules.replace('{{ADMIN_EMAILS_ARRAY}}', formattedEmails);
storageRules = storageRules.replace('{{ADMIN_EMAILS_ARRAY}}', formattedEmails);

// Write rules to files
const firestoreRulesPath = path.join(rootDir, 'firestore.rules');
const storageRulesPath = path.join(rootDir, 'storage.rules');

fs.writeFileSync(firestoreRulesPath, firestoreRules);
fs.writeFileSync(storageRulesPath, storageRules);

log('green', '✅ Generated firestore.rules with admin emails');
log('green', '✅ Generated storage.rules with admin emails');
log('blue', '🔐 Rules generated for admin emails: ' + emailArray.join(', '));