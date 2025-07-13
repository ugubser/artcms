import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { PortfolioService, PortfolioItem } from '../../services/portfolio.service';
import { PortfolioDetailDialogComponent } from '../portfolio-detail/portfolio-detail-dialog.component';

@Component({
  selector: 'app-portfolio-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="portfolio-grid">
      <div 
        *ngFor="let item of portfolio$ | async; trackBy: trackByFn" 
        class="portfolio-item"
        [class]="'category-' + item.category"
        (click)="selectItem(item)"
      >
        <div class="portfolio-image">
          <img [src]="item.featuredImage" [alt]="item.title" />
          <div class="portfolio-overlay">
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
            <span class="category-badge">{{ getCategoryLabel(item.category) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading state -->
    <div *ngIf="isLoading" class="loading-state">
      <p>Loading portfolio...</p>
    </div>
    
    <!-- Empty state -->
    <div *ngIf="(portfolio$ | async)?.length === 0 && !isLoading" class="empty-state">
      <h3>No portfolio items found</h3>
      <p>Portfolio items will appear here once they are added to the database.</p>
      <button (click)="initializeSampleData()" class="sample-data-btn">
        Load Sample Data
      </button>
    </div>
  `,
  styles: [`
    .portfolio-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin: 2rem 0;
      padding: 0 2rem;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 1rem;
        padding: 0 1rem;
      }
    }

    .portfolio-item {
      position: relative;
      aspect-ratio: 4/3;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      cursor: pointer;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        
        .portfolio-overlay {
          opacity: 1;
        }
      }
    }

    .portfolio-image {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .portfolio-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .portfolio-item:hover .portfolio-image img {
      transform: scale(1.05);
    }

    .portfolio-overlay {
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

    .portfolio-overlay h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
      font-weight: 500;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }

    .portfolio-overlay p {
      margin: 0 0 1rem 0;
      font-size: 0.9rem;
      line-height: 1.4;
      opacity: 0.9;
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

    .loading-state,
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }

    .empty-state h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #333;
    }

    .sample-data-btn {
      background: #000;
      color: #fff;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background 0.3s ease;
      margin-top: 1rem;

      &:hover {
        background: #333;
      }
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
export class PortfolioGridComponent implements OnInit {
  @Input() category?: string;
  
  portfolio$: Observable<PortfolioItem[]>;
  isLoading = true;

  constructor(
    private portfolioService: PortfolioService,
    private dialog: MatDialog
  ) {
    this.portfolio$ = new Observable<PortfolioItem[]>();
  }

  ngOnInit() {
    this.loadPortfolio();
  }

  private loadPortfolio() {
    this.isLoading = true;
    
    if (this.category) {
      this.portfolio$ = this.portfolioService.getPortfolioByCategory(this.category);
    } else {
      this.portfolio$ = this.portfolioService.getPublishedPortfolio();
    }
    
    // Set loading to false after a short delay to show the loading state
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  selectItem(item: PortfolioItem) {
    console.log('Selected portfolio item:', item);
    
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

  async initializeSampleData() {
    try {
      await this.portfolioService.initializeSampleData();
      this.loadPortfolio();
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  }
}