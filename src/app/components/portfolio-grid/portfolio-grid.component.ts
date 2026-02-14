import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { PortfolioService, PortfolioItem } from '../../services/portfolio.service';
import { CategoryService } from '../../services/category.service';
import { ResolveStorageUrlPipe } from '../../pipes/resolve-storage-url.pipe';
import { ImgLoadingDirective } from '../../directives/img-loading.directive';

@Component({
  selector: 'app-portfolio-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ResolveStorageUrlPipe, ImgLoadingDirective],
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
    let source$: Observable<PortfolioItem[]>;

    if (this.portfolioPageId) {
      source$ = this.portfolioService.getPortfolioForPage(this.portfolioPageId);
    } else if (this.category) {
      source$ = this.portfolioService.getPortfolioForPage(undefined, this.category);
    } else {
      source$ = this.portfolioService.getPublishedPortfolio();
    }

    this.portfolio$ = source$.pipe(tap(() => this.isLoading = false));
  }

  selectItem(item: PortfolioItem) {
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
    }
  }
}