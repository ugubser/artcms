import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { PortfolioGridComponent } from '../portfolio-grid/portfolio-grid.component';
import { PortfolioPagesService, PortfolioPageConfig } from '../../services/portfolio-pages.service';
import { MetaService } from '../../services/meta.service';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, MatDialogModule, PortfolioGridComponent],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss'
})
export class PortfolioComponent implements OnInit {
  category?: string;
  pageTitle = signal<string>('Portfolio');
  pageSubtitle = signal<string>('A collection of our finest work in graphic design, art, and branding.');

  constructor(
    private route: ActivatedRoute,
    private portfolioPagesService: PortfolioPagesService,
    private metaService: MetaService
  ) {}

  ngOnInit() {
    this.category = this.route.snapshot.data['category'];
    this.loadPageContent();
  }

  private async loadPageContent() {
    // Initialize default pages if none exist
    await this.portfolioPagesService.initializeDefaultPortfolioPages();
    
    // Load page content based on category
    const categoryKey = this.category || 'portfolio';
    
    this.portfolioPagesService.getPortfolioPageByCategory(categoryKey).subscribe(pageConfig => {
      if (pageConfig) {
        this.pageTitle.set(pageConfig.title);
        this.pageSubtitle.set(pageConfig.subtitle);
      } else {
        // Fallback to defaults if no config found
        const defaults = this.getDefaultPageContent();
        this.pageTitle.set(defaults.title);
        this.pageSubtitle.set(defaults.subtitle);
      }
      
      // Set meta title
      this.metaService.setPageTitle(this.pageTitle());
    });
  }

  private getDefaultPageContent(): { title: string; subtitle: string } {
    switch (this.category) {
      case 'art':
        return {
          title: 'Art',
          subtitle: 'Contemporary abstract art pieces inspired by Japanese minimalism and Swiss precision.'
        };
      case 'graphic-design':
        return {
          title: 'Design',
          subtitle: 'Graphic design solutions that combine Swiss typography principles with modern aesthetics.'
        };
      default:
        return {
          title: 'Portfolio',
          subtitle: 'A collection of our finest work in graphic design, art, and branding.'
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