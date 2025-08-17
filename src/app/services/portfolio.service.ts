import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Picture {
  id?: string;
  imageUrl: string;
  description: string; // Markdown formatted
  alt: string;
  order: number;
  dateCreated?: string; // Date when the artwork was created (YYYY-MM format)
  artMedium?: string; // e.g., "Acrylic on canvas", "Digital painting", "Oil on canvas"
  genre?: string; // e.g., "Abstract expressionism", "Landscape", "Portrait"
  dimensions?: {
    width: number; // Width in units (cm, inches, etc.)
    height: number; // Height in units (cm, inches, etc.)
  };
  price?: number; // Price in base currency
  sold?: boolean; // Whether the piece is sold (default: false)
  showPrice?: boolean; // Whether to display the price (default: false)
}

export interface GalleryEntry {
  id?: string;
  title: string;
  description: string; // Markdown formatted
  pictures: Picture[];
  order: number;
}

export interface PortfolioItem {
  id?: string;
  title: string;
  description: string; // Markdown formatted - main project description
  category: 'graphic-design' | 'art' | 'branding' | 'web-design';
  featuredImage: string; // Main portfolio image
  galleries: GalleryEntry[]; // Multiple gallery entries
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
    console.log('Creating portfolio item with data:', item);
    
    const portfolioItem = {
      title: item.title || '',
      description: item.description || '',
      category: item.category || 'graphic-design',
      featuredImage: item.featuredImage || '',
      galleries: item.galleries || [],
      published: item.published || false,
      order: item.order || 0,
      createdAt: item.createdAt || new Date()
    } as Omit<PortfolioItem, 'id'>;
    
    console.log('Processed portfolio item for Firestore:', portfolioItem);
    
    try {
      const docRef = await addDoc(this.portfolioCollection, portfolioItem);
      console.log('Successfully added document with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding document to Firestore:', error);
      throw error;
    }
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

  // Utility methods for managing nested galleries and pictures
  generateGalleryId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  generatePictureId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  createEmptyGallery(): GalleryEntry {
    return {
      id: this.generateGalleryId(),
      title: '',
      description: '',
      pictures: [],
      order: 0
    };
  }

  createEmptyPicture(): Picture {
    return {
      id: this.generatePictureId(),
      imageUrl: '',
      description: '',
      alt: '',
      order: 0,
      dateCreated: '',
      artMedium: '',
      genre: '',
      dimensions: {
        width: 0,
        height: 0
      },
      price: 0,
      sold: false,
      showPrice: false
    };
  }

  // Upload image to Firebase Storage
  async uploadImage(file: File, path: string): Promise<string> {
    const storageRef = ref(this.storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  // Upload image and return object path instead of absolute URL
  async uploadImageReturnPath(file: File, path: string): Promise<string> {
    const storageRef = ref(this.storage, path);
    await uploadBytes(storageRef, file);
    return path; // Return the object path, not the download URL
  }

  // Upload multiple images for gallery
  async uploadGalleryImages(files: File[], portfolioId: string): Promise<string[]> {
    const uploadPromises = files.map((file, index) => {
      const path = `portfolio/gallery/${portfolioId}_${index}_${file.name}`;
      return this.uploadImage(file, path);
    });
    
    return Promise.all(uploadPromises);
  }

  // Upload multiple images and return object paths instead of absolute URLs
  async uploadGalleryImagesReturnPaths(files: File[], portfolioId: string): Promise<string[]> {
    const uploadPromises = files.map((file, index) => {
      const path = `portfolio/gallery/${portfolioId}_${index}_${file.name}`;
      return this.uploadImageReturnPath(file, path);
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
        featuredImage: 'https://via.placeholder.com/400x300/000000/FFFFFF?text=Swiss+Typography',
        galleries: [
          {
            id: 'gallery-1',
            title: 'Design Process',
            description: 'The evolution of the typography poster from sketch to final design.',
            order: 0,
            pictures: [
              {
                id: 'pic-1',
                imageUrl: 'https://via.placeholder.com/800x600/000000/FFFFFF?text=Detail+1',
                description: 'Initial sketch concepts',
                alt: 'Typography poster initial sketches',
                order: 0
              },
              {
                id: 'pic-2',
                imageUrl: 'https://via.placeholder.com/800x600/000000/FFFFFF?text=Detail+2',
                description: 'Final design details',
                alt: 'Typography poster final design',
                order: 1
              }
            ]
          }
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
        featuredImage: 'https://via.placeholder.com/400x300/333333/FFFFFF?text=Abstract+Art',
        galleries: [
          {
            id: 'gallery-2',
            title: 'Art Collection',
            description: 'A series of abstract pieces exploring form and space.',
            order: 0,
            pictures: [
              {
                id: 'pic-3',
                imageUrl: 'https://via.placeholder.com/800x600/333333/FFFFFF?text=Art+Piece+1',
                description: 'First piece in the series - exploring geometric forms',
                alt: 'Abstract art piece one',
                order: 0
              },
              {
                id: 'pic-4',
                imageUrl: 'https://via.placeholder.com/800x600/333333/FFFFFF?text=Art+Piece+2',
                description: 'Second piece - minimalist composition',
                alt: 'Abstract art piece two',
                order: 1
              },
              {
                id: 'pic-5',
                imageUrl: 'https://via.placeholder.com/800x600/333333/FFFFFF?text=Art+Piece+3',
                description: 'Final piece - synthesis of concepts',
                alt: 'Abstract art piece three',
                order: 2
              }
            ]
          }
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
        featuredImage: 'https://via.placeholder.com/400x300/666666/FFFFFF?text=Corporate+Identity',
        galleries: [
          {
            id: 'gallery-3',
            title: 'Brand Elements',
            description: 'Core visual identity components',
            order: 0,
            pictures: [
              {
                id: 'pic-6',
                imageUrl: 'https://via.placeholder.com/800x600/666666/FFFFFF?text=Logo+Design',
                description: 'Primary logo design with grid system',
                alt: 'Corporate logo design',
                order: 0
              },
              {
                id: 'pic-7',
                imageUrl: 'https://via.placeholder.com/800x600/666666/FFFFFF?text=Business+Cards',
                description: 'Business card design system',
                alt: 'Business card designs',
                order: 1
              },
              {
                id: 'pic-8',
                imageUrl: 'https://via.placeholder.com/800x600/666666/FFFFFF?text=Letterhead',
                description: 'Letterhead and stationary design',
                alt: 'Corporate letterhead',
                order: 2
              }
            ]
          }
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