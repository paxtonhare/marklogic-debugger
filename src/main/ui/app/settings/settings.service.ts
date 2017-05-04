import { Injectable } from '@angular/core';

@Injectable()
export class SettingsService {

  constructor() { }

  get hideDebuggerRequests(): boolean {
    // return this._value;
    let value = localStorage.getItem('_hide_debugger_requests');
    if (value) {
      return value === 'true';
    }

    return true;
  };

  set hideDebuggerRequests(hide: boolean) {
    localStorage.setItem('_hide_debugger_requests', JSON.stringify(hide));
  }

}
