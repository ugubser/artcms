import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private googleProvider = new GoogleAuthProvider();

  // Admin users whitelist - injected from environment variables
  private readonly adminEmails: string[] = this.getAdminEmails();

  private getAdminEmails(): string[] {
    if (environment.adminEmails) {
      return environment.adminEmails.split(',').map((email: string) => email.trim());
    }
    return [];
  }

  constructor(private auth: Auth) {
    // Monitor auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);
    });
  }

  async signIn(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signInWithGoogle(): Promise<void> {
    try {
      const result = await signInWithPopup(this.auth, this.googleProvider);
      const user = result.user;
      
      // Check if user is authorized admin
      if (!this.isAdminUser(user)) {
        await this.signOut();
        throw new Error('Unauthorized: Admin access required');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  isAdminUser(user: User | null = null): boolean {
    const currentUser = user || this.getCurrentUser();
    if (!currentUser?.email) return false;
    
    return this.adminEmails.includes(currentUser.email as string);
  }

  isAuthenticatedAdmin(): boolean {
    return this.isAuthenticated() && this.isAdminUser();
  }
}