import { Component, OnInit, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PortfolioService } from '../../services/portfolio.service';
import { NotificationService } from '../../services/notification.service';
import { PortfolioEditAdvancedDialogComponent } from '../dialogs/portfolio-edit-advanced-dialog.component';
import { ResolveStorageUrlPipe } from '../../pipes/resolve-storage-url.pipe';

@Component({
  selector: 'cms-portfolio-tab',
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
        <h2>Portfolio Management</h2>
        <button mat-raised-button color="primary" (click)="addNew()">
          <mat-icon>add</mat-icon>
          Add New Portfolio Item
        </button>
      </div>

      <div class="portfolio-grid" *ngIf="items.length > 0">
        <mat-card *ngFor="let item of items; trackBy: trackByFn" class="portfolio-card">
          <mat-card-header>
            <mat-card-title>{{ item.title }}</mat-card-title>
            <mat-card-subtitle>{{ item.category }}</mat-card-subtitle>
          </mat-card-header>
          <img mat-card-image [src]="item.featuredImage | resolveStorageUrl | async" [alt]="item.title" *ngIf="item.featuredImage" loading="lazy">
          <mat-card-content>
            <p>{{ item.description }}</p>
            <p><strong>Status:</strong> {{ item.published ? 'Published' : 'Draft' }}</p>
            <p><strong>Order:</strong> {{ item.order }}</p>
            <p><strong>Galleries:</strong> {{ item.galleries?.length || 0 }}</p>
            <p><strong>Total Pictures:</strong> {{ getTotalPicturesCount(item) }}</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button (click)="edit(item)">
              <mat-icon>edit</mat-icon>
              Edit
            </button>
            <button mat-button color="warn" (click)="delete(item.id!)">
              <mat-icon>delete</mat-icon>
              Delete
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <div class="empty-state" *ngIf="items.length === 0">
        <mat-icon>photo_library</mat-icon>
        <h3>No portfolio items yet</h3>
        <p>Create your first portfolio item to get started</p>
        <button mat-raised-button color="primary" (click)="addNew()">
          Add Portfolio Item
        </button>
      </div>
    </div>
  `
})
export class CmsPortfolioTabComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  items: any[] = [];

  constructor(
    private portfolioService: PortfolioService,
    private dialog: MatDialog,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.portfolioService.getAllPortfolio().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => { this.items = items; this.cdr.markForCheck(); },
      error: () => {}
    });
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

  addNew() {
    const dialogRef = this.dialog.open(PortfolioEditAdvancedDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { item: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
        this.notify.created('Portfolio item');
      }
    });
  }

  edit(item: any) {
    const dialogRef = this.dialog.open(PortfolioEditAdvancedDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { item }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  async delete(id: string) {
    if (confirm('Are you sure you want to delete this portfolio item?')) {
      try {
        await this.portfolioService.deletePortfolioItem(id);
        this.loadData();
        this.notify.deleted('Portfolio item');
      } catch (error) {
        this.notify.deleteError('portfolio item');
      }
    }
  }
}
