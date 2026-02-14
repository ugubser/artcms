import { Component, Inject, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { deleteField } from 'firebase/firestore';
import { PortfolioService, PortfolioItem, GalleryEntry, Picture } from '../../services/portfolio.service';
import { CategoryService } from '../../services/category.service';
import { PortfolioPagesService, PortfolioPageConfig } from '../../services/portfolio-pages.service';
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
  private destroyRef = inject(DestroyRef);
  portfolioForm: FormGroup;
  isEdit: boolean;
  saving = false;
  currentFeaturedImage: string | null = null;
  galleries: GalleryEntry[] = [];
  categories: {value: string, label: string}[] = [];
  portfolioPages: PortfolioPageConfig[] = [];
  filteredPortfolioPages: PortfolioPageConfig[] = [];

  constructor(
    private fb: FormBuilder,
    private portfolioService: PortfolioService,
    private categoryService: CategoryService,
    private portfolioPagesService: PortfolioPagesService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<PortfolioEditAdvancedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { item?: PortfolioItem }
  ) {
    this.isEdit = !!data?.item;
    this.portfolioForm = this.createForm();
  }

  ngOnInit() {
    // Load categories first
    this.categoryService.getCategoriesForSelect().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (categories) => {
        this.categories = categories || [];

        // Load portfolio pages after categories are loaded
        this.portfolioPagesService.getPortfolioPages().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (portfolioPages) => {
            this.portfolioPages = portfolioPages || [];

            // Set up category change listener to filter portfolio pages
            this.portfolioForm.get('category')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(category => {
              this.filterPortfolioPages(category);
            });
            
            if (this.isEdit && this.data.item) {
              this.populateForm(this.data.item);
            } else {
              // Initialize with one empty gallery for new items
              this.galleries = [this.portfolioService.createEmptyGallery()];
            }
          },
          error: () => {
            this.portfolioPages = [];
          }
        });
      },
      error: () => {
        // Fallback categories
        this.categories = [
          { value: 'art', label: 'Art' },
          { value: 'exhibition', label: 'Exhibition' },
          { value: 'graphic-design', label: 'Graphic Design' },
          { value: 'branding', label: 'Branding' },
          { value: 'web-design', label: 'Web Design' },
          { value: 'photography', label: 'Photography' },
          { value: 'illustration', label: 'Illustration' }
        ];
        this.portfolioPages = [];
        
        if (this.isEdit && this.data.item) {
          this.populateForm(this.data.item);
        } else {
          this.galleries = [this.portfolioService.createEmptyGallery()];
        }
      }
    });
  }

  private filterPortfolioPages(category: string) {
    // Show ALL portfolio pages, not just matching category (allows cross-category assignment)
    this.filteredPortfolioPages = [...this.portfolioPages];
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      description: [''],
      category: ['', Validators.required],
      portfolioPageId: [''], // Optional portfolio page assignment
      order: [0],
      published: [false]
    });
  }

  private populateForm(item: PortfolioItem) {
    this.portfolioForm.patchValue({
      title: item.title,
      description: item.description,
      category: item.category,
      portfolioPageId: item.portfolioPageId || '', // Backwards compatible
      order: item.order || 0,
      published: item.published || false
    });
    // Filter portfolio pages based on current category
    if (item.category) {
      setTimeout(() => {
        this.filterPortfolioPages(item.category);
      }, 100); // Small delay to ensure form is updated
    }
    
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

    // Handle portfolioPageId assignment
    if (formValue.portfolioPageId && formValue.portfolioPageId.trim() !== '') {
      // Explicit page assignment
      portfolioItem.portfolioPageId = formValue.portfolioPageId;
    } else {
      // Auto-assign by category: remove portfolioPageId field completely
      portfolioItem.portfolioPageId = deleteField() as any;
    }

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
      this.snackBar.open(`Error saving portfolio item: ${error}`, 'Close', { duration: 5000 });
    } finally {
      this.saving = false;
    }
  }
}