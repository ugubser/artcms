import { Routes } from '@angular/router';
import { CMSComponent } from './cms/cms.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) },
  { path: 'art', loadComponent: () => import('./components/portfolio/portfolio.component').then(m => m.PortfolioComponent), data: { category: 'art' } },
  { path: 'design', loadComponent: () => import('./components/portfolio/portfolio.component').then(m => m.PortfolioComponent), data: { category: 'graphic-design' } },
  { path: 'portfolio/:id', loadComponent: () => import('./components/portfolio-detail/portfolio-detail.component').then(m => m.PortfolioDetailComponent) },
  { path: 'portfolio/:id/galleries/:galleryIndex/pictures/:pictureIndex', loadComponent: () => import('./components/picture-viewer/picture-viewer.component').then(m => m.PictureViewerComponent) },
  { path: 'about', loadComponent: () => import('./components/about/about.component').then(m => m.AboutComponent) },
  { path: 'contact', loadComponent: () => import('./components/contact/contact.component').then(m => m.ContactComponent) },
  { path: 'sitemap.html', loadComponent: () => import('./components/sitemap-html/sitemap-html.component').then(m => m.SitemapHtmlComponent) },
  { path: 'sitemap.xml', loadComponent: () => import('./components/sitemap-xml/sitemap-xml.component').then(m => m.SitemapXmlComponent) },
  { path: 'admin/login', loadComponent: () => import('./components/admin-login/admin-login.component').then(m => m.AdminLoginComponent) },
  { path: 'admin', component: CMSComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/home' }
];
