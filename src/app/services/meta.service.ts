import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { SettingsService, SiteSettings } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class MetaService {
  private currentSettings: SiteSettings | null = null;

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private settingsService: SettingsService
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