import { Component, OnInit, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PortfolioPagesService } from '../../services/portfolio-pages.service';
import { NotificationService } from '../../services/notification.service';
import { PortfolioPagesEditDialogComponent } from '../dialogs/portfolio-pages-edit-dialog.component';
import { ResolveStorageUrlPipe } from '../../pipes/resolve-storage-url.pipe';

@Component({
  selector: 'cms-portfolio-pages-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    ResolveStorageUrlPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../styles/cms-shared.scss'],
  template: `
    <div class="tab-content">
      <div class="tab-header">
        <h2>Portfolio Pages Management</h2>
        <button mat-raised-button color="primary" (click)="addNew()">
          <mat-icon>add</mat-icon>
          Add New Portfolio Page
        </button>
      </div>

      <div class="portfolio-pages-grid" *ngIf="pages.length > 0">
        <mat-card *ngFor="let page of pages; trackBy: trackByFn" class="portfolio-page-card">
          <mat-card-header>
            <mat-card-title>{{ page.title }}</mat-card-title>
            <mat-card-subtitle>{{ page.slug }}</mat-card-subtitle>
          </mat-card-header>
          <img mat-card-image [src]="page.featuredImage | resolveStorageUrl | async" [alt]="page.title" *ngIf="page.featuredImage" loading="lazy">
          <mat-card-content>
            <p>{{ page.excerpt }}</p>
            <p><strong>Status:</strong> {{ page.published ? 'Published' : 'Draft' }}</p>
            <p><strong>Order:</strong> {{ page.order }}</p>
            <p><strong>Last Updated:</strong> {{ page.updatedAt ? (page.updatedAt | date:'medium') : 'Never' }}</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button (click)="edit(page)">
              <mat-icon>edit</mat-icon>
              Edit
            </button>
            <button mat-button color="warn" (click)="delete(page.id!)">
              <mat-icon>delete</mat-icon>
              Delete
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <div class="empty-state" *ngIf="pages.length === 0">
        <mat-icon>web</mat-icon>
        <h3>No portfolio pages yet</h3>
        <p>Create your first portfolio page to get started</p>
        <button mat-raised-button color="primary" (click)="addNew()">
          Add Portfolio Page
        </button>
      </div>
    </div>
  `
})
export class CmsPortfolioPagesTabComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  pages: any[] = [];

  constructor(
    private portfolioPagesService: PortfolioPagesService,
    private dialog: MatDialog,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.portfolioPagesService.getPortfolioPages().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (pages) => { this.pages = pages; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  trackByFn(index: number, item: any) {
    return item.id || index;
  }

  addNew() {
    const dialogRef = this.dialog.open(PortfolioPagesEditDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { page: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
        this.notify.created('Portfolio page');
      }
    });
  }

  edit(page: any) {
    const dialogRef = this.dialog.open(PortfolioPagesEditDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { page }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  async delete(id: string) {
    if (confirm('Are you sure you want to delete this portfolio page?')) {
      try {
        await this.portfolioPagesService.deletePortfolioPage(id);
        this.loadData();
        this.notify.deleted('Portfolio page');
      } catch (error) {
        this.notify.deleteError('portfolio page');
      }
    }
  }
}
