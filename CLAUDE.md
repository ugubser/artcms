# Claude Code Configuration

## Project Overview
Tribeca Concepts Portfolio Website - A Swiss design-inspired portfolio website built with Angular SSR and powered by Firebase for seamless content management. Server-side rendering ensures proper SEO meta tags and Open Graph data for every route.

## Development Commands

### Development Server (SSR)
```bash
npm run dev
```
Runs Angular dev server with SSR at `http://localhost:4200/`

### Firebase Emulators (backend data)
```bash
npm run emulator
```
- Firestore: localhost:8080
- Storage: localhost:9199
- Authentication: localhost:9099
- Hosting: localhost:5050
- Functions: localhost:5001

For development, run both `npm run dev` and `npm run emulator` in separate terminals.

### Build Commands
```bash
# Development build
npm run build

```

### Production Deployment
```bash
# Setup Firebase project and environment
./scripts/setup-firebase.sh

# Deploy to production (hosting + functions + rules)
./scripts/deploy.sh
```

### Testing
```bash
# Unit tests
ng test

# End-to-end tests (if configured)
ng e2e

# Lint code (not configured)
ng lint
```

## Project Structure

### Key Directories
- `src/app/cms/` - Custom Angular Material admin interface
- `src/app/components/` - Public-facing Angular components
- `src/app/services/` - Firebase integration services
- `src/environments/` - Firebase configuration
- `scripts/` - Deployment and setup scripts
- `functions/` - Firebase Cloud Functions (SSR entry point)

### Important Files
- `src/app/cms/cms.component.ts` - Custom Angular Material admin interface
- `src/app/components/admin-login/` - Admin authentication component
- `src/app/services/portfolio.service.ts` - Portfolio CRUD operations
- `src/app/services/auth.service.ts` - Firebase authentication with Google OAuth
- `src/app/services/meta.service.ts` - SEO meta tags and Open Graph tags
- `src/app/guards/auth.guard.ts` - Route protection for admin access
- `src/app/app.routes.server.ts` - SSR route render mode config
- `src/app/app.config.server.ts` - Server-side Angular config
- `src/server.ts` - Express server for SSR
- `functions/index.js` - Firebase Cloud Function SSR entry
- `firebase.json` - Firebase project configuration
- `firestore.rules` - Firestore security rules
- `storage.rules` - Firebase Storage security rules
- `scripts/inject-env.js` - Environment variable injection script
- `src/environments/*.template` - Environment configuration templates

## SSR Architecture

### Render Modes
- **Public routes** (`/home`, `/about`, `/contact`, `/portfolio/*`, slug routes) → `RenderMode.Server` (SSR per request with live Firestore data)
- **Admin routes** (`/admin`, `/admin/login`) → `RenderMode.Client` (SPA only, no SSR)
- **Sitemaps** (`/sitemap.xml`, `/sitemap.html`) → `RenderMode.Server`

### SSR Considerations
- Browser APIs (`document.*`, `window.*`) are guarded with `isPlatformBrowser()`
- Firestore observables use `first()` on server to ensure completion
- `provideBrowserGlobalErrorListeners()` is in `src/main.ts` (browser only), not in shared config
- `MetaService.setPageMeta()` sets `<title>`, `og:title`, `og:description`, `og:image` per route
- Firebase Cloud Function (`functions/index.js`) serves SSR HTML; static assets come from Firebase Hosting CDN

## Content Management System

### Admin Access
- **Development**: `http://localhost:4200/admin` (emulator mode)
- **Production**: `https://your-domain.com/admin` (requires authentication)
- **Login**: `https://your-domain.com/admin/login` (Google OAuth)

### Authentication
- **Google OAuth**: Admin users authenticate with Google accounts
- **Email Whitelist**: Admin access restricted to specific email addresses
- **Security**: Route protection via AuthGuard, secure Firebase rules

### Content Collections
- **Portfolio** (`/portfolio`) - Project showcase with image galleries
- **About** (`/about`) - Markdown-supported content sections
- **Contact** (`/contact`) - Business information and social links
- **Settings** (`/settings`) - Site configuration and SEO
- **Portfolio Pages** (`/portfolio-pages`) - Page-specific settings

## Production Deployment

### Prerequisites
- Firebase project created
- Google Authentication enabled in Firebase Console
- Admin email addresses configured in code

### Security Features
- **Environment Templating**: Template-based environment configuration prevents sensitive data commits
- **Environment Separation**: Clear separation between development and production
- **Firebase Rules**: Secure database and storage rules
- **Admin Authorization**: Email-based admin user whitelist
- **Route Protection**: AuthGuard prevents unauthorized access
- **HTTPS Only**: Production uses secure connections only

### Deployment Process
1. **Setup**: Run `./scripts/setup-firebase.sh` to configure Firebase project
2. **Environment Injection**: `./scripts/deploy.sh` automatically injects environment variables from templates
3. **Deploy**: Run `./scripts/deploy.sh` for automated deployment (hosting + functions + rules)
4. **Test**: Access admin panel and verify authentication works

### Environment Variables
- `.env.example` - Template for environment variables
- `.env.production` - Production Firebase credentials (git-ignored)
- `.env.local` - Local testing credentials (git-ignored)
- `src/environments/*.template` - Environment configuration templates (git-tracked)
- `src/environments/environment.ts` - Generated development config (git-ignored)
- `src/environments/environment.prod.ts` - Generated production config (git-ignored)

## Technology Stack
- **Frontend**: Angular 20.1.0 + Angular Material UI
- **SSR**: Angular SSR (`@angular/ssr`) with Express
- **Backend**: Firebase (Firestore, Storage, Auth, Cloud Functions)
- **Authentication**: Google OAuth with email whitelist
- **Styling**: SCSS with Swiss design principles
- **Deployment**: Firebase Hosting (static assets) + Cloud Functions (SSR)

## Development Notes
- Uses Firebase emulators for local development
- `ng serve` provides SSR dev server; Firebase emulators provide backend data
- Environment configuration via template system in `src/environments/`
- Swiss design principles guide the visual implementation
- Real-time content updates through Firestore
- Custom Angular admin interface with Material Design
- Secure production deployment with environment variable injection
- Template-based configuration prevents sensitive data commits
- SSR ensures crawlers see correct meta tags for each route
