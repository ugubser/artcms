import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { getStorage, provideStorage, connectStorageEmulator } from '@angular/fire/storage';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay()),
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
    // Auth is provided in main.ts (browser only) — it creates persistent connections that block SSR
  ]
};
