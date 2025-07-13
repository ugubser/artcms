import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PortfolioItem } from '../../services/portfolio.service';

@Component({
  selector: 'app-portfolio-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="portfolio-detail-container">
      <div class="portfolio-header">
        <h2 mat-dialog-title>{{ data.title }}</h2>
        <button mat-icon-button (click)="onClose()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <mat-dialog-content class="portfolio-content">
        <!-- Featured Image -->
        <div class="featured-image" *ngIf="data.image">
          <img [src]="data.image" [alt]="data.title" (click)="openImageViewer(data.image, 0)">
        </div>

        <!-- Portfolio Info -->
        <div class="portfolio-info">
          <div class="category-badge">{{ getCategoryLabel(data.category) }}</div>
          <p class="description" *ngIf="data.description">{{ data.description }}</p>
        </div>

        <!-- Gallery -->
        <div class="gallery-section" *ngIf="data.gallery && data.gallery.length > 0">
          <h3>Gallery</h3>
          <div class="gallery-grid">
            <div *ngFor="let image of data.gallery; let i = index" 
                 class="gallery-item"
                 (click)="openImageViewer(image, i + 1)">
              <img [src]="image" [alt]="data.title + ' - Image ' + (i + 1)">
              <div class="gallery-overlay">
                <mat-icon>zoom_in</mat-icon>
              </div>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <!-- Image Viewer Modal -->
      <div class="image-viewer" 
           *ngIf="selectedImageUrl" 
           (click)="closeImageViewer()"
           [@fadeInOut]>
        <div class="image-viewer-content" (click)="$event.stopPropagation()">
          <button mat-icon-button (click)="closeImageViewer()" class="viewer-close">
            <mat-icon>close</mat-icon>
          </button>
          
          <div class="image-navigation">
            <button mat-icon-button (click)="previousImage()" [disabled]="currentImageIndex <= 0">
              <mat-icon>chevron_left</mat-icon>
            </button>
            
            <div class="image-container">
              <img [src]="selectedImageUrl" [alt]="data.title">
            </div>
            
            <button mat-icon-button (click)="nextImage()" [disabled]="currentImageIndex >= totalImages - 1">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
          
          <div class="image-counter">
            {{ currentImageIndex + 1 }} / {{ totalImages }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .portfolio-detail-container {
      width: 90vw;
      max-width: 1000px;
      max-height: 90vh;
    }

    .portfolio-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #eee;
    }

    .portfolio-header h2 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 300;
      color: #000;
    }

    .close-button {
      color: #666;
    }

    .portfolio-content {
      padding: 0;
      max-height: 70vh;
      overflow-y: auto;
    }

    .featured-image {
      width: 100%;
      margin-bottom: 2rem;
    }

    .featured-image img {
      width: 100%;
      height: auto;
      max-height: 400px;
      object-fit: contain;
      cursor: zoom-in;
      transition: transform 0.3s ease;
    }

    .featured-image img:hover {
      transform: scale(1.02);
    }

    .portfolio-info {
      padding: 0 1.5rem 1.5rem;
    }

    .category-badge {
      display: inline-block;
      background: #000;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 1rem;
    }

    .description {
      font-size: 1rem;
      line-height: 1.6;
      color: #666;
      margin: 0;
    }

    .gallery-section {
      padding: 1.5rem;
      border-top: 1px solid #eee;
    }

    .gallery-section h3 {
      font-size: 1.2rem;
      font-weight: 400;
      margin: 0 0 1rem 0;
      color: #333;
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .gallery-item {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      border-radius: 8px;
      cursor: zoom-in;
      transition: transform 0.3s ease;
    }

    .gallery-item:hover {
      transform: scale(1.05);
    }

    .gallery-item:hover .gallery-overlay {
      opacity: 1;
    }

    .gallery-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .gallery-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      color: white;
    }

    .gallery-overlay mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }

    /* Image Viewer Styles */
    .image-viewer {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.95);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    }

    .image-viewer-content {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .viewer-close {
      position: absolute;
      top: -50px;
      right: 0;
      color: white;
      z-index: 1001;
    }

    .image-navigation {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .image-navigation button {
      color: white;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(4px);
    }

    .image-navigation button:disabled {
      opacity: 0.3;
    }

    .image-container {
      max-width: 80vw;
      max-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .image-container img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }

    .image-counter {
      color: white;
      margin-top: 1rem;
      font-size: 0.9rem;
      opacity: 0.8;
    }

    @media (max-width: 768px) {
      .portfolio-detail-container {
        width: 100vw;
        max-width: 100vw;
        height: 100vh;
        max-height: 100vh;
      }

      .gallery-grid {
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 0.5rem;
      }

      .image-navigation {
        flex-direction: column;
        gap: 0.5rem;
      }

      .image-container {
        max-width: 95vw;
        max-height: 70vh;
      }
    }
  `],
  animations: []
})
export class PortfolioDetailDialogComponent {
  selectedImageUrl: string | null = null;
  currentImageIndex = 0;
  totalImages = 0;
  allImages: string[] = [];

  constructor(
    private dialogRef: MatDialogRef<PortfolioDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PortfolioItem
  ) {
    // Combine featured image and gallery for viewer
    this.allImages = [];
    if (data.image) {
      this.allImages.push(data.image);
    }
    if (data.gallery) {
      this.allImages.push(...data.gallery);
    }
    this.totalImages = this.allImages.length;
  }

  onClose() {
    this.dialogRef.close();
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
  }

  closeImageViewer() {
    this.selectedImageUrl = null;
  }

  previousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.selectedImageUrl = this.allImages[this.currentImageIndex];
    }
  }

  nextImage() {
    if (this.currentImageIndex < this.totalImages - 1) {
      this.currentImageIndex++;
      this.selectedImageUrl = this.allImages[this.currentImageIndex];
    }
  }
}