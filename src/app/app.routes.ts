import { Routes } from '@angular/router';
import { CMSComponent } from './cms/cms.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) },
  
  // Portfolio page routes (new: by portfolio page ID)
  { path: 'portfolio-page/:pageId', loadComponent: () => import('./components/portfolio/portfolio.component').then(m => m.PortfolioComponent), data: { mode: 'page' } },
  
  // Legacy category routes (backwards compatible)
  { path: 'art', loadComponent: () => import('./components/portfolio/portfolio.component').then(m => m.PortfolioComponent), data: { category: 'art', mode: 'category' } },
  { path: 'design', loadComponent: () => import('./components/portfolio/portfolio.component').then(m => m.PortfolioComponent), data: { category: 'graphic-design', mode: 'category' } },
  { path: 'exhibition', loadComponent: () => import('./components/portfolio/portfolio.component').then(m => m.PortfolioComponent), data: { category: 'exhibition', mode: 'category' } },
  { path: 'branding', loadComponent: () => import('./components/portfolio/portfolio.component').then(m => m.PortfolioComponent), data: { category: 'branding', mode: 'category' } },
  { path: 'web-design', loadComponent: () => import('./components/portfolio/portfolio.component').then(m => m.PortfolioComponent), data: { category: 'web-design', mode: 'category' } },
  { path: 'photography', loadComponent: () => import('./components/portfolio/portfolio.component').then(m => m.PortfolioComponent), data: { category: 'photography', mode: 'category' } },
  { path: 'illustration', loadComponent: () => import('./components/portfolio/portfolio.component').then(m => m.PortfolioComponent), data: { category: 'illustration', mode: 'category' } },
  
  // Portfolio item detail routes
  { path: 'portfolio/:id', loadComponent: () => import('./components/portfolio-detail/portfolio-detail.component').then(m => m.PortfolioDetailComponent) },
  { path: 'portfolio/:id/galleries/:galleryIndex/pictures/:pictureIndex', loadComponent: () => import('./components/picture-viewer/picture-viewer.component').then(m => m.PictureViewerComponent) },
  
  // Other routes
  { path: 'about', loadComponent: () => import('./components/about/about.component').then(m => m.AboutComponent) },
  { path: 'contact', loadComponent: () => import('./components/contact/contact.component').then(m => m.ContactComponent) },
  { path: 'admin/login', loadComponent: () => import('./components/admin-login/admin-login.component').then(m => m.AdminLoginComponent) },
  { path: 'admin', component: CMSComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/home' }
];
