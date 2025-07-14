import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private auth: Auth,
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    // In development mode, allow access for testing
    if (!environment.production && environment.useEmulators) {
      console.log('Development mode: allowing admin access');
      return true;
    }
    
    // Production mode: check authentication immediately
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser && this.authService.isAdminUser(currentUser)) {
      console.log('Authenticated admin user, allowing access');
      return true;
    } else {
      console.log('Access denied: requires authenticated admin user');
      this.router.navigate(['/admin/login']);
      return false;
    }
  }
}