import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PortfolioService, PortfolioItem } from '../../services/portfolio.service';
import { PortfolioDetailDialogComponent } from '../portfolio-detail/portfolio-detail-dialog.component';
import { MetaService } from '../../services/meta.service';
import { SettingsService, SiteSettings } from '../../services/settings.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatDialogModule],
  template: `
    <div class="home-container">
      <header class="hero-section">
        <h1>{{ siteName() }}</h1>
        <p class="hero-subtitle">{{ siteDescription() }}</p>
        <p class="hero-description">
          Swiss-American-Japanese graphic design studio combining precision, innovation, and minimalism.
        </p>
      </header>
      
      <section class="featured-work">
        <div class="section-header">
          <h2>Featured Work</h2>
          <a routerLink="/art" class="view-all-link">View All Portfolio →</a>
        </div>
        
        <div class="featured-grid">
          <div 
            *ngFor="let item of featuredPortfolio$ | async; trackBy: trackByFn" 
            class="featured-item"
            [class]="'category-' + item.category"
            (click)="selectItem(item)"
          >
            <div class="featured-image">
              <img [src]="item.featuredImage" [alt]="item.title" />
              <div class="featured-overlay">
                <h3>{{ item.title }}</h3>
                <span class="category-badge">{{ getCategoryLabel(item.category) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section class="studio-intro">
        <div class="intro-content">
          <h2>Swiss Design Principles</h2>
          <p>
            Our approach is rooted in the International Typographic Style, emphasizing clean lines, 
            systematic grids, and thoughtful use of white space. Every project is crafted with 
            meticulous attention to detail and a deep understanding of both form and function.
          </p>
          <div class="intro-actions">
            <a routerLink="/about" class="cta-button">Learn More About Us</a>
            <a routerLink="/contact" class="cta-button secondary">Get In Touch</a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home-container {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      min-height: calc(100vh - 80px);
    }
    
    .hero-section {
      text-align: center;
      padding: 4rem 2rem;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    }
    
    .hero-section h1 {
      font-size: 4rem;
      font-weight: 300;
      margin-bottom: 1rem;
      color: #000;
      letter-spacing: -2px;
      
      @media (max-width: 768px) {
        font-size: 2.5rem;
        letter-spacing: -1px;
      }
    }
    
    .hero-subtitle {
      font-size: 1.5rem;
      color: #666;
      margin-bottom: 2rem;
      
      @media (max-width: 768px) {
        font-size: 1.2rem;
      }
    }
    
    .hero-description {
      font-size: 1.1rem;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .featured-work {
      padding: 4rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3rem;
      
      @media (max-width: 768px) {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
    }
    
    .section-header h2 {
      font-size: 2.5rem;
      font-weight: 300;
      color: #000;
      margin: 0;
    }
    
    .view-all-link {
      color: #333;
      text-decoration: none;
      font-size: 1rem;
      border-bottom: 1px solid transparent;
      transition: border-color 0.3s ease;
    }
    
    .view-all-link:hover {
      border-bottom-color: #000;
    }
    
    .featured-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 2rem;
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
    }
    
    .featured-item {
      position: relative;
      aspect-ratio: 4/3;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      cursor: pointer;
    }
    
    .featured-item:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.15);
      
      .featured-overlay {
        opacity: 1;
      }
      
      img {
        transform: scale(1.05);
      }
    }
    
    .featured-image {
      position: relative;
      width: 100%;
      height: 100%;
    }
    
    .featured-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    .featured-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.9));
      color: white;
      padding: 2rem 1.5rem 1.5rem;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .featured-overlay h3 {
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
      font-weight: 400;
    }
    
    .category-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .studio-intro {
      background: #f8f9fa;
      padding: 4rem 2rem;
    }
    
    .intro-content {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
    }
    
    .intro-content h2 {
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 2rem;
      color: #000;
    }
    
    .intro-content p {
      font-size: 1.2rem;
      line-height: 1.7;
      color: #333;
      margin-bottom: 3rem;
    }
    
    .intro-actions {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      
      @media (max-width: 768px) {
        flex-direction: column;
        align-items: center;
      }
    }
    
    .cta-button {
      display: inline-block;
      padding: 1rem 2rem;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
      transition: all 0.3s ease;
      font-size: 1rem;
    }
    
    .cta-button:not(.secondary) {
      background: #000;
      color: #fff;
    }
    
    .cta-button:not(.secondary):hover {
      background: #333;
    }
    
    .cta-button.secondary {
      background: transparent;
      color: #000;
      border: 2px solid #000;
    }
    
    .cta-button.secondary:hover {
      background: #000;
      color: #fff;
    }
    
    // Category-specific styling
    .category-graphic-design {
      border-left: 4px solid #000;
    }

    .category-art {
      border-left: 4px solid #666;
    }

    .category-branding {
      border-left: 4px solid #333;
    }

    .category-web-design {
      border-left: 4px solid #999;
    }
  `]
})
export class HomeComponent implements OnInit {
  featuredPortfolio$: Observable<PortfolioItem[]>;
  siteName = signal<string>('tribeca concepts');
  siteDescription = signal<string>('Design and Art in Zurich, Switzerland');

  constructor(
    private portfolioService: PortfolioService,
    private dialog: MatDialog,
    private metaService: MetaService,
    private settingsService: SettingsService
  ) {
    this.featuredPortfolio$ = new Observable<PortfolioItem[]>();
  }

  ngOnInit() {
    // Get first 3 portfolio items for featured section
    this.featuredPortfolio$ = this.portfolioService.getPublishedPortfolio().pipe(
      map(items => items.slice(0, 3))
    );

    // Load site settings for dynamic content
    this.settingsService.getSiteSettings().subscribe(settings => {
      if (settings) {
        this.siteName.set(settings.siteName);
        this.siteDescription.set(settings.siteDescription);
        this.metaService.setPageTitle('Home');
      }
    });
  }

  selectItem(item: PortfolioItem) {
    // Open portfolio detail dialog
    const dialogRef = this.dialog.open(PortfolioDetailDialogComponent, {
      data: item,
      maxWidth: '95vw',
      maxHeight: '95vh',
      panelClass: 'portfolio-detail-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Portfolio detail dialog closed');
    });
  }

  trackByFn(index: number, item: PortfolioItem): string {
    return item.id || index.toString();
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'graphic-design': 'Graphic Design',
      'art': 'Art',
      'branding': 'Branding',
      'web-design': 'Web Design'
    };
    return labels[category] || category;
  }
}