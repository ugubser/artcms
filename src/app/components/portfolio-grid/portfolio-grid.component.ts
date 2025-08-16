import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { PortfolioService, PortfolioItem } from '../../services/portfolio.service';
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
  
  portfolio$: Observable<PortfolioItem[]>;
  isLoading = true;

  constructor(
    private portfolioService: PortfolioService,
    private router: Router
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
    
    // Navigate to portfolio detail page
    this.router.navigate(['/portfolio', item.id]);
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