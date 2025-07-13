import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface ContactInfo {
  id?: string;
  email: string;
  phone?: string;
  address?: string;
  socialMedia: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    behance?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private contactCollection;

  constructor(private firestore: Firestore) {
    this.contactCollection = collection(this.firestore, 'contact');
  }

  // Get contact information
  getContactInfo(): Observable<ContactInfo[]> {
    return collectionData(this.contactCollection, { idField: 'id' }) as Observable<ContactInfo[]>;
  }

  // Add contact info
  async addContactInfo(contact: Omit<ContactInfo, 'id'>): Promise<string> {
    const docRef = await addDoc(this.contactCollection, contact);
    return docRef.id;
  }

  // Update contact info
  async updateContactInfo(contact: ContactInfo): Promise<void> {
    // For simplicity, we'll use a fixed document ID for contact info
    const contactId = 'main-contact';
    const docRef = doc(this.firestore, 'contact', contactId);
    
    // Convert to plain object for Firestore
    const updateData = {
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
      socialMedia: contact.socialMedia
    };
    
    try {
      await updateDoc(docRef, updateData);
    } catch (error) {
      // If document doesn't exist, create it
      await addDoc(this.contactCollection, { ...updateData, id: contactId });
    }
  }

  // Delete contact info
  async deleteContactInfo(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'contact', id);
    await deleteDoc(docRef);
  }

  // Get sample contact data
  getSampleContactData(): ContactInfo {
    return {
      id: 'contact-1',
      email: 'hello@tribecaconcepts.com',
      phone: '+41 44 123 45 67',
      address: `Tribeca Concepts Studio
Bahnhofstrasse 123
8001 Zurich, Switzerland`,
      socialMedia: {
        instagram: 'https://instagram.com/tribecaconcepts',
        linkedin: 'https://linkedin.com/company/tribecaconcepts',
        behance: 'https://behance.net/tribecaconcepts'
      }
    };
  }

  // Initialize with sample data
  async initializeSampleData(): Promise<void> {
    const sampleData = this.getSampleContactData();
    const { id, ...contactData } = sampleData;
    await this.addContactInfo(contactData);
  }
}