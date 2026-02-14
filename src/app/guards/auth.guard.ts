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
    // Development emulator bypass - double-check this cannot leak into production.
    // The guard only bypasses when BOTH flags are set AND we are explicitly
    // NOT in production mode. Even if useEmulators were accidentally true in
    // a production build, the production flag would block this path.
    if (environment.production === false && environment.useEmulators === true) {
      return true;
    }

    const currentUser = this.authService.getCurrentUser();

    if (currentUser && this.authService.isAdminUser(currentUser)) {
      return true;
    }

    this.router.navigate(['/admin/login']);
    return false;
  }
}