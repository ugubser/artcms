import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { SettingsService, SiteSettings } from '../../services/settings.service';
import { ImageUploadComponent } from '../components/image-upload.component';

@Component({
  selector: 'app-settings-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatIconModule,
    MatSnackBarModule,
    MatTabsModule,
    MatChipsModule,
    ImageUploadComponent
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Site Settings</h2>
      
      <mat-dialog-content>
        <mat-tab-group class="settings-tabs">
          <mat-tab label="General">
            <div class="tab-content">
              <form [formGroup]="settingsForm" class="settings-form">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Site Name</mat-label>
                  <input matInput formControlName="siteName" placeholder="Tribeca Concepts">
                  <mat-error *ngIf="settingsForm.get('siteName')?.hasError('required')">
                    Site name is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Site Description</mat-label>
                  <textarea matInput formControlName="siteDescription" rows="3" 
                           placeholder="A brief description of your site"></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Contact Email</mat-label>
                  <input matInput type="email" formControlName="contactEmail" 
                         placeholder="info@example.com">
                  <mat-error *ngIf="settingsForm.get('contactEmail')?.hasError('email')">
                    Please enter a valid email
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Footer Text</mat-label>
                  <input matInput formControlName="footerText" 
                         placeholder="© 2024 by TribecaConcepts">
                </mat-form-field>
              </form>
            </div>
          </mat-tab>

          <mat-tab label="SEO & Keywords">
            <div class="tab-content">
              <form [formGroup]="settingsForm" class="settings-form">
                <div class="keywords-section">
                  <h3>SEO Keywords</h3>
                  <div class="keywords-input">
                    <mat-form-field appearance="outline" class="keyword-input">
                      <mat-label>Add Keyword</mat-label>
                      <input matInput [(ngModel)]="newKeyword" [ngModelOptions]="{standalone: true}"
                             (keyup.enter)="addKeyword()" placeholder="Enter keyword">
                    </mat-form-field>
                    <button mat-raised-button type="button" (click)="addKeyword()" 
                            [disabled]="!newKeyword || !newKeyword.trim()">
                      <mat-icon>add</mat-icon>
                      Add
                    </button>
                  </div>
                  
                  <div class="keywords-chips" *ngIf="keywords.length > 0">
                    <mat-chip-set>
                      <mat-chip *ngFor="let keyword of keywords; let i = index" 
                               (removed)="removeKeyword(i)">
                        {{ keyword }}
                        <button matChipRemove>
                          <mat-icon>cancel</mat-icon>
                        </button>
                      </mat-chip>
                    </mat-chip-set>
                  </div>
                </div>

                <div class="analytics-section">
                  <h3>Analytics</h3>
                  <div class="checkbox-field">
                    <mat-checkbox formControlName="enableAnalytics">
                      Enable Google Analytics
                    </mat-checkbox>
                  </div>
                  
                  <mat-form-field appearance="outline" class="full-width" 
                                 *ngIf="settingsForm.get('enableAnalytics')?.value">
                    <mat-label>Analytics ID</mat-label>
                    <input matInput formControlName="analyticsId" 
                           placeholder="G-XXXXXXXXXX">
                    <mat-hint>Your Google Analytics tracking ID</mat-hint>
                  </mat-form-field>
                </div>
              </form>
            </div>
          </mat-tab>

          <mat-tab label="Branding">
            <div class="tab-content">
              <div class="branding-section">
                <h3>Logo</h3>
                <app-image-upload
                  [currentImageUrl]="currentLogoUrl"
                  [storagePath]="'branding/logo'"
                  [alt]="'Site logo'"
                  [maxSizeMB]="2"
                  [recommendedSize]="'200x60px'"
                  [allowUrlInput]="true"
                  (imageUploaded)="onLogoUploaded($event)"
                  (imageRemoved)="onLogoRemoved()">
                </app-image-upload>
              </div>

              <div class="branding-section">
                <h3>Favicon</h3>
                <app-image-upload
                  [currentImageUrl]="currentFaviconUrl"
                  [storagePath]="'branding/favicon'"
                  [alt]="'Site favicon'"
                  [maxSizeMB]="1"
                  [recommendedSize]="'32x32px'"
                  [allowUrlInput]="true"
                  (imageUploaded)="onFaviconUploaded($event)"
                  (imageRemoved)="onFaviconRemoved()">
                </app-image-upload>
              </div>

              <form [formGroup]="settingsForm" class="settings-form">
                <div class="color-section">
                  <h3>Brand Colors</h3>
                  <div class="color-inputs">
                    <mat-form-field appearance="outline">
                      <mat-label>Primary Color</mat-label>
                      <input matInput type="color" formControlName="primaryColor">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Secondary Color</mat-label>
                      <input matInput type="color" formControlName="secondaryColor">
                    </mat-form-field>
                  </div>
                </div>
              </form>
            </div>
          </mat-tab>

          <mat-tab label="Social Media">
            <div class="tab-content">
              <form [formGroup]="settingsForm" class="settings-form">
                <div formGroupName="socialMedia">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Facebook URL</mat-label>
                    <input matInput formControlName="facebook" 
                           placeholder="https://facebook.com/yourpage">
                    <mat-icon matPrefix>link</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Twitter URL</mat-label>
                    <input matInput formControlName="twitter" 
                           placeholder="https://twitter.com/youraccount">
                    <mat-icon matPrefix>link</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Instagram URL</mat-label>
                    <input matInput formControlName="instagram" 
                           placeholder="https://instagram.com/youraccount">
                    <mat-icon matPrefix>link</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>LinkedIn URL</mat-label>
                    <input matInput formControlName="linkedin" 
                           placeholder="https://linkedin.com/in/yourprofile">
                    <mat-icon matPrefix>link</mat-icon>
                  </mat-form-field>
                </div>
              </form>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" 
                (click)="onSave()" 
                [disabled]="settingsForm.invalid || saving">
          <mat-icon *ngIf="saving">hourglass_empty</mat-icon>
          {{ saving ? 'Saving...' : 'Save Settings' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 800px;
      max-width: 90vw;
      max-height: 80vh;
    }
    
    .settings-tabs {
      min-height: 500px;
    }
    
    .tab-content {
      padding: 1.5rem 1rem;
    }
    
    .settings-form {
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
    
    .keywords-section, .analytics-section, .branding-section, .color-section {
      margin-bottom: 2rem;
    }
    
    h3 {
      font-size: 1.1rem;
      font-weight: 500;
      margin: 0 0 1rem 0;
      color: #333;
      border-bottom: 1px solid #eee;
      padding-bottom: 0.5rem;
    }
    
    .keywords-input {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      margin-bottom: 1rem;
    }
    
    .keyword-input {
      flex: 1;
    }
    
    .keywords-chips {
      margin-top: 1rem;
    }
    
    .color-inputs {
      display: flex;
      gap: 1rem;
    }
    
    .color-inputs mat-form-field {
      flex: 1;
    }
    
    mat-dialog-actions {
      padding: 1rem 0 0 0;
    }
    
    mat-icon[matPrefix] {
      margin-right: 0.5rem;
      color: #666;
    }
  `]
})
export class SettingsEditDialogComponent implements OnInit {
  settingsForm: FormGroup;
  saving = false;
  keywords: string[] = [];
  newKeyword = '';
  currentLogoUrl: string | null = null;
  currentFaviconUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<SettingsEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { settings?: SiteSettings }
  ) {
    this.settingsForm = this.createForm();
  }

  ngOnInit() {
    if (this.data?.settings) {
      this.populateForm(this.data.settings);
    } else {
      // Load default settings
      const defaults = this.settingsService.getDefaultSettings();
      this.populateForm(defaults);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      siteName: ['', Validators.required],
      siteDescription: [''],
      contactEmail: ['', [Validators.email]],
      footerText: [''],
      enableAnalytics: [false],
      analyticsId: [''],
      primaryColor: ['#000000'],
      secondaryColor: ['#ffffff'],
      socialMedia: this.fb.group({
        facebook: [''],
        twitter: [''],
        instagram: [''],
        linkedin: ['']
      })
    });
  }

  private populateForm(settings: SiteSettings) {
    this.settingsForm.patchValue({
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      contactEmail: settings.contactEmail,
      footerText: settings.footerText,
      enableAnalytics: settings.enableAnalytics,
      analyticsId: settings.analyticsId,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      socialMedia: {
        facebook: settings.socialMedia?.facebook || '',
        twitter: settings.socialMedia?.twitter || '',
        instagram: settings.socialMedia?.instagram || '',
        linkedin: settings.socialMedia?.linkedin || ''
      }
    });
    
    this.keywords = settings.siteKeywords || [];
    this.currentLogoUrl = settings.logoUrl || null;
    this.currentFaviconUrl = settings.faviconUrl || null;
  }

  onCancel() {
    this.dialogRef.close();
  }

  // Keyword management
  addKeyword() {
    const keyword = this.newKeyword?.trim();
    if (keyword && !this.keywords.includes(keyword)) {
      this.keywords.push(keyword);
      this.newKeyword = '';
    }
  }

  removeKeyword(index: number) {
    this.keywords.splice(index, 1);
  }

  // Image handling
  onLogoUploaded(imageUrl: string) {
    this.currentLogoUrl = imageUrl;
  }

  onLogoRemoved() {
    this.currentLogoUrl = null;
  }

  onFaviconUploaded(imageUrl: string) {
    this.currentFaviconUrl = imageUrl;
  }

  onFaviconRemoved() {
    this.currentFaviconUrl = null;
  }

  async onSave() {
    if (this.settingsForm.invalid) {
      console.log('Form is invalid:', this.settingsForm.errors);
      return;
    }

    this.saving = true;
    const formValue = this.settingsForm.value;

    const settingsData: Partial<SiteSettings> = {
      siteName: formValue.siteName,
      siteDescription: formValue.siteDescription,
      siteKeywords: this.keywords,
      contactEmail: formValue.contactEmail,
      logoUrl: this.currentLogoUrl || '',
      faviconUrl: this.currentFaviconUrl || '',
      primaryColor: formValue.primaryColor,
      secondaryColor: formValue.secondaryColor,
      footerText: formValue.footerText,
      enableAnalytics: formValue.enableAnalytics,
      analyticsId: formValue.analyticsId,
      socialMedia: formValue.socialMedia
    };

    console.log('Saving settings:', settingsData);

    try {
      await this.settingsService.updateSiteSettings(settingsData);
      this.snackBar.open('Site settings updated successfully', 'Close', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error saving settings:', error);
      this.snackBar.open(`Error saving settings: ${error}`, 'Close', { duration: 5000 });
    } finally {
      this.saving = false;
    }
  }
}