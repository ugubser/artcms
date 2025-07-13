import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app;
  private firestore;
  private storage;
  private auth;

  constructor() {
    this.app = initializeApp(environment.firebase);
    this.firestore = getFirestore(this.app);
    this.storage = getStorage(this.app);
    this.auth = getAuth(this.app);

    // Connect to emulators in development
    if (environment.useEmulators) {
      this.connectToEmulators();
    }
  }

  private connectToEmulators() {
    try {
      // Connect to Firestore emulator
      connectFirestoreEmulator(this.firestore, 'localhost', 8080);
      console.log('Connected to Firestore emulator');
    } catch (error) {
      console.log('Firestore emulator already connected or unavailable');
    }

    try {
      // Connect to Storage emulator
      connectStorageEmulator(this.storage, 'localhost', 9199);
      console.log('Connected to Storage emulator');
    } catch (error) {
      console.log('Storage emulator already connected or unavailable');
    }

    try {
      // Connect to Auth emulator
      connectAuthEmulator(this.auth, 'http://localhost:9099');
      console.log('Connected to Auth emulator');
    } catch (error) {
      console.log('Auth emulator already connected or unavailable');
    }
  }

  getFirestore() {
    return this.firestore;
  }

  getStorage() {
    return this.storage;
  }

  getAuth() {
    return this.auth;
  }

  getApp() {
    return this.app;
  }
}