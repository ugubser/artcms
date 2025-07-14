# Production Deployment Guide

This guide walks you through deploying the Tribeca Concepts portfolio website to Firebase production.

## Prerequisites

- Node.js and npm installed
- Firebase CLI installed globally: `npm install -g firebase-tools`
- Angular CLI installed globally: `npm install -g @angular/cli`
- A Firebase project created in the Firebase Console

## Quick Start

1. **Initial Setup**
   ```bash
   ./scripts/setup-firebase.sh
   ```

2. **Deploy to Production**
   ```bash
   ./scripts/deploy.sh
   ```

## Manual Setup Process

### 1. Firebase Console Configuration

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name your project (e.g., "tribecaconcepts-production")
4. Enable Google Analytics if desired
5. Wait for project creation

#### Enable Required Services
1. **Authentication**
   - Go to Authentication > Sign-in method
   - Enable Google provider
   - Add authorized domains (your production domain)

2. **Firestore Database**
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in production mode"
   - Select your preferred location

3. **Storage**
   - Go to Storage
   - Click "Get started"
   - Accept default rules (will be overridden by deployment)

4. **Hosting**
   - Go to Hosting
   - Click "Get started"
   - Follow the setup wizard

### 2. Admin User Setup

#### Method 1: Manual Addition in Firebase Console
1. Go to Authentication > Users
2. Click "Add user"
3. Enter admin email and temporary password
4. Send password reset email to admin
5. Admin can login and change password

#### Method 2: First-time Google Sign-in
1. Deploy the application
2. Try to access `/admin` with your Google account
3. It will fail (expected)
4. Go to Firebase Console > Authentication > Users
5. You'll see your Google account listed
6. Add your email to the whitelists in code (see below)

### 3. Environment Configuration

#### Admin Email Configuration
Admin emails are now automatically injected via environment variables. No manual code editing required!

1. **Environment File** (`.env.production`)
   ```bash
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   FIREBASE_APP_ID=your-app-id
   
   # Admin emails (comma-separated)
   ADMIN_EMAILS=admin@tribecaconcepts.com,your-google-account@gmail.com
   ```

2. **Automatic Injection During Deployment**
   - **AuthService**: Loads admin emails from `environment.adminEmails`
   - **Firebase Rules**: Generated automatically with injected admin emails
   - **Consistent Configuration**: Same emails used across all security layers

### 4. Automated Setup Process

#### Using Setup Script (Recommended)
```bash
./scripts/setup-firebase.sh
```

This script will:
- Collect your Firebase project credentials
- Prompt for admin email addresses
- Generate `.env.production` with all configuration
- Update `.firebaserc` with your project ID

#### Manual Configuration (Alternative)
If you prefer manual setup:

1. **Create `.env.production`**:
   ```bash
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   FIREBASE_APP_ID=your-app-id
   ADMIN_EMAILS=admin@example.com,another-admin@example.com
   ```

2. **Update `.firebaserc`**:
   ```json
   {
     "projects": {
       "default": "your-production-project-id",
       "dev": "tribecaconcepts-9c"
     }
   }
   ```

### 5. Security Rules (Automatic)

The deployment automatically generates secure Firestore and Storage rules:

- **Public content**: Portfolio, About, Contact, Settings (read-only)
- **Admin operations**: Creating, updating, deleting content (admin-only)
- **File uploads**: Image uploads restricted to admin users with size/type validation
- **Authentication**: Google Sign-in with email whitelist
- **Auto-generated**: Rules are created with your admin emails during deployment

### 6. Deployment Process

#### Automated Deployment (Recommended)
```bash
./scripts/deploy.sh
```

The script automatically:
1. **Loads Environment**: Sources `.env.production` for configuration
2. **Validates Setup**: Checks for required environment variables
3. **Generates Rules**: Creates Firebase rules with your admin emails
4. **Builds Application**: Compiles Angular with injected environment variables
5. **Deploys Everything**: Firestore rules, Storage rules, and hosting
6. **Validates Deployment**: Ensures all components deployed successfully

#### Manual Deployment Steps (Alternative)
1. **Generate Rules**:
   ```bash
   export $(grep -v '^#' .env.production | xargs)
   node scripts/generate-rules.js
   ```

2. **Build Application**:
   ```bash
   export $(grep -v '^#' .env.production | xargs)
   ng build --configuration production
   ```

3. **Deploy to Firebase**:
   ```bash
   firebase deploy
   ```

## Post-Deployment

### 1. Test Admin Access
1. Visit your production URL
2. Navigate to `/admin`
3. Sign in with your Google account
4. Verify you can access the CMS

### 2. Content Management
- **Portfolio**: Add/edit portfolio items with images
- **About**: Manage about sections with rich text
- **Contact**: Update contact information
- **Settings**: Configure site-wide settings

### 3. Domain Configuration (Optional)
1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Follow the verification process
4. Update DNS records as instructed

## Security Considerations

### Authentication
- Only whitelisted Google accounts can access admin panel
- No anonymous access to admin functions
- Session management handled by Firebase Auth

### Database Security
- Public content is read-only for visitors
- All write operations require admin authentication
- Email-based authorization in security rules

### File Storage
- Public images are readable by all
- Only admin users can upload/modify files
- File type and size validation in storage rules
- Temporary files are admin-only readable

### Environment Variables
- Production credentials are environment-based
- Sensitive data excluded from version control
- Environment variables injected at build time

## Monitoring and Maintenance

### Firebase Console Monitoring
- **Authentication**: Monitor user sign-ins
- **Firestore**: Monitor database usage
- **Storage**: Track file uploads and storage usage
- **Hosting**: Monitor site performance

### Error Handling
- Client-side error handling in Angular services
- Server-side security rules provide additional protection
- Firebase Console provides detailed error logs

## Troubleshooting

### Common Issues
1. **403 Errors**: Check admin email whitelist configuration
2. **Build Failures**: Verify environment variables are set
3. **Deploy Failures**: Ensure Firebase CLI is logged in
4. **Authentication Issues**: Verify Google provider is enabled

### Debug Steps
1. Check Firebase Console for errors
2. Verify admin email is in all three locations
3. Test authentication with browser developer tools
4. Check Firestore and Storage rules in Firebase Console

## Support

For issues or questions:
1. Check Firebase Console logs
2. Review security rules in Firebase Console
3. Verify environment configuration
4. Test with development environment first