import { Component, OnInit, OnDestroy, HostListener, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PortfolioService, PortfolioItem } from '../../services/portfolio.service';
import { CategoryService } from '../../services/category.service';
import { MetaService } from '../../services/meta.service';
import { ResolveStorageUrlPipe } from '../../pipes/resolve-storage-url.pipe';

@Component({
  selector: 'app-picture-viewer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    ResolveStorageUrlPipe
  ],
  templateUrl: './picture-viewer.component.html',
  styleUrl: './picture-viewer.component.scss'
})
export class PictureViewerComponent implements OnInit, OnDestroy {
  private destroyRef = inject(DestroyRef);
  portfolioItem: PortfolioItem | null = null;
  currentImage: { url: string; description?: string; alt?: string; galleryTitle?: string; galleryDescription?: string; dimensions?: { width: number; height: number }; price?: number; sold?: boolean; showPrice?: boolean; dateCreated?: string; artMedium?: string; genre?: string; galleryIndex: number; pictureIndex: number } | null = null;
  currentImageIndex = 0;
  totalImages = 0;
  allImages: { url: string; description?: string; alt?: string; galleryTitle?: string; galleryDescription?: string; dimensions?: { width: number; height: number }; price?: number; sold?: boolean; showPrice?: boolean; dateCreated?: string; artMedium?: string; genre?: string; galleryIndex: number; pictureIndex: number }[] = [];
  isLoading = true;
  
  // URL parameters
  portfolioId: string = '';
  galleryIndex: number = 0;
  pictureIndex: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private portfolioService: PortfolioService,
    private categoryService: CategoryService,
    private metaService: MetaService
  ) {}

  ngOnInit() {
    // Prevent body scrolling when component loads
    document.body.style.overflow = 'hidden';
    
    // Get route parameters
    this.portfolioId = this.route.snapshot.paramMap.get('id') || '';
    this.galleryIndex = parseInt(this.route.snapshot.paramMap.get('galleryIndex') || '0', 10);
    this.pictureIndex = parseInt(this.route.snapshot.paramMap.get('pictureIndex') || '0', 10);
    
    if (this.portfolioId) {
      this.loadPortfolioItem(this.portfolioId);
    } else {
      this.goToPortfolio();
    }
  }

  ngOnDestroy() {
    // Restore body scrolling when component is destroyed
    document.body.style.overflow = 'auto';
  }

  private loadPortfolioItem(id: string) {
    this.portfolioService.getPublishedPortfolio().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(items => {
      const item = items.find(p => p.id === id);
      if (item) {
        this.portfolioItem = item;
        this.setupImageData();
        this.setCurrentImage();
        this.updateMetaTags();
        this.isLoading = false;
      } else {
        this.goToPortfolio();
      }
    });
  }

  private setupImageData() {
    if (!this.portfolioItem) return;

    this.allImages = [];
    let globalIndex = 0;
    
    // Build array of all images with their gallery/picture indices
    if (this.portfolioItem.galleries) {
      this.portfolioItem.galleries.forEach((gallery, galIdx) => {
        if (gallery.pictures) {
          gallery.pictures.forEach((picture, picIdx) => {
            this.allImages.push({
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
              genre: picture.genre,
              galleryIndex: galIdx,
              pictureIndex: picIdx
            });
            
            // Check if this is our target image
            if (galIdx === this.galleryIndex && picIdx === this.pictureIndex) {
              this.currentImageIndex = globalIndex;
            }
            globalIndex++;
          });
        }
      });
    }
    
    this.totalImages = this.allImages.length;
  }

  private setCurrentImage() {
    if (this.allImages.length > 0 && this.currentImageIndex < this.allImages.length) {
      this.currentImage = this.allImages[this.currentImageIndex];
    } else {
      // Invalid image index, redirect to portfolio
      this.goToPortfolio();
    }
  }

  private updateMetaTags() {
    if (this.currentImage && this.portfolioItem) {
      const title = `${this.currentImage.description || 'Image'} - ${this.portfolioItem.title}`;
      this.metaService.setPageTitle(title);
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    switch (event.key) {
      case 'Escape':
        this.goToPortfolio();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.previousImage();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextImage();
        break;
    }
  }

  previousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.currentImage = this.allImages[this.currentImageIndex];
      this.updateUrl();
      this.updateMetaTags();
    }
  }

  nextImage() {
    if (this.currentImageIndex < this.totalImages - 1) {
      this.currentImageIndex++;
      this.currentImage = this.allImages[this.currentImageIndex];
      this.updateUrl();
      this.updateMetaTags();
    }
  }

  private updateUrl() {
    if (this.currentImage) {
      const newUrl = `/portfolio/${this.portfolioId}/galleries/${this.currentImage.galleryIndex}/pictures/${this.currentImage.pictureIndex}`;
      this.router.navigate([newUrl], { replaceUrl: true });
    }
  }

  goToPortfolio() {
    this.router.navigate(['/portfolio', this.portfolioId]);
  }

  getCategoryLabel(category: string): string {
    return this.categoryService.getCategoryLabelSync(category);
  }
}