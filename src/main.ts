import { bootstrapApplication } from '@angular/platform-browser';
import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const browserConfig = {
  ...appConfig,
  providers: [
    provideBrowserGlobalErrorListeners(),
    ...appConfig.providers,
  ]
};

bootstrapApplication(App, browserConfig)
  .catch((err) => console.error(err));
