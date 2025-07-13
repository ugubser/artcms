import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  category: 'graphic-design' | 'art' | 'branding' | 'web-design';
  image: string;
  gallery: string[];
  published: boolean;
  order: number;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private portfolioCollection;

  constructor(
    private firestore: Firestore,
    private storage: Storage
  ) {
    this.portfolioCollection = collection(this.firestore, 'portfolio');
  }

  // Get all published portfolio items
  getPublishedPortfolio(): Observable<PortfolioItem[]> {
    const q = query(
      this.portfolioCollection,
      where('published', '==', true),
      orderBy('order', 'asc')
    );
    
    return collectionData(q, { idField: 'id' }) as Observable<PortfolioItem[]>;
  }

  // Get portfolio items by category
  getPortfolioByCategory(category: string): Observable<PortfolioItem[]> {
    const q = query(
      this.portfolioCollection,
      where('category', '==', category),
      where('published', '==', true),
      orderBy('order', 'asc')
    );
    
    return collectionData(q, { idField: 'id' }) as Observable<PortfolioItem[]>;
  }

  // Get all portfolio items (for admin)
  getAllPortfolio(): Observable<PortfolioItem[]> {
    const q = query(this.portfolioCollection, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<PortfolioItem[]>;
  }

  // Add new portfolio item
  async addPortfolioItem(item: Omit<PortfolioItem, 'id' | 'createdAt'>): Promise<string> {
    const portfolioItem = {
      ...item,
      createdAt: new Date()
    };
    
    const docRef = await addDoc(this.portfolioCollection, portfolioItem);
    return docRef.id;
  }

  // Create portfolio item (alias for addPortfolioItem)
  async createPortfolioItem(item: Partial<PortfolioItem>): Promise<string> {
    const portfolioItem = {
      title: item.title || '',
      description: item.description || '',
      category: item.category || 'graphic-design',
      image: item.image || '',
      gallery: item.gallery || [],
      published: item.published || false,
      order: item.order || 0,
      createdAt: item.createdAt || new Date()
    } as Omit<PortfolioItem, 'id'>;
    
    const docRef = await addDoc(this.portfolioCollection, portfolioItem);
    return docRef.id;
  }

  // Update portfolio item
  async updatePortfolioItem(id: string, item: Partial<PortfolioItem>): Promise<void> {
    const docRef = doc(this.firestore, 'portfolio', id);
    await updateDoc(docRef, item);
  }

  // Delete portfolio item
  async deletePortfolioItem(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'portfolio', id);
    await deleteDoc(docRef);
  }

  // Upload image to Firebase Storage
  async uploadImage(file: File, path: string): Promise<string> {
    const storageRef = ref(this.storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  // Upload multiple images for gallery
  async uploadGalleryImages(files: File[], portfolioId: string): Promise<string[]> {
    const uploadPromises = files.map((file, index) => {
      const path = `portfolio/gallery/${portfolioId}_${index}_${file.name}`;
      return this.uploadImage(file, path);
    });
    
    return Promise.all(uploadPromises);
  }

  // Delete image from Firebase Storage
  async deleteImage(imageUrl: string): Promise<void> {
    const imageRef = ref(this.storage, imageUrl);
    await deleteObject(imageRef);
  }

  // Get sample portfolio data for testing
  getSamplePortfolioData(): PortfolioItem[] {
    return [
      {
        id: 'sample-1',
        title: 'Swiss Typography Poster',
        description: 'A minimalist poster design showcasing Swiss typography principles with clean lines and geometric compositions.',
        category: 'graphic-design',
        image: 'https://via.placeholder.com/400x300/000000/FFFFFF?text=Swiss+Typography',
        gallery: [
          'https://via.placeholder.com/800x600/000000/FFFFFF?text=Detail+1',
          'https://via.placeholder.com/800x600/000000/FFFFFF?text=Detail+2'
        ],
        published: true,
        order: 1,
        createdAt: new Date('2024-01-15')
      },
      {
        id: 'sample-2',
        title: 'Abstract Art Series',
        description: 'Contemporary abstract art pieces inspired by Japanese minimalism and Swiss precision.',
        category: 'art',
        image: 'https://via.placeholder.com/400x300/333333/FFFFFF?text=Abstract+Art',
        gallery: [
          'https://via.placeholder.com/800x600/333333/FFFFFF?text=Art+Piece+1',
          'https://via.placeholder.com/800x600/333333/FFFFFF?text=Art+Piece+2',
          'https://via.placeholder.com/800x600/333333/FFFFFF?text=Art+Piece+3'
        ],
        published: true,
        order: 2,
        createdAt: new Date('2024-01-20')
      },
      {
        id: 'sample-3',
        title: 'Corporate Identity Package',
        description: 'Complete branding solution for a Zurich-based technology company featuring clean, professional design elements.',
        category: 'branding',
        image: 'https://via.placeholder.com/400x300/666666/FFFFFF?text=Corporate+Identity',
        gallery: [
          'https://via.placeholder.com/800x600/666666/FFFFFF?text=Logo+Design',
          'https://via.placeholder.com/800x600/666666/FFFFFF?text=Business+Cards',
          'https://via.placeholder.com/800x600/666666/FFFFFF?text=Letterhead'
        ],
        published: true,
        order: 3,
        createdAt: new Date('2024-02-01')
      }
    ];
  }

  // Initialize with sample data (for development/testing)
  async initializeSampleData(): Promise<void> {
    const sampleData = this.getSamplePortfolioData();
    
    for (const item of sampleData) {
      const { id, ...itemData } = item;
      await this.addPortfolioItem(itemData);
    }
  }
}