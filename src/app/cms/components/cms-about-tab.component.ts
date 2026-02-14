import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AboutService } from '../../services/about.service';
import { AboutEditDialogComponent } from '../dialogs/about-edit-dialog.component';
import { ResolveStorageUrlPipe } from '../../pipes/resolve-storage-url.pipe';

@Component({
  selector: 'cms-about-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    ResolveStorageUrlPipe
  ],
  styleUrls: ['../styles/cms-shared.scss'],
  template: `
    <div class="tab-content">
      <div class="tab-header">
        <h2>About Page Management</h2>
        <button mat-raised-button color="primary" (click)="addNew()">
          <mat-icon>add</mat-icon>
          Add New Section
        </button>
      </div>

      <div class="about-sections" *ngIf="sections.length > 0">
        <mat-card *ngFor="let section of sections; trackBy: trackByFn" class="about-card">
          <mat-card-header>
            <mat-card-title>{{ section.title }}</mat-card-title>
            <mat-card-subtitle>Order: {{ section.order }}</mat-card-subtitle>
          </mat-card-header>
          <img mat-card-image [src]="section.image | resolveStorageUrl | async" [alt]="section.title" *ngIf="section.image" loading="lazy">
          <mat-card-content>
            <div [innerHTML]="sanitizeHtml(section.content)"></div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button (click)="edit(section)">
              <mat-icon>edit</mat-icon>
              Edit
            </button>
            <button mat-button color="warn" (click)="delete(section.id!)">
              <mat-icon>delete</mat-icon>
              Delete
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <div class="empty-state" *ngIf="sections.length === 0">
        <mat-icon>info</mat-icon>
        <h3>No about sections yet</h3>
        <p>Create your first about section to get started</p>
        <button mat-raised-button color="primary" (click)="addNew()">
          Add About Section
        </button>
      </div>
    </div>
  `
})
export class CmsAboutTabComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  sections: any[] = [];

  constructor(
    private aboutService: AboutService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.aboutService.getAboutSections().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (sections) => this.sections = sections,
      error: () => {}
    });
  }

  trackByFn(index: number, item: any) {
    return item.id || index;
  }

  sanitizeHtml(content: string): SafeHtml {
    if (!content) return '';
    const cleaned = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');
    return this.sanitizer.bypassSecurityTrustHtml(cleaned);
  }

  addNew() {
    const dialogRef = this.dialog.open(AboutEditDialogComponent, {
      width: '700px',
      data: { section: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
        this.snackBar.open('About section created successfully', 'Close', { duration: 3000 });
      }
    });
  }

  edit(section: any) {
    const dialogRef = this.dialog.open(AboutEditDialogComponent, {
      width: '700px',
      data: { section }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  async delete(id: string) {
    if (confirm('Are you sure you want to delete this about section?')) {
      try {
        await this.aboutService.deleteAboutSection(id);
        this.loadData();
        this.snackBar.open('About section deleted successfully', 'Close', { duration: 3000 });
      } catch (error) {
        this.snackBar.open('Error deleting about section', 'Close', { duration: 5000 });
      }
    }
  }
}
