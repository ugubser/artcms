import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { PortfolioService, PortfolioItem } from '../../services/portfolio.service';
import { ImageUploadComponent } from '../components/image-upload.component';

@Component({
  selector: 'app-portfolio-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatIconModule,
    MatSnackBarModule,
    MatTabsModule,
    ImageUploadComponent
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>{{ isEdit ? 'Edit' : 'Add' }} Portfolio Item</h2>
      
      <mat-dialog-content>
        <mat-tab-group class="portfolio-tabs">
          <mat-tab label="Basic Info">
            <div class="tab-content">
              <form [formGroup]="portfolioForm" class="portfolio-form">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Title</mat-label>
                  <input matInput formControlName="title" placeholder="Enter portfolio title">
                  <mat-error *ngIf="portfolioForm.get('title')?.hasError('required')">
                    Title is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" rows="4" placeholder="Enter description"></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Category</mat-label>
                  <mat-select formControlName="category">
                    <mat-option value="art">Art</mat-option>
                    <mat-option value="graphic-design">Graphic Design</mat-option>
                    <mat-option value="branding">Branding</mat-option>
                    <mat-option value="web-design">Web Design</mat-option>
                  </mat-select>
                  <mat-error *ngIf="portfolioForm.get('category')?.hasError('required')">
                    Category is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Display Order</mat-label>
                  <input matInput type="number" formControlName="order" placeholder="0">
                  <mat-hint>Lower numbers appear first</mat-hint>
                </mat-form-field>

                <div class="checkbox-field">
                  <mat-checkbox formControlName="published">
                    Published (visible on website)
                  </mat-checkbox>
                </div>
              </form>
            </div>
          </mat-tab>

          <mat-tab label="Featured Image">
            <div class="tab-content">
              <h3>Featured Image</h3>
              <app-image-upload
                [currentImageUrl]="currentFeaturedImage"
                [storagePath]="'portfolio/featured'"
                [alt]="portfolioForm.get('title')?.value || 'Portfolio item'"
                [maxSizeMB]="5"
                [recommendedSize]="'800x600px'"
                [allowUrlInput]="true"
                (imageUploaded)="onFeaturedImageUploaded($event)"
                (imageRemoved)="onFeaturedImageRemoved()">
              </app-image-upload>
            </div>
          </mat-tab>

          <mat-tab label="Gallery">
            <div class="tab-content">
              <h3>Gallery Images</h3>
              <div class="gallery-uploads">
                <div *ngFor="let imageUrl of galleryImages; let i = index" class="gallery-item">
                  <app-image-upload
                    [currentImageUrl]="imageUrl"
                    [storagePath]="'portfolio/gallery'"
                    [alt]="'Gallery image ' + (i + 1)"
                    [maxSizeMB]="5"
                    [recommendedSize]="'800x600px'"
                    [allowUrlInput]="true"
                    (imageUploaded)="onGalleryImageUploaded($event, i)"
                    (imageRemoved)="onGalleryImageRemoved(i)">
                  </app-image-upload>
                </div>
                
                <button mat-raised-button color="accent" (click)="addGallerySlot()" class="add-gallery-btn">
                  <mat-icon>add</mat-icon>
                  Add Gallery Image
                </button>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" 
                (click)="onSave()" 
                [disabled]="portfolioForm.invalid || saving">
          <mat-icon *ngIf="saving">hourglass_empty</mat-icon>
          {{ saving ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 700px;
      max-width: 90vw;
      max-height: 80vh;
    }
    
    .portfolio-tabs {
      min-height: 400px;
    }
    
    .tab-content {
      padding: 1rem;
    }
    
    .portfolio-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .full-width {
      width: 100%;
    }
    
    .checkbox-field {
      margin: 1rem 0;
    }
    
    .gallery-uploads {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .gallery-item {
      border: 1px solid #eee;
      border-radius: 8px;
      padding: 1rem;
    }
    
    .add-gallery-btn {
      align-self: flex-start;
    }
    
    h3 {
      font-size: 1.1rem;
      font-weight: 500;
      margin: 0 0 1rem 0;
      color: #333;
    }
    
    mat-dialog-actions {
      padding: 1rem 0 0 0;
    }
  `]
})
export class PortfolioEditDialogComponent implements OnInit {
  portfolioForm: FormGroup;
  isEdit: boolean;
  saving = false;
  currentFeaturedImage: string | null = null;
  galleryImages: (string | null)[] = [];

  constructor(
    private fb: FormBuilder,
    private portfolioService: PortfolioService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<PortfolioEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { item?: PortfolioItem }
  ) {
    this.isEdit = !!data?.item;
    this.portfolioForm = this.createForm();
  }

  ngOnInit() {
    if (this.isEdit && this.data.item) {
      this.populateForm(this.data.item);
    } else {
      // Initialize with one empty gallery slot for new items
      this.galleryImages = [null];
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      description: [''],
      category: ['', Validators.required],
      order: [0],
      published: [false]
    });
  }

  private populateForm(item: PortfolioItem) {
    this.portfolioForm.patchValue({
      title: item.title,
      description: item.description,
      category: item.category,
      order: item.order || 0,
      published: item.published || false
    });
    
    // Set images
    this.currentFeaturedImage = item.image || null;
    this.galleryImages = item.gallery ? [...item.gallery] : [];
    
    // Ensure at least one gallery slot
    if (this.galleryImages.length === 0) {
      this.galleryImages = [null];
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  // Image handling methods
  onFeaturedImageUploaded(imageUrl: string) {
    this.currentFeaturedImage = imageUrl;
  }

  onFeaturedImageRemoved() {
    this.currentFeaturedImage = null;
  }

  onGalleryImageUploaded(imageUrl: string, index: number) {
    this.galleryImages[index] = imageUrl;
  }

  onGalleryImageRemoved(index: number) {
    this.galleryImages.splice(index, 1);
    
    // Ensure at least one slot
    if (this.galleryImages.length === 0) {
      this.galleryImages = [null];
    }
  }

  addGallerySlot() {
    this.galleryImages.push(null);
  }

  async onSave() {
    if (this.portfolioForm.invalid) {
      return;
    }

    this.saving = true;
    const formValue = this.portfolioForm.value;
    
    // Process gallery images (filter out null values)
    const gallery = this.galleryImages.filter(url => url !== null) as string[];

    const portfolioItem: Partial<PortfolioItem> = {
      title: formValue.title,
      description: formValue.description,
      category: formValue.category,
      image: this.currentFeaturedImage || '',
      order: formValue.order,
      published: formValue.published,
      gallery: gallery
    };

    try {
      if (this.isEdit && this.data.item?.id) {
        await this.portfolioService.updatePortfolioItem(this.data.item.id, portfolioItem);
        this.snackBar.open('Portfolio item updated successfully', 'Close', { duration: 3000 });
      } else {
        portfolioItem.createdAt = new Date();
        await this.portfolioService.createPortfolioItem(portfolioItem);
        this.snackBar.open('Portfolio item created successfully', 'Close', { duration: 3000 });
      }
      
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error saving portfolio item:', error);
      this.snackBar.open('Error saving portfolio item. Please try again.', 'Close', { duration: 5000 });
    } finally {
      this.saving = false;
    }
  }
}