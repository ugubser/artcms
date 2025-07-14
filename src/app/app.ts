import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MetaService } from './services/meta.service';
import { SettingsService, SiteSettings } from './services/settings.service';
import { AnalyticsService } from './services/analytics.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('tribeca-concepts-clone');
  mobileMenuOpen = false;
  siteName = signal<string>('tribecaconcepts');

  constructor(
    private metaService: MetaService,
    private settingsService: SettingsService,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit(): void {
    this.settingsService.getSiteSettings().subscribe(settings => {
      if (settings) {
        this.siteName.set(settings.siteName);
      }
    });
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }
}
