import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  constructor(
    private authService: AuthService,
    private router: Router) {}

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['login']);
    });
  }
}
