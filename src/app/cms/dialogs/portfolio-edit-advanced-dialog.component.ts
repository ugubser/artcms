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
  templateUrl: './portfolio-edit-advanced-dialog.component.html',
  styleUrl: './portfolio-edit-advanced-dialog.component.scss'
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
    
    // Set galleries and ensure proper initialization
    this.galleries = item.galleries ? [...item.galleries] : [];
    
    // Ensure all pictures have the new fields properly initialized
    this.galleries.forEach(gallery => {
      gallery.pictures.forEach(picture => {
        if (!picture.dimensions) {
          picture.dimensions = { width: 0, height: 0 };
        }
        if (picture.price === undefined) {
          picture.price = 0;
        }
        if (picture.sold === undefined) {
          picture.sold = false;
        }
        if (picture.showPrice === undefined) {
          picture.showPrice = false;
        }
      });
    });
    
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
    // Ensure dimensions object is initialized
    if (!newPicture.dimensions) {
      newPicture.dimensions = { width: 0, height: 0 };
    }
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