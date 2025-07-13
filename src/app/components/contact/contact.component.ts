import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ContactService, ContactInfo } from '../../services/contact.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="contact-container">
      <header class="contact-header">
        <h1>Contact</h1>
        <p class="contact-subtitle">Get in touch with our design studio</p>
      </header>
      
      <main class="contact-content">
        <div *ngFor="let contact of contactInfo$ | async; trackBy: trackByFn" class="contact-info">
          <div class="contact-grid">
            <div class="contact-details">
              <div class="contact-item">
                <h3>Email</h3>
                <a [href]="'mailto:' + contact.email" class="contact-link">
                  {{ contact.email }}
                </a>
              </div>
              
              <div *ngIf="contact.phone" class="contact-item">
                <h3>Phone</h3>
                <a [href]="'tel:' + contact.phone" class="contact-link">
                  {{ contact.phone }}
                </a>
              </div>
              
              <div *ngIf="contact.address" class="contact-item">
                <h3>Address</h3>
                <address class="contact-address">
                  <pre>{{ contact.address }}</pre>
                </address>
              </div>
            </div>
            
            <div class="social-media">
              <h3>Follow Our Work</h3>
              <div class="social-links">
                <a 
                  *ngIf="contact.socialMedia.instagram" 
                  [href]="contact.socialMedia.instagram" 
                  target="_blank" 
                  rel="noopener"
                  class="social-link"
                >
                  <span class="social-icon">📷</span>
                  Instagram
                </a>
                
                <a 
                  *ngIf="contact.socialMedia.linkedin" 
                  [href]="contact.socialMedia.linkedin" 
                  target="_blank" 
                  rel="noopener"
                  class="social-link"
                >
                  <span class="social-icon">💼</span>
                  LinkedIn
                </a>
                
                <a 
                  *ngIf="contact.socialMedia.behance" 
                  [href]="contact.socialMedia.behance" 
                  target="_blank" 
                  rel="noopener"
                  class="social-link"
                >
                  <span class="social-icon">🎨</span>
                  Behance
                </a>
                
                <a 
                  *ngIf="contact.socialMedia.twitter" 
                  [href]="contact.socialMedia.twitter" 
                  target="_blank" 
                  rel="noopener"
                  class="social-link"
                >
                  <span class="social-icon">🐦</span>
                  Twitter
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Loading state -->
        <div *ngIf="isLoading" class="loading-state">
          <p>Loading contact information...</p>
        </div>
        
        <!-- Empty state -->
        <div *ngIf="(contactInfo$ | async)?.length === 0 && !isLoading" class="empty-state">
          <h3>No contact information available</h3>
          <p>Contact details will appear here once they're added to the database.</p>
          <button (click)="initializeSampleData()" class="sample-data-btn">
            Load Sample Data
          </button>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .contact-container {
      padding: 2rem 0;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      min-height: calc(100vh - 80px);
    }
    
    .contact-header {
      text-align: center;
      max-width: 800px;
      margin: 0 auto 4rem;
      padding: 0 2rem;
    }
    
    .contact-header h1 {
      font-size: 3rem;
      font-weight: 300;
      margin-bottom: 1rem;
      color: #000;
      letter-spacing: -1px;
      
      @media (max-width: 768px) {
        font-size: 2rem;
      }
    }
    
    .contact-subtitle {
      font-size: 1.2rem;
      color: #666;
      line-height: 1.6;
    }
    
    .contact-content {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 2rem;
    }
    
    .contact-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 3rem;
      }
    }
    
    .contact-item {
      margin-bottom: 2.5rem;
    }
    
    .contact-item h3 {
      font-size: 1.25rem;
      font-weight: 500;
      margin-bottom: 0.75rem;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 0.9rem;
    }
    
    .contact-link {
      color: #333;
      text-decoration: none;
      font-size: 1.1rem;
      border-bottom: 1px solid transparent;
      transition: border-color 0.3s ease;
    }
    
    .contact-link:hover {
      border-bottom-color: #000;
    }
    
    .contact-address {
      font-style: normal;
    }
    
    .contact-address pre {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 1.1rem;
      line-height: 1.6;
      color: #333;
      margin: 0;
      white-space: pre-line;
    }
    
    .social-media h3 {
      font-size: 1.25rem;
      font-weight: 500;
      margin-bottom: 1.5rem;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 0.9rem;
    }
    
    .social-links {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .social-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #333;
      text-decoration: none;
      padding: 0.75rem 0;
      border-bottom: 1px solid #eee;
      transition: color 0.3s ease, border-color 0.3s ease;
    }
    
    .social-link:hover {
      color: #000;
      border-bottom-color: #000;
    }
    
    .social-link:last-child {
      border-bottom: none;
    }
    
    .social-icon {
      font-size: 1.25rem;
      width: 1.5rem;
      text-align: center;
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
export class ContactComponent implements OnInit {
  contactInfo$: Observable<ContactInfo[]>;
  isLoading = true;

  constructor(private contactService: ContactService) {
    this.contactInfo$ = new Observable<ContactInfo[]>();
  }

  ngOnInit() {
    this.loadContactInfo();
  }

  private loadContactInfo() {
    this.isLoading = true;
    this.contactInfo$ = this.contactService.getContactInfo();
    
    // Set loading to false after a short delay
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  trackByFn(index: number, contact: ContactInfo): string {
    return contact.id || index.toString();
  }

  async initializeSampleData() {
    try {
      await this.contactService.initializeSampleData();
      this.loadContactInfo();
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  }
}