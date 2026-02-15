import { Component, signal, OnInit, DestroyRef, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MetaService } from './services/meta.service';
import { SettingsService, SiteSettings } from './services/settings.service';
import { AnalyticsService } from './services/analytics.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('tribeca-concepts-clone');
  mobileMenuOpen = false;
  siteName = signal<string>('tribecaconcepts');
  private destroyRef = inject(DestroyRef);

  constructor(
    private metaService: MetaService,
    private settingsService: SettingsService,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit(): void {
    this.settingsService.getSiteSettings().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
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
