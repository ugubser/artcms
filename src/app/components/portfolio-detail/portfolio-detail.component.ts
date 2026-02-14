import { Component, OnInit, OnDestroy, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PortfolioService, PortfolioItem } from '../../services/portfolio.service';
import { CategoryService } from '../../services/category.service';
import { MetaService } from '../../services/meta.service';
import { PageHeaderComponent } from '../shared/page-header.component';
import { ResolveStorageUrlPipe } from '../../pipes/resolve-storage-url.pipe';
import { ImgLoadingDirective } from '../../directives/img-loading.directive';

@Component({
  selector: 'app-portfolio-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    ResolveStorageUrlPipe,
    ImgLoadingDirective
  ],
  templateUrl: './portfolio-detail.component.html',
  styleUrl: './portfolio-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortfolioDetailComponent implements OnInit, OnDestroy {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  portfolioItem: PortfolioItem | null = null;
  selectedImageUrl: string | null = null;
  currentImageIndex = 0;
  totalImages = 0;
  allImages: string[] = [];
  allImageData: { url: string; description?: string; alt?: string; galleryTitle?: string; galleryDescription?: string; dimensions?: { width: number; height: number }; price?: number; sold?: boolean; showPrice?: boolean; dateCreated?: string; artMedium?: string; genre?: string }[] = [];
  currentImageData: { url: string; description?: string; alt?: string; galleryTitle?: string; galleryDescription?: string; dimensions?: { width: number; height: number }; price?: number; sold?: boolean; showPrice?: boolean; dateCreated?: string; artMedium?: string; genre?: string } | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private portfolioService: PortfolioService,
    private categoryService: CategoryService,
    private metaService: MetaService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPortfolioItem(id);
    } else {
      this.router.navigate(['/home']);
    }
  }

  ngOnDestroy() {
    // Restore body scrolling if modal was open
    document.body.style.overflow = 'auto';
  }

  private loadPortfolioItem(id: string) {
    this.portfolioService.getPublishedPortfolio().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(items => {
      const item = items.find(p => p.id === id);
      if (item) {
        this.portfolioItem = item;
        this.setupImageData();
        this.metaService.setPageTitle(item.title);
        this.isLoading = false;
        this.cdr.markForCheck();
      } else {
        this.router.navigate(['/home']);
      }
    });
  }

  private setupImageData() {
    if (!this.portfolioItem) return;

    this.allImages = [];
    this.allImageData = [];
    
    // Only include gallery images, not the featured image
    if (this.portfolioItem.galleries) {
      this.portfolioItem.galleries.forEach(gallery => {
        if (gallery.pictures) {
          gallery.pictures.forEach(picture => {
            this.allImages.push(picture.imageUrl);
            this.allImageData.push({
              url: picture.imageUrl,
              description: picture.description,
              alt: picture.alt || this.portfolioItem!.title,
              galleryTitle: gallery.title,
              galleryDescription: gallery.description,
              dimensions: picture.dimensions,
              price: picture.price,
              sold: picture.sold,
              showPrice: picture.showPrice,
              dateCreated: picture.dateCreated,
              artMedium: picture.artMedium,
              genre: picture.genre
            });
          });
        }
      });
    }
    
    this.totalImages = this.allImages.length;
  }

  getCategoryLabel(category: string): string {
    return this.categoryService.getCategoryLabelSync(category);
  }

  openImageViewer(imageUrl: string, index: number) {
    this.selectedImageUrl = imageUrl;
    this.currentImageIndex = index;
    this.currentImageData = this.allImageData[index] || null;
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  }

  closeImageViewer() {
    this.selectedImageUrl = null;
    this.currentImageData = null;
    // Restore body scrolling
    document.body.style.overflow = 'auto';
  }

  previousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.selectedImageUrl = this.allImages[this.currentImageIndex];
      this.currentImageData = this.allImageData[this.currentImageIndex] || null;
    }
  }

  nextImage() {
    if (this.currentImageIndex < this.totalImages - 1) {
      this.currentImageIndex++;
      this.selectedImageUrl = this.allImages[this.currentImageIndex];
      this.currentImageData = this.allImageData[this.currentImageIndex] || null;
    }
  }

  goBack() {
    window.history.back();
  }

  getImageIndex(galleryIndex: number, imageIndex: number): number {
    let totalIndex = 0;
    
    if (this.portfolioItem?.galleries) {
      // Count images in all previous galleries
      for (let i = 0; i < galleryIndex; i++) {
        const gallery = this.portfolioItem.galleries[i];
        if (gallery.pictures) {
          totalIndex += gallery.pictures.length;
        }
      }
      // Add the current image index within the current gallery
      totalIndex += imageIndex;
    }
    
    return totalIndex;
  }
}