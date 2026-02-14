import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { BaseFirestoreService, FirestoreDocument } from './base-firestore.service';

export interface AboutSection extends FirestoreDocument {
  id?: string;
  title: string;
  content: string;
  image?: string;
  order: number;
}

@Injectable({
  providedIn: 'root'
})
export class AboutService extends BaseFirestoreService<AboutSection> {

  constructor(firestore: Firestore) {
    super(firestore, 'about');
  }

  getAboutSections(): Observable<AboutSection[]> {
    return this.getAllOrdered('order', 'asc');
  }

  async addAboutSection(section: Omit<AboutSection, 'id'>): Promise<string> {
    return this.add(section);
  }

  async createAboutSection(section: Partial<AboutSection>): Promise<string> {
    return this.add({
      title: section.title || '',
      content: section.content || '',
      image: section.image || '',
      order: section.order || 0
    });
  }

  async updateAboutSection(id: string, section: Partial<AboutSection>): Promise<void> {
    return this.update(id, section);
  }

  async deleteAboutSection(id: string): Promise<void> {
    return this.delete(id);
  }

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

  async initializeSampleData(): Promise<void> {
    const sampleData = this.getSampleAboutData();

    for (const section of sampleData) {
      const { id, ...sectionData } = section;
      await this.addAboutSection(sectionData);
    }
  }
}
