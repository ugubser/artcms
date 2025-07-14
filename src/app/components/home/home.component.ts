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
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
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