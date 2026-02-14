import { Component, Inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { PortfolioPagesService, PortfolioPageConfig } from '../../services/portfolio-pages.service';
import { CategoryService } from '../../services/category.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-portfolio-pages-edit-dialog',
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
    MatIconModule,
    MatTabsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './portfolio-pages-edit-dialog.component.html',
  styleUrl: './portfolio-pages-edit-dialog.component.scss'
})
export class PortfolioPagesEditDialogComponent implements OnInit {
  portfolioPagesForm: FormGroup;
  isLoading = false;
  isEdit = false;
  isAddMode = false;

  constructor(
    private fb: FormBuilder,
    private portfolioPagesService: PortfolioPagesService,
    private categoryService: CategoryService,
    private notify: NotificationService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<PortfolioPagesEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEdit = !!this.data?.page;
    this.isAddMode = this.data?.page === null;
    
    if (this.isEdit || this.isAddMode) {
      // Single page mode
      this.portfolioPagesForm = this.fb.group({
        category: ['', Validators.required],
        title: ['', Validators.required],
        subtitle: ['', Validators.required],
        slug: ['', Validators.required],
        order: [null]
      });
    } else {
      // Multi-page mode (legacy)
      this.portfolioPagesForm = this.fb.group({
        pages: this.fb.array([])
      });
    }
  }

  ngOnInit() {
    if (this.isEdit || this.isAddMode) {
      this.loadSinglePage();
    } else {
      this.loadPortfolioPages();
    }
  }

  get pagesArray(): FormArray {
    return this.portfolioPagesForm.get('pages') as FormArray;
  }

  private loadSinglePage() {
    if (this.isEdit && this.data.page) {
      // Editing existing page
      this.portfolioPagesForm.patchValue({
        category: this.data.page.category,
        title: this.data.page.title,
        subtitle: this.data.page.subtitle,
        slug: this.data.page.slug || '',
        order: this.data.page.order ?? null
      });
    } else if (this.isAddMode) {
      // Adding new page - form is already initialized with empty values
      // Set a default category if needed
      this.portfolioPagesForm.patchValue({
        category: 'portfolio'
      });
    }

    // Auto-generate slug from title when title changes (only if slug is empty or matches previous auto-slug)
    this.portfolioPagesForm.get('title')?.valueChanges.subscribe(title => {
      const currentSlug = this.portfolioPagesForm.get('slug')?.value;
      const autoSlug = this.slugify(title);
      // Only auto-set if slug is empty or was previously auto-generated
      if (!currentSlug || currentSlug === this.slugify(this.previousTitle)) {
        this.portfolioPagesForm.get('slug')?.setValue(autoSlug, { emitEvent: false });
      }
      this.previousTitle = title;
    });
  }

  private previousTitle = '';

  private slugify(text: string): string {
    return (text || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  private async loadPortfolioPages() {
    this.isLoading = true;
    
    try {
      // Initialize defaults if none exist
      await this.portfolioPagesService.initializeDefaultPortfolioPages();
      
      // Get pages data once
      const pages = await new Promise<PortfolioPageConfig[]>((resolve, reject) => {
        this.portfolioPagesService.getPortfolioPages().subscribe({
          next: (data) => resolve(data),
          error: (error) => reject(error)
        });
      });
      
      this.pagesArray.clear();
      
      // Get page categories from CategoryService (only portfolio, art, and graphic-design for now)
      const availableCategories = this.categoryService.getCategoriesArray();
      const pageCategories = availableCategories
        .filter(cat => ['portfolio', 'art', 'graphic-design'].includes(cat.id))
        .map(cat => cat.id);
      
      const defaultPages = this.portfolioPagesService.getDefaultPortfolioPages();
      
      for (const category of pageCategories) {
        const existingPage = pages.find(p => p.category === category);
        const defaultPage = defaultPages.find(p => p.category === category);
        
        const pageData = existingPage || defaultPage!;
        
        this.pagesArray.push(this.fb.group({
          category: [pageData.category, Validators.required],
          title: [pageData.title, Validators.required],
          subtitle: [pageData.subtitle, Validators.required]
        }));
      }
      
      this.isLoading = false;
      this.cdr.markForCheck();
    } catch (error) {
      this.notify.error('Error loading portfolio pages');
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  getCategoryLabel(category: string): string {
    return this.categoryService.getCategoryLabelSync(category);
  }

  async onSave() {
    if (this.portfolioPagesForm.invalid) {
      this.notify.error('Please fill in all required fields');
      return;
    }

    this.isLoading = true;

    try {
      if (this.isEdit || this.isAddMode) {
        // Single page mode
        const formValue = this.portfolioPagesForm.value;
        const pageConfig: Partial<PortfolioPageConfig> = {
          category: formValue.category,
          title: formValue.title,
          subtitle: formValue.subtitle,
          slug: formValue.slug,
          order: formValue.order != null ? Number(formValue.order) : null as any,
          updatedAt: new Date()
        };

        if (this.isEdit && this.data.page?.id) {
          pageConfig.id = this.data.page.id;
        }

        await this.portfolioPagesService.updatePortfolioPage(pageConfig);
        this.isEdit ? this.notify.updated('Portfolio page') : this.notify.created('Portfolio page');
      } else {
        // Multi-page mode (legacy)
        const pages = this.pagesArray.value as PortfolioPageConfig[];

        for (const page of pages) {
          await this.portfolioPagesService.updatePortfolioPage(page);
        }
        this.notify.updated('Portfolio pages');
      }

      this.dialogRef.close(true);
    } catch (error) {
      console.error('Portfolio pages save error:', error);
      this.notify.saveError('portfolio pages', error);
    } finally {
      this.isLoading = false;
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}