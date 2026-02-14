import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PortfolioItem } from '../../services/portfolio.service';
import { CategoryService } from '../../services/category.service';
import { ResolveStorageUrlPipe } from '../../pipes/resolve-storage-url.pipe';

@Component({
  selector: 'app-portfolio-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ResolveStorageUrlPipe
  ],
  templateUrl: './portfolio-detail-dialog.component.html',
  styleUrl: './portfolio-detail-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: []
})
export class PortfolioDetailDialogComponent {
  selectedImageUrl: string | null = null;
  currentImageIndex = 0;
  totalImages = 0;
  allImages: string[] = [];
  allImageData: { url: string; description?: string; alt?: string }[] = [];
  currentImageData: { url: string; description?: string; alt?: string } | null = null;

  constructor(
    private categoryService: CategoryService,
    private dialogRef: MatDialogRef<PortfolioDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PortfolioItem
  ) {
    // Combine featured image and all gallery pictures for viewer
    this.allImages = [];
    this.allImageData = [];
    
    if (data.featuredImage) {
      this.allImages.push(data.featuredImage);
      this.allImageData.push({ 
        url: data.featuredImage, 
        description: undefined, 
        alt: data.title 
      });
    }
    
    if (data.galleries) {
      data.galleries.forEach(gallery => {
        if (gallery.pictures) {
          gallery.pictures.forEach(picture => {
            this.allImages.push(picture.imageUrl);
            this.allImageData.push({
              url: picture.imageUrl,
              description: picture.description,
              alt: picture.alt || data.title
            });
          });
        }
      });
    }
    
    this.totalImages = this.allImages.length;
  }

  onClose() {
    this.dialogRef.close();
  }

  getCategoryLabel(category: string): string {
    return this.categoryService.getCategoryLabelSync(category);
  }

  openImageViewer(imageUrl: string, index: number) {
    this.selectedImageUrl = imageUrl;
    this.currentImageIndex = index;
    this.currentImageData = this.allImageData[index] || null;
  }

  closeImageViewer() {
    this.selectedImageUrl = null;
    this.currentImageData = null;
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
}