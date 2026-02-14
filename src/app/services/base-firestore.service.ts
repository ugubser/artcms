import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, query, orderBy, CollectionReference, QueryConstraint } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface FirestoreDocument {
  id?: string;
}

export abstract class BaseFirestoreService<T extends FirestoreDocument> {
  protected collectionRef: CollectionReference;

  constructor(
    protected firestore: Firestore,
    protected collectionName: string
  ) {
    this.collectionRef = collection(this.firestore, this.collectionName);
  }

  getAll(...constraints: QueryConstraint[]): Observable<T[]> {
    const q = constraints.length > 0
      ? query(this.collectionRef, ...constraints)
      : this.collectionRef;
    return collectionData(q, { idField: 'id' }) as Observable<T[]>;
  }

  getAllOrdered(field: string, direction: 'asc' | 'desc' = 'asc'): Observable<T[]> {
    return this.getAll(orderBy(field, direction));
  }

  async add(item: Omit<T, 'id'>): Promise<string> {
    const docRef = await addDoc(this.collectionRef, item as any);
    return docRef.id;
  }

  async update(id: string, item: Partial<T>): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    await updateDoc(docRef, item as any);
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    await deleteDoc(docRef);
  }
}
