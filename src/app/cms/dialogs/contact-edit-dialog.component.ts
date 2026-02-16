import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { ContactService } from '../../services/contact.service';
import { NotificationService } from '../../services/notification.service';
import { BaseEditDialogComponent } from './base-edit-dialog.component';

export interface ContactInfo {
  id?: string;
  email: string;
  phone: string;
  address: string;
  socialMedia: {
    instagram: string;
    linkedin: string;
    twitter: string;
  };
}

@Component({
  selector: 'app-contact-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Edit Contact Information</h2>
      
      <mat-dialog-content>
        <form [formGroup]="form" class="contact-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" placeholder="contact@example.com">
            <mat-error *ngIf="form.get('email')?.hasError('required')">
              Email is required
            </mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('email')">
              Please enter a valid email
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Phone</mat-label>
            <input matInput formControlName="phone" placeholder="+1 (555) 123-4567">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Address</mat-label>
            <textarea matInput formControlName="address" rows="3" 
              placeholder="123 Design Street&#10;Zurich, Switzerland&#10;8001"></textarea>
          </mat-form-field>

          <div class="social-media-section">
            <h3>Social Media</h3>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Instagram</mat-label>
              <input matInput formControlName="instagram" placeholder="@yourbrand">
              <mat-hint>Enter username (with or without &#64;)</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>LinkedIn</mat-label>
              <input matInput formControlName="linkedin" placeholder="your-company">
              <mat-hint>Enter LinkedIn profile or company name</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Twitter</mat-label>
              <input matInput formControlName="twitter" placeholder="@yourbrand">
              <mat-hint>Enter username (with or without &#64;)</mat-hint>
            </mat-form-field>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" 
                (click)="onSave()" 
                [disabled]="form.invalid || saving">
          <mat-icon *ngIf="saving">hourglass_empty</mat-icon>
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 100%;
    }
    
    .contact-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem 0;
    }
    
    .full-width {
      width: 100%;
    }
    
    .social-media-section {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }
    
    .social-media-section h3 {
      font-size: 1rem;
      font-weight: 500;
      margin: 0 0 1rem 0;
      color: #333;
    }
    
    mat-dialog-actions {
      padding: 1rem 0 0 0;
    }
  `]
})
export class ContactEditDialogComponent extends BaseEditDialogComponent<{ contactInfo?: ContactInfo }, ContactInfo> implements OnInit {
  constructor(
    fb: FormBuilder,
    notify: NotificationService,
    dialogRef: MatDialogRef<ContactEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: { contactInfo?: ContactInfo },
    private contactService: ContactService
  ) {
    super(fb, notify, dialogRef, data, 'contact information');
  }

  protected override checkIsEdit(data: { contactInfo?: ContactInfo }): boolean {
    return !!data?.contactInfo;
  }

  ngOnInit() {
    if (this.data.contactInfo) {
      this.form.patchValue({
        email: this.data.contactInfo.email || '',
        phone: this.data.contactInfo.phone || '',
        address: this.data.contactInfo.address || '',
        instagram: this.data.contactInfo.socialMedia?.instagram || '',
        linkedin: this.data.contactInfo.socialMedia?.linkedin || '',
        twitter: this.data.contactInfo.socialMedia?.twitter || ''
      });
    }
  }

  protected createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      instagram: [''],
      linkedin: [''],
      twitter: ['']
    });
  }

  protected buildEntity(): ContactInfo {
    const v = this.form.value;
    return {
      email: v.email,
      phone: v.phone,
      address: v.address,
      socialMedia: { instagram: v.instagram, linkedin: v.linkedin, twitter: v.twitter }
    };
  }

  protected async saveEntity(entity: ContactInfo): Promise<void> {
    await this.contactService.updateContactInfo(entity);
    this.notify.updated('Contact information');
  }
}