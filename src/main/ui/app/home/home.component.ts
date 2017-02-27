import { Component, EventEmitter, OnInit, OnDestroy, ViewChild } from '@angular/core';
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
  requests: any;
  currentUri: string;
  currentLine: number;
  currentRequest: any;
  currentStackPosition: number;
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
  welcomeShown: boolean = false;

  breakpointsSet: boolean = false;

  @ViewChild('consoleInputCtrl') consoleInputCtrl;

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

      if (!this.appservers || !this.selectedServer) {
        this.marklogic.getServers().subscribe((servers: any) => {
          this.appservers = servers;
          if (this.appserverName) {
            let server = _.find(this.appservers, (appserver) => { return appserver.name === this.appserverName; });
            if (server) {
              this.selectedServer = server;
              this.showFiles();
              this.getRequests();
              this.getBreakpoints();
            }
          }

          this.updateStack();
        },
        () => {
          this.router.navigate(['login']);
        });
      }
      else {
        this.getRequests();
        this.updateStack();
      }
    });

    if (!this.welcomeShown && localStorage.getItem('_show_welcome_') !== 'false') {
      this.showWelcome();
      this.welcomeShown = true;
    }

  }

  updateStack() {
    if (this.requestId) {
      this.marklogic.getRequest(this.selectedServer.id, this.requestId).subscribe((request) => {
        this.currentRequest = request;
        this.getStack(this.requestId);
      });
    } else {
      this.currentRequest = null;
      this.fileBreakpoints = null;
      this.currentLine = null;
      this.showLine = null;
      this.currentUri = null;
    }
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

  getRequests() {
    this.marklogic.getRequests(this.selectedServer.id).subscribe((requests: any) => {
      this.requests = requests;
      if (this.requests === null || this.requests.length === 0) {
        this.router.navigate(['server', this.appserverName]);
      }
    },() => {
      this.requests = null;
    });
  }

  getStack(requestId) {
    this.marklogic.getStack(requestId).subscribe((stack: any) => {
      this.stack = stack;
      if (this.stack && this.stack.frames && this.stack.frames.length > 0) {
        this.showFile(this.stack.frames[0], 0);
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
      this.stack.frames[this.currentStackPosition] &&
      (
        (
          this.stack.frames[this.currentStackPosition].variables &&
          this.stack.frames[this.currentStackPosition].variables.length > 0
        ) ||
        (
          this.stack.frames[this.currentStackPosition].externalVariables &&
          this.stack.frames[this.currentStackPosition].externalVariables.length > 0
        ) ||
        (
          this.stack.frames[this.currentStackPosition].globalVariables &&
          this.stack.frames[this.currentStackPosition].globalVariables.length > 0
        )
      );
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
  }

  continueRequest(requestId) {
    this.marklogic.continue(requestId).subscribe(() => {
      this.getRequests();
    });
  }

  pauseRequest(requestId) {
    this.marklogic.pause(requestId).subscribe(() => {
      this.debugRequest(requestId);
    });
  }

  setBreakpoints() {
    let keys: Array<string>;
    if (this.breakpoints) {
      keys = Array.from(this.breakpoints.keys());
    }

    if (!this.breakpointsSet && keys && keys.length > 0) {
      this.breakpointsSet = true;
      let breakpoints = new Array<Breakpoint>();
      for (let key of keys) {
        for (let bps of this.breakpoints.get(key)) {
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
    const info = cm.lineInfo(line);
    this.breakpointsSet = false;
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
    this.breakpointUris = Array.from(this.breakpoints.keys());
    if (this.currentUri) {
      this.fileBreakpoints = this.marklogic.getBreakpoints(this.selectedServer.name, this.currentUri);
    } else {
      this.fileBreakpoints = null;
    }
  }

  toggleBreakpoint(breakpoint: Breakpoint) {
    this.breakpointsSet = false;
    this.marklogic.toggleBreakpoint(this.selectedServer.name, breakpoint.uri, breakpoint.line);
    this.getBreakpoints();
  }

  disableBreakpoint(breakpoint: Breakpoint) {
    this.breakpointsSet = false;
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

  showEval(frame, index: number) {
    this.currentLine = null;
    this.showLine = null;
    if (this.currentRequest) {
      this.currentUri = '/eval';
      this.fileText = this.currentRequest.requestText;
      this.currentLine = frame.line;
      this.currentStackPosition = index;
      this.getBreakpoints();
      if (this.stack.expressions && this.stack.expressions.length > 0) {
        if (index === 0) {
          this.currentExpression = this.stack.expressions[index].expressionSource;
        }
        else {
          this.currentExpression = null;
        }
      }
    }
  }

  showFile(frame: any, index: number) {
    if (frame.uri === '/eval') {
      this.showEval(frame, index);
    } else {
      this.currentLine = null;
      this.showLine = null;
      this.marklogic.getFile(this.selectedServer.id, frame.uri).subscribe((txt: any) => {
        this.currentUri = frame.uri;
        this.fileText = txt;
        this.currentLine = frame.line;
        this.currentStackPosition = index;
        this.getBreakpoints();
        if (this.stack.expressions && this.stack.expressions.length > 0) {
          if (index === 0) {
            this.currentExpression = this.stack.expressions[index].expressionSource;
          }
          else {
            this.currentExpression = null;
          }
        }
      });
    }
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

  invokeModule(uri: string) {
    this.marklogic.invokeModule(this.selectedServer.id, uri).subscribe(() => {
      setTimeout(() => {
        this.getRequests();
      }, 1000);
    });
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

  clearConsole($event: MouseEvent) {
    this.consoleOutput = [];
    $event.preventDefault();
    $event.stopPropagation();
  }

  focusConsole($event) {
    this.consoleInputCtrl.nativeElement.focus();
  }

  getRequestName(request) {
    let name;
    if (request.requestKind === 'eval') {
      name = 'eval';
    } else {
      name = (request.requestRewrittenText || request.requestText);
    }
    return name;
  }
}
