# Production Deployment Guide

This guide walks you through deploying the Tribeca Concepts portfolio website to Firebase production.

## Prerequisites

- Node.js and npm installed
- Firebase CLI installed globally: `npm install -g firebase-tools`
- Angular CLI installed globally: `npm install -g @angular/cli`
- A Firebase project created in the Firebase Console
- **Blaze (pay-as-you-go) plan** enabled on the Firebase project (required for Cloud Functions / SSR)

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

   # Site URL for sitemap generation (base URL used in sitemap.xml)
   SITE_URL=https://your-domain.com
   ```

2. **Automatic Injection During Deployment**
   - **Template System**: Environment files generated from `.template` files during deployment
   - **AuthService**: Loads admin emails from `environment.adminEmails`
   - **Firebase Rules**: Generated automatically with injected admin emails
   - **Consistent Configuration**: Same emails used across all security layers
   - **Security**: Sensitive data never committed to git repository

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
   SITE_URL=https://your-domain.com
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
4. **Injects Environment**: Generates environment files from templates with real values
5. **Builds Application**: Compiles Angular with injected environment variables
6. **Deploys Everything**: Firestore rules, Storage rules, and hosting
7. **Validates Deployment**: Ensures all components deployed successfully

#### Manual Deployment Steps (Alternative)
1. **Generate Rules**:
   ```bash
   export $(grep -v '^#' .env.production | xargs)
   node scripts/generate-rules.js
   ```

2. **Inject Environment Variables**:
   ```bash
   node scripts/inject-env.js
   ```

3. **Build Application**:
   ```bash
   ng build --configuration production
   ```

4. **Deploy to Firebase**:
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
- Environment variables injected at build time from templates
- Template system prevents accidental commits of sensitive data

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

## Deploying to a New Domain (Fresh Start)

This project is fully portable. You can deploy it to a completely new Firebase project and domain with no content carryover. All site content lives in Firestore and Firebase Storage, so a new project starts empty and you populate it through the CMS.

### What you get out of the box

- The CMS admin panel at `/admin` for managing all content
- Sample/default data that fills in automatically when collections are empty (site name, placeholder about sections, etc.)
- Security rules generated from your `ADMIN_EMAILS` environment variable
- SSR with dynamic meta tags for SEO on every route

### Step-by-step

1. **Create a new Firebase project** in the [Firebase Console](https://console.firebase.google.com):
   - Enable **Authentication** > Sign-in method > **Google**
   - Create **Cloud Firestore** database (production mode, pick your region)
   - Enable **Storage** (production mode, same region)
   - Enable **Hosting**
   - Upgrade to **Blaze plan** (required for Cloud Functions)
   - Register a **Web app** under Project settings > General, and copy the config values

2. **Run the setup script**:
   ```bash
   firebase login
   ./scripts/setup-firebase.sh
   ```
   Enter your new project ID, Firebase config values, and admin email addresses when prompted. This generates `.env.production` and `.env.local`.

3. **Set your site URL** in `.env.production`:
   ```
   SITE_URL=https://your-new-domain.com
   ```

4. **Update the sitemap SSR fallback** in `src/app/components/sitemap-xml/sitemap-xml.component.ts` (line 48):
   ```typescript
   // Change the fallback domain used when window.location is unavailable (SSR)
   const baseUrl = isPlatformBrowser(this.platformId)
     ? window.location.origin
     : 'https://your-new-domain.com';
   ```

5. **Deploy**:
   ```bash
   ./scripts/deploy.sh
   ```

6. **Connect your custom domain** in Firebase Console > Hosting > Add custom domain. Add the DNS records (TXT for verification, then A records). SSL is provisioned automatically.

7. **Add your admin domain** to Firebase Console > Authentication > Settings > Authorized domains (add your custom domain).

8. **Populate content** by visiting `https://your-new-domain.com/admin/login`, signing in with Google, and using the CMS to add portfolio items, about sections, contact info, and site settings.

### Optional: Update default fallback values

These are fallback values shown briefly before Firestore data loads. They don't affect functionality but you may want them to match your brand:

| File | Line | Default value |
|------|------|---------------|
| `src/app/app.ts` | 17 | `'tribecaconcepts'` |
| `src/app/components/home/home.component.ts` | 28, 30 | Site name and footer text |
| `src/app/components/shared/page-header.component.ts` | 184 | `'tribeca concepts'` |
| `src/app/services/meta.service.ts` | 78 | `'Tribecaconcepts'` |
| `src/app/services/settings.service.ts` | 110-137 | Default settings (email, colors, etc.) |
| `src/app/services/contact.service.ts` | 58-72 | Sample contact data and social links |

All of these are overridden at runtime by whatever you save in the CMS.

## Firestore Collections Reference

All content is managed through the CMS admin panel. These are the collections and their expected document structures:

### `settings` (document ID: `main-settings`)

| Field | Type | Description |
|-------|------|-------------|
| `siteName` | string | Display name in header and meta tags |
| `siteDescription` | string | Subtitle and meta description |
| `siteKeywords` | string[] | SEO keywords |
| `contactEmail` | string | Primary contact email |
| `logoUrl` | string | Firebase Storage path to site logo |
| `faviconUrl` | string | Firebase Storage path to favicon |
| `primaryColor` | string | Hex color code |
| `secondaryColor` | string | Hex color code |
| `footerText` | string | Footer copyright text |
| `enableAnalytics` | boolean | Toggle Google Analytics |
| `analyticsId` | string | Google Analytics ID |
| `socialMedia` | object | `{ facebook, twitter, instagram, linkedin }` URLs |
| `artistName` | string | (optional) Artist name for structured data |
| `artistBiography` | string | (optional) Artist bio |
| `artistPortraitUrl` | string | (optional) Storage path to portrait |
| `updatedAt` | timestamp | Last update time |

### `portfolio` (auto-generated IDs)

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Portfolio item title |
| `description` | string | Markdown-formatted description |
| `category` | string | Category identifier |
| `portfolioPageId` | string | (optional) Assigned portfolio page |
| `featuredImage` | string | Storage path to main image |
| `galleries` | array | Array of gallery objects (each with `id`, `title`, `description`, `order`, `pictures[]`) |
| `published` | boolean | Visibility on public site |
| `order` | number | Display order |
| `createdAt` | timestamp | Creation time |

Each gallery picture contains: `id`, `imageUrl`, `description`, `alt`, `order`, `dateCreated`, `artMedium`, `genre`, `dimensions`, `price`, `sold`, `showPrice`.

### `portfolio-pages` (auto-generated IDs)

| Field | Type | Description |
|-------|------|-------------|
| `category` | string | Category identifier |
| `title` | string | Navigation link text |
| `subtitle` | string | Page subtitle |
| `slug` | string | URL slug (e.g., `art` for `/art`) |
| `order` | number | Navigation order |
| `updatedAt` | timestamp | Last update time |

### `about` (auto-generated IDs)

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Section heading |
| `content` | string | Markdown-formatted body text |
| `image` | string | (optional) Storage path to section image |
| `order` | number | Display order |

### `contact` (document ID: `main-contact`)

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | Contact email address |
| `phone` | string | (optional) Phone number |
| `address` | string | (optional) Physical address |
| `socialMedia` | object | `{ instagram, linkedin, twitter, behance }` URLs |

### `mail` (auto-generated IDs, created by contact form)

| Field | Type | Description |
|-------|------|-------------|
| `to` | string | Recipient email |
| `message` | object | `{ subject, text, html }` |

## Firebase Storage Structure

All images are uploaded through the CMS and stored under these paths:

| Path | Contents |
|------|----------|
| `portfolio/featured/` | Portfolio featured/cover images |
| `portfolio/gallery/` | Gallery images (named `{portfolioId}_{index}_{filename}`) |
| `about/` | About page section images |
| `branding/` | Site logo and favicon |
| `uploads/` | General file uploads |
| `temp/` | Temporary CMS upload staging (admin-only read) |

Images are served via Firebase Storage download URLs. No hardcoded bucket URLs exist in the codebase -- all references go through the Firebase SDK.

## Support

For issues or questions:
1. Check Firebase Console logs
2. Review security rules in Firebase Console
3. Verify environment configuration
4. Test with development environment first