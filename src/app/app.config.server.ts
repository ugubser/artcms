import { mergeApplicationConfig, ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // Zoneless on server: prevents Firebase WebSocket connections from blocking SSR stability.
    // Zone.js tracks gRPC/WebSocket macrotasks that never complete; zoneless bypasses this.
    provideZonelessChangeDetection(),
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
