import { Component, OnInit, ChangeDetectionStrategy, signal, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SettingsService } from '../../services/settings.service';
import { PortfolioPagesService, PortfolioPageConfig } from '../../services/portfolio-pages.service';

@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="hero-section">
      <h1>{{ siteName() }}</h1>
      <p class="hero-subtitle">{{ siteDescription() }}</p>

      <nav class="main-nav">
        <ul class="nav-links">
          <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">HOME</a></li>
          <ng-container *ngFor="let page of portfolioPages()">
            <li class="nav-divider">|</li>
            <li><a [routerLink]="'/' + page.slug" routerLinkActive="active">{{ page.title | uppercase }}</a></li>
          </ng-container>
          <li class="nav-divider">|</li>
          <li><a routerLink="/about" routerLinkActive="active">ABOUT</a></li>
          <li class="nav-divider">|</li>
          <li><a routerLink="/contact" routerLinkActive="active">CONTACT</a></li>
        </ul>
      </nav>
    </header>
  `,
  styles: [`
    .hero-section {
      text-align: center;
      padding: 2rem 2rem 1rem;
      background: white;
    }
    
    .hero-section h1 {
      font-family: var(--font-display);
      font-size: 1.375rem;
      font-weight: var(--fw-regular);
      margin-bottom: 0.5rem;
      color: #000;
      letter-spacing: 6px;
      text-transform: uppercase;
      
      @media (max-width: 768px) {
        font-size: 1.1rem;
        letter-spacing: 2px;
      }
    }
    
    .hero-subtitle {
      font-family: var(--font-display);
      font-size: 0.66rem;
      color: #000;
      margin-bottom: 2rem;
      font-weight: var(--fw-light);
      letter-spacing: 5px;
      
      @media (max-width: 768px) {
        font-size: 0.55rem;
      }
    }
    
    .main-nav {
      margin-bottom: 2rem;
    }
    
    .nav-links {
      display: flex;
      justify-content: center;
      align-items: center;
      list-style: none;
      margin: 0;
      padding: 0;
      gap: 1.5rem;
      
      @media (max-width: 768px) {
        gap: 1rem;
      }
    }
    
    .nav-links li {
      display: flex;
      align-items: center;
    }
    
    .nav-links a {
      font-family: var(--font-display);
      color: #000;
      text-decoration: none;
      font-weight: var(--fw-light);
      font-size: 0.55rem;
      letter-spacing: 3px;
      text-transform: uppercase;
      transition: color 0.3s ease;
      
      &:hover {
        color: #666;
      }
      
      &.active {
        color: #000;
        font-weight: var(--fw-regular);
      }
    }
    
    .nav-divider {
      color: #ccc;
      font-weight: 300;
      font-size: 1rem;
      margin: 0 0.5rem;
    }
  `]
})
export class PageHeaderComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  siteName = signal<string>('tribeca concepts');
  siteDescription = signal<string>('Design and Art in Zurich, Switzerland');
  portfolioPages = signal<PortfolioPageConfig[]>([]);

  constructor(
    private settingsService: SettingsService,
    private portfolioPagesService: PortfolioPagesService
  ) {}

  ngOnInit() {
    this.settingsService.getSiteSettings().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(settings => {
      if (settings) {
        this.siteName.set(settings.siteName);
        this.siteDescription.set(settings.siteDescription);
      }
    });

    this.portfolioPagesService.getPortfolioPages().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(pages => {
      // Only show pages that have a slug and order set
      this.portfolioPages.set(pages.filter(p => p.slug && p.order != null));
    });
  }
}
