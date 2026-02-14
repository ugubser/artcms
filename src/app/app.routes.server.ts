import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Public pages — SSR per request
  { path: 'home', renderMode: RenderMode.Server },
  { path: 'about', renderMode: RenderMode.Server },
  { path: 'contact', renderMode: RenderMode.Server },

  // Portfolio detail routes
  { path: 'portfolio/:id', renderMode: RenderMode.Server },
  { path: 'portfolio/:id/galleries/:galleryIndex/pictures/:pictureIndex', renderMode: RenderMode.Server },

  // Portfolio page routes
  { path: 'portfolio-page/:pageId', renderMode: RenderMode.Server },

  // Portfolio page slug routes
  { path: 'art', renderMode: RenderMode.Server },
  { path: 'design', renderMode: RenderMode.Server },
  { path: 'exhibition', renderMode: RenderMode.Server },
  { path: 'branding', renderMode: RenderMode.Server },
  { path: 'web-design', renderMode: RenderMode.Server },
  { path: 'photography', renderMode: RenderMode.Server },
  { path: 'illustration', renderMode: RenderMode.Server },

  // Sitemaps — SSR so content is always fresh
  { path: 'sitemap.xml', renderMode: RenderMode.Server },
  { path: 'sitemap.html', renderMode: RenderMode.Server },

  // Admin — client only (no SSR)
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin/login', renderMode: RenderMode.Client },

  // Catch-all
  { path: '**', renderMode: RenderMode.Server },
];
