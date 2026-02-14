import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CmsPortfolioTabComponent } from './components/cms-portfolio-tab.component';
import { CmsPortfolioPagesTabComponent } from './components/cms-portfolio-pages-tab.component';
import { CmsAboutTabComponent } from './components/cms-about-tab.component';
import { CmsContactTabComponent } from './components/cms-contact-tab.component';
import { CmsSettingsTabComponent } from './components/cms-settings-tab.component';

@Component({
  selector: 'app-cms',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    CmsPortfolioTabComponent,
    CmsPortfolioPagesTabComponent,
    CmsAboutTabComponent,
    CmsContactTabComponent,
    CmsSettingsTabComponent
  ],
  template: `
    <div class="cms-wrapper">
      <header class="cms-header">
        <h1>Tribeca Concepts CMS</h1>
        <p>Content Management System</p>
      </header>

      <mat-tab-group class="cms-tabs">
        <mat-tab label="Portfolio">
          <cms-portfolio-tab></cms-portfolio-tab>
        </mat-tab>
        <mat-tab label="Portfolio Pages">
          <cms-portfolio-pages-tab></cms-portfolio-pages-tab>
        </mat-tab>
        <mat-tab label="About">
          <cms-about-tab></cms-about-tab>
        </mat-tab>
        <mat-tab label="Contact">
          <cms-contact-tab></cms-contact-tab>
        </mat-tab>
        <mat-tab label="Settings">
          <cms-settings-tab></cms-settings-tab>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .cms-wrapper {
      width: 100%;
      min-height: 100vh;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background: #f5f5f5;
    }

    .cms-header {
      background: #fff;
      padding: 2rem;
      border-bottom: 1px solid #eee;
      text-align: center;
    }

    .cms-header h1 {
      font-size: 2.5rem;
      font-weight: 300;
      margin: 0 0 0.5rem 0;
      color: #000;
    }

    .cms-header p {
      color: #666;
      margin: 0;
    }

    .cms-tabs {
      background: #fff;
    }

    @media (max-width: 768px) {
      .cms-header {
        padding: 1rem;
      }
    }
  `]
})
export class CMSComponent {}
