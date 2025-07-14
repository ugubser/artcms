export const environment = {
  production: false,
  useEmulators: true,
  emulatorHost: '192.168.0.22', // Change this to your machine's IP address
  firebase: {
    apiKey: "demo-api-key",
    authDomain: "tribecaconcepts-9c.firebaseapp.com",
    projectId: "tribecaconcepts-9c",
    storageBucket: "tribecaconcepts-9c.appspot.com",
    messagingSenderId: "123456789",
    appId: "demo-app-id"
  },
  adminEmails: '' // Empty for development - emulator allows all access
};