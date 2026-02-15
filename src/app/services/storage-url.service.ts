import { Injectable, Injector, inject, runInInjectionContext, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Storage, ref, getDownloadURL } from '@angular/fire/storage';
import { Observable, from, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StorageUrlService {
  private injector = inject(Injector);
  private platformId = inject(PLATFORM_ID);

  constructor(private storage: Storage) {}

  /**
   * Resolves a storage path or absolute URL to a download URL
   * @param pathOrUrl - Either a storage object path (e.g., "portfolio/image.jpg") or absolute URL
   * @returns Observable<string> - The resolved download URL
   */
  resolveUrl(pathOrUrl: string): Observable<string> {
    // Skip Storage API calls on server -- images will resolve on the client after hydration
    if (isPlatformServer(this.platformId)) {
      return of('');
    }

    // If it's already an absolute URL, return as-is
    if (this.isAbsoluteUrl(pathOrUrl)) {
      return of(pathOrUrl);
    }

    // If it's an object path, resolve to download URL
    return this.getDownloadUrl(pathOrUrl);
  }

  /**
   * Gets download URL for a storage object path
   * @param path - Storage object path (e.g., "portfolio/image.jpg")
   * @returns Observable<string> - The download URL
   */
  getDownloadUrl(path: string): Observable<string> {
    const storageRef = ref(this.storage, path);
    return from(runInInjectionContext(this.injector, () => getDownloadURL(storageRef))).pipe(
      catchError((error) => {
        console.error(`[StorageUrlService] Failed to resolve "${path}":`, error?.message || error);
        return of('');
      })
    );
  }

  /**
   * Synchronous version of resolveUrl for immediate use
   * @param pathOrUrl - Either a storage object path or absolute URL
   * @returns Promise<string> - The resolved download URL
   */
  async resolveUrlAsync(pathOrUrl: string): Promise<string> {
    if (this.isAbsoluteUrl(pathOrUrl)) {
      return pathOrUrl;
    }

    try {
      const storageRef = ref(this.storage, pathOrUrl);
      return await runInInjectionContext(this.injector, () => getDownloadURL(storageRef));
    } catch (error) {
      return '';
    }
  }

  /**
   * Extracts object path from Firebase Storage absolute URL
   * @param url - Absolute Firebase Storage URL
   * @returns string - Object path (e.g., "portfolio/image.jpg")
   */
  extractPathFromUrl(url: string): string {
    if (!this.isFirebaseStorageUrl(url)) {
      return url; // Return as-is if not a Firebase Storage URL
    }

    try {
      // Parse Firebase Storage URL to extract object path
      // Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/v0\/b\/[^\/]+\/o\/(.+)/);
      
      if (pathMatch && pathMatch[1]) {
        // Decode URL-encoded path
        return decodeURIComponent(pathMatch[1]);
      }
      
      return url;
    } catch (error) {
      return url;
    }
  }

  /**
   * Checks if a string is an absolute URL
   * @param str - String to check
   * @returns boolean
   */
  private isAbsoluteUrl(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if URL is a Firebase Storage URL
   * @param url - URL to check
   * @returns boolean
   */
  private isFirebaseStorageUrl(url: string): boolean {
    return url.includes('firebasestorage.googleapis.com') || 
           url.includes('firebasestorage.app') ||
           url.includes('appspot.com');
  }

  /**
   * Converts absolute URL to object path (for migration purposes)
   * @param url - Absolute Firebase Storage URL
   * @returns string - Object path
   */
  urlToPath(url: string): string {
    return this.extractPathFromUrl(url);
  }

  /**
   * Batch resolve multiple paths/URLs
   * @param pathsOrUrls - Array of paths or URLs to resolve
   * @returns Promise<string[]> - Array of resolved download URLs
   */
  async batchResolveUrls(pathsOrUrls: string[]): Promise<string[]> {
    const promises = pathsOrUrls.map(pathOrUrl => this.resolveUrlAsync(pathOrUrl));
    return Promise.all(promises);
  }
}