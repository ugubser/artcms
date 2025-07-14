// Production environment configuration
// Firebase credentials will be injected during build via environment variables
// See .env.example for required environment variables

declare const process: any;

export const environment = {
  production: true,
  useEmulators: false,
  firebase: {
    apiKey: process.env['FIREBASE_API_KEY'] || '',
    authDomain: process.env['FIREBASE_AUTH_DOMAIN'] || '',
    projectId: process.env['FIREBASE_PROJECT_ID'] || '',
    storageBucket: process.env['FIREBASE_STORAGE_BUCKET'] || '',
    messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID'] || '',
    appId: process.env['FIREBASE_APP_ID'] || ''
  }
};