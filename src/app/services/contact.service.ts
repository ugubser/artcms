import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Firestore, doc, addDoc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { BaseFirestoreService, FirestoreDocument } from './base-firestore.service';

export interface ContactInfo extends FirestoreDocument {
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
export class ContactService extends BaseFirestoreService<ContactInfo> {

  constructor(firestore: Firestore, @Inject(PLATFORM_ID) platformId: Object) {
    super(firestore, 'contact', platformId);
  }

  getContactInfo(): Observable<ContactInfo[]> {
    return this.getAll();
  }

  async addContactInfo(contact: Omit<ContactInfo, 'id'>): Promise<string> {
    return this.add(contact);
  }

  async updateContactInfo(contact: ContactInfo): Promise<void> {
    const contactId = 'main-contact';
    const docRef = doc(this.firestore, 'contact', contactId);

    const updateData = {
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
      socialMedia: contact.socialMedia
    };

    try {
      await updateDoc(docRef, updateData);
    } catch (error) {
      await addDoc(this.collectionRef, { ...updateData, id: contactId });
    }
  }

  async deleteContactInfo(id: string): Promise<void> {
    return this.delete(id);
  }

  getSampleContactData(): ContactInfo {
    return {
      id: 'contact-1',
      email: 'hello@example.com',
      phone: '',
      address: '',
      socialMedia: {
        instagram: '',
        linkedin: '',
        behance: ''
      }
    };
  }

  async initializeSampleData(): Promise<void> {
    const sampleData = this.getSampleContactData();
    const { id, ...contactData } = sampleData;
    await this.addContactInfo(contactData);
  }
}
