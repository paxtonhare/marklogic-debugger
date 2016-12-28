import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthModel, AuthService } from '../auth';
import { MarkLogicService } from '../marklogic';

@Component({
  selector: 'app-login-form',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  authInfo: AuthModel = new AuthModel('localhost', 'admin', 'admin');
  appServers: Array<any>;
  currentServer: any;

  constructor(
    private authService: AuthService,
    private marklogicService: MarkLogicService,
    private router: Router) {}

  login(): void {
    this.authService.login(this.authInfo).subscribe(() => {
      this.marklogicService.getServers().subscribe((servers) => {
        this.appServers = servers;
      });
    });
  }


  selectServer(server) {
    this.currentServer = server;

  }

  startDebugging() {
    this.router.navigate(['server', this.currentServer.name]);
  }
}
