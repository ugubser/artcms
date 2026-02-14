import { Inject, PLATFORM_ID, inject, PendingTasks } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, query, orderBy, CollectionReference, QueryConstraint } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { first, finalize } from 'rxjs/operators';

export interface FirestoreDocument {
  id?: string;
}

export abstract class BaseFirestoreService<T extends FirestoreDocument> {
  protected collectionRef: CollectionReference;
  private pendingTasks = inject(PendingTasks);

  constructor(
    protected firestore: Firestore,
    protected collectionName: string,
    @Inject(PLATFORM_ID) protected platformId: Object
  ) {
    this.collectionRef = collection(this.firestore, this.collectionName);
  }

  protected completeOnServer<U>(obs$: Observable<U>): Observable<U> {
    if (isPlatformServer(this.platformId)) {
      const done = this.pendingTasks.add();
      return obs$.pipe(first(), finalize(() => done()));
    }
    return obs$;
  }

  getAll(...constraints: QueryConstraint[]): Observable<T[]> {
    const q = constraints.length > 0
      ? query(this.collectionRef, ...constraints)
      : this.collectionRef;
    return this.completeOnServer(collectionData(q, { idField: 'id' }) as Observable<T[]>);
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
