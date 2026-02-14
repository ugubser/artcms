import { Component, OnInit, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContactService } from '../../services/contact.service';
import { ContactEditDialogComponent } from '../dialogs/contact-edit-dialog.component';

@Component({
  selector: 'cms-contact-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../styles/cms-shared.scss'],
  template: `
    <div class="tab-content">
      <div class="tab-header">
        <h2>Contact Information</h2>
        <button mat-raised-button color="primary" (click)="edit()">
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
          <button mat-button (click)="edit()">
            <mat-icon>edit</mat-icon>
            Edit
          </button>
        </mat-card-actions>
      </mat-card>

      <div class="empty-state" *ngIf="!contactInfo">
        <mat-icon>contact_mail</mat-icon>
        <h3>No contact information yet</h3>
        <p>Set up your contact information</p>
        <button mat-raised-button color="primary" (click)="edit()">
          Add Contact Info
        </button>
      </div>
    </div>
  `
})
export class CmsContactTabComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  contactInfo: any = null;

  constructor(
    private contactService: ContactService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.contactService.getContactInfo().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (contactArray) => { this.contactInfo = contactArray.length > 0 ? contactArray[0] : null; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  edit() {
    const dialogRef = this.dialog.open(ContactEditDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { contactInfo: this.contactInfo }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }
}
