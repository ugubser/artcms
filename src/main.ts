import { bootstrapApplication } from '@angular/platform-browser';
import { provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { getAuth, provideAuth, connectAuthEmulator } from '@angular/fire/auth';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

const browserConfig = {
  ...appConfig,
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    ...appConfig.providers,
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
    }),
  ]
};

bootstrapApplication(App, browserConfig)
  .catch((err) => console.error(err));
