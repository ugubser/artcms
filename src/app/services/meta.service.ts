import { Injectable, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { SettingsService, SiteSettings } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class MetaService {
  private currentSettings: SiteSettings | null = null;

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private settingsService: SettingsService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.settingsService.getSiteSettings().subscribe(settings => {
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
    
    // Update favicon if provided
    if (settings.faviconUrl) {
      this.updateFavicon(settings.faviconUrl);
    }
  }

  private updateFavicon(faviconUrl: string): void {
    // Remove existing favicon links
    const existingLinks = this.document.querySelectorAll('link[rel*="icon"]');
    existingLinks.forEach(link => link.remove());
    
    // Add new favicon link
    const link = this.document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/x-icon';
    link.href = faviconUrl;
    this.document.head.appendChild(link);
  }

  setPageTitle(pageTitle: string): void {
    if (this.currentSettings) {
      this.titleService.setTitle(`${pageTitle} | ${this.currentSettings.siteName}`);
    } else {
      this.titleService.setTitle(pageTitle);
    }
  }

  getSiteSettings(): SiteSettings | null {
    return this.currentSettings;
  }
}