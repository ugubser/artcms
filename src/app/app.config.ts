import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { getStorage, provideStorage, connectStorageEmulator } from '@angular/fire/storage';
import { getAuth, provideAuth, connectAuthEmulator } from '@angular/fire/auth';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => {
      const firestore = getFirestore();
      if (environment.useEmulators) {
        try {
          const host = (environment as any).emulatorHost || 'localhost';
          connectFirestoreEmulator(firestore, host, 8080);
        } catch (error) {
          // Emulator already connected
        }
      }
      return firestore;
    }),
    provideStorage(() => {
      const storage = getStorage();
      if (environment.useEmulators) {
        try {
          const host = (environment as any).emulatorHost || 'localhost';
          connectStorageEmulator(storage, host, 9199);
        } catch (error) {
          // Emulator already connected
        }
      }
      return storage;
    }),
    provideAuth(() => {
      const auth = getAuth();
      if (environment.useEmulators) {
        try {
          const host = (environment as any).emulatorHost || 'localhost';
          connectAuthEmulator(auth, `http://${host}:9099`);
        } catch (error) {
          // Emulator already connected
        }
      }
      return auth;
    })
  ]
};
