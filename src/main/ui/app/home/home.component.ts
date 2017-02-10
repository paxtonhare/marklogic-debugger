import { Component, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Response } from '@angular/http';
import { MarkLogicService } from '../marklogic';
import { Breakpoint } from '../marklogic';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { AuthService } from '../auth';
import { ErrorComponent } from '../error';
import { StartupComponent } from '../help';
import { MdlDialogService, MdlDialogReference } from 'angular2-mdl';
import * as _ from 'lodash';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

  appservers: Array<any>;
  selectedServer: any;
  hostname: string;
  port: number;
  serverFiles: any;
  systemFiles: any;
  attached: any;
  currentUri: string;
  currentLine: number;
  showLine: number;
  currentExpression: string;
  fileText: string;
  breakpoints: Map<string, Array<Breakpoint>>;
  breakpointUris: Array<string>;
  fileBreakpoints: Array<Breakpoint>;
  requestId: string;
  appserverName: any;
  stack: any;
  consoleInput: string;
  consoleOutput: Array<any> = [];
  commandHistory: Array<string> = [];
  commandHistoryIndex: number = -1;

  breakpointsSet: boolean = false;

  codeMirrorConfig = {
    lineNumbers: true,
    indentWithTabs: true,
    lineWrapping: true,
    readOnly: true,
    cursorBlinkRate: 0,
    gutters: ['CodeMirror-linenumbers', 'breakpoints', 'currentlines'],
    events: {
      gutterClick: this.gutterClick.bind(this),
      gutterContextMenu: this.gutterContextMenu.bind(this)
    }
  };

  private sub: any;
  private sub2: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private dialogService: MdlDialogService,
    private marklogic: MarkLogicService) {
    this.hostname = authService.hostname;
    this.port = authService.port;
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.appserverName = params['appserverName'];
    });

    this.sub2 = this.route.queryParams.subscribe(params => {
      this.breakpointsSet = false;
      this.requestId = params['requestId'];

      if (!this.appserverName) {
        this.router.navigate(['login']);
      }

      this.marklogic.getServers().subscribe((servers: any) => {
        this.appservers = servers;
        if (this.appserverName) {
          let server = _.find(this.appservers, (appserver) => { return appserver.name === this.appserverName; });
          if (server) {
            this.selectedServer = server;
            this.showFiles();
            this.getAttached();
            this.getBreakpoints();
          }
        }

        if (this.requestId) {
          this.getStack(this.requestId);
        } else {
          this.fileBreakpoints = null;
          this.currentLine = null;
          this.showLine = null;
          this.currentUri = null;
        }

        if (localStorage.getItem('_show_welcome_') !== 'false') {
          this.showWelcome();
        }

      },
      () => {
        this.router.navigate(['login']);
      });
    });
  }

  showWelcome() {
    this.dialogService.showCustomDialog({
      component: StartupComponent,
      isModal: true
    });
  }

  handleDebugError(error: Response) {
    if (error.status === 404 && error.text() === 'Request ID not found') {
      let res = this.dialogService.alert(`The current Request: ${this.requestId} is no longer available.`);
      res.subscribe(() => {
        this.router.navigate(['server', this.appserverName]);
      });
    }
  }

  openNewIssue() {
    window.open('https://github.com/paxtonhare/marklogic-debugger/issues/new', '_blank');
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    this.sub2.unsubscribe();
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['login']);
    });
  }

  getAttached() {
    this.marklogic.getAttached(this.selectedServer.id).subscribe((attached: any) => {
      this.attached = attached;
    },() => {
      this.attached = null;
    });
  }

  getStack(requestId) {
    this.marklogic.getStack(requestId).subscribe((stack: any) => {
      this.stack = stack;
      if (this.stack && this.stack.frames && this.stack.frames.length > 0) {
        const frame = this.stack.frames[0];
        this.showFile(frame.uri, frame.line);
      }
    }, () => {
      this.router.navigate(['server', this.appserverName]);
    });
  }

  hasFrames() {
    return this.stack &&
      this.stack.frames &&
      this.stack.frames.length > 0;
  }

  hasVariables() {
    return this.stack &&
      this.stack.frames &&
      this.stack.frames[0] &&
      this.stack.frames[0].variables &&
      this.stack.frames[0].variables.length > 0;
  }

  debugRequest(requestId) {
    let navigationExtras: NavigationExtras = {
      queryParams: { 'requestId': requestId }
    };

    this.router.navigate(['server', this.appserverName], navigationExtras);
  }

  stepOver() {
    this.setBreakpoints().subscribe(() => {
      this.marklogic.stepOver(this.requestId).subscribe(() => {
        this.getStack(this.requestId);
      });
    },
    (error) => {
      this.handleDebugError(error)
    });
    this.isServerEnabled();
  }

  stepIn() {
    this.setBreakpoints().subscribe(() => {
      this.marklogic.stepIn(this.requestId).subscribe(() => {
        this.getStack(this.requestId);
      });
    },
    (error) => {
      this.handleDebugError(error)
    });
    this.isServerEnabled();
  }

  stepOut() {
    this.setBreakpoints().subscribe(() => {
      this.marklogic.stepOut(this.requestId).subscribe(() => {
        this.getStack(this.requestId);
      });
    },
    (error) => {
      this.handleDebugError(error)
    });
    this.isServerEnabled();
  }

  continue() {
    this.setBreakpoints().subscribe((x: any) => {
      this.marklogic.continue(this.requestId).subscribe(() => {
        this.getStack(this.requestId);
      });
    },
    (error) => {
      this.handleDebugError(error)
    });
    this.isServerEnabled();
  }

  continueRequest(requestId) {
    this.marklogic.continue(requestId).subscribe(() => {
      this.getAttached();
    });
  }

  setBreakpoints() {
    if (!this.breakpointsSet && Object.keys(this.breakpoints).length > 0) {
      this.breakpointsSet = true;
      let breakpoints = new Array<Breakpoint>();
      let keys = Object.keys(this.breakpoints);
      for (let key of keys) {
        for (let bps of this.breakpoints[key]) {
          breakpoints.push(bps);
        }
      }
      return this.marklogic.sendBreakpoints(this.requestId, breakpoints);
    }

    return Observable.of({});
  }

  gutterContextMenu(cm: any, line: number, gutter: string, clickEvent: MouseEvent) {
    clickEvent.preventDefault();
    clickEvent.stopPropagation();
  }

  gutterClick(cm: any, line: number, gutter: string, clickEvent: MouseEvent) {
    console.log(clickEvent);
    const info = cm.lineInfo(line);
    if (info.gutterMarkers && info.gutterMarkers.breakpoints && clickEvent.which === 3) {
      this.marklogic.disableBreakpoint(this.selectedServer.name, this.currentUri, line);
    } else if (info.gutterMarkers && info.gutterMarkers.breakpoints) {
      this.marklogic.toggleBreakpoint(this.selectedServer.name, this.currentUri, line);
    } else {
      this.marklogic.enableBreakpoint(this.selectedServer.name, this.currentUri, line);
    }
    this.getBreakpoints();
  }

  getBreakpoints() {
    this.breakpoints = this.marklogic.getAllBreakpoints(this.selectedServer.name);
    this.breakpointUris = Object.keys(this.breakpoints);
    if (this.currentUri) {
      this.fileBreakpoints = this.marklogic.getBreakpoints(this.selectedServer.name, this.currentUri);
    } else {
      this.fileBreakpoints = null;
    }
  }

  toggleBreakpoint(breakpoint: Breakpoint) {
    this.marklogic.toggleBreakpoint(this.selectedServer.name, breakpoint.uri, breakpoint.line);
    this.getBreakpoints();
  }

  disableBreakpoint(breakpoint: Breakpoint) {
    this.marklogic.disableBreakpoint(this.selectedServer.name, breakpoint.uri, breakpoint.line);
    this.getBreakpoints();
  }

  toggleConnected(server) {
    return server.connected ? this.enableServer(server) : this.disableServer(server);
  }

  enableServer(server) {
    this.marklogic.enableServer(server.id).subscribe(() => {
      server.connected = true;
    });
  }

  disableServer(server) {
    this.marklogic.disableServer(server.id).subscribe(() => {
      server.connected = false;
    });
  }

  isServerEnabled() {
    this.marklogic.getServerEnabled(this.selectedServer.id).subscribe((resp) => {
      if (!resp.enabled) {
        let res = this.dialogService.alert(`Debugging is no longer enabled. Try again.`);
        res.subscribe(() => {
          this.router.navigate(['server', this.appserverName]);
        });
      }
    });
  }

  showFiles() {
    this.marklogic.getFiles(this.selectedServer.id).subscribe((files: any) => {
      this.serverFiles = files;
    });

    this.marklogic.getSystemFiles().subscribe((files: any) => {
      this.systemFiles = files;
    });
  }

  fileClicked(uri) {
    this.fileBreakpoints = null;
    this.currentLine = null;
    this.showLine = null;
    this.marklogic.getFile(this.selectedServer.id, uri).subscribe((txt: any) => {
      this.currentUri = uri;
      this.fileText = txt;
      this.getBreakpoints();
    });
  }

  gotoBreakpoint(uri: string, line: number) {
    this.fileBreakpoints = null;
    this.currentLine = null;
    this.showLine = null;
    this.marklogic.getFile(this.selectedServer.id, uri).subscribe((txt: any) => {
      this.currentUri = uri;
      this.showLine = line;
      this.fileText = txt;
      this.getBreakpoints();
    });
  }

  showFile(uri: string, line: number) {
    this.currentLine = null;
    this.showLine = null;
    this.marklogic.getFile(this.selectedServer.id, uri).subscribe((txt: any) => {
      this.currentUri = uri;
      this.fileText = txt;
      this.currentLine = line;
      this.getBreakpoints();
      if (this.stack.expressions && this.stack.expressions.length > 0) {
        this.currentExpression = this.stack.expressions[0].expressionSource;
      }
    });
  }

  consoleKeyPressed($event: KeyboardEvent) {
    if (!this.requestId) {
      return;
    }
    if ($event.keyCode === 13) {
      this.consoleOutput.push({
        txt: this.consoleInput,
        type: 'i'
      });
      this.commandHistory.push(this.consoleInput);
      this.marklogic.valueExpression(this.requestId, this.consoleInput).subscribe((output: any) => {
        if (!output.error) {
          this.consoleOutput.push({
            txt: output.resp,
            type: 'o'
          });
        } else {
          this.consoleOutput.push({
            txt: output.resp,
            type: 'e'
          });
        }
      });
      this.consoleInput = null;
      this.commandHistoryIndex = -1;
    } else if ($event.keyCode === 38) {
      if (this.commandHistoryIndex < (this.commandHistory.length - 1)) {
        this.commandHistoryIndex++;
        this.consoleInput = this.commandHistory[this.commandHistory.length - 1 - this.commandHistoryIndex];
      }
    } else if ($event.keyCode === 40) {
      if (this.commandHistoryIndex > 0) {
        this.commandHistoryIndex--;
        this.consoleInput = this.commandHistory[this.commandHistory.length - 1 - this.commandHistoryIndex];
      }
    }
  }

  showError(errorText: string) {
    this.dialogService.showCustomDialog({
      component: ErrorComponent,
      providers: [
        { provide: 'error', useValue: errorText }
      ],
      isModal: true
    });
  }

  clearConsole() {
    this.consoleOutput = [];
  }
}
