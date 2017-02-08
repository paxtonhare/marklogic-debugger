import { Injectable, EventEmitter } from '@angular/core';
import { Headers, Http, RequestOptions, Response } from '@angular/http';

import { AuthModel } from './auth.model';

@Injectable()
export class AuthService {
  authenticated: EventEmitter<any> = new EventEmitter();
  redirectUrl: string;

  constructor(private http: Http) {}

  isAuthenticated() {
    return localStorage.getItem('_isAuthenticated_') === 'true';
  }

  get hostname() : string {
    return localStorage.getItem('_authed_host_');
  }

  get port() : number {
    return parseInt(localStorage.getItem('_authed_port_'), 10);
  }

  setAuthenticated(authed: boolean, hostname: string, port: number) {
    localStorage.setItem('_isAuthenticated_', authed.toString());
    localStorage.setItem('_authed_host_', hostname);
    localStorage.setItem('_authed_port_', port.toString());
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

  // login(authInfo: AuthModel) {
  //   const params = {
  //     hostname: authInfo.hostname,
  //     username: authInfo.username,
  //     password: authInfo.password,
  //   };

  //   let resp = this.http.post('/api/user/login', params).share();
  //   resp.subscribe(() => {
  //     this.setAuthenticated(true);
  //   });
  //   return resp;
  // }

  logout() {
    let resp = this.http.delete('/api/user/logout').share();
    resp.subscribe(() => {
      this.setAuthenticated(false);
    });
    return resp;
  }
}
