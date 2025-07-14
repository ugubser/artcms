#!/usr/bin/env node

// Script to generate Firebase rules with injected admin emails from environment variables
// This ensures admin emails are consistently applied across all Firebase security rules

const fs = require('fs');
const path = require('path');

// Get admin emails from environment variable
const adminEmails = process.env.ADMIN_EMAILS || '';
const emailArray = adminEmails.split(',').map(email => email.trim()).filter(email => email);

if (emailArray.length === 0) {
  console.error('❌ No admin emails found in ADMIN_EMAILS environment variable');
  process.exit(1);
}

console.log('📧 Admin emails found:', emailArray);

// Format emails for Firebase rules
const formattedEmails = emailArray.map(email => `'${email}'`).join(',\n               ');

// Generate Firestore rules
const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             request.auth.token.email in [
               ${formattedEmails}
             ];
    }
    
    // Allow authenticated users to read/write their own content
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Portfolio content - public read, admin write
    match /portfolio/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // About content - public read, admin write
    match /about/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Contact content - public read, admin write
    match /contact/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Site settings - public read, admin write
    match /settings/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Portfolio pages settings - public read, admin write
    match /portfolio-pages/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}`;

// Generate Storage rules
const storageRules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             request.auth.token.email in [
               ${formattedEmails}
             ];
    }
    
    // Helper function to check for valid image types
    function isValidImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    // Helper function to check file size (max 10MB)
    function isValidSize() {
      return request.resource.size < 10 * 1024 * 1024;
    }
    
    // Portfolio images - public read, admin write with validation
    match /portfolio/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin() && isValidImage() && isValidSize();
    }
    
    // Portfolio featured images - public read, admin write with validation
    match /portfolio/featured/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin() && isValidImage() && isValidSize();
    }
    
    // Portfolio gallery images - public read, admin write with validation
    match /portfolio/gallery/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin() && isValidImage() && isValidSize();
    }
    
    // About page images - public read, admin write with validation
    match /about/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin() && isValidImage() && isValidSize();
    }
    
    // General uploads - admin only with validation
    match /uploads/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin() && isValidImage() && isValidSize();
    }
    
    // Temporary uploads for CMS - admin only with validation
    match /temp/{allPaths=**} {
      allow read: if isAdmin();
      allow write: if isAdmin() && isValidImage() && isValidSize();
    }
    
    // Deny all other paths by default
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}`;

// Write rules to files
const rootDir = path.join(__dirname, '..');
const firestoreRulesPath = path.join(rootDir, 'firestore.rules');
const storageRulesPath = path.join(rootDir, 'storage.rules');

fs.writeFileSync(firestoreRulesPath, firestoreRules);
fs.writeFileSync(storageRulesPath, storageRules);

console.log('✅ Generated firestore.rules with admin emails');
console.log('✅ Generated storage.rules with admin emails');
console.log('🔐 Rules generated for admin emails:', emailArray.join(', '));