import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ContactService, ContactInfo } from '../../services/contact.service';
import { SettingsService, SiteSettings } from '../../services/settings.service';
import { MetaService } from '../../services/meta.service';
import { PageHeaderComponent } from '../shared/page-header.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit {
  contactInfo$: Observable<ContactInfo[]>;
  isLoading = true;
  settingsContactEmail = signal<string>('');

  constructor(
    private contactService: ContactService,
    private settingsService: SettingsService,
    private metaService: MetaService
  ) {
    this.contactInfo$ = new Observable<ContactInfo[]>();
  }

  ngOnInit() {
    this.loadContactInfo();
    
    // Load site settings for contact email
    this.settingsService.getSiteSettings().subscribe(settings => {
      if (settings) {
        this.settingsContactEmail.set(settings.contactEmail);
      }
    });
    
    this.metaService.setPageTitle('Contact');
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