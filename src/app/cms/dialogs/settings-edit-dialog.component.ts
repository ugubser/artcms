import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { SettingsService, SiteSettings } from '../../services/settings.service';
import { NotificationService } from '../../services/notification.service';
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
    MatTabsModule,
    MatChipsModule,
    ImageUploadComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-edit-dialog.component.html',
  styleUrl: './settings-edit-dialog.component.scss'
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
    private notify: NotificationService,
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
      }),
      // Artist information fields
      artistName: [''],
      artistAlternateName: [''],
      artistBirthPlace: [''],
      artistNationality: [''],
      artistPortraitUrl: [''],
      artistBiography: ['']
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
      },
      // Artist information
      artistName: settings.artistName || '',
      artistAlternateName: settings.artistAlternateName || '',
      artistBirthPlace: settings.artistBirthPlace || '',
      artistNationality: settings.artistNationality || '',
      artistPortraitUrl: settings.artistPortraitUrl || '',
      artistBiography: settings.artistBiography || ''
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
      socialMedia: formValue.socialMedia,
      // Artist information
      artistName: formValue.artistName,
      artistAlternateName: formValue.artistAlternateName,
      artistBirthPlace: formValue.artistBirthPlace,
      artistNationality: formValue.artistNationality,
      artistPortraitUrl: formValue.artistPortraitUrl,
      artistBiography: formValue.artistBiography
    };

    try {
      await this.settingsService.updateSiteSettings(settingsData);
      this.notify.updated('Site settings');
      this.dialogRef.close(true);
    } catch (error) {
      this.notify.saveError('settings', error);
    } finally {
      this.saving = false;
    }
  }
}