import { Component, OnInit, ChangeDetectionStrategy, signal, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogModule } from '@angular/material/dialog';
import { PortfolioGridComponent } from '../portfolio-grid/portfolio-grid.component';
import { PortfolioPagesService, PortfolioPageConfig } from '../../services/portfolio-pages.service';
import { MetaService } from '../../services/meta.service';
import { PageHeaderComponent } from '../shared/page-header.component';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatDialogModule, PortfolioGridComponent, PageHeaderComponent],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss'
})
export class PortfolioComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  category?: string;
  portfolioPageId?: string;
  mode: 'page' | 'category' = 'category';
  pageTitle = signal<string>('Portfolio');
  pageSubtitle = signal<string>('A collection of our finest work in graphic design, art, and branding.');

  constructor(
    private route: ActivatedRoute,
    private portfolioPagesService: PortfolioPagesService,
    private metaService: MetaService
  ) {}

  ngOnInit() {
    // Determine mode and get parameters
    this.mode = this.route.snapshot.data['mode'] || 'category';
    this.category = this.route.snapshot.data['category'];
    this.portfolioPageId = this.route.snapshot.paramMap.get('pageId') || undefined;
    
    this.loadPageContent();
  }

  private async loadPageContent() {
    // Initialize default pages if none exist
    await this.portfolioPagesService.initializeDefaultPortfolioPages();
    
    if (this.mode === 'page' && this.portfolioPageId) {
      // Load content by specific portfolio page ID
      this.portfolioPagesService.getPortfolioPages().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(pages => {
        const pageConfig = pages.find(page => page.id === this.portfolioPageId);
        if (pageConfig) {
          this.pageTitle.set(pageConfig.title);
          this.pageSubtitle.set(pageConfig.subtitle);
          // Also set category for the portfolio grid component
          this.category = pageConfig.category;
        } else {
          // Fallback if page not found
          this.pageTitle.set('Portfolio');
          this.pageSubtitle.set('Portfolio not found.');
        }
        this.metaService.setPageMeta({
          title: this.pageTitle(),
          description: this.pageSubtitle()
        });
      });
    } else {
      // Legacy: Load page content based on category (backwards compatible)
      const categoryKey = this.category || 'portfolio';
      
      this.portfolioPagesService.getPortfolioPageByCategory(categoryKey).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(pageConfig => {
        if (pageConfig) {
          this.pageTitle.set(pageConfig.title);
          this.pageSubtitle.set(pageConfig.subtitle);
          // Set the portfolio page ID so items assigned to this specific page are displayed
          this.portfolioPageId = pageConfig.id;
        } else {
          // Fallback to defaults if no config found
          const defaults = this.getDefaultPageContent();
          this.pageTitle.set(defaults.title);
          this.pageSubtitle.set(defaults.subtitle);
          // No specific page found, keep portfolioPageId undefined for category-based fallback
          this.portfolioPageId = undefined;
        }
        
        this.metaService.setPageMeta({
          title: this.pageTitle(),
          description: this.pageSubtitle()
        });
      });
    }
  }

  private getDefaultPageContent(): { title: string; subtitle: string } {
    switch (this.category) {
      case 'art':
        return {
          title: 'Art',
          subtitle: 'Art collection'
        };
      case 'graphic-design':
        return {
          title: 'Design',
          subtitle: 'Design portfolio'
        };
      default:
        return {
          title: 'Portfolio',
          subtitle: 'Portfolio collection'
        };
    }
  }

  getPageTitle(): string {
    return this.pageTitle();
  }

  getPageSubtitle(): string {
    return this.pageSubtitle();
  }
}