/**
 * Storage URL Resolver Utility
 * 
 * Provides URL resolution logic for Firebase Storage paths, compatible with both
 * production and emulator environments. This mirrors the logic from StorageUrlService.
 */

const admin = require('firebase-admin');
const { initializeApp, getApps } = require('firebase/app');
const { getStorage, ref, getDownloadURL, connectStorageEmulator } = require('firebase/storage');

class StorageUrlResolver {
  constructor(options = {}) {
    this.bucket = options.bucket;
    this.isEmulator = options.isEmulator || false;
    this.emulatorHost = options.emulatorHost || 'localhost:9199';
    
    // Initialize client SDK for emulator if needed
    if (this.isEmulator) {
      this.initializeClientSDK(options);
    }
  }
  
  initializeClientSDK(options) {
    try {
      // Check if client app already exists
      const apps = getApps();
      let clientApp;
      
      if (apps.length === 0) {
        // Initialize client SDK with same config as Angular app
        clientApp = initializeApp({
          projectId: options.projectId || 'tribecaconcepts-9c',
          storageBucket: this.bucket
        }, 'storage-resolver');
      } else {
        clientApp = apps[0];
      }
      
      this.clientStorage = getStorage(clientApp);
      
      // Connect to emulator
      const [host, port] = this.emulatorHost.split(':');
      connectStorageEmulator(this.clientStorage, host, parseInt(port));
      
      console.log('✅ Client SDK initialized for emulator');
    } catch (error) {
      console.warn('Failed to initialize client SDK:', error.message);
      this.clientStorage = null;
    }
  }

  /**
   * Resolves a storage path or absolute URL to a download URL
   * @param {string} pathOrUrl - Either a storage object path or absolute URL
   * @returns {Promise<string>} - The resolved download URL
   */
  async resolveUrl(pathOrUrl) {
    // If it's already an absolute URL, return as-is
    if (this.isAbsoluteUrl(pathOrUrl)) {
      return pathOrUrl;
    }

    // If it's an object path, resolve to download URL
    return this.getDownloadUrl(pathOrUrl);
  }

  /**
   * Gets download URL for a storage object path
   * @param {string} path - Storage object path (e.g., "portfolio/image.jpg")
   * @returns {Promise<string>} - The download URL
   */
  async getDownloadUrl(path) {
    try {
      if (this.isEmulator && this.clientStorage) {
        // For emulator: Use client SDK getDownloadURL (same as Angular app)
        const storageRef = ref(this.clientStorage, path);
        const url = await getDownloadURL(storageRef);
        console.log(`🔧 EMULATOR URL (Client SDK): ${url}`);
        return url;
      } else {
        // For production: Use Firebase Admin SDK getSignedUrl
        const bucket = admin.storage().bucket(this.bucket);
        const file = bucket.file(path);
        
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-09-2491' // Far future date
        });
        console.log(`🌐 PRODUCTION URL (Admin SDK): ${url}`);
        return url;
      }
    } catch (error) {
      console.warn(`Failed to get download URL for path: ${path}`, error.message);
      return '';
    }
  }

  /**
   * Extracts object path from Firebase Storage absolute URL
   * @param {string} url - Absolute Firebase Storage URL
   * @returns {string} - Object path
   */
  extractPathFromUrl(url) {
    if (!this.isFirebaseStorageUrl(url)) {
      return url; // Return as-is if not a Firebase Storage URL
    }

    try {
      // Parse Firebase Storage URL to extract object path
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/v0\/b\/[^\/]+\/o\/(.+)/);
      
      if (pathMatch && pathMatch[1]) {
        // Decode URL-encoded path
        return decodeURIComponent(pathMatch[1]);
      }
      
      return url;
    } catch (error) {
      console.warn('Failed to extract path from URL:', url, error.message);
      return url;
    }
  }

  /**
   * Checks if a string is an absolute URL
   * @param {string} str - String to check
   * @returns {boolean}
   */
  isAbsoluteUrl(str) {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if URL is a Firebase Storage URL
   * @param {string} url - URL to check
   * @returns {boolean}
   */
  isFirebaseStorageUrl(url) {
    return url.includes('firebasestorage.googleapis.com') || 
           url.includes('firebasestorage.app') ||
           url.includes('appspot.com') ||
           url.includes('localhost:9199'); // Include emulator
  }

  /**
   * Batch resolve multiple paths/URLs
   * @param {string[]} pathsOrUrls - Array of paths or URLs to resolve
   * @returns {Promise<string[]>} - Array of resolved download URLs
   */
  async batchResolveUrls(pathsOrUrls) {
    const promises = pathsOrUrls.map(pathOrUrl => this.resolveUrl(pathOrUrl));
    return Promise.all(promises);
  }

  /**
   * Static factory method to create resolver from environment
   * @param {object} envVars - Environment variables
   * @param {boolean} isEmulator - Whether using emulator
   * @returns {StorageUrlResolver}
   */
  static createFromEnv(envVars, isEmulator = false) {
    const bucket = envVars.FIREBASE_STORAGE_BUCKET || envVars.FIREBASE_PROJECT_ID + '.appspot.com';
    const emulatorHost = envVars.FIREBASE_STORAGE_EMULATOR_HOST || 'localhost:9199';

    return new StorageUrlResolver({
      bucket,
      isEmulator,
      emulatorHost,
      projectId: envVars.FIREBASE_PROJECT_ID
    });
  }
}

module.exports = StorageUrlResolver;