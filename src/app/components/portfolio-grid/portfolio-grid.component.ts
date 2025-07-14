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
  templateUrl: './portfolio-grid.component.html',
  styleUrls: ['./portfolio-grid.component.scss']
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