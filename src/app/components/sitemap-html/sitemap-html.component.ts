import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, Inject, DestroyRef, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PortfolioService, PortfolioItem } from '../../services/portfolio.service';
import { SettingsService, SiteSettings } from '../../services/settings.service';
import { PortfolioPagesService, PortfolioPageConfig } from '../../services/portfolio-pages.service';
import { ResolveStorageUrlPipe } from '../../pipes/resolve-storage-url.pipe';

@Component({
  selector: 'app-sitemap-html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ResolveStorageUrlPipe],
  template: `
    <div class="sitemap-container">
      <h1>Sitemap for {{ siteSettings?.siteName || 'Tribecaconcepts' }}</h1>
      <p class="description">{{ siteSettings?.siteDescription || 'Portfolio website' }}</p>

      <h2>Main Pages</h2>
      <ul class="main-pages">
        <li><a routerLink="/home">Home</a><div class="description">Main landing page</div></li>
        <li *ngFor="let page of portfolioPages">
          <a [routerLink]="'/' + page.slug">{{ page.title }}</a>
          <div class="description">{{ page.subtitle }}</div>
        </li>
        <li><a routerLink="/about">About</a><div class="description">About the artist</div></li>
        <li><a routerLink="/contact">Contact</a><div class="description">Get in touch</div></li>
      </ul>

      <h2>Portfolio Items</h2>
      <ul class="portfolio-items" *ngIf="portfolio$ | async as portfolioItems; else noItems">
        <li *ngFor="let item of portfolioItems">
          <div class="portfolio-item">
            <a [routerLink]="['/portfolio', item.id]">{{ item.title }}</a>
            <span class="category">{{ item.category }}</span>
          </div>
          
          <!-- Gallery structure -->
          <div class="galleries" *ngIf="item.galleries && item.galleries.length > 0">
            <div class="gallery" *ngFor="let gallery of item.galleries; let galleryIndex = index">
              <strong class="gallery-title">
                <a [routerLink]="['/portfolio', item.id, 'galleries', galleryIndex]">
                  📁 {{ gallery.description || 'Gallery ' + (galleryIndex + 1) }}
                </a>
              </strong>
              <ul class="pictures" *ngIf="gallery.pictures && gallery.pictures.length > 0">
                <li *ngFor="let picture of gallery.pictures; let pictureIndex = index">
                  <a [routerLink]="['/portfolio', item.id, 'galleries', galleryIndex, 'pictures', pictureIndex]"
                     class="picture-link">
                    <img [src]="picture.imageUrl | resolveStorageUrl | async"
                         [alt]="picture.alt || picture.description || 'Image ' + (pictureIndex + 1)"
                         class="thumbnail">
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </li>
      </ul>
      
      <ng-template #noItems>
        <p class="no-items">No portfolio items available.</p>
      </ng-template>
      
      <div class="footer">
        <div class="description">
          Last updated: {{ lastUpdated | date:'short' }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sitemap-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      color: #333;
      line-height: 1.6;
    }

    h1 {
      color: #2c3e50;
      border-bottom: 2px solid #ecf0f1;
      padding-bottom: 10px;
    }

    h2 {
      color: #34495e;
      margin-top: 40px;
      margin-bottom: 20px;
    }

    ul {
      list-style: none;
      padding: 0;
    }

    li {
      margin: 8px 0;
      padding: 8px 0;
      border-bottom: 1px solid #ecf0f1;
    }

    a {
      color: #3498db;
      text-decoration: none;
      font-weight: 500;
    }

    a:hover {
      text-decoration: underline;
    }

    .description {
      color: #7f8c8d;
      font-size: 0.9em;
      margin-top: 5px;
    }

    .portfolio-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .category {
      background: #ecf0f1;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8em;
      color: #2c3e50;
    }

    .galleries {
      margin-left: 20px;
      margin-top: 8px;
    }

    .gallery {
      margin-bottom: 12px;
    }

    .gallery-title {
      font-size: 0.9em;
      color: #2c3e50;
    }

    .gallery-title a {
      text-decoration: none;
      color: #2c3e50;
    }

    .pictures {
      margin: 4px 0 0 20px;
      list-style: none;
      padding: 0;
    }

    .pictures li {
      margin: 4px 0;
      border: none;
      padding: 0;
    }

    .picture-link {
      text-decoration: none;
      display: block;
    }

    .thumbnail {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #ddd;
      transition: transform 0.2s;
    }

    .thumbnail:hover {
      transform: scale(1.1);
    }

    .no-items {
      color: #7f8c8d;
      font-style: italic;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ecf0f1;
    }
  `]
})
export class SitemapHtmlComponent implements OnInit, OnDestroy {
  private destroyRef = inject(DestroyRef);
  portfolio$: Observable<PortfolioItem[]>;
  siteSettings: SiteSettings | null = null;
  portfolioPages: PortfolioPageConfig[] = [];
  lastUpdated = new Date();

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private portfolioService: PortfolioService,
    private settingsService: SettingsService,
    private portfolioPagesService: PortfolioPagesService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.portfolio$ = new Observable<PortfolioItem[]>();
  }

  ngOnInit() {
    // Load portfolio items using the same pattern as other components
    this.portfolio$ = this.portfolioService.getPublishedPortfolio();

    // Load site settings
    this.settingsService.getSiteSettings().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(settings => {
      this.siteSettings = settings;
      this.cdr.markForCheck();
    });

    // Load portfolio pages for dynamic nav links
    this.portfolioPagesService.getPortfolioPages().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(pages => {
      this.portfolioPages = pages.filter(p => p.slug && p.order != null);
      this.cdr.markForCheck();
    });

    // Subscribe to portfolio changes to generate structured data
    this.portfolio$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(portfolioItems => {
      this.generateStructuredData(portfolioItems);
    });
  }

  private generateStructuredData(portfolioItems: PortfolioItem[]) {
    if (!portfolioItems || portfolioItems.length === 0) {
      return;
    }

    const artworkSchemas: any[] = [];
    
    portfolioItems.forEach(item => {
      if (item.galleries && item.galleries.length > 0) {
        item.galleries.forEach((gallery: any, galleryIndex: number) => {
          if (gallery.pictures && gallery.pictures.length > 0) {
            gallery.pictures.forEach((picture: any, pictureIndex: number) => {
              if (picture.imageUrl) {
                // Create structured data for all pictures with images
                const artworkSchema: any = {
                  "@context": "https://schema.org",
                  "@type": "Painting", // Default type - could be made more specific based on artMedium
                  "name": picture.description || picture.alt || `Artwork from ${item.title}`,
                  "creator": {
                    "@type": "Person",
                    "name": this.siteSettings?.artistName || "Artist",
                    "url": (typeof window !== 'undefined' ? window.location.origin : 'https://tribecaconcepts.com')
                  },
                  "image": picture.imageUrl
                };
                
                // Add optional fields if they exist
                if (picture.dateCreated) {
                  artworkSchema.dateCreated = picture.dateCreated;
                }
                
                if (picture.artMedium) {
                  artworkSchema.artMedium = picture.artMedium;
                }
                
                if (picture.genre) {
                  artworkSchema.genre = picture.genre;
                }
                
                // Add description if available
                if (picture.description && picture.description.trim() !== '') {
                  artworkSchema.description = picture.description;
                }
                
                artworkSchemas.push(artworkSchema);
              }
            });
          }
        });
      }
    });
    
    // Remove any existing structured data scripts first
    this.removeExistingStructuredData();
    
    // Inject script tags into document head
    if (artworkSchemas.length > 0) {
      artworkSchemas.forEach((schema, index) => {
        const script = this.document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-sitemap-structured-data', 'true');
        script.textContent = JSON.stringify(schema, null, 2);
        this.document.head.appendChild(script);
      });
    }
  }

  ngOnDestroy() {
    // Clean up structured data when component is destroyed
    this.removeExistingStructuredData();
  }

  private removeExistingStructuredData() {
    // Remove any existing structured data scripts created by this component
    const existingScripts = this.document.querySelectorAll('script[data-sitemap-structured-data="true"]');
    existingScripts.forEach(script => script.remove());
  }
}