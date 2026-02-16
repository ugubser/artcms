import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, signal, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Admin Login</mat-card-title>
          <mat-card-subtitle>{{ siteName() }} CMS</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="login-content">
            <mat-icon class="login-icon">admin_panel_settings</mat-icon>
            <p>Please sign in with your authorized Google account to access the admin panel.</p>
            
            <div class="error-message" *ngIf="errorMessage">
              <mat-icon>error</mat-icon>
              {{ errorMessage }}
            </div>
          </div>
        </mat-card-content>
        
        <mat-card-actions>
          <button 
            mat-raised-button 
            color="primary" 
            (click)="signInWithGoogle()"
            [disabled]="isLoading"
            class="google-signin-button">
            <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
            <mat-icon *ngIf="!isLoading">login</mat-icon>
            <span *ngIf="!isLoading">Sign in with Google</span>
            <span *ngIf="isLoading">Signing in...</span>
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
      padding: 20px;
    }

    .login-card {
      max-width: 400px;
      width: 100%;
    }

    .login-content {
      text-align: center;
      padding: 20px 0;
    }

    .login-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #666;
      margin-bottom: 20px;
    }

    .error-message {
      color: #f44336;
      margin-top: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
    }

    .google-signin-button {
      width: 100%;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    mat-card-actions {
      padding: 16px;
    }
  `]
})
export class AdminLoginComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private settingsService = inject(SettingsService);
  siteName = signal<string>('');
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.settingsService.getSiteSettings().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(settings => {
      if (settings) {
        this.siteName.set(settings.siteName);
      }
    });
  }

  async signInWithGoogle() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.signInWithGoogle();
      // If successful, redirect to admin
      this.router.navigate(['/admin']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Authentication failed. Please try again.';
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }
}