import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  template: `
    <div class="image-upload-container">
      <!-- Current Image Preview -->
      <div class="current-image" *ngIf="currentImageUrl && !uploading">
        <img [src]="currentImageUrl" [alt]="alt" class="preview-image">
        <div class="image-overlay">
          <button mat-icon-button color="warn" (click)="removeImage()" 
                  [disabled]="uploading" title="Remove image">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </div>

      <!-- Upload Progress -->
      <div class="upload-progress" *ngIf="uploading">
        <mat-progress-bar mode="determinate" [value]="uploadProgress"></mat-progress-bar>
        <p>Uploading... {{ uploadProgress }}%</p>
      </div>

      <!-- Upload Button -->
      <div class="upload-section">
        <input #fileInput
               type="file"
               accept="image/*"
               (change)="onFileSelected($event)"
               style="display: none">
        
        <button mat-raised-button 
                color="primary" 
                (click)="fileInput.click()"
                [disabled]="uploading">
          <mat-icon>{{ currentImageUrl ? 'edit' : 'add_photo_alternate' }}</mat-icon>
          {{ currentImageUrl ? 'Change Image' : 'Upload Image' }}
        </button>

        <div class="upload-hints" *ngIf="!currentImageUrl">
          <small>
            • Supported formats: JPG, PNG, WebP<br>
            • Maximum size: {{ maxSizeMB }}MB<br>
            • Recommended: {{ recommendedSize }}
          </small>
        </div>
      </div>

      <!-- URL Input Alternative -->
      <div class="url-input-section" *ngIf="allowUrlInput && !currentImageUrl">
        <p class="or-divider">— OR —</p>
        <div class="url-input">
          <input #urlInput
                 type="url"
                 placeholder="Enter image URL"
                 class="url-field">
          <button mat-button (click)="setImageFromUrl(urlInput.value)" [disabled]="uploading">
            <mat-icon>link</mat-icon>
            Use URL
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .image-upload-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      border: 2px dashed #ddd;
      border-radius: 8px;
      background: #fafafa;
    }

    .current-image {
      position: relative;
      display: flex;
      justify-content: center;
      border-radius: 8px;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .preview-image {
      max-width: 100%;
      max-height: 200px;
      object-fit: contain;
    }

    .image-overlay {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      gap: 0.5rem;
    }

    .upload-progress {
      text-align: center;
    }

    .upload-progress p {
      margin: 0.5rem 0 0 0;
      font-size: 0.9rem;
      color: #666;
    }

    .upload-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .upload-hints {
      text-align: center;
      color: #666;
      font-size: 0.8rem;
      line-height: 1.4;
    }

    .url-input-section {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    .or-divider {
      text-align: center;
      color: #999;
      font-size: 0.9rem;
      margin: 0 0 1rem 0;
    }

    .url-input {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .url-field {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.9rem;
    }

    .url-field:focus {
      outline: none;
      border-color: #000;
    }
  `]
})
export class ImageUploadComponent implements OnInit {
  @Input() currentImageUrl: string | null = null;
  @Input() storagePath: string = 'uploads';
  @Input() alt: string = 'Uploaded image';
  @Input() maxSizeMB: number = 5;
  @Input() recommendedSize: string = '800x600px';
  @Input() allowUrlInput: boolean = true;
  
  @Output() imageUploaded = new EventEmitter<string>();
  @Output() imageRemoved = new EventEmitter<void>();

  uploading = false;
  uploadProgress = 0;

  constructor(
    private storage: Storage,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Component initialization
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!this.validateFile(file)) {
      return;
    }

    this.uploading = true;
    this.uploadProgress = 0;

    try {
      // Create unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name}`;
      const filePath = `${this.storagePath}/${filename}`;
      
      // Create storage reference
      const storageRef = ref(this.storage, filePath);
      
      // Upload file with progress tracking
      const uploadTask = uploadBytes(storageRef, file);
      
      // Simulate progress for better UX (Firebase Storage doesn't provide real-time progress in v9)
      const progressInterval = setInterval(() => {
        if (this.uploadProgress < 90) {
          this.uploadProgress += Math.random() * 20;
        }
      }, 200);

      // Wait for upload to complete
      const snapshot = await uploadTask;
      clearInterval(progressInterval);
      this.uploadProgress = 100;

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Remove old image if exists
      if (this.currentImageUrl && this.currentImageUrl.includes('firebase')) {
        await this.deleteOldImage(this.currentImageUrl);
      }

      this.currentImageUrl = downloadURL;
      this.imageUploaded.emit(downloadURL);
      
      this.snackBar.open('Image uploaded successfully!', 'Close', { duration: 3000 });
      
    } catch (error) {
      console.error('Upload error:', error);
      this.snackBar.open('Failed to upload image. Please try again.', 'Close', { duration: 5000 });
    } finally {
      this.uploading = false;
      this.uploadProgress = 0;
      // Reset file input
      event.target.value = '';
    }
  }

  setImageFromUrl(url: string) {
    if (!url.trim()) {
      this.snackBar.open('Please enter a valid URL', 'Close', { duration: 3000 });
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
      this.currentImageUrl = url;
      this.imageUploaded.emit(url);
      this.snackBar.open('Image URL set successfully!', 'Close', { duration: 3000 });
    } catch {
      this.snackBar.open('Invalid URL format', 'Close', { duration: 3000 });
    }
  }

  async removeImage() {
    if (this.currentImageUrl && this.currentImageUrl.includes('firebase')) {
      try {
        await this.deleteOldImage(this.currentImageUrl);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    this.currentImageUrl = null;
    this.imageRemoved.emit();
    this.snackBar.open('Image removed', 'Close', { duration: 2000 });
  }

  private validateFile(file: File): boolean {
    // Check file type
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Please select a valid image file', 'Close', { duration: 3000 });
      return false;
    }

    // Check file size
    const maxSizeBytes = this.maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.snackBar.open(`File size must be less than ${this.maxSizeMB}MB`, 'Close', { duration: 3000 });
      return false;
    }

    return true;
  }

  private async deleteOldImage(imageUrl: string) {
    try {
      const imageRef = ref(this.storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting old image:', error);
      // Don't throw error as it's not critical
    }
  }
}