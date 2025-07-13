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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { PortfolioService, PortfolioItem, GalleryEntry, Picture } from '../../services/portfolio.service';
import { ImageUploadComponent } from '../components/image-upload.component';

@Component({
  selector: 'app-portfolio-edit-advanced-dialog',
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
    MatExpansionModule,
    MatCardModule,
    ImageUploadComponent
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>{{ isEdit ? 'Edit' : 'Add' }} Portfolio Item</h2>
      
      <mat-dialog-content>
        <mat-tab-group class="portfolio-tabs">
          <!-- Basic Info Tab -->
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
                  <mat-label>Description (Markdown)</mat-label>
                  <textarea matInput formControlName="description" rows="6" 
                           placeholder="Enter main project description (supports markdown)"></textarea>
                  <mat-hint>Supports markdown formatting: **bold**, *italic*, # headers, etc.</mat-hint>
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

          <!-- Featured Image Tab -->
          <mat-tab label="Featured Image">
            <div class="tab-content">
              <h3>Featured Image</h3>
              <p>This image represents the portfolio item in listings and previews.</p>
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

          <!-- Galleries Tab -->
          <mat-tab label="Galleries">
            <div class="tab-content">
              <div class="galleries-header">
                <h3>Gallery Collections</h3>
                <button mat-raised-button color="primary" (click)="addGallery()">
                  <mat-icon>add</mat-icon>
                  Add Gallery
                </button>
              </div>

              <div class="galleries-container" *ngIf="galleries.length > 0">
                <mat-expansion-panel *ngFor="let gallery of galleries; let galleryIndex = index" 
                                   class="gallery-panel">
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      {{ gallery.title || 'Gallery ' + (galleryIndex + 1) }}
                    </mat-panel-title>
                    <mat-panel-description>
                      {{ gallery.pictures.length }} pictures
                    </mat-panel-description>
                  </mat-expansion-panel-header>

                  <div class="gallery-content">
                    <!-- Gallery Info -->
                    <div class="gallery-info">
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Gallery Title</mat-label>
                        <input matInput [(ngModel)]="gallery.title" 
                               placeholder="Enter gallery title">
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Gallery Description (Markdown)</mat-label>
                        <textarea matInput [(ngModel)]="gallery.description" rows="3"
                                 placeholder="Describe this gallery section"></textarea>
                        <mat-hint>Supports markdown formatting</mat-hint>
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="order-field">
                        <mat-label>Gallery Order</mat-label>
                        <input matInput type="number" [(ngModel)]="gallery.order" placeholder="0">
                      </mat-form-field>

                      <button mat-button color="warn" (click)="removeGallery(galleryIndex)">
                        <mat-icon>delete</mat-icon>
                        Remove Gallery
                      </button>
                    </div>

                    <!-- Pictures in Gallery -->
                    <div class="pictures-section">
                      <div class="pictures-header">
                        <h4>Pictures in this Gallery</h4>
                        <button mat-button color="accent" (click)="addPictureToGallery(galleryIndex)">
                          <mat-icon>add_photo_alternate</mat-icon>
                          Add Picture
                        </button>
                      </div>

                      <div class="pictures-grid" *ngIf="gallery.pictures.length > 0">
                        <mat-card *ngFor="let picture of gallery.pictures; let pictureIndex = index" 
                                 class="picture-card">
                          <div class="picture-image">
                            <app-image-upload
                              [currentImageUrl]="picture.imageUrl"
                              [storagePath]="'portfolio/gallery-' + galleryIndex"
                              [alt]="picture.alt || 'Gallery picture'"
                              [maxSizeMB]="5"
                              [recommendedSize]="'800x600px'"
                              [allowUrlInput]="true"
                              (imageUploaded)="onPictureImageUploaded($event, galleryIndex, pictureIndex)"
                              (imageRemoved)="onPictureImageRemoved(galleryIndex, pictureIndex)">
                            </app-image-upload>
                          </div>

                          <div class="picture-details">
                            <mat-form-field appearance="outline" class="full-width">
                              <mat-label>Picture Description (Markdown)</mat-label>
                              <textarea matInput [(ngModel)]="picture.description" rows="3"
                                       placeholder="Describe this picture"></textarea>
                            </mat-form-field>

                            <mat-form-field appearance="outline" class="full-width">
                              <mat-label>Alt Text</mat-label>
                              <input matInput [(ngModel)]="picture.alt" 
                                     placeholder="Alt text for accessibility">
                            </mat-form-field>

                            <div class="picture-actions">
                              <mat-form-field appearance="outline" class="order-field">
                                <mat-label>Order</mat-label>
                                <input matInput type="number" [(ngModel)]="picture.order" placeholder="0">
                              </mat-form-field>

                              <button mat-button color="warn" 
                                     (click)="removePictureFromGallery(galleryIndex, pictureIndex)">
                                <mat-icon>delete</mat-icon>
                                Remove
                              </button>
                            </div>
                          </div>
                        </mat-card>
                      </div>

                      <div class="empty-pictures" *ngIf="gallery.pictures.length === 0">
                        <p>No pictures in this gallery yet. Add your first picture!</p>
                      </div>
                    </div>
                  </div>
                </mat-expansion-panel>
              </div>

              <div class="empty-galleries" *ngIf="galleries.length === 0">
                <mat-icon>photo_library</mat-icon>
                <h4>No galleries yet</h4>
                <p>Create your first gallery collection to organize your portfolio images.</p>
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
      width: 1000px;
      max-width: 95vw;
      max-height: 90vh;
    }
    
    .portfolio-tabs {
      min-height: 600px;
    }
    
    .tab-content {
      padding: 1.5rem 1rem;
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
    
    .galleries-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    
    .galleries-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .gallery-panel {
      border: 1px solid #e0e0e0;
    }
    
    .gallery-content {
      padding: 1rem;
    }
    
    .gallery-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #eee;
    }
    
    .order-field {
      max-width: 120px;
    }
    
    .pictures-section {
      margin-top: 1rem;
    }
    
    .pictures-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .pictures-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1rem;
    }
    
    .picture-card {
      padding: 1rem;
    }
    
    .picture-image {
      margin-bottom: 1rem;
    }
    
    .picture-details {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .picture-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    
    .empty-galleries, .empty-pictures {
      text-align: center;
      padding: 2rem;
      color: #666;
    }
    
    .empty-galleries mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: #ccc;
    }
    
    h3, h4 {
      font-size: 1.1rem;
      font-weight: 500;
      margin: 0;
      color: #333;
    }
    
    mat-dialog-actions {
      padding: 1rem 0 0 0;
    }
  `]
})
export class PortfolioEditAdvancedDialogComponent implements OnInit {
  portfolioForm: FormGroup;
  isEdit: boolean;
  saving = false;
  currentFeaturedImage: string | null = null;
  galleries: GalleryEntry[] = [];

  constructor(
    private fb: FormBuilder,
    private portfolioService: PortfolioService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<PortfolioEditAdvancedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { item?: PortfolioItem }
  ) {
    this.isEdit = !!data?.item;
    this.portfolioForm = this.createForm();
  }

  ngOnInit() {
    if (this.isEdit && this.data.item) {
      this.populateForm(this.data.item);
    } else {
      // Initialize with one empty gallery for new items
      this.galleries = [this.portfolioService.createEmptyGallery()];
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
    
    // Set featured image
    this.currentFeaturedImage = item.featuredImage || null;
    
    // Set galleries
    this.galleries = item.galleries ? [...item.galleries] : [];
    
    // Ensure at least one gallery
    if (this.galleries.length === 0) {
      this.galleries = [this.portfolioService.createEmptyGallery()];
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  // Featured image handling
  onFeaturedImageUploaded(imageUrl: string) {
    this.currentFeaturedImage = imageUrl;
  }

  onFeaturedImageRemoved() {
    this.currentFeaturedImage = null;
  }

  // Gallery management
  addGallery() {
    const newGallery = this.portfolioService.createEmptyGallery();
    newGallery.order = this.galleries.length;
    this.galleries.push(newGallery);
  }

  removeGallery(index: number) {
    if (confirm('Are you sure you want to remove this gallery and all its pictures?')) {
      this.galleries.splice(index, 1);
    }
  }

  // Picture management
  addPictureToGallery(galleryIndex: number) {
    const newPicture = this.portfolioService.createEmptyPicture();
    newPicture.order = this.galleries[galleryIndex].pictures.length;
    this.galleries[galleryIndex].pictures.push(newPicture);
  }

  removePictureFromGallery(galleryIndex: number, pictureIndex: number) {
    if (confirm('Are you sure you want to remove this picture?')) {
      this.galleries[galleryIndex].pictures.splice(pictureIndex, 1);
    }
  }

  // Picture image handling
  onPictureImageUploaded(imageUrl: string, galleryIndex: number, pictureIndex: number) {
    this.galleries[galleryIndex].pictures[pictureIndex].imageUrl = imageUrl;
  }

  onPictureImageRemoved(galleryIndex: number, pictureIndex: number) {
    this.galleries[galleryIndex].pictures[pictureIndex].imageUrl = '';
  }

  async onSave() {
    if (this.portfolioForm.invalid) {
      console.log('Form is invalid:', this.portfolioForm.errors);
      return;
    }

    this.saving = true;
    const formValue = this.portfolioForm.value;

    const portfolioItem: Partial<PortfolioItem> = {
      title: formValue.title,
      description: formValue.description,
      category: formValue.category,
      featuredImage: this.currentFeaturedImage || '',
      order: formValue.order,
      published: formValue.published,
      galleries: this.galleries.map(gallery => ({
        ...gallery,
        pictures: gallery.pictures.filter(picture => picture.imageUrl) // Only save pictures with images
      }))
    };

    console.log('Saving portfolio item:', portfolioItem);

    try {
      if (this.isEdit && this.data.item?.id) {
        await this.portfolioService.updatePortfolioItem(this.data.item.id, portfolioItem);
        console.log('Portfolio item updated successfully');
        this.snackBar.open('Portfolio item updated successfully', 'Close', { duration: 3000 });
      } else {
        portfolioItem.createdAt = new Date();
        const result = await this.portfolioService.createPortfolioItem(portfolioItem);
        console.log('Portfolio item created successfully with ID:', result);
        this.snackBar.open('Portfolio item created successfully', 'Close', { duration: 3000 });
      }
      
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error saving portfolio item:', error);
      this.snackBar.open(`Error saving portfolio item: ${error}`, 'Close', { duration: 5000 });
    } finally {
      this.saving = false;
    }
  }
}