import { Routes } from '@angular/router';
import { CMSComponent } from './cms/cms.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) },
  { path: 'art', loadComponent: () => import('./components/portfolio/portfolio.component').then(m => m.PortfolioComponent), data: { category: 'art' } },
  { path: 'design', loadComponent: () => import('./components/portfolio/portfolio.component').then(m => m.PortfolioComponent), data: { category: 'graphic-design' } },
  { path: 'about', loadComponent: () => import('./components/about/about.component').then(m => m.AboutComponent) },
  { path: 'contact', loadComponent: () => import('./components/contact/contact.component').then(m => m.ContactComponent) },
  { path: 'admin', component: CMSComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/home' }
];
