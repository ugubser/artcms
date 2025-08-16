import { Injectable } from '@angular/core';
import { Storage, ref, getDownloadURL } from '@angular/fire/storage';
import { Observable, from, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StorageUrlService {

  constructor(private storage: Storage) {}

  /**
   * Resolves a storage path or absolute URL to a download URL
   * @param pathOrUrl - Either a storage object path (e.g., "portfolio/image.jpg") or absolute URL
   * @returns Observable<string> - The resolved download URL
   */
  resolveUrl(pathOrUrl: string): Observable<string> {
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
    return from(getDownloadURL(storageRef)).pipe(
      catchError((error) => {
        console.error(`Failed to get download URL for path: ${path}`, error);
        // Return a placeholder or empty string on error
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
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error(`Failed to get download URL for path: ${pathOrUrl}`, error);
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
      console.error('Failed to extract path from URL:', url, error);
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