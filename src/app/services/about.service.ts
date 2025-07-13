import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface AboutSection {
  id?: string;
  title: string;
  content: string;
  image?: string;
  order: number;
}

@Injectable({
  providedIn: 'root'
})
export class AboutService {
  private aboutCollection;

  constructor(private firestore: Firestore) {
    this.aboutCollection = collection(this.firestore, 'about');
  }

  // Get all about sections
  getAboutSections(): Observable<AboutSection[]> {
    const q = query(this.aboutCollection, orderBy('order', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<AboutSection[]>;
  }

  // Add new about section
  async addAboutSection(section: Omit<AboutSection, 'id'>): Promise<string> {
    const docRef = await addDoc(this.aboutCollection, section);
    return docRef.id;
  }

  // Create about section (alias for addAboutSection)
  async createAboutSection(section: Partial<AboutSection>): Promise<string> {
    const aboutSection = {
      title: section.title || '',
      content: section.content || '',
      image: section.image || '',
      order: section.order || 0
    };
    
    const docRef = await addDoc(this.aboutCollection, aboutSection);
    return docRef.id;
  }

  // Update about section
  async updateAboutSection(id: string, section: Partial<AboutSection>): Promise<void> {
    const docRef = doc(this.firestore, 'about', id);
    await updateDoc(docRef, section);
  }

  // Delete about section
  async deleteAboutSection(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'about', id);
    await deleteDoc(docRef);
  }

  // Get sample about data
  getSampleAboutData(): AboutSection[] {
    return [
      {
        id: 'about-1',
        title: 'About Tribeca Concepts',
        content: `Tribeca Concepts is a Swiss-American-Japanese graphic design studio based in Zurich, Switzerland. 
        
We specialize in creating exceptional design solutions that combine the precision of Swiss typography, the innovation of American creativity, and the minimalism of Japanese aesthetics.

Our approach is rooted in the International Typographic Style, emphasizing clean lines, systematic grids, and thoughtful use of white space. Every project is crafted with meticulous attention to detail and a deep understanding of both form and function.`,
        order: 1
      },
      {
        id: 'about-2',
        title: 'Design Philosophy',
        content: `We believe that great design is invisible design. Our work focuses on clarity, functionality, and timeless aesthetic appeal. 

Drawing inspiration from the Bauhaus movement and Swiss design pioneers like Josef Müller-Brockmann and Armin Hofmann, we create solutions that communicate effectively while maintaining visual elegance.

Our process involves thorough research, systematic exploration, and iterative refinement to ensure each project meets the highest standards of design excellence.`,
        order: 2
      },
      {
        id: 'about-3',
        title: 'Services',
        content: `• **Graphic Design** - Posters, brochures, publications, and print materials
• **Brand Identity** - Logo design, corporate identity systems, and brand guidelines  
• **Art Direction** - Creative concept development and visual strategy
• **Web Design** - Clean, functional websites that reflect our design principles
• **Editorial Design** - Books, magazines, and digital publications`,
        order: 3
      }
    ];
  }

  // Initialize with sample data
  async initializeSampleData(): Promise<void> {
    const sampleData = this.getSampleAboutData();
    
    for (const section of sampleData) {
      const { id, ...sectionData } = section;
      await this.addAboutSection(sectionData);
    }
  }
}