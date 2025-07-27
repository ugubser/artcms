# Claude Code Configuration

## Project Overview
Tribeca Concepts Portfolio Website - A Swiss design-inspired portfolio website built with Angular and powered by Firebase for seamless content management.

## Development Commands

### Development Server
```bash
cd tribeca-concepts-clone
npm run emulator
```
Server runs at `http://localhost:5050/`

### Firebase Emulators
```bash
cd tribeca-concepts-clone
npm run emulator
```
- Firestore: localhost:8080
- Storage: localhost:9199  
- Authentication: localhost:9099

### Build Commands
```bash
# Development build
npm run build

```

### Production Deployment
```bash
# Setup Firebase project and environment
./scripts/setup-firebase.sh

# Deploy to production
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

### Important Files
- `src/app/cms/cms.component.ts` - Custom Angular Material admin interface
- `src/app/components/admin-login/` - Admin authentication component
- `src/app/services/portfolio.service.ts` - Portfolio CRUD operations
- `src/app/services/auth.service.ts` - Firebase authentication with Google OAuth
- `src/app/guards/auth.guard.ts` - Route protection for admin access
- `firebase.json` - Firebase project configuration
- `firestore.rules` - Firestore security rules
- `storage.rules` - Firebase Storage security rules
- `scripts/inject-env.js` - Environment variable injection script
- `src/environments/*.template` - Environment configuration templates

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
3. **Deploy**: Run `./scripts/deploy.sh` for automated deployment
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
- **Backend**: Firebase (Firestore, Storage, Auth)
- **Authentication**: Google OAuth with email whitelist
- **Styling**: SCSS with Swiss design principles
- **Deployment**: Firebase Hosting with automated scripts

## Development Notes
- Uses Firebase emulators for local development
- Environment configuration via template system in `src/environments/`
- Swiss design principles guide the visual implementation
- Real-time content updates through Firestore
- Custom Angular admin interface with Material Design
- Secure production deployment with environment variable injection
- Template-based configuration prevents sensitive data commits
