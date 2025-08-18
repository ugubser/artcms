import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, setDoc, addDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PortfolioPageConfig {
  id?: string;
  category: string;
  title: string;
  subtitle: string;
  slug?: string; // URL slug for the page (optional, generated from title)
  order?: number; // Order within category (optional)
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioPagesService {
  private portfolioPagesCollection;

  constructor(private firestore: Firestore) {
    this.portfolioPagesCollection = collection(this.firestore, 'portfolio-pages');
  }

  getPortfolioPages(): Observable<PortfolioPageConfig[]> {
    return collectionData(this.portfolioPagesCollection, { idField: 'id' }).pipe(
      map((pages: any[]) => {
        console.log('Loaded portfolio pages:', pages);
        return pages as PortfolioPageConfig[];
      })
    );
  }

  getPortfolioPageByCategory(category: string): Observable<PortfolioPageConfig | null> {
    return this.getPortfolioPages().pipe(
      map(pages => pages.find(page => page.category === category) || null)
    );
  }

  async updatePortfolioPage(config: Partial<PortfolioPageConfig>): Promise<string> {
    console.log('Updating portfolio page:', config);
    
    const configData = {
      ...config,
      updatedAt: new Date()
    };

    try {
      if (config.id) {
        // Update existing page
        const docRef = doc(this.firestore, 'portfolio-pages', config.id);
        await setDoc(docRef, configData, { merge: true });
        console.log('Portfolio page updated successfully');
        return config.id;
      } else {
        // Create new page
        const docRef = await addDoc(this.portfolioPagesCollection, configData);
        console.log('Portfolio page created successfully with ID:', docRef.id);
        return docRef.id;
      }
    } catch (error) {
      console.error('Error updating portfolio page:', error);
      throw error;
    }
  }

  async createPortfolioPage(config: Omit<PortfolioPageConfig, 'id' | 'updatedAt'>): Promise<string> {
    return this.updatePortfolioPage(config);
  }

  getDefaultPortfolioPages(): PortfolioPageConfig[] {
    return [
      {
        category: 'art',
        title: 'Art',
        subtitle: 'Contemporary abstract art pieces inspired by Japanese minimalism and Swiss precision.',
        updatedAt: new Date()
      },
      {
        category: 'graphic-design',
        title: 'Design',
        subtitle: 'Graphic design solutions that combine Swiss typography principles with modern aesthetics.',
        updatedAt: new Date()
      },
      {
        category: 'portfolio',
        title: 'Portfolio',
        subtitle: 'A collection of our finest work in graphic design, art, and branding.',
        updatedAt: new Date()
      }
    ];
  }

  async deletePortfolioPage(category: string): Promise<void> {
    console.log('Deleting portfolio page:', category);
    
    const docRef = doc(this.firestore, 'portfolio-pages', category);
    
    try {
      await deleteDoc(docRef);
      console.log('Portfolio page deleted successfully');
    } catch (error) {
      console.error('Error deleting portfolio page:', error);
      throw error;
    }
  }

  async initializeDefaultPortfolioPages(): Promise<void> {
    try {
      const currentPages = await new Promise<PortfolioPageConfig[]>((resolve, reject) => {
        this.getPortfolioPages().subscribe({
          next: (pages) => resolve(pages),
          error: (error) => reject(error)
        });
      });

      if (currentPages.length === 0) {
        console.log('No portfolio pages found, initializing with defaults');
        const defaultPages = this.getDefaultPortfolioPages();
        
        for (const page of defaultPages) {
          await this.updatePortfolioPage(page);
        }
      }
    } catch (error) {
      console.error('Error initializing default portfolio pages:', error);
    }
  }
}