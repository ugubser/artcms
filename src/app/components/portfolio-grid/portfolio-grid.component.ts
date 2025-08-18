import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { PortfolioService, PortfolioItem } from '../../services/portfolio.service';
import { CategoryService } from '../../services/category.service';
import { ResolveStorageUrlPipe } from '../../pipes/resolve-storage-url.pipe';

@Component({
  selector: 'app-portfolio-grid',
  standalone: true,
  imports: [CommonModule, ResolveStorageUrlPipe],
  templateUrl: './portfolio-grid.component.html',
  styleUrls: ['./portfolio-grid.component.scss']
})
export class PortfolioGridComponent implements OnInit {
  @Input() category?: string;
  @Input() portfolioPageId?: string;
  @Input() mode: 'page' | 'category' = 'category';
  
  portfolio$: Observable<PortfolioItem[]>;
  isLoading = true;

  constructor(
    private portfolioService: PortfolioService,
    private categoryService: CategoryService,
    private router: Router
  ) {
    this.portfolio$ = new Observable<PortfolioItem[]>();
  }

  ngOnInit() {
    this.loadPortfolio();
  }

  private loadPortfolio() {
    this.isLoading = true;
    
    console.log('Loading portfolio - Mode:', this.mode, 'PageId:', this.portfolioPageId, 'Category:', this.category);
    
    if (this.portfolioPageId) {
      // Load portfolios assigned to specific portfolio page (regardless of mode)
      this.portfolio$ = this.portfolioService.getPortfolioForPage(this.portfolioPageId);
    } else if (this.category) {
      // Load portfolios by category (backwards compatible + auto-assigned items)
      this.portfolio$ = this.portfolioService.getPortfolioForPage(undefined, this.category);
    } else {
      // Load all published portfolios
      this.portfolio$ = this.portfolioService.getPublishedPortfolio();
    }
    
    // Set loading to false after a short delay to show the loading state
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  selectItem(item: PortfolioItem) {
    console.log('Selected portfolio item:', item);
    
    // Navigate to portfolio detail page
    this.router.navigate(['/portfolio', item.id]);
  }

  trackByFn(index: number, item: PortfolioItem): string {
    return item.id || index.toString();
  }

  getCategoryLabel(category: string): string {
    return this.categoryService.getCategoryLabelSync(category);
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