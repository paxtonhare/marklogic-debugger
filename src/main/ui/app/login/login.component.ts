import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthModel, AuthService } from '../auth';
import { MarkLogicService } from '../marklogic';

import * as _ from 'lodash';

@Component({
  selector: 'app-login-form',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  authInfo: AuthModel = new AuthModel('localhost', 8000, 'admin', 'admin');
  appServers: Array<any>;
  modulesDbs: Array<any>;
  currentServer: any;
  currentModulesDb: any;
  modulesRoot: string;
  invalidLogin: boolean = false;
  serverOk: boolean = false;

  constructor(
    private authService: AuthService,
    private marklogicService: MarkLogicService,
    private router: Router) {
    this.checkServer();
    this.currentServer = this.marklogicService.currentServer;
    this.currentModulesDb = this.marklogicService.currentModulesDb;
    this.modulesRoot = this.marklogicService.modulesRoot;
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
      this.startDebugging();
    },
    (error: any) => {
      if (error.status === 401) {
        this.invalidLogin = true;
      }
    });
  }

  selectServer(server) {
    this.currentServer = server;
    if (this.modulesDbs) {
      this.currentModulesDb = _.find(this.modulesDbs, (db) => {
        return _.includes(db.appserverIds, server.id);
      });
    }
  }

  selectModulesDb(modulesDb) {
    this.currentModulesDb = modulesDb;
  }

  selectRootPath(modulesRoot) {
    this.modulesRoot = modulesRoot;
  }

  startDebugging() {
    this.router.navigate(['server']);
  }
}
