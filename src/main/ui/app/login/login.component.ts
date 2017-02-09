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
  authInfo: AuthModel = new AuthModel('localhost', 8000, 'admin', 'admin');
  appServers: Array<any>;
  currentServer: any;
  invalidLogin: boolean = false;
  serverOk: boolean = false;

  constructor(
    private authService: AuthService,
    private marklogicService: MarkLogicService,
    private router: Router) {
    this.checkServer();
  }

  updateHostname(hostname: any) {
    this.authInfo.hostname = hostname;
    this.checkServer();
  }

  updatePort(port: any) {
    this.authInfo.port = port;
    this.checkServer();
  }

  checkServer(): void {
    this.authService.checkServer(this.authInfo).subscribe((res: any) => {
      this.serverOk = res.result;
    },
    (error: any) => {
      this.serverOk = false;
    });
  }

  login(): void {
    this.invalidLogin = false;
    this.authService.login(this.authInfo).subscribe(() => {
      this.marklogicService.getServers().subscribe((servers) => {
        this.appServers = servers;
      });
    },
    (error: any) => {
      if (error.status === 401) {
        this.invalidLogin = true;
      }
    });
  }

  selectServer(server) {
    this.currentServer = server;

  }

  startDebugging() {
    this.router.navigate(['server', this.currentServer.name]);
  }
}
