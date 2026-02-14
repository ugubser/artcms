import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SettingsService } from '../../services/settings.service';
import { SettingsEditDialogComponent } from '../dialogs/settings-edit-dialog.component';

@Component({
  selector: 'cms-settings-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  styleUrls: ['../styles/cms-shared.scss'],
  template: `
    <div class="tab-content">
      <div class="tab-header">
        <h2>Site Settings</h2>
        <button mat-raised-button color="primary" (click)="edit()">
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
          <button mat-button (click)="edit()">
            <mat-icon>edit</mat-icon>
            Edit Settings
          </button>
        </mat-card-actions>
      </mat-card>

      <div class="empty-state" *ngIf="!siteSettings">
        <mat-icon>settings</mat-icon>
        <h3>No site settings configured</h3>
        <p>Configure your site settings to customize branding and SEO</p>
        <button mat-raised-button color="primary" (click)="edit()">
          Configure Settings
        </button>
      </div>
    </div>
  `
})
export class CmsSettingsTabComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  siteSettings: any = null;

  constructor(
    private settingsService: SettingsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.settingsService.getSiteSettings().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (settings) => this.siteSettings = settings,
      error: () => {}
    });
  }

  edit() {
    const dialogRef = this.dialog.open(SettingsEditDialogComponent, {
      width: '800px',
      data: { settings: this.siteSettings }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
        this.snackBar.open('Site settings updated successfully', 'Close', { duration: 3000 });
      }
    });
  }
}
