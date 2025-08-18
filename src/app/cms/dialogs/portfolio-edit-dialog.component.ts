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
import { Observable } from 'rxjs';
import { PortfolioService, PortfolioItem } from '../../services/portfolio.service';
import { CategoryService } from '../../services/category.service';
import { PortfolioPagesService, PortfolioPageConfig } from '../../services/portfolio-pages.service';
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
  templateUrl: './portfolio-edit-dialog.component.html',
  styleUrl: './portfolio-edit-dialog.component.scss'
})
export class PortfolioEditDialogComponent implements OnInit {
  portfolioForm: FormGroup;
  isEdit: boolean;
  saving = false;
  currentFeaturedImage: string | null = null;
  galleryImages: (string | null)[] = [];
  categories$: Observable<{value: string, label: string}[]>;
  categories: {value: string, label: string}[] = [];
  portfolioPages: PortfolioPageConfig[] = [];
  filteredPortfolioPages: PortfolioPageConfig[] = [];

  constructor(
    private fb: FormBuilder,
    private portfolioService: PortfolioService,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<PortfolioEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { item?: PortfolioItem }
  ) {
    this.isEdit = !!data?.item;
    this.portfolioForm = this.createForm();
    this.categories$ = this.categoryService.getCategoriesForSelect();
  }

  ngOnInit() {
    // Load categories and populate form
    this.categoryService.getCategoriesForSelect().subscribe({
      next: (categories) => {
        console.log('Categories loaded for select:', categories);
        this.categories = categories;
        
        if (this.isEdit && this.data.item) {
          this.populateForm(this.data.item);
        } else {
          // Initialize with one empty gallery slot for new items
          this.galleryImages = [null];
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
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
      }
    });
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
    this.currentFeaturedImage = item.featuredImage || null;
    this.galleryImages = item.galleries?.[0]?.pictures?.map(p => p.imageUrl) || [];
    
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
      console.log('Form is invalid:', this.portfolioForm.errors);
      return;
    }

    console.log('Dialog state - isEdit:', this.isEdit);
    console.log('Dialog data:', this.data);
    console.log('Data item ID:', this.data?.item?.id);

    this.saving = true;
    const formValue = this.portfolioForm.value;
    
    // Process gallery images (filter out null values)
    const gallery = this.galleryImages.filter(url => url !== null) as string[];

    const portfolioItem: Partial<PortfolioItem> = {
      title: formValue.title,
      description: formValue.description,
      category: formValue.category,
      featuredImage: this.currentFeaturedImage || '',
      order: formValue.order,
      published: formValue.published,
      galleries: gallery.length > 0 ? [{
        id: Date.now().toString(),
        title: 'Gallery',
        description: '',
        order: 0,
        pictures: gallery.map((url, index) => ({
          id: Date.now().toString() + index,
          imageUrl: url,
          description: '',
          alt: '',
          order: index
        }))
      }] : []
    };

    console.log('Saving portfolio item:', portfolioItem);

    try {
      let result;
      if (this.isEdit && this.data.item?.id) {
        console.log('Taking UPDATE path for item ID:', this.data.item.id);
        await this.portfolioService.updatePortfolioItem(this.data.item.id, portfolioItem);
        console.log('Portfolio item updated successfully');
        this.snackBar.open('Portfolio item updated successfully', 'Close', { duration: 3000 });
      } else {
        console.log('Taking CREATE path - isEdit:', this.isEdit, 'item ID:', this.data?.item?.id);
        portfolioItem.createdAt = new Date();
        result = await this.portfolioService.createPortfolioItem(portfolioItem);
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