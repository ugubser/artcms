import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ContactService } from '../../services/contact.service';

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
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Edit Contact Information</h2>
      
      <mat-dialog-content>
        <form [formGroup]="contactForm" class="contact-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" placeholder="contact@tribecaconcepts.com">
            <mat-error *ngIf="contactForm.get('email')?.hasError('required')">
              Email is required
            </mat-error>
            <mat-error *ngIf="contactForm.get('email')?.hasError('email')">
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
              <input matInput formControlName="instagram" placeholder="@tribecaconcepts">
              <mat-hint>Enter username (with or without &#64;)</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>LinkedIn</mat-label>
              <input matInput formControlName="linkedin" placeholder="tribeca-concepts">
              <mat-hint>Enter LinkedIn profile or company name</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Twitter</mat-label>
              <input matInput formControlName="twitter" placeholder="@tribecaconcepts">
              <mat-hint>Enter username (with or without &#64;)</mat-hint>
            </mat-form-field>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" 
                (click)="onSave()" 
                [disabled]="contactForm.invalid || saving">
          <mat-icon *ngIf="saving">hourglass_empty</mat-icon>
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 500px;
      max-width: 90vw;
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
export class ContactEditDialogComponent implements OnInit {
  contactForm: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<ContactEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { contactInfo?: ContactInfo }
  ) {
    this.contactForm = this.createForm();
  }

  ngOnInit() {
    if (this.data.contactInfo) {
      this.populateForm(this.data.contactInfo);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      instagram: [''],
      linkedin: [''],
      twitter: ['']
    });
  }

  private populateForm(contactInfo: ContactInfo) {
    this.contactForm.patchValue({
      email: contactInfo.email || '',
      phone: contactInfo.phone || '',
      address: contactInfo.address || '',
      instagram: contactInfo.socialMedia?.instagram || '',
      linkedin: contactInfo.socialMedia?.linkedin || '',
      twitter: contactInfo.socialMedia?.twitter || ''
    });
  }

  onCancel() {
    this.dialogRef.close();
  }

  async onSave() {
    if (this.contactForm.invalid) {
      return;
    }

    this.saving = true;
    const formValue = this.contactForm.value;
    
    const contactInfo: ContactInfo = {
      email: formValue.email,
      phone: formValue.phone,
      address: formValue.address,
      socialMedia: {
        instagram: formValue.instagram,
        linkedin: formValue.linkedin,
        twitter: formValue.twitter
      }
    };

    try {
      await this.contactService.updateContactInfo(contactInfo);
      this.snackBar.open('Contact information updated successfully', 'Close', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error saving contact info:', error);
      this.snackBar.open('Error saving contact information. Please try again.', 'Close', { duration: 5000 });
    } finally {
      this.saving = false;
    }
  }
}