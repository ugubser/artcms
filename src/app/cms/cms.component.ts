import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PortfolioService } from '../services/portfolio.service';
import { AboutService } from '../services/about.service';
import { ContactService } from '../services/contact.service';
import { SettingsService } from '../services/settings.service';
import { PortfolioEditDialogComponent } from './dialogs/portfolio-edit-dialog.component';
import { PortfolioEditAdvancedDialogComponent } from './dialogs/portfolio-edit-advanced-dialog.component';
import { AboutEditDialogComponent } from './dialogs/about-edit-dialog.component';
import { ContactEditDialogComponent } from './dialogs/contact-edit-dialog.component';
import { SettingsEditDialogComponent } from './dialogs/settings-edit-dialog.component';

@Component({
  selector: 'app-cms',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    MatTabsModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="cms-wrapper">
      <header class="cms-header">
        <h1>Tribeca Concepts CMS</h1>
        <p>Content Management System</p>
      </header>
      
      <mat-tab-group class="cms-tabs" (selectedTabChange)="onTabChange($event)">
        <mat-tab label="Portfolio">
          <div class="tab-content">
            <div class="tab-header">
              <h2>Portfolio Management</h2>
              <button mat-raised-button color="primary" (click)="addNewPortfolioItem()">
                <mat-icon>add</mat-icon>
                Add New Portfolio Item
              </button>
            </div>
            
            <div class="portfolio-grid" *ngIf="portfolioItems.length > 0">
              <mat-card *ngFor="let item of portfolioItems; trackBy: trackByFn" class="portfolio-card">
                <mat-card-header>
                  <mat-card-title>{{ item.title }}</mat-card-title>
                  <mat-card-subtitle>{{ item.category }}</mat-card-subtitle>
                </mat-card-header>
                <img mat-card-image [src]="item.featuredImage" [alt]="item.title" *ngIf="item.featuredImage">
                <mat-card-content>
                  <p>{{ item.description }}</p>
                  <p><strong>Status:</strong> {{ item.published ? 'Published' : 'Draft' }}</p>
                  <p><strong>Order:</strong> {{ item.order }}</p>
                  <p><strong>Galleries:</strong> {{ item.galleries?.length || 0 }}</p>
                  <p><strong>Total Pictures:</strong> {{ getTotalPicturesCount(item) }}</p>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-button (click)="editPortfolioItem(item)">
                    <mat-icon>edit</mat-icon>
                    Edit
                  </button>
                  <button mat-button color="warn" (click)="deletePortfolioItem(item.id!)">
                    <mat-icon>delete</mat-icon>
                    Delete
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>
            
            <div class="empty-state" *ngIf="portfolioItems.length === 0">
              <mat-icon>photo_library</mat-icon>
              <h3>No portfolio items yet</h3>
              <p>Create your first portfolio item to get started</p>
              <button mat-raised-button color="primary" (click)="addNewPortfolioItem()">
                Add Portfolio Item
              </button>
            </div>
          </div>
        </mat-tab>
        
        <mat-tab label="About">
          <div class="tab-content">
            <div class="tab-header">
              <h2>About Page Management</h2>
              <button mat-raised-button color="primary" (click)="addNewAboutSection()">
                <mat-icon>add</mat-icon>
                Add New Section
              </button>
            </div>
            
            <div class="about-sections" *ngIf="aboutSections.length > 0">
              <mat-card *ngFor="let section of aboutSections; trackBy: trackByFn" class="about-card">
                <mat-card-header>
                  <mat-card-title>{{ section.title }}</mat-card-title>
                  <mat-card-subtitle>Order: {{ section.order }}</mat-card-subtitle>
                </mat-card-header>
                <img mat-card-image [src]="section.image" [alt]="section.title" *ngIf="section.image">
                <mat-card-content>
                  <div [innerHTML]="section.content"></div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-button (click)="editAboutSection(section)">
                    <mat-icon>edit</mat-icon>
                    Edit
                  </button>
                  <button mat-button color="warn" (click)="deleteAboutSection(section.id!)">
                    <mat-icon>delete</mat-icon>
                    Delete
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>
            
            <div class="empty-state" *ngIf="aboutSections.length === 0">
              <mat-icon>info</mat-icon>
              <h3>No about sections yet</h3>
              <p>Create your first about section to get started</p>
              <button mat-raised-button color="primary" (click)="addNewAboutSection()">
                Add About Section
              </button>
            </div>
          </div>
        </mat-tab>
        
        <mat-tab label="Contact">
          <div class="tab-content">
            <div class="tab-header">
              <h2>Contact Information</h2>
              <button mat-raised-button color="primary" (click)="editContactInfo()">
                <mat-icon>edit</mat-icon>
                Edit Contact Info
              </button>
            </div>
            
            <mat-card class="contact-card" *ngIf="contactInfo">
              <mat-card-header>
                <mat-card-title>Contact Information</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p><strong>Email:</strong> {{ contactInfo.email }}</p>
                <p><strong>Phone:</strong> {{ contactInfo.phone }}</p>
                <p><strong>Address:</strong></p>
                <pre>{{ contactInfo.address }}</pre>
                <div *ngIf="contactInfo.socialMedia">
                  <p><strong>Social Media:</strong></p>
                  <p>Instagram: {{ contactInfo.socialMedia.instagram }}</p>
                  <p>LinkedIn: {{ contactInfo.socialMedia.linkedin }}</p>
                  <p>Twitter: {{ contactInfo.socialMedia.twitter }}</p>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button (click)="editContactInfo()">
                  <mat-icon>edit</mat-icon>
                  Edit
                </button>
              </mat-card-actions>
            </mat-card>
            
            <div class="empty-state" *ngIf="!contactInfo">
              <mat-icon>contact_mail</mat-icon>
              <h3>No contact information yet</h3>
              <p>Set up your contact information</p>
              <button mat-raised-button color="primary" (click)="editContactInfo()">
                Add Contact Info
              </button>
            </div>
          </div>
        </mat-tab>
        
        <mat-tab label="Settings">
          <div class="tab-content">
            <div class="tab-header">
              <h2>Site Settings</h2>
              <button mat-raised-button color="primary" (click)="editSiteSettings()">
                <mat-icon>settings</mat-icon>
                Edit Settings
              </button>
            </div>
            
            <mat-card class="settings-card" *ngIf="siteSettings">
              <mat-card-header>
                <mat-card-title>Site Configuration</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p><strong>Site Name:</strong> {{ siteSettings.siteName }}</p>
                <p><strong>Description:</strong> {{ siteSettings.siteDescription }}</p>
                <p><strong>Contact Email:</strong> {{ siteSettings.contactEmail }}</p>
                <p><strong>Keywords:</strong> {{ siteSettings.siteKeywords?.join(', ') || 'None set' }}</p>
                <p><strong>Analytics:</strong> {{ siteSettings.enableAnalytics ? 'Enabled' : 'Disabled' }}</p>
                <p><strong>Last Updated:</strong> {{ siteSettings.updatedAt ? (siteSettings.updatedAt | date:'medium') : 'Never' }}</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button (click)="editSiteSettings()">
                  <mat-icon>edit</mat-icon>
                  Edit Settings
                </button>
              </mat-card-actions>
            </mat-card>
            
            <div class="empty-state" *ngIf="!siteSettings">
              <mat-icon>settings</mat-icon>
              <h3>No site settings configured</h3>
              <p>Configure your site settings to customize branding and SEO</p>
              <button mat-raised-button color="primary" (click)="editSiteSettings()">
                Configure Settings
              </button>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
      
      <div class="loading-overlay" *ngIf="loading">
        <mat-spinner></mat-spinner>
        <p>Loading...</p>
      </div>
    </div>
  `,
  styles: [`
    .cms-wrapper {
      width: 100%;
      min-height: 100vh;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background: #f5f5f5;
    }
    
    .cms-header {
      background: #fff;
      padding: 2rem;
      border-bottom: 1px solid #eee;
      text-align: center;
    }
    
    .cms-header h1 {
      font-size: 2.5rem;
      font-weight: 300;
      margin: 0 0 0.5rem 0;
      color: #000;
    }
    
    .cms-header p {
      color: #666;
      margin: 0;
    }
    
    .cms-tabs {
      background: #fff;
    }
    
    .tab-content {
      padding: 2rem;
      min-height: 60vh;
    }
    
    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #eee;
    }
    
    .tab-header h2 {
      font-size: 1.5rem;
      font-weight: 400;
      margin: 0;
      color: #333;
    }
    
    .portfolio-grid, .about-sections {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
    }
    
    .portfolio-card, .about-card, .contact-card, .settings-card {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.3s ease;
    }
    
    .portfolio-card:hover, .about-card:hover {
      transform: translateY(-2px);
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }
    
    .empty-state mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: #ccc;
      margin-bottom: 1rem;
    }
    
    .empty-state h3 {
      font-size: 1.5rem;
      font-weight: 400;
      margin: 0 0 0.5rem 0;
    }
    
    .empty-state p {
      margin: 0 0 2rem 0;
    }
    
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255,255,255,0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .loading-overlay p {
      margin-top: 1rem;
      color: #666;
    }
    
    @media (max-width: 768px) {
      .tab-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      
      .portfolio-grid, .about-sections {
        grid-template-columns: 1fr;
      }
      
      .cms-header {
        padding: 1rem;
      }
      
      .tab-content {
        padding: 1rem;
      }
    }
  `]
})
export class CMSComponent implements OnInit {
  loading = false;
  portfolioItems: any[] = [];
  aboutSections: any[] = [];
  contactInfo: any = null;
  siteSettings: any = null;
  
  constructor(
    private portfolioService: PortfolioService,
    private aboutService: AboutService,
    private contactService: ContactService,
    private settingsService: SettingsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadData();
  }
  
  private loadData() {
    console.log('Loading CMS data...');
    this.loading = true;
    
    // Load ALL portfolio items (not just published ones) for admin interface
    this.portfolioService.getAllPortfolio().subscribe({
      next: (items) => {
        console.log('Loaded portfolio items count:', items.length);
        console.log('Portfolio items detail:', items);
        items.forEach((item, index) => {
          console.log(`Item ${index}:`, {
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            published: item.published
          });
        });
        this.portfolioItems = items;
        console.log('CMS portfolioItems array updated:', this.portfolioItems);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading portfolio items:', error);
        this.loading = false;
      }
    });
    
    // Load about sections
    this.aboutService.getAboutSections().subscribe({
      next: (sections) => {
        console.log('Loaded about sections:', sections);
        this.aboutSections = sections;
      },
      error: (error) => {
        console.error('Error loading about sections:', error);
      }
    });
    
    // Load contact info
    this.contactService.getContactInfo().subscribe({
      next: (contactArray) => {
        console.log('Loaded contact info:', contactArray);
        this.contactInfo = contactArray.length > 0 ? contactArray[0] : null;
      },
      error: (error) => {
        console.error('Error loading contact info:', error);
      }
    });
    
    // Load site settings
    this.settingsService.getSiteSettings().subscribe({
      next: (settings) => {
        console.log('Loaded site settings:', settings);
        this.siteSettings = settings;
      },
      error: (error) => {
        console.error('Error loading site settings:', error);
      }
    });
  }

  onTabChange(event: any) {
    console.log('Tab changed to:', event.index);
  }

  trackByFn(index: number, item: any) {
    return item.id || index;
  }

  getTotalPicturesCount(item: any): number {
    if (!item.galleries) return 0;
    return item.galleries.reduce((total: number, gallery: any) => {
      return total + (gallery.pictures ? gallery.pictures.length : 0);
    }, 0);
  }

  // Portfolio methods
  addNewPortfolioItem() {
    const dialogRef = this.dialog.open(PortfolioEditAdvancedDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { item: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData(); // Reload data after successful save
        this.snackBar.open('Portfolio item created successfully', 'Close', { duration: 3000 });
      }
    });
  }

  editPortfolioItem(item: any) {
    const dialogRef = this.dialog.open(PortfolioEditAdvancedDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { item: item }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData(); // Reload data after successful save
      }
    });
  }

  async deletePortfolioItem(id: string) {
    if (confirm('Are you sure you want to delete this portfolio item?')) {
      try {
        await this.portfolioService.deletePortfolioItem(id);
        this.loadData(); // Reload data after deletion
        this.snackBar.open('Portfolio item deleted successfully', 'Close', { duration: 3000 });
      } catch (error) {
        console.error('Error deleting portfolio item:', error);
        this.snackBar.open('Error deleting portfolio item', 'Close', { duration: 5000 });
      }
    }
  }

  // About methods
  addNewAboutSection() {
    const dialogRef = this.dialog.open(AboutEditDialogComponent, {
      width: '700px',
      data: { section: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData(); // Reload data after successful save
        this.snackBar.open('About section created successfully', 'Close', { duration: 3000 });
      }
    });
  }

  editAboutSection(section: any) {
    const dialogRef = this.dialog.open(AboutEditDialogComponent, {
      width: '700px',
      data: { section: section }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData(); // Reload data after successful save
      }
    });
  }

  async deleteAboutSection(id: string) {
    if (confirm('Are you sure you want to delete this about section?')) {
      try {
        await this.aboutService.deleteAboutSection(id);
        this.loadData(); // Reload data after deletion
        this.snackBar.open('About section deleted successfully', 'Close', { duration: 3000 });
      } catch (error) {
        console.error('Error deleting about section:', error);
        this.snackBar.open('Error deleting about section', 'Close', { duration: 5000 });
      }
    }
  }

  // Contact methods
  editContactInfo() {
    const dialogRef = this.dialog.open(ContactEditDialogComponent, {
      width: '600px',
      data: { contactInfo: this.contactInfo }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData(); // Reload data after successful save
      }
    });
  }

  // Settings methods
  editSiteSettings() {
    const dialogRef = this.dialog.open(SettingsEditDialogComponent, {
      width: '800px',
      data: { settings: this.siteSettings }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData(); // Reload data after successful save
        this.snackBar.open('Site settings updated successfully', 'Close', { duration: 3000 });
      }
    });
  }
}