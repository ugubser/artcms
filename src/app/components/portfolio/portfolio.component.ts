import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { PortfolioGridComponent } from '../portfolio-grid/portfolio-grid.component';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, MatDialogModule, PortfolioGridComponent],
  template: `
    <div class="portfolio-container">
      <header class="portfolio-header">
        <h1>{{ getPageTitle() }}</h1>
        <p class="portfolio-subtitle">{{ getPageSubtitle() }}</p>
      </header>
      
      <app-portfolio-grid [category]="category"></app-portfolio-grid>
    </div>
  `,
  styles: [`
    .portfolio-container {
      padding: 2rem 0;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      min-height: calc(100vh - 80px);
    }
    
    .portfolio-header {
      text-align: center;
      max-width: 800px;
      margin: 0 auto 3rem;
      padding: 0 2rem;
    }
    
    .portfolio-header h1 {
      font-size: 3rem;
      font-weight: 300;
      margin-bottom: 1rem;
      color: #000;
      letter-spacing: -1px;
      
      @media (max-width: 768px) {
        font-size: 2rem;
      }
    }
    
    .portfolio-subtitle {
      font-size: 1.2rem;
      color: #666;
      line-height: 1.6;
      max-width: 600px;
      margin: 0 auto;
    }
  `]
})
export class PortfolioComponent implements OnInit {
  category?: string;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.category = this.route.snapshot.data['category'];
  }

  getPageTitle(): string {
    switch (this.category) {
      case 'art':
        return 'Art';
      case 'graphic-design':
        return 'Design';
      default:
        return 'Portfolio';
    }
  }

  getPageSubtitle(): string {
    switch (this.category) {
      case 'art':
        return 'Contemporary abstract art pieces inspired by Japanese minimalism and Swiss precision.';
      case 'graphic-design':
        return 'Graphic design solutions that combine Swiss typography principles with modern aesthetics.';
      default:
        return 'A collection of our finest work in graphic design, art, and branding.';
    }
  }
}