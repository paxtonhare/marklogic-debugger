import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot,
         RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | boolean {
      if (this.authService.isAuthenticated()) {
        return true;
      }

      // Store the attempted URL for redirecting
      this.authService.redirectUrl = state.url;

      // Navigate to the login page
      this.router.navigate(['login']);
      return false;
  }
}
