# Tribeca Concepts Portfolio Website

A Swiss design-inspired portfolio website built with Angular and powered by FireCMS for seamless content management. This project clones the aesthetic and functionality of the original Tribeca Concepts website while providing a modern, scalable CMS solution.

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

**Portfolio Management** (`/portfolio`)
- Project showcase with categories (Art, Design, Branding)
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

**Site Settings** (`/settings`)
- SEO metadata management
- Branding assets (logos, favicons)
- Global site configuration

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Angular CLI 20.1.0
- Firebase CLI for deployment

### Quick Start

1. **Clone and Install**
```bash
git clone <repository-url>
cd tribeca-concepts-clone
npm install
```

2. **Firebase Setup**
```bash
# Configure Firebase (replace with your project)
firebase login
firebase use --add your-project-id

# Start emulators for local development
firebase emulators:start
```

3. **Development Server**
```bash
ng serve
```
Navigate to `http://localhost:4200/`

4. **Admin Access**
- Visit `http://localhost:4200/admin`
- Sign in with Firebase Auth credentials
- Start managing content immediately

### Firebase Emulator Configuration
- **Firestore**: localhost:8080
- **Storage**: localhost:9199  
- **Authentication**: localhost:9099

## Project Structure

```
src/
├── app/
│   ├── cms/                    # FireCMS configuration & admin interface
│   │   ├── cms.config.ts       # Content schema definitions
│   │   └── cms.component.ts    # Custom admin interface
│   ├── components/             # Public-facing components
│   │   ├── home/              # Landing page
│   │   ├── portfolio-grid/    # Portfolio display
│   │   └── navigation/        # Site navigation
│   ├── services/              # Firebase integration services
│   │   ├── portfolio.service.ts
│   │   ├── auth.service.ts
│   │   └── firebase.service.ts
│   └── guards/                # Route protection
└── environments/              # Firebase configuration
```

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

## Development Benefits of FireCMS Approach

### For Developers
- **Reduced Boilerplate**: Schema-driven development eliminates repetitive CRUD code
- **Type Safety**: Auto-generated TypeScript interfaces prevent runtime errors
- **Real-Time Development**: Instant content updates during development
- **Scalable Architecture**: Firebase handles scaling without infrastructure management

### For Content Managers
- **Immediate Publishing**: Changes go live instantly without technical intervention
- **Media Management**: Drag-and-drop image uploads with automatic optimization
- **Collaborative Editing**: Multiple users can edit content simultaneously
- **Version Control**: Firebase's real-time sync provides natural versioning

### For Maintenance
- **Security**: Firebase handles authentication, authorization, and data security
- **Environment Safety**: Template-based configuration prevents sensitive data commits
- **Performance**: CDN-delivered assets and optimized queries out of the box  
- **Monitoring**: Built-in Firebase console for usage analytics and error tracking
- **Backup**: Automatic data backup and point-in-time recovery

## Swiss Design Implementation

This project faithfully recreates Swiss design principles:
- **Grid-based layouts** with mathematical precision
- **Minimal color palette** emphasizing contrast and readability
- **Typography hierarchy** using Helvetica font family
- **Asymmetrical balance** while maintaining visual harmony
- **Generous white space** for content breathing room

## Testing

### Unit Tests
```bash
ng test
```

### End-to-End Testing  
```bash
ng e2e
```

## Additional Resources

- [Angular CLI Documentation](https://angular.dev/tools/cli)
- [FireCMS Documentation](https://firecms.co/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Swiss Design Principles](https://www.smashingmagazine.com/2009/07/lessons-from-swiss-style-graphic-design/)
