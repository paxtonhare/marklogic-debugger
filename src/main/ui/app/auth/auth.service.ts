import { Injectable, EventEmitter } from '@angular/core';
import { Headers, Http, RequestOptions, Response } from '@angular/http';

import { AuthModel } from './auth.model';

@Injectable()
export class AuthService {
  authenticated: EventEmitter<any> = new EventEmitter();
  redirectUrl: string;

  AUTH_HOST: string = '_authed_host_';
  AUTH_PORT: string = '_authed_port_';

  constructor(private http: Http) {}

  isAuthenticated() {
    return localStorage.getItem('_isAuthenticated_') === 'true';
  }

  get hostname() : string {
    return localStorage.getItem(this.AUTH_HOST);
  }

  get port() : number {
    return parseInt(localStorage.getItem(this.AUTH_PORT), 10);
  }

  setAuthenticated(authed: boolean, hostname: string, port: number) {
    localStorage.setItem('_isAuthenticated_', authed.toString());
    if (hostname) {
      localStorage.setItem(this.AUTH_HOST, hostname);
    } else {
      localStorage.removeItem(this.AUTH_HOST);
    }

    if (port) {
      localStorage.setItem(this.AUTH_PORT, port.toString());
    } else {
      localStorage.removeItem(this.AUTH_PORT);
    }
    this.authenticated.emit(authed);
  }

  checkServer(authInfo: AuthModel) {
    return this.http.get(`/api/server/status?host=${authInfo.hostname}&port=${authInfo.port}`).map((resp: Response) => {
      return resp.json();
    });
  }

  login(authInfo: AuthModel) {
    const body = this.formData({
      username: authInfo.username,
      password: authInfo.password,
      hostname: authInfo.hostname,
      port: authInfo.port
    });
    let headers = new Headers();
    headers.set('Content-Type', 'application/x-www-form-urlencoded');
    let options = new RequestOptions({
      headers: headers,
      method: 'POST'
    });
    let resp = this.http.post('/api/user/login', body, options).share();
    resp.subscribe(() => {
      this.setAuthenticated(true, authInfo.hostname, authInfo.port);
    },
    (error) => {});
    return resp;
  }

  formData(data) {
    return Object.keys(data).map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
    }).join('&');
  }

  logout() {
    let resp = this.http.delete('/api/user/logout').share();
    resp.subscribe(() => {
      this.setAuthenticated(false, null, null);
    });
    return resp;
  }
}
