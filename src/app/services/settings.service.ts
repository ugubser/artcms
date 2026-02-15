import { Injectable, Inject, Injector, PLATFORM_ID, inject, PendingTasks, runInInjectionContext } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map, first, finalize, timeout, catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

export interface SiteSettings {
  id?: string;
  siteName: string;
  siteDescription: string;
  siteKeywords: string[];
  contactEmail: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
  enableAnalytics: boolean;
  analyticsId?: string;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  // Artist-specific fields for VisualArtist schema
  artistName?: string;
  artistAlternateName?: string;
  artistBirthPlace?: string;
  artistNationality?: string;
  artistPortraitUrl?: string;
  artistBiography?: string;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private settingsCollection;
  private readonly SETTINGS_DOC_ID = 'main-settings';
  private pendingTasks = inject(PendingTasks);
  private injector = inject(Injector);

  constructor(
    private firestore: Firestore,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.settingsCollection = collection(this.firestore, 'settings');
  }

  private completeOnServer<T>(obs$: Observable<T>): Observable<T> {
    if (isPlatformServer(this.platformId)) {
      const done = this.pendingTasks.add();
      return obs$.pipe(
        timeout(5000),
        first(),
        catchError(() => EMPTY as Observable<T>),
        finalize(() => done())
      );
    }
    return obs$;
  }

  private toJsDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
    if (value.seconds != null) return new Date(value.seconds * 1000);
    return null;
  }

  // Get site settings
  getSiteSettings(): Observable<SiteSettings | null> {
    return this.completeOnServer(
      runInInjectionContext(this.injector, () =>
        collectionData(this.settingsCollection, { idField: 'id' })
      ).pipe(
        map((settings: any[]) => {
          if (settings.length === 0) return null;
          const s = settings[0];
          return {
            ...s,
            updatedAt: this.toJsDate(s.updatedAt)
          } as SiteSettings;
        })
      )
    );
  }

  // Update or create site settings
  async updateSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
    const settingsData = {
      ...settings,
      updatedAt: new Date()
    };

    const docRef = doc(this.firestore, 'settings', this.SETTINGS_DOC_ID);
    
    try {
      await setDoc(docRef, settingsData, { merge: true });
    } catch (error) {
      throw error;
    }
  }

  // Get default settings
  getDefaultSettings(): SiteSettings {
    return {
      siteName: 'Tribeca Concepts',
      siteDescription: 'Swiss-American-Japanese graphic design portfolio showcasing minimalist design principles and creative excellence.',
      siteKeywords: ['graphic design', 'swiss design', 'minimalist', 'portfolio', 'branding', 'art'],
      contactEmail: 'info@tribecaconcepts.com',
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      footerText: '© 2024 by TribecaConcepts. All rights reserved.',
      enableAnalytics: false,
      analyticsId: '',
      socialMedia: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: ''
      },
      // Default artist information
      artistName: '',
      artistAlternateName: '',
      artistBirthPlace: '',
      artistNationality: '',
      artistPortraitUrl: '',
      artistBiography: '',
      updatedAt: new Date()
    };
  }

  // Initialize settings with defaults if none exist
  async initializeDefaultSettings(): Promise<void> {
    try {
      const currentSettings = await new Promise<SiteSettings | null>((resolve, reject) => {
        this.getSiteSettings().subscribe({
          next: (settings) => resolve(settings),
          error: (error) => reject(error)
        });
      });

      if (!currentSettings) {
        await this.updateSiteSettings(this.getDefaultSettings());
      }
    } catch (error) {
    }
  }
}