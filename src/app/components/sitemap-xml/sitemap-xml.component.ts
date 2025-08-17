import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { PortfolioService, PortfolioItem } from '../../services/portfolio.service';
import { SettingsService, SiteSettings } from '../../services/settings.service';

@Component({
  selector: 'app-sitemap-xml',
  standalone: true,
  imports: [CommonModule],
  template: `<pre>{{ xmlContent }}</pre>`,
})
export class SitemapXmlComponent implements OnInit {
  xmlContent = '';
  portfolio$: Observable<PortfolioItem[]>;
  siteSettings: SiteSettings | null = null;
  
  constructor(
    private portfolioService: PortfolioService,
    private settingsService: SettingsService
  ) {
    this.portfolio$ = new Observable<PortfolioItem[]>();
  }

  ngOnInit() {
    // Load portfolio items using the same pattern as other components
    this.portfolio$ = this.portfolioService.getPublishedPortfolio();

    // Load site settings using the same pattern as home component
    this.settingsService.getSiteSettings().subscribe(settings => {
      this.siteSettings = settings;
      this.updateXmlSitemap();
    });

    // Subscribe to portfolio changes to generate XML
    this.portfolio$.subscribe(portfolioItems => {
      this.generateXmlSitemap(portfolioItems);
    });
  }

  private updateXmlSitemap() {
    if (this.siteSettings) {
      // Regenerate XML when settings are loaded
      this.portfolio$.subscribe(portfolioItems => {
        this.generateXmlSitemap(portfolioItems);
      });
    }
  }

  private generateXmlSitemap(portfolioItems: PortfolioItem[]) {
    const baseUrl = (typeof window !== 'undefined' ? window.location.origin : 'https://tribecaconcepts.com');
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    const now = new Date().toISOString();
    
    // Static pages with priorities
    const staticPages = [
      { url: `${cleanBaseUrl}/home`, priority: '1.0', changefreq: 'weekly' },
      { url: `${cleanBaseUrl}/art`, priority: '0.9', changefreq: 'weekly' },
      { url: `${cleanBaseUrl}/design`, priority: '0.9', changefreq: 'weekly' },
      { url: `${cleanBaseUrl}/about`, priority: '0.8', changefreq: 'monthly' },
      { url: `${cleanBaseUrl}/contact`, priority: '0.7', changefreq: 'monthly' }
    ];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    staticPages.forEach(page => {
      xml += `  <url>
    <loc>${this.escapeXml(page.url)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    });

    // Add portfolio pages and individual gallery items
    portfolioItems.forEach(item => {
      let lastmod;
      try {
        if (item.createdAt instanceof Date) {
          lastmod = item.createdAt.toISOString();
        } else if (item.createdAt && typeof (item.createdAt as any).toDate === 'function') {
          // Firestore Timestamp object
          lastmod = (item.createdAt as any).toDate().toISOString();
        } else if (item.createdAt) {
          lastmod = new Date(item.createdAt).toISOString();
        } else {
          lastmod = now;
        }
      } catch (error) {
        // Fallback to current time if date conversion fails
        lastmod = now;
      }
      
      // Add portfolio item page
      xml += `  <url>
    <loc>${this.escapeXml(cleanBaseUrl)}/portfolio/${this.escapeXml(item.id || '')}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      
      // Add gallery and individual gallery items
      if (item.galleries && item.galleries.length > 0) {
        item.galleries.forEach((gallery: any, galleryIndex: number) => {
          // Add gallery page URL
          xml += `  <url>
    <loc>${this.escapeXml(cleanBaseUrl)}/portfolio/${this.escapeXml(item.id || '')}/galleries/${galleryIndex}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
          
          // Add individual picture URLs
          if (gallery.pictures && gallery.pictures.length > 0) {
            gallery.pictures.forEach((picture: any, pictureIndex: number) => {
              if (picture.imageUrl) {
                xml += `  <url>
    <loc>${this.escapeXml(cleanBaseUrl)}/portfolio/${this.escapeXml(item.id || '')}/galleries/${galleryIndex}/pictures/${pictureIndex}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
              }
            });
          }
        });
      }
    });

    xml += `</urlset>`;
    this.xmlContent = xml;
  }

  private escapeXml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}