import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PortfolioService, PortfolioItem } from '../../services/portfolio.service';
import { MetaService } from '../../services/meta.service';
import { PageHeaderComponent } from '../shared/page-header.component';

@Component({
  selector: 'app-portfolio-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent
  ],
  templateUrl: './portfolio-detail.component.html',
  styleUrl: './portfolio-detail.component.scss'
})
export class PortfolioDetailComponent implements OnInit {
  portfolioItem: PortfolioItem | null = null;
  selectedImageUrl: string | null = null;
  currentImageIndex = 0;
  totalImages = 0;
  allImages: string[] = [];
  allImageData: { url: string; description?: string; alt?: string; galleryTitle?: string; galleryDescription?: string }[] = [];
  currentImageData: { url: string; description?: string; alt?: string; galleryTitle?: string; galleryDescription?: string } | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private portfolioService: PortfolioService,
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

  private loadPortfolioItem(id: string) {
    this.portfolioService.getPublishedPortfolio().subscribe(items => {
      const item = items.find(p => p.id === id);
      if (item) {
        this.portfolioItem = item;
        this.setupImageData();
        this.metaService.setPageTitle(item.title);
        this.isLoading = false;
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
              galleryDescription: gallery.description
            });
          });
        }
      });
    }
    
    this.totalImages = this.allImages.length;
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
}