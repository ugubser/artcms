# Tribeca Concepts Portfolio Website

A Swiss design-inspired portfolio website built with Angular and powered by Firebase for seamless content management. This project demonstrates modern web development practices with secure deployment, real-time content management, and elegant Swiss design principles.

## 🎯 Perfect For

- **Portfolio Websites**: Showcase creative work with elegant galleries
- **Small Business Sites**: Professional presence with easy content management  
- **Design Studios**: Swiss design aesthetic with modern functionality
- **Learning Project**: Modern Angular + Firebase development patterns
- **Template Base**: Customizable foundation for similar projects

## 🔥 Live Demo

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
- **Public Site**: `http://localhost:4200/`
- **Admin Panel**: `http://localhost:4200/admin`
- **Firebase Emulator UI**: `http://localhost:4000/`

6. **Initial Admin Setup**
- Go to `http://localhost:4200/admin/login`
- Sign in with Google using one of your configured admin emails
- Start managing content through the CMS interface

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

## Features & Benefits

### 🔐 Security First
- **Template-Based Configuration**: No sensitive data in git repository
- **Environment Variable Injection**: Secure deployment with automated credential handling
- **Role-Based Access Control**: Admin-only content management with email whitelisting
- **Firebase Security Rules**: Comprehensive database and storage protection

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

### Unit Tests
```bash
ng test
```

### End-to-End Testing  
```bash
ng e2e
```

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
- **Angular Team**: For the excellent framework
- **Firebase**: For the powerful backend-as-a-service platform
- **Open Source Community**: For the tools and libraries that make this possible

## Support

If you find this project helpful, please consider:
- ⭐ Starring the repository
- 🍴 Forking for your own projects
- 🐛 Reporting issues
- 📝 Contributing improvements

## Additional Resources

- [Angular CLI Documentation](https://angular.dev/tools/cli)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Swiss Design Principles](https://www.smashingmagazine.com/2009/07/lessons-from-swiss-style-graphic-design/)
- [Angular Material Design](https://material.angular.io/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
