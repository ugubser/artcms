import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { PortfolioGridComponent } from '../portfolio-grid/portfolio-grid.component';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, MatDialogModule, PortfolioGridComponent],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss'
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