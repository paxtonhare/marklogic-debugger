import { Component } from '@angular/core';
import { AuthService } from './auth';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private authService: AuthService) {}

  isAuthenticated() {
    return this.authService.isAuthenticated();
  }
}
