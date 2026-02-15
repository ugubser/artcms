import { Injectable, Inject, PLATFORM_ID, DestroyRef, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SettingsService, SiteSettings } from './settings.service';
import { StorageUrlService } from './storage-url.service';

@Injectable({
  providedIn: 'root'
})
export class MetaService {
  private currentSettings: SiteSettings | null = null;
  private destroyRef = inject(DestroyRef);

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private settingsService: SettingsService,
    private storageUrlService: StorageUrlService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.settingsService.getSiteSettings().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      if (settings) {
        this.currentSettings = settings;
        this.updateMetaTags(settings);
      }
    });
  }

  private updateMetaTags(settings: SiteSettings): void {
    this.titleService.setTitle(settings.siteName);

    this.metaService.updateTag({ name: 'description', content: settings.siteDescription });
    this.metaService.updateTag({ name: 'keywords', content: settings.siteKeywords.join(', ') });
    this.metaService.updateTag({ name: 'author', content: settings.siteName });
    this.metaService.updateTag({ property: 'og:title', content: settings.siteName });
    this.metaService.updateTag({ property: 'og:description', content: settings.siteDescription });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:site_name', content: settings.siteName });

    // Update favicon if provided (browser only)
    if (settings.faviconUrl) {
      this.updateFavicon(settings.faviconUrl);
    }
  }

  private updateFavicon(faviconUrl: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.storageUrlService.resolveUrl(faviconUrl).subscribe(resolvedUrl => {
      if (!resolvedUrl) return;

      // Remove existing favicon links
      const existingLinks = this.document.querySelectorAll('link[rel*="icon"]');
      existingLinks.forEach(link => link.remove());

      // Add new favicon link
      const link = this.document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/x-icon';
      link.href = resolvedUrl;
      this.document.head.appendChild(link);
    });
  }

  setPageTitle(pageTitle: string): void {
    if (this.currentSettings) {
      this.titleService.setTitle(`${pageTitle} | ${this.currentSettings.siteName}`);
    } else {
      this.titleService.setTitle(pageTitle);
    }
  }

  setPageMeta(options: { title: string; description?: string; image?: string; type?: string }): void {
    const siteName = this.currentSettings?.siteName || 'Tribecaconcepts';
    const fullTitle = `${options.title} | ${siteName}`;
    this.titleService.setTitle(fullTitle);
    this.metaService.updateTag({ property: 'og:title', content: fullTitle });
    this.metaService.updateTag({ property: 'og:site_name', content: siteName });
    if (options.description) {
      this.metaService.updateTag({ name: 'description', content: options.description });
      this.metaService.updateTag({ property: 'og:description', content: options.description });
    }
    if (options.image) {
      this.metaService.updateTag({ property: 'og:image', content: options.image });
    }
    this.metaService.updateTag({ property: 'og:type', content: options.type || 'website' });
  }

  getSiteSettings(): SiteSettings | null {
    return this.currentSettings;
  }
}
