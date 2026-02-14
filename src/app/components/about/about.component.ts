import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable, tap } from 'rxjs';
import { AboutService, AboutSection } from '../../services/about.service';
import { PageHeaderComponent } from '../shared/page-header.component';
import { ResolveStorageUrlPipe } from '../../pipes/resolve-storage-url.pipe';
import { ImgLoadingDirective } from '../../directives/img-loading.directive';

@Component({
  selector: 'app-about',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PageHeaderComponent, ResolveStorageUrlPipe, ImgLoadingDirective],
  template: `
    <div class="about-container">
      <app-page-header></app-page-header>
      
      <main class="about-content">
        <section 
          *ngFor="let section of aboutSections$ | async; trackBy: trackByFn" 
          class="about-section"
          [class.has-image]="section.image"
          [class.no-image]="!section.image"
        >
          <div class="section-content">
            <h2>{{ section.title }}</h2>
            <div class="section-text" [innerHTML]="formatContent(section.content)"></div>
          </div>
          <div *ngIf="section.image" class="section-image">
            <img appImgLoading [src]="section.image | resolveStorageUrl | async" [alt]="section.title" loading="lazy" />
          </div>
        </section>
        
        
        <!-- Empty state -->
        <div *ngIf="(aboutSections$ | async)?.length === 0 && !isLoading" class="empty-state">
          <h3>No content available</h3>
          <p>About content will appear here once it's added to the database.</p>
          <button (click)="initializeSampleData()" class="sample-data-btn">
            Load Sample Data
          </button>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .about-container {
      padding: 2rem 0;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      min-height: calc(100vh - 80px);
    }
    
    .about-header {
      text-align: center;
      max-width: 800px;
      margin: 0 auto 4rem;
      padding: 0 2rem;
    }
    
    .about-header h1 {
      font-size: 3rem;
      font-weight: 300;
      margin-bottom: 1rem;
      color: #000;
      letter-spacing: -1px;
      
      @media (max-width: 768px) {
        font-size: 2rem;
      }
    }
    
    .about-subtitle {
      font-size: 1.2rem;
      color: #666;
      line-height: 1.6;
    }
    
    .about-content {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 2rem;
    }
    
    .about-section {
      display: grid;
      gap: 3rem;
      margin-bottom: 4rem;
      align-items: start;
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 2rem;
        margin-bottom: 3rem;
      }
    }
    
    .about-section.has-image {
      grid-template-columns: 2fr 1fr;
    }
    
    .about-section.no-image {
      grid-template-columns: 1fr;
    }
    
    .about-section.has-image:nth-child(even) {
      grid-template-columns: 1fr 2fr;
      
      .section-content {
        order: 2;
      }
      
      .section-image {
        order: 1;
      }
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        
        .section-content {
          order: 1;
        }
        
        .section-image {
          order: 2;
        }
      }
    }
    
    .section-content h2 {
      font-size: 2rem;
      font-weight: 400;
      margin-bottom: 1.5rem;
      color: #000;
      line-height: 1.3;
    }
    
    .section-text {
      font-size: 1.1rem;
      line-height: 1.7;
      color: #333;
    }
    
    .section-text p {
      margin-bottom: 1.5rem;
    }
    
    .section-text ul {
      margin: 1.5rem 0;
      padding-left: 0;
      list-style: none;
    }
    
    .section-text li {
      margin-bottom: 0.75rem;
      position: relative;
      padding-left: 1.5rem;
    }
    
    .section-text li:before {
      content: '•';
      position: absolute;
      left: 0;
      color: #000;
      font-weight: bold;
    }
    
    .section-text strong {
      color: #000;
      font-weight: 500;
    }
    
    .section-image {
      text-align: center;
    }
    
    .section-image img {
      width: 100%;
      height: auto;
      border-radius: 4px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }
    
    .loading-state,
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }

    .empty-state h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #333;
    }

    .sample-data-btn {
      background: #000;
      color: #fff;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background 0.3s ease;
      margin-top: 1rem;

      &:hover {
        background: #333;
      }
    }
  `]
})
export class AboutComponent implements OnInit {
  aboutSections$: Observable<AboutSection[]>;
  isLoading = true;

  private sanitizedContentCache = new Map<string, SafeHtml>();

  constructor(
    private aboutService: AboutService,
    private sanitizer: DomSanitizer
  ) {
    this.aboutSections$ = new Observable<AboutSection[]>();
  }

  ngOnInit() {
    this.loadAboutSections();
  }

  private loadAboutSections() {
    this.isLoading = true;
    this.aboutSections$ = this.aboutService.getAboutSections().pipe(
      tap(() => this.isLoading = false)
    );
  }

  trackByFn(index: number, section: AboutSection): string {
    return section.id || index.toString();
  }

  formatContent(content: string): SafeHtml {
    if (!content) return '';

    // Return cached result if content hasn't changed
    const cached = this.sanitizedContentCache.get(content);
    if (cached) return cached;

    // Convert markdown-style formatting to HTML
    let html = content;

    // Strip any script tags and event handlers before processing
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    html = html.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');

    // Handle bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Split content into blocks (separated by double newlines)
    const blocks = html.split(/\n\s*\n/);
    const processedBlocks = blocks.map(block => {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) return '';

      // Check if block contains ordered list items
      if (/^\s*\d+\.\s/.test(trimmedBlock)) {
        const items = trimmedBlock.split('\n')
          .filter(line => line.trim())
          .map(line => '<li>' + line.replace(/^\s*\d+\.\s+/, '') + '</li>');
        return '<ol>' + items.join('') + '</ol>';
      }

      // Check if block contains unordered list items
      if (/^\s*[-*]\s/.test(trimmedBlock)) {
        const items = trimmedBlock.split('\n')
          .filter(line => line.trim())
          .map(line => '<li>' + line.replace(/^\s*[-*]\s+/, '') + '</li>');
        return '<ul>' + items.join('') + '</ul>';
      }

      // Regular paragraph
      return '<p>' + trimmedBlock.replace(/\n/g, '<br>') + '</p>';
    });

    const rawHtml = processedBlocks.filter(block => block).join('');
    const sanitized = this.sanitizer.bypassSecurityTrustHtml(rawHtml);
    this.sanitizedContentCache.set(content, sanitized);
    return sanitized;
  }

  async initializeSampleData() {
    try {
      await this.aboutService.initializeSampleData();
      this.loadAboutSections();
    } catch (error) {
    }
  }
}