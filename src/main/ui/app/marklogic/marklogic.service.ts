import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptionsArgs, Response } from '@angular/http';
import { Breakpoint } from './breakpoint';

import * as _ from 'lodash';

@Injectable()
export class MarkLogicService {

  constructor(private http: Http) {}

  getServers() {
    return this.get('/api/servers');
  }

  enableServer(serverId) {
    return this.http.get('/api/servers/' + serverId + '/enable');
  }

  disableServer(serverId) {
    return this.http.get('/api/servers/' + serverId + '/disable');
  }

  getFiles(serverId) {
    return this.get('/api/servers/' + serverId + '/files');
  }

  getSystemFiles() {
    return this.get('/api/marklogic/files');
  }

  getFile(serverId, uri) {
    let options: RequestOptionsArgs = {
      headers: new Headers({'Accept': 'text/plain'})
    };
    const url = '/api/servers/' + serverId + '/file?uri=' + uri;
    return this.http.get(url, options).map((resp: Response) => {
      return resp.text();
    });
  }

  getServerEnabled(serverId) {
    return this.get(`/api/servers/${serverId}`);
  }

  getAttached(serverId) {
    return this.get(`/api/servers/${serverId}/attached`);
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

  getAllBreakpoints(server: string): Map<string, Array<Breakpoint>> {
    return JSON.parse(localStorage.getItem(`breakpoints-${server}`)) || new Map<string, Array<Breakpoint>>();
  }

  getBreakpoints(server: string, uri: string): Array<Breakpoint> {
    let breakpoints = this.getAllBreakpoints(server);
    return breakpoints[uri] || new Array<Breakpoint>();
  }

  enableBreakpoint(server: string, uri: string, line: number) {
    let breakpoints = this.getBreakpoints(server, uri);
    breakpoints.push(new Breakpoint(uri, line, true));
    this.setBreakpoints(server, uri, breakpoints);
  }

  toggleBreakpoint(server: string, uri: string, line: number) {
    let breakpoints = this.getBreakpoints(server, uri);
    let breakpoint = _.find(breakpoints, (breakpoint: Breakpoint) => {
      return breakpoint.uri === uri && breakpoint.line === line;
    });
    if (breakpoint) {
      breakpoint.enabled = !breakpoint.enabled;
      this.setBreakpoints(server, uri, breakpoints);
    }
  }

  disableBreakpoint(server: string, uri: string, line: number) {
    let breakpoints: Array<Breakpoint> = this.getBreakpoints(server, uri);
    _.remove(breakpoints, (bp) => { return bp.line === line; });
    if (breakpoints.length > 0) {
      this.setBreakpoints(server, uri, breakpoints);
    } else {
      this.removeBreakpoints(server, uri);
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

  private setBreakpoints(server: string, uri, breakpoints: Array<Breakpoint>) {
    let allBreakpoints = this.getAllBreakpoints(server);
    allBreakpoints[uri] = breakpoints;
    this.saveBreakpoints(server, allBreakpoints);
  }

  private removeBreakpoints(server: string, uri) {
    let allBreakpoints = this.getAllBreakpoints(server);
    delete allBreakpoints[uri];
    this.saveBreakpoints(server, allBreakpoints);
  }


  private saveBreakpoints(server: string, breakpoints: Map<string, Array<Breakpoint>>) {
    localStorage.setItem(`breakpoints-${server}`, JSON.stringify(breakpoints));
  }
}
