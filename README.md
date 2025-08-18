# Tribeca Concepts Portfolio Website

A Swiss design-inspired portfolio website built with Angular and powered by Firebase for seamless content management. This project demonstrates modern web development practices with secure deployment, real-time content management, and elegant Swiss design principles.

**✨ Version 2.0 Features:**
- **Flexible Portfolio Management**: Cross-category assignments with centralized category system
- **Enhanced SEO & Schema.org**: Complete structured data implementation for search engines
- **Advanced Picture Management**: Individual artwork metadata with pricing, dimensions, and detailed information
- **Production Data Sync**: Seamless local development with production data integration
- **Dynamic Routing System**: Support for both ID-based and legacy category routes

## 🎯 Perfect For

- **Portfolio Websites**: Showcase creative work with elegant galleries
- **Small Business Sites**: Professional presence with easy content management  
- **Design Studios**: Swiss design aesthetic with modern functionality
- **Learning Project**: Modern Angular + Firebase development patterns
- **Template Base**: Customizable foundation for similar projects

## 🔥 Live Demo

[tribecaconcept.com](https://www.tribecaconcepts.com/)

> **Note**: This is a template repository. Set up your own Firebase project to see it in action following the setup guide below. 

## Architecture Overview

### Frontend: Angular + Swiss Design Principles
- **Framework**: Angular 20.1.0 with Angular Material UI
- **Design System**: Swiss/International Typographic Style
- **Responsive Design**: Mobile-first approach with systematic grid layouts
- **Typography**: Helvetica-based font stack with mathematical precision
- **Color Palette**: High-contrast monochromatic scheme

### Backend: Firebase + FireCMS Integration
- **Database**: Cloud Firestore for real-time content management
- **Storage**: Firebase Storage for optimized image handling
- **Authentication**: Firebase Auth with role-based access control
- **CMS**: Custom Angular admin interface using FireCMS schemas

## FireCMS Content Management System

### Why FireCMS Makes Development Easier

**Schema-Driven Architecture**
- Content models defined once in `cms.config.ts` auto-generate:
  - TypeScript interfaces
  - Database structure  
  - Admin forms
  - Validation rules
  - API endpoints

**Rapid Content Type Creation**
```typescript
// Adding a new content type takes minutes
const newsCollection = buildCollection({
  name: "News",
  path: "news", 
  properties: {
    title: buildProperty({ dataType: "string" }),
    content: buildProperty({ dataType: "string", markdown: true }),
    publishDate: buildProperty({ dataType: "date" })
  }
});
```

**Real-Time Updates**
- Content changes appear instantly across all devices
- No cache invalidation or manual refreshes needed
- Collaborative editing with live sync

**Non-Technical User Empowerment**
- Intuitive admin interface at `/admin`
- Drag-and-drop image uploads
- WYSIWYG markdown editing
- Publishing workflow with draft/live states

### Content Collections

**Portfolio Management** (`/portfolio`) - **Enhanced in v2.0**
- **Flexible Assignment System**: Assign any portfolio to any portfolio page across categories
- **Centralized Category Management**: Dynamic categories loaded from `categories.json`
- **Dual Routing Support**: Both ID-based (`/portfolio-page/:pageId`) and legacy category routes
- **Enhanced Artwork Metadata**: Dimensions, pricing, sold status, art medium, genre, and creation dates
- **Individual Picture Viewer**: Direct access to artworks with `/portfolio/:id/galleries/:galleryIndex/pictures/:pictureIndex`
- Multi-image galleries with Firebase Storage integration
- Publishing workflow for content control
- Automatic image optimization and responsive serving

**About Section** (`/about`)
- Markdown-supported content editing
- Profile image management
- Structured content sections

**Contact Information** (`/contact`) 
- Business details with validation
- Social media link management
- Email configuration

**Site Settings** (`/settings`) - **Enhanced in v2.0**
- **Artist Profile Schema**: Complete artist information for Schema.org structured data
- **Enhanced SEO Management**: Comprehensive metadata with structured data support
- **Sitemap Generation**: Automatic XML and HTML sitemap creation with portfolio data
- Branding assets (logos, favicons)
- Global site configuration

### CMS Configuration Details

The CMS is configured through `src/app/cms/cms.config.ts` which defines:

- **Portfolio Collection**: Manage portfolio items with categories and image galleries
- **About Collection**: Edit about page content with markdown support
- **Contact Collection**: Manage contact information and social media links
- **Settings Collection**: Control site-wide settings like SEO metadata

Each collection supports:
- **Custom Validation**: Field-level validation rules
- **Image Uploads**: Direct integration with Firebase Storage
- **Rich Text Editing**: Markdown support for content fields
- **Publishing Workflow**: Draft/published status for content

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Angular CLI 20.1.0
- Firebase CLI for deployment

### Quick Start

1. **Clone and Install**
```bash
git clone https://github.com/yourusername/tribeca-concepts-clone.git
cd tribeca-concepts-clone
npm install
```

2. **Firebase Project Setup**
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Create a new Firebase project or use existing one
firebase projects:create your-project-id

# Configure the project
firebase use --add your-project-id
```

3. **Environment Configuration**
```bash
# Run the setup script to configure Firebase credentials
./scripts/setup-firebase.sh
```

This script will:
- Prompt for your Firebase project credentials
- Ask for admin email addresses
- Generate `.env.production` file with your configuration
- Update `.firebaserc` with your project ID

4. **Start Development Environment**
```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, start the development server
ng serve
```

5. **Access the Application**
- **Public Site**: `http://localhost:5050/`
- **Admin Panel**: `http://localhost:5050/admin`
- **Firebase Emulator UI**: `http://localhost:4000/`

6. **Initial Admin Setup**
- Go to `http://localhost:5050/admin/login`
- Sign in with Google using one of your configured admin emails
- Start managing content through the CMS interface

### Firebase Emulator Configuration
- **Firestore**: localhost:8080
- **Storage**: localhost:9199
- **Authentication**: localhost:9099

### Development Workflow with Emulators

The development workflow uses Firebase emulators for local testing:

- **Data Persistence**: Emulator data is persisted in `emulator_data/` directory
- **Easy Reset**: Delete `emulator_data/` to start with a clean slate
- **Realistic Testing**: Emulators closely match production Firebase behavior
- **Offline Development**: Work without internet connectivity
- **Security Testing**: Test Firebase rules locally before deployment

### Environment Variable Injection

The project uses a template-based configuration system to securely manage environment variables:

- **Template Files**: Configuration templates are stored in `src/environments/*.template` and are tracked in version control
- **Environment Files**: Actual configuration files (`.env.production`, `.env.local`) contain sensitive data and are git-ignored
- **Injection Process**: During deployment, scripts inject real values from environment files into templates
- **Security**: Sensitive data never committed to the repository

### Meta Data Injection

Site metadata (title, description, keywords) is automatically injected from Firestore settings:

- **Template**: `src/index.html.template` contains placeholders for metadata
- **Injection**: `scripts/inject-meta.js` fetches settings from Firestore and generates `src/index.html`
- **Dynamic Updates**: Site metadata can be updated through the CMS without code changes

### Firebase Rules Generation

Firebase security rules are automatically generated with admin email whitelisting:

- **Templates**: `firestore.rules.template` and `storage.rules.template` contain placeholders
- **Generation**: `scripts/generate-rules.js` creates actual rules with injected admin emails
- **Consistency**: Same admin emails used across all security layers

### Admin Email Whitelisting

Admin access is controlled through email whitelisting for enhanced security:

- **Configuration**: Admin emails are configured during setup via `./scripts/setup-firebase.sh`
- **Injection**: Emails are automatically injected into Firebase rules and Angular environment files
- **Authentication**: Only whitelisted Google accounts can access the admin panel
- **Authorization**: Route protection and Firebase rules enforce admin-only access

## Project Structure

```
src/
├── app/
│   ├── cms/                           # FireCMS configuration & admin interface
│   │   ├── cms.config.ts              # Content schema definitions
│   │   ├── cms.component.ts           # Custom admin interface component
│   │   ├── components/                # CMS custom components
│   │   └── dialogs/                   # CMS edit dialogs
│   ├── components/                    # Public-facing components
│   │   ├── about/                     # About page component
│   │   ├── admin-login/               # Admin authentication component
│   │   ├── contact/                   # Contact page component
│   │   ├── home/                      # Landing page component
│   │   ├── portfolio/                 # Portfolio category pages
│   │   ├── portfolio-detail/          # Portfolio item detail pages
│   │   ├── portfolio-grid/            # Portfolio grid display component
│   │   └── shared/                    # Shared UI components
│   ├── guards/                        # Route protection guards
│   │   └── auth.guard.ts              # Admin route protection
│   ├── services/                      # Firebase integration services
│   │   ├── about.service.ts           # About content management
│   │   ├── analytics.service.ts       # Analytics integration
│   │   ├── auth.service.ts            # Authentication service
│   │   ├── category.service.ts        # **NEW v2.0**: Dynamic category management
│   │   ├── contact.service.ts         # Contact content management
│   │   ├── firebase.service.ts        # Firebase utilities
│   │   ├── meta.service.ts            # Meta tag management
│   │   ├── portfolio-pages.service.ts # Portfolio page settings
│   │   ├── portfolio.service.ts       # **ENHANCED v2.0**: Portfolio content with flexible assignments
│   │   ├── settings.service.ts       # Site settings management
│   │   └── storage-url.service.ts     # **NEW v2.0**: Storage URL resolution system
│   ├── app.config.ts                 # Angular application configuration
│   ├── app.routes.ts                 # Application routing configuration
│   └── app.ts                        # Main application component
├── assets/                           # Static assets
│   ├── data/                         # **NEW v2.0**: Configuration data
│   │   └── categories.json           # **NEW v2.0**: Centralized category definitions
│   ├── fonts/                        # Custom fonts
│   └── images/                       # Static images
├── environments/                      # Environment configuration
│   ├── environment.prod.ts.template  # Production environment template
│   └── environment.ts.template       # Development environment template
├── styles.scss                       # Global styles
└── index.html.template               # HTML template with metadata placeholders

scripts/                              # Deployment and setup scripts
├── deploy.sh                         # Production deployment script
├── generate-rules.js                 # Firebase rules generation
├── inject-env.js                     # Environment variable injection
├── inject-meta.js                    # **ENHANCED v2.0**: Production metadata & sitemap generation
├── inject-meta-dev.js                # **NEW v2.0**: Development metadata & sitemap generation
├── setup-firebase.sh                 # Firebase project setup
├── sync-all-production-data.sh       # **NEW v2.0**: Complete production data sync
├── sync-production-gcloud.sh         # **NEW v2.0**: Firestore data sync
├── sync-storage-data.sh              # **NEW v2.0**: Firebase Storage sync
├── upload-to-emulator.js             # **NEW v2.0**: Storage upload to emulator
└── upload-storage-to-emulator.sh     # **NEW v2.0**: Storage sync wrapper
```

### Deployment Process Details

The deployment process automates several important steps:

1. **Environment Validation**: Checks for required environment variables
2. **Rule Generation**: Creates Firebase rules with admin email injection
3. **Environment Injection**: Generates environment files from templates
4. **Meta Data Injection**: Fetches site settings from Firestore
5. **Build Process**: Compiles Angular application for production
6. **Validation**: Ensures build output meets requirements
7. **Deployment**: Deploys Firestore rules, Storage rules, and hosting
8. **Cleanup**: Removes sensitive environment variables from memory

### Angular Application Structure

The application follows a modular structure with clear separation of concerns:

- **Standalone Components**: Modern Angular approach using standalone components
- **Lazy Loading**: Routes are lazy-loaded for improved performance
- **Services**: Firebase integration is encapsulated in dedicated services
- **Guards**: Route protection using Angular guards
- **CMS Integration**: Custom FireCMS implementation for content management
- **Picture Viewer Component**: **NEW v2.0** - Individual artwork viewing with navigation
- **Flexible Routing**: **NEW v2.0** - Dual routing system supporting both ID-based and category routes
- **Dynamic Categories**: **NEW v2.0** - Category management through external configuration

### Authentication and Authorization System

The application implements a robust authentication and authorization system:

- **Google OAuth**: Authentication using Google accounts for security
- **Email Whitelisting**: Admin access restricted to pre-configured email addresses
- **Route Protection**: AuthGuard prevents unauthorized access to admin routes
- **Service-Level Authorization**: Services check admin status before operations
- **Development Mode**: Relaxed security in emulator mode for testing

## Deployment

### Automated Production Deployment
```bash
# Setup Firebase project and environment
./scripts/setup-firebase.sh

# Deploy to production with secure environment injection
./scripts/deploy.sh
```

### Manual Production Build
```bash
# Inject environment variables from templates
node scripts/inject-env.js

# Build for production
ng build --configuration production

# Deploy to Firebase
firebase deploy
```

## What's New in v2.0

### 🎯 Flexible Portfolio Management System
- **Cross-Category Assignments**: Assign any portfolio item to any portfolio page, regardless of category
- **Centralized Category Management**: New `CategoryService` with `categories.json` for dynamic category handling
- **Dual Routing System**: Support for both ID-based routes (`/portfolio-page/:pageId`) and legacy category routes (`/art`, `/exhibition`)
- **Enhanced Admin Interface**: Advanced edit dialogs with dynamic dropdowns and improved form validation

### 🖼️ Advanced Artwork & Picture Management
- **Expanded Metadata**: Dimensions, pricing, sold status, art medium, genre, and creation date fields
- **Individual Picture Viewer**: Direct access to artworks with keyboard navigation and full-screen viewing
- **Enhanced Image Navigation**: Cross-gallery navigation with visual controls and hover effects
- **Redesigned Picture Interface**: Two-column layout matching portfolio detail design

### 🔍 Enhanced SEO & Schema.org Integration
- **Static Sitemap Generation**: XML and HTML sitemaps with complete portfolio data for search engines
- **Schema.org Structured Data**: Full VisualArtwork and Person schema implementation
- **Artist Profile Support**: Comprehensive artist information fields with social media integration
- **Enhanced Meta Generation**: Automatic SEO file generation for both development and production

### 🔧 Development Workflow Improvements
- **Production Data Sync**: Complete Firebase Storage and Firestore sync for local development
- **Storage URL Resolution**: Centralized system for seamless emulator/production switching
- **Environment Separation**: Improved development/production configuration management
- **Enhanced Firebase Integration**: Better emulator support with production data compatibility

### 🎨 UI/UX Enhancements
- **Improved Layout System**: Dynamic grid layouts with responsive image handling
- **Enhanced Markdown Support**: Fixed list parsing and improved content formatting
- **Interactive Thumbnails**: Direct clickable sitemap thumbnails with scale animations
- **Consistent Design Language**: Swiss design principles maintained across all new components

## Features & Benefits

### 🔐 Security First
- **Template-Based Configuration**: No sensitive data in git repository
- **Environment Variable Injection**: Secure deployment with automated credential handling
- **Role-Based Access Control**: Admin-only content management with email whitelisting
- **Firebase Security Rules**: Comprehensive database and storage protection
- **HTTPS Enforcement**: Production deployment uses secure connections only
- **Data Validation**: Strict validation in both frontend and backend
- **Input Sanitization**: Protection against malicious content

### 🚀 Developer Experience
- **Rapid Setup**: One-command deployment with automated environment configuration
- **Real-Time Development**: Live content updates during development
- **Type Safety**: Full TypeScript support with auto-generated interfaces
- **Modern Stack**: Angular 20+ with Firebase integration

### 📝 Content Management
- **Intuitive Admin Interface**: Clean, Swiss design-inspired CMS
- **Rich Content Editing**: Markdown support with live preview
- **Image Management**: Drag-and-drop uploads with automatic optimization
- **Portfolio System**: Multi-gallery support with category management

### 🎨 Design System
- **Swiss Design Principles**: Mathematical precision in typography and layout
- **Responsive Architecture**: Mobile-first design with systematic grid
- **Performance Optimized**: CDN delivery and optimized asset loading
- **SEO Ready**: Meta tag management and semantic HTML structure

## Swiss Design Implementation

This project faithfully recreates Swiss design principles:
- **Grid-based layouts** with mathematical precision
- **Minimal color palette** emphasizing contrast and readability
- **Typography hierarchy** using Helvetica font family
- **Asymmetrical balance** while maintaining visual harmony
- **Generous white space** for content breathing room

## Testing

### Unit Testing with Jasmine and Karma

This project uses Jasmine as the testing framework and Karma as the test runner. Jasmine provides behavior-driven development (BDD) capabilities, while Karma runs tests in real browsers.

**Running Unit Tests**
```bash
# Run tests once
ng test

# Run tests in watch mode (re-runs on file changes)
ng test --watch

# Run tests with code coverage
ng test --code-coverage
```

**Test Configuration**
- **Karma**: Configured through Angular CLI in `angular.json` (test section)
- **Jasmine**: Specified in `tsconfig.spec.json` as the testing framework
- **Test Files**: All files with `.spec.ts` extension are automatically recognized as test files
- **Test Environment**: Runs in Chrome browser by default with headless option available

**Example Test Structure**
```typescript
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App Component', () => {
  beforeEach(async () => {
    // Configure testing module before each test
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    // Test individual functionality
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
```

**Key Testing Features**
- **Component Testing**: Test Angular components in isolation or with their templates
- **Service Testing**: Mock dependencies and test business logic
- **Asynchronous Testing**: Handle promises, observables, and HTTP requests
- **DOM Testing**: Verify component rendering and user interactions
- **Code Coverage**: Measure test coverage with detailed reports

### End-to-End Testing
```bash
ng e2e
```

### Testing Procedures

The project includes comprehensive testing capabilities:

- **Unit Testing**: Component and service testing with Jasmine and Karma
- **End-to-End Testing**: Integration testing with Protractor (if configured)
- **Emulator Testing**: Test Firebase rules and functions locally
- **Manual Testing**: Use Firebase Emulator UI for data inspection
- **Security Testing**: Validate Firebase rules with emulator testing

**Troubleshooting Test Errors**

If you encounter errors when running the test server, it may be due to:

1. **Template Mismatch**: The test expects specific DOM elements that don't exist in the actual template
2. **Missing Dependencies**: The App component depends on Firebase services that need to be mocked in tests
3. **Environment Configuration**: Tests may fail if they can't connect to Firebase emulators

To fix these issues, ensure that:
- Test files properly mock all external dependencies
- Test expectations match the actual component template
- Firebase services are properly stubbed in the testing environment

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. **Security**: Never commit sensitive data (API keys, credentials, personal emails)
2. **Templates**: Use the template system for any configuration files
3. **Documentation**: Update relevant documentation for new features
4. **Testing**: Ensure tests pass before submitting PRs
5. **Code Style**: Follow existing code patterns and conventions

### Security Note

This project uses a template-based configuration system to prevent sensitive data from being committed to the repository. All credentials are injected during deployment. Please maintain this security standard in contributions.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- **Swiss Design Movement**: For the timeless design principles
- **Angular Team**: For the excellent framework and Angular 20+ capabilities
- **Firebase**: For the powerful backend-as-a-service platform and emulator tools
- **FireCMS**: For a very simple to implement CMS system
- **Schema.org Community**: For the structured data standards implemented in v2.0
- **Open Source Community**: For the tools and libraries that make this possible

## Version History

- **v2.0** (Current) - Major portfolio management overhaul with SEO enhancements
- **v1.x** - Initial FireCMS implementation with Swiss design principles

## Support

If you find this project helpful, please consider:
- ⭐ Starring the repository
- 🍴 Forking for your own projects
- 🐛 Reporting issues
- 📝 Contributing improvements

## Additional Resources

- [Angular CLI Documentation](https://angular.dev/tools/cli)
- [Firebase Documentation](https://firebase.google.com/docs)
- [FireCMS Documentation](https://firecms.co/docs)
- [Swiss Design Principles](https://www.smashingmagazine.com/2009/07/lessons-from-swiss-style-graphic-design/)
- [Angular Material Design](https://material.angular.io/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
