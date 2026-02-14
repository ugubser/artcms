import { Component, OnInit, signal, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContactService, ContactInfo } from '../../services/contact.service';
import { SettingsService, SiteSettings } from '../../services/settings.service';
import { MetaService } from '../../services/meta.service';
import { PageHeaderComponent } from '../shared/page-header.component';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  contactInfo$: Observable<ContactInfo[]>;
  isLoading = true;
  settingsContactEmail = signal<string>('');
  siteName = signal<string>('');
  contactForm: FormGroup;
  isSubmitting = false;
  submitMessage = '';
  submitSuccess = false;

  constructor(
    private contactService: ContactService,
    private settingsService: SettingsService,
    private metaService: MetaService,
    private fb: FormBuilder,
    private firestore: Firestore
  ) {
    this.contactInfo$ = new Observable<ContactInfo[]>();
    
    // Initialize reactive form
    this.contactForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.loadContactInfo();
    
    // Load site settings for contact email and site name
    this.settingsService.getSiteSettings().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(settings => {
      if (settings) {
        this.settingsContactEmail.set(settings.contactEmail);
        this.siteName.set(settings.siteName);
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
    }
  }

  async onSubmit() {
    if (this.contactForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.submitMessage = '';
      
      try {
        const formData = this.contactForm.value;
        const contactEmail = this.settingsContactEmail() || 'admin@example.com';
        
        // Save to Firestore /mail collection
        await addDoc(collection(this.firestore, 'mail'), {
          to: contactEmail,
          message: {
            subject: `${this.siteName()} message from ${formData.name}`,
            html: `Name: ${formData.name}<br>E-Mail: ${formData.email}<br>Message: ${formData.message}`
          }
        });
        
        this.submitSuccess = true;
        this.submitMessage = 'Thank you! Your message has been sent successfully.';
        this.contactForm.reset();
        
      } catch (error) {
        this.submitSuccess = false;
        this.submitMessage = 'Sorry, there was an error sending your message. Please try again.';
      } finally {
        this.isSubmitting = false;
        
        // Clear message after 5 seconds
        setTimeout(() => {
          this.submitMessage = '';
        }, 5000);
      }
    }
  }
}