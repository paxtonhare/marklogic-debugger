import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptionsArgs, Response } from '@angular/http';
import { Breakpoint } from './breakpoint';
import { AuthService } from '../auth';

import * as _ from 'lodash';

@Injectable()
export class MarkLogicService {

  currentServer: any;
  currentModulesDb: any;
  modulesRoot: string;

  constructor(
    private http: Http,
    private auth: AuthService) {
    let parsed = JSON.parse(localStorage.getItem('_debugger_current_server'));
    if (parsed) {
      this.currentServer = parsed;
    }
  }

  getServers() {
    return this.get('/api/servers');
  }

  getModulesDbs() {
    return this.get('/api/modules-dbs');
  }

  enableServer(serverId) {
    return this.http.get(`/api/servers/${serverId}/enable`);
  }

  disableServer(serverId) {
    return this.http.get(`/api/servers/${serverId}/disable`);
  }

  getFiles(databaseId, modulesRoot) {
    return this.get(`/api/dbs/${databaseId}/files?modulesRoot=${modulesRoot}`);
  }

  getSystemFiles() {
    return this.get('/api/marklogic/files');
  }

  getFile(uri, databaseId, modulesRoot) {
    let options: RequestOptionsArgs = {
      headers: new Headers({'Accept': 'text/plain'})
    };
    const url = `/api/dbs/${databaseId}/file?uri=${uri}&modulesRoot=${modulesRoot}`;
    return this.http.get(url, options).map((resp: Response) => {
      return resp.text();
    });
  }

  getServerEnabled(serverId) {
    return this.get(`/api/servers/${serverId}`);
  }

  getRequests() {
    return this.get(`/api/requests`);
  }

  getRequest(serverId, requestId) {
    return this.get(`/api/servers/${serverId}/requests/${requestId}`);
  }

  getStack(requestId) {
    return this.get(`/api/requests/${requestId}/stack`);
  }

  stepOver(requestId: any) {
    return this.http.get(`/api/requests/${requestId}/step-over`);
  }

  stepIn(requestId: any) {
    return this.http.get(`/api/requests/${requestId}/step-in`);
  }

  stepOut(requestId: any) {
    return this.http.get(`/api/requests/${requestId}/step-out`);
  }

  continue(requestId: any) {
    return this.http.get(`/api/requests/${requestId}/continue`);
  }

  pause(requestId: any) {
    return this.http.get(`/api/requests/${requestId}/pause`);
  }

  get(url: string) {
    return this.http.get(url).map((resp: Response) => {
      return resp.json();
    });
  }

  getTrace(id: string) {
    return this.http.get('/hub/traces/' + id);
  }

  getIds(query: string) {
    return this.http.get('/hub/traces/ids?q=' + query);
  }

  getAllBreakpoints(): Map<string, Array<Breakpoint>> {
    let map = new Map<string, Array<Breakpoint>>();
    let parsed = JSON.parse(localStorage.getItem(`breakpoints`));
    if (parsed) {
      Object.keys(parsed).forEach((key) => {
        let breakpoints = new Array<Breakpoint>();
        for (let bp of parsed[key]) {
          let breakpoint = new Breakpoint(bp.uri, bp.line, bp.enabled);
          breakpoints.push(breakpoint);
        }
        map.set(key, breakpoints);
      });
    }
    return map;
  }

  getBreakpoints(uri: string): Array<Breakpoint> {
    let breakpoints = this.getAllBreakpoints();
    return breakpoints.get(uri) || new Array<Breakpoint>();
  }

  enableBreakpoint(uri: string, line: number) {
    let breakpoints = this.getBreakpoints(uri);
    breakpoints.push(new Breakpoint(uri, line, true));
    this.setBreakpoints(uri, breakpoints);
  }

  toggleBreakpoint(uri: string, line: number) {
    let breakpoints = this.getBreakpoints(uri);
    let breakpoint = _.find(breakpoints, (breakpoint: Breakpoint) => {
      return breakpoint.uri === uri && breakpoint.line === line;
    });
    if (breakpoint) {
      breakpoint.enabled = !breakpoint.enabled;
      this.setBreakpoints(uri, breakpoints);
    }
  }

  disableBreakpoint(uri: string, line: number) {
    let breakpoints: Array<Breakpoint> = this.getBreakpoints(uri);
    _.remove(breakpoints, (bp) => { return bp.line === line; });
    if (breakpoints.length > 0) {
      this.setBreakpoints(uri, breakpoints);
    } else {
      this.removeBreakpoints(uri);
    }
  }

  sendBreakpoints(requestId: any, breakpoints: Array<Breakpoint>) {
    let onOnly = _.filter(breakpoints, { enabled: true });
    return this.http.post(`/api/requests/${requestId}/breakpoints`, onOnly);
  }

  evalExpression(requestId: any, expression: string) {
    return this.http.post(`/api/requests/${requestId}/eval`, expression).map((resp: Response) => {
      return resp.text();
    });
  }

  valueExpression(requestId: any, expression: string) {
    return this.http.post(`/api/requests/${requestId}/value`, expression).map((resp: Response) => {
      return resp.json();
    });
  }

  invokeModule(serverId: string, uri: string) {
    return this.http.post(`/api/servers/${serverId}/invoke?uri=${uri}`, null);
  }

  private setBreakpoints(uri, breakpoints: Array<Breakpoint>) {
    let allBreakpoints = this.getAllBreakpoints();
    allBreakpoints.set(uri, breakpoints);
    this.saveBreakpoints(allBreakpoints);
  }

  private removeBreakpoints(uri) {
    let allBreakpoints = this.getAllBreakpoints();
    allBreakpoints.delete(uri);
    this.saveBreakpoints(allBreakpoints);
  }


  private saveBreakpoints(breakpoints: Map<string, Array<Breakpoint>>) {
    let serializeme = {};
    breakpoints.forEach((value, key) => {
      serializeme[key] = value;
    });
    localStorage.setItem(`breakpoints`, JSON.stringify(serializeme));
  }
}
