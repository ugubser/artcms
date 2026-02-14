import { Component, OnInit, ChangeDetectionStrategy, signal, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PortfolioService, PortfolioItem } from '../../services/portfolio.service';
import { CategoryService } from '../../services/category.service';
import { MetaService } from '../../services/meta.service';
import { SettingsService } from '../../services/settings.service';
import { ContactService, ContactInfo } from '../../services/contact.service';
import { PageHeaderComponent } from '../shared/page-header.component';
import { ResolveStorageUrlPipe } from '../../pipes/resolve-storage-url.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PageHeaderComponent, ResolveStorageUrlPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  featuredPortfolio$: Observable<PortfolioItem[]>;
  contactInfo$: Observable<ContactInfo[]>;
  siteName = signal<string>('tribeca concepts');
  siteDescription = signal<string>('Design and Art in Zurich, Switzerland');
  footerText = signal<string>('© 2025 by tribeca concepts');

  constructor(
    private portfolioService: PortfolioService,
    private categoryService: CategoryService,
    private router: Router,
    private metaService: MetaService,
    private settingsService: SettingsService,
    private contactService: ContactService
  ) {
    this.featuredPortfolio$ = new Observable<PortfolioItem[]>();
    this.contactInfo$ = new Observable<ContactInfo[]>();
  }

  ngOnInit() {
    // Get first portfolio item for featured section
    this.featuredPortfolio$ = this.portfolioService.getPublishedPortfolio().pipe(
      map(items => items.slice(0, 1))
    );

    // Load contact info for social media links
    this.contactInfo$ = this.contactService.getContactInfo();

    // Load site settings for dynamic content
    this.settingsService.getSiteSettings().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(settings => {
      if (settings) {
        this.siteName.set(settings.siteName);
        this.siteDescription.set(settings.siteDescription);
        this.footerText.set(settings.footerText);
        this.metaService.setPageTitle('Home');
      }
    });
  }

  selectItem(item: PortfolioItem) {
    // Navigate to portfolio detail page
    this.router.navigate(['/portfolio', item.id]);
  }

  trackByFn(index: number, item: PortfolioItem): string {
    return item.id || index.toString();
  }

  trackByContactFn(index: number, item: ContactInfo): string {
    return item.id || index.toString();
  }

  getCategoryLabel(category: string): string {
    return this.categoryService.getCategoryLabelSync(category);
  }
}