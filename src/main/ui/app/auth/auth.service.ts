import { Injectable, EventEmitter } from '@angular/core';
import { Headers, Http, RequestOptions } from '@angular/http';

import { AuthModel } from './auth.model';

@Injectable()
export class AuthService {
  authenticated: EventEmitter<any> = new EventEmitter();
  redirectUrl: string;

  constructor(private http: Http) {}

  isAuthenticated() {
    return localStorage.getItem('_isAuthenticated_') === 'true';
  }

  setAuthenticated(authed: boolean) {
    localStorage.setItem('_isAuthenticated_', authed.toString());
    this.authenticated.emit(authed);
  }

  login(authInfo: AuthModel) {
    // const params = `username=${authInfo.username}&password=${authInfo.password}&hostname=${authInfo.hostname}`;

    const body = this.formData({ username: authInfo.username, password: authInfo.password, hostname: authInfo.hostname });
    let headers = new Headers();
    headers.set('Content-Type', 'application/x-www-form-urlencoded');
    let options = new RequestOptions({
      headers: headers,
      method: 'POST'
    });
    let resp = this.http.post('/api/user/login', body, options).share();
    resp.subscribe(() => {
      this.setAuthenticated(true);
    });
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
