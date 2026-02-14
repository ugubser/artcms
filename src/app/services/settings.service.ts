import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

  constructor(private firestore: Firestore) {
    this.settingsCollection = collection(this.firestore, 'settings');
  }

  // Get site settings
  getSiteSettings(): Observable<SiteSettings | null> {
    return collectionData(this.settingsCollection, { idField: 'id' }).pipe(
      map((settings: any[]) => {
        return settings.length > 0 ? settings[0] as SiteSettings : null;
      })
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