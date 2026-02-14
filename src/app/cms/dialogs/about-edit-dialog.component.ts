import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { AboutService } from '../../services/about.service';
import { NotificationService } from '../../services/notification.service';
import { ImageUploadComponent } from '../components/image-upload.component';
import { BaseEditDialogComponent } from './base-edit-dialog.component';

export interface AboutSection {
  id?: string;
  title: string;
  content: string;
  image: string;
  order: number;
}

@Component({
  selector: 'app-about-edit-dialog',
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
    ImageUploadComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>{{ isEdit ? 'Edit' : 'Add' }} About Section</h2>
      
      <mat-dialog-content>
        <form [formGroup]="form" class="about-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Section Title</mat-label>
            <input matInput formControlName="title" placeholder="About the Artist">
            <mat-error *ngIf="form.get('title')?.hasError('required')">
              Title is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Content</mat-label>
            <textarea matInput formControlName="content" rows="8" 
              placeholder="Write about yourself, your work, or your philosophy...&#10;&#10;You can use **markdown** formatting:&#10;- **bold text**&#10;- *italic text*&#10;- # Headings&#10;- [links](http://example.com)"></textarea>
            <mat-hint>Supports Markdown formatting</mat-hint>
          </mat-form-field>

          <div class="image-section">
            <h3>Section Image</h3>
            <app-image-upload
              [currentImageUrl]="currentImage"
              [storagePath]="'about'"
              [alt]="form.get('title')?.value || 'About section image'"
              [maxSizeMB]="3"
              [recommendedSize]="'600x400px'"
              [allowUrlInput]="true"
              (imageUploaded)="onImageUploaded($event)"
              (imageRemoved)="onImageRemoved()">
            </app-image-upload>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Display Order</mat-label>
            <input matInput type="number" formControlName="order" placeholder="0">
            <mat-hint>Lower numbers appear first</mat-hint>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" 
                (click)="onSave()" 
                [disabled]="form.invalid || saving">
          <mat-icon *ngIf="saving">hourglass_empty</mat-icon>
          {{ saving ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 600px;
      max-width: 90vw;
    }
    
    .about-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem 0;
    }
    
    .full-width {
      width: 100%;
    }
    
    .image-section {
      margin: 1rem 0;
    }
    
    .image-section h3 {
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
export class AboutEditDialogComponent extends BaseEditDialogComponent<{ section?: AboutSection }, AboutSection> implements OnInit {
  currentImage: string | null = null;

  constructor(
    fb: FormBuilder,
    notify: NotificationService,
    dialogRef: MatDialogRef<AboutEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: { section?: AboutSection },
    private aboutService: AboutService
  ) {
    super(fb, notify, dialogRef, data, 'about section');
  }

  protected override checkIsEdit(data: { section?: AboutSection }): boolean {
    return !!data?.section;
  }

  ngOnInit() {
    if (this.isEdit && this.data.section) {
      this.form.patchValue({
        title: this.data.section.title,
        content: this.data.section.content,
        order: this.data.section.order || 0
      });
      this.currentImage = this.data.section.image || null;
    }
  }

  protected createForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      content: [''],
      order: [0]
    });
  }

  protected buildEntity(): AboutSection {
    const v = this.form.value;
    return { title: v.title, content: v.content, image: this.currentImage || '', order: v.order };
  }

  protected async saveEntity(entity: AboutSection): Promise<void> {
    if (this.isEdit && this.data.section?.id) {
      await this.aboutService.updateAboutSection(this.data.section.id, entity);
      this.notify.updated('About section');
    } else {
      await this.aboutService.createAboutSection(entity);
      this.notify.created('About section');
    }
  }

  onImageUploaded(imageUrl: string) {
    this.currentImage = imageUrl;
  }

  onImageRemoved() {
    this.currentImage = null;
  }
}