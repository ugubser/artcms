import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Observable, combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PortfolioService, PortfolioItem } from '../../services/portfolio.service';
import { SettingsService, SiteSettings } from '../../services/settings.service';
import { PortfolioPagesService, PortfolioPageConfig } from '../../services/portfolio-pages.service';

@Component({
  selector: 'app-sitemap-xml',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `<pre>{{ xmlContent }}</pre>`,
})
export class SitemapXmlComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  xmlContent = '';
  portfolio$: Observable<PortfolioItem[]>;
  siteSettings: SiteSettings | null = null;

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private portfolioService: PortfolioService,
    private settingsService: SettingsService,
    private portfolioPagesService: PortfolioPagesService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.portfolio$ = new Observable<PortfolioItem[]>();
  }

  ngOnInit() {
    this.portfolio$ = this.portfolioService.getPublishedPortfolio();

    // Combine all streams so we regenerate XML when any changes
    combineLatest([
      this.portfolio$,
      this.settingsService.getSiteSettings(),
      this.portfolioPagesService.getPortfolioPages()
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([portfolioItems, settings, pages]) => {
      this.siteSettings = settings;
      this.generateXmlSitemap(portfolioItems, pages);
    });
  }

  private generateXmlSitemap(portfolioItems: PortfolioItem[], portfolioPages: PortfolioPageConfig[] = []) {
    const baseUrl = isPlatformBrowser(this.platformId) ? window.location.origin : 'https://tribecaconcepts.com';
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    const now = new Date().toISOString();

    // Static pages with priorities
    const staticPages = [
      { url: `${cleanBaseUrl}/home`, priority: '1.0', changefreq: 'weekly' },
      // Dynamic portfolio pages sorted by order
      ...portfolioPages
        .filter(p => p.slug && p.order != null)
        .map(p => ({ url: `${cleanBaseUrl}/${p.slug}`, priority: '0.9', changefreq: 'weekly' })),
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
    this.cdr.markForCheck();
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