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
  templateUrl: './portfolio-detail-dialog.component.html',
  styleUrl: './portfolio-detail-dialog.component.scss',
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
    // Combine featured image and all gallery pictures for viewer
    this.allImages = [];
    if (data.featuredImage) {
      this.allImages.push(data.featuredImage);
    }
    if (data.galleries) {
      data.galleries.forEach(gallery => {
        if (gallery.pictures) {
          this.allImages.push(...gallery.pictures.map(p => p.imageUrl));
        }
      });
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