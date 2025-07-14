import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SettingsService } from './settings.service';

declare let gtag: Function;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private isInitialized = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private settingsService: SettingsService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeAnalytics();
    }
  }

  private initializeAnalytics(): void {
    this.settingsService.getSiteSettings().subscribe(settings => {
      if (settings && settings.enableAnalytics && settings.analyticsId && !this.isInitialized) {
        this.loadGoogleAnalytics(settings.analyticsId);
        this.isInitialized = true;
      }
    });
  }

  private loadGoogleAnalytics(analyticsId: string): void {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
    document.head.appendChild(script);

    const configScript = document.createElement('script');
    configScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${analyticsId}', {
        page_title: document.title,
        page_location: window.location.href
      });
    `;
    document.head.appendChild(configScript);
  }

  trackEvent(eventName: string, parameters?: any): void {
    if (isPlatformBrowser(this.platformId) && this.isInitialized && typeof gtag !== 'undefined') {
      gtag('event', eventName, parameters);
    }
  }

  trackPageView(url: string, title?: string): void {
    if (isPlatformBrowser(this.platformId) && this.isInitialized && typeof gtag !== 'undefined') {
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: url,
        page_title: title
      });
    }
  }
}