import { Component, EventEmitter, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Response } from '@angular/http';
import { MarkLogicService } from '../marklogic';
import { SettingsService } from '../settings';
import { Breakpoint } from '../marklogic';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { AuthService } from '../auth';
import { ErrorComponent } from '../error';
import { StartupComponent } from '../help';
import { MdlDialogService, MdlDialogReference } from '@angular-mdl/core';
import * as _ from 'lodash';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

  modulesDatabases: any;
  appServers: Array<any>;
  modulesRoots: Array<string> = new Array<string>();
  modulesDb: any;
  modulesRoot: string;
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
  modulesDbName: any;
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

  private queryParamListener: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private dialogService: MdlDialogService,
    private marklogic: MarkLogicService,
    private settings: SettingsService) {
    this.hostname = authService.hostname;
    this.port = authService.port;

    this.marklogic.getModulesDbs().subscribe((databases) => {
      this.modulesDatabases = databases;
    });

    this.marklogic.getServers().subscribe((servers) => {
      this.appServers = servers;

      this.modulesRoots = new Array<string>();
      for (let server of this.appServers) {
        if (server.modulesDb === '0') {
          this.modulesRoots.push(server.root);
        }
      }
    });


  }

  ngOnInit() {
    this.showFiles();
    this.getRequests();
    this.getBreakpoints();
    this.updateStack();


    if (!this.welcomeShown && localStorage.getItem('_show_welcome_') !== 'false') {
      this.showWelcome();
      this.welcomeShown = true;
    }
  }

  reset(getRequest: boolean = true) {
      this.currentRequest = null;
      this.fileBreakpoints = null;
      this.currentLine = null;
      this.showLine = null;
      this.currentUri = null;
      this.stack = null;
      this.fileText = null;
      if (getRequest) {
        this.getRequests();
      }
  }

  updateStack() {
    if (this.currentRequest) {
      this.getStack(this.currentRequest.requestId);
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
      let res = this.dialogService.alert(`The current Request: ${this.currentRequest.requestId} is no longer available.`);
      res.subscribe(() => {
        this.reset();
      });
    }
  }

  openNewIssue() {
    window.open('https://github.com/paxtonhare/marklogic-debugger/issues/new', '_blank');
  }

  ngOnDestroy() {
    if (this.queryParamListener) {
      this.queryParamListener.unsubscribe();
    }
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['login']);
    });
  }

  hideDebuggerRequests(requests) {
    if (this.settings.hideDebuggerRequests) {
      return _.filter(requests, (request: any) => {
        return !(request.requestText && request.requestText.match(/\(: marklogic-debugger-code :\)/));
      });
    }
    return requests;
  }

  getRequests() {
    this.marklogic.getRequests().subscribe((requests: any) => {
      this.requests = this.hideDebuggerRequests(requests);
      if (this.requests == null || this.requests.length === 0) {
        this.reset(false);
      }
      else if (this.currentRequest) {
        if (!_.find(this.requests, (req: any) => {
          return this.currentRequest.requestId === req.requestId;
        })) {
          this.reset(false);
        }
      }
    },() => {
      this.requests = null;
      this.reset(false);
    });
  }

  getStack(requestId) {
    this.marklogic.getStack(requestId).subscribe((stack: any) => {
      this.stack = stack;
      if (this.stack && this.stack.frames && this.stack.frames.length > 0) {
        this.showFile(this.stack.frames[0], 0);
      }
    }, () => {
      this.reset();
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

  debugRequest(request) {
    if (request.isExpired) {
      return;
    }

    this.currentRequest = request;

    let modulesDb = _.find(this.modulesDatabases, (database: any) => {
      return database.name === request.modules;
    });

    if (!modulesDb) {
      modulesDb = this.modulesDb;
    }

    if (modulesDb) {
      this.modulesDb = modulesDb;
      this.modulesRoot = request.root;
      this.showFiles();
      this.currentUri = null;
      this.fileText = null;
      this.updateStack();
    }
  }

  stepOver() {
    this.setBreakpoints().subscribe(() => {
      this.marklogic.stepOver(this.currentRequest.requestId).subscribe(() => {
        this.getStack(this.currentRequest.requestId);
      });
    },
    (error) => {
      this.handleDebugError(error)
    });
  }

  stepIn() {
    this.setBreakpoints().subscribe(() => {
      this.marklogic.stepIn(this.currentRequest.requestId).subscribe(() => {
        this.getStack(this.currentRequest.requestId);
      });
    },
    (error) => {
      this.handleDebugError(error)
    });
  }

  stepOut() {
    this.setBreakpoints().subscribe(() => {
      this.marklogic.stepOut(this.currentRequest.requestId).subscribe(() => {
        this.getStack(this.currentRequest.requestId);
      });
    },
    (error) => {
      this.handleDebugError(error)
    });
  }

  continue() {
    this.setBreakpoints().subscribe((x: any) => {
      this.marklogic.continue(this.currentRequest.requestId).subscribe(() => {
        this.getStack(this.currentRequest.requestId);
      });
    },
    (error) => {
      this.handleDebugError(error)
    });
  }

  continueRequest(requestId, $event) {
    this.marklogic.continue(requestId).subscribe(() => {
      this.getRequests();
    });
    $event.preventDefault();
    $event.stopPropagation();
  }

  pauseRequest(requestId, $event) {
    this.marklogic.pause(requestId).subscribe(() => {
      this.debugRequest(requestId);
    });
    $event.preventDefault();
    $event.stopPropagation();
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
      return this.marklogic.sendBreakpoints(this.currentRequest.requestId, breakpoints);
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
      this.marklogic.disableBreakpoint(this.currentUri, line);
    } else if (info.gutterMarkers && info.gutterMarkers.breakpoints) {
      this.marklogic.toggleBreakpoint(this.currentUri, line);
    } else {
      this.marklogic.enableBreakpoint(this.currentUri, line);
    }
    this.getBreakpoints();
  }

  getBreakpoints() {
    this.breakpoints = this.marklogic.getAllBreakpoints();
    this.breakpointUris = Array.from(this.breakpoints.keys());
    if (this.currentUri !== null) {
      this.fileBreakpoints = this.marklogic.getBreakpoints(this.currentUri);
    } else {
      this.fileBreakpoints = null;
    }
  }

  toggleBreakpoint(breakpoint: Breakpoint) {
    this.breakpointsSet = false;
    this.marklogic.toggleBreakpoint(breakpoint.uri, breakpoint.line);
    this.getBreakpoints();
  }

  disableBreakpoint(breakpoint: Breakpoint) {
    this.breakpointsSet = false;
    this.marklogic.disableBreakpoint(breakpoint.uri, breakpoint.line);
    this.getBreakpoints();
  }

  toggleConnected(server: any) {
    return server.connected ? this.enableServer(server) : this.disableServer(server);
  }

  enableServer(server: any) {
    this.marklogic.enableServer(server.id).subscribe(() => {
      server.connected = true;
    });
  }

  disableServer(server: any) {
    this.marklogic.disableServer(server.id).subscribe(() => {
      server.connected = false;
    });
  }

  showFiles() {
    if (this.modulesDb && this.modulesRoot) {
      this.marklogic.getFiles(this.modulesDb.id, this.modulesRoot).subscribe((files: any) => {
        this.serverFiles = files;
      });

      if (!this.systemFiles) {
        this.marklogic.getSystemFiles().subscribe((files: any) => {
          this.systemFiles = files;
        });
      }
    }
  }

  fileClicked(uri) {
    this.fileBreakpoints = null;
    this.currentLine = null;
    this.showLine = null;
    this.marklogic.getFile(uri, this.modulesDb.id, this.modulesRoot).subscribe((txt: any) => {
      this.currentUri = uri;
      this.fileText = txt;
      this.getBreakpoints();
    });
  }

  gotoBreakpoint(uri: string, line: number) {
    this.fileBreakpoints = null;
    this.currentLine = null;
    this.showLine = null;
    this.marklogic.getFile(uri, this.modulesDb.id, this.modulesRoot).subscribe((txt: any) => {
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
      this.currentUri = '';
      this.currentLine = frame.line;
      this.currentStackPosition = index;
      this.getBreakpoints();
      if (this.stack.expressions && this.stack.expressions.length > 0) {
        if (index === 0) {
          this.currentExpression = this.stack.expressions[index].expressionSource;
          this.fileText = this.stack.expressions[index].evalSource;
        }
        else {
          this.currentExpression = null;
        }
      }
    }
  }

  showInvoke(frame, index: number) {
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
    if (frame.type === 'xdmp:eval') {
      this.showEval(frame, index);
    }
    else if (frame.type === 'invoke') {
      this.showInvoke(frame, index);
    } else {
      this.currentLine = null;
      this.showLine = null;

      let uri = frame.uri;
      let modulesRoot = this.modulesRoot;
      let modulesDb = null;
      if (frame.location && frame.location.database) {
        modulesRoot = '/';

        uri = frame.location.uri;

        let db = _.find(this.modulesDatabases, (database: any) => {
          return database.id === frame.location.database;
        });

        if (db) {
          modulesDb = db;
        }
      }
      this.marklogic.getFile(uri, modulesDb.id, modulesRoot).subscribe((txt: any) => {
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
    if (!this.currentRequest) {
      return;
    }
    if ($event.keyCode === 13) {
      this.consoleOutput.push({
        txt: this.consoleInput,
        type: 'i'
      });
      this.commandHistory.push(this.consoleInput);
      this.marklogic.valueExpression(this.currentRequest.requestId, this.consoleInput).subscribe((output: any) => {
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

  invokeModule(uri: string, serverId) {
    this.marklogic.invokeModule(serverId, uri).subscribe(() => {
      setTimeout(() => {
        this.getRequests();
      }, 1000);
    },
    (error: Response) => {
      this.showError(error.json().message);
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

  selectModulesDb(modulesDb) {
    this.modulesRoot = null;
    this.modulesDb = modulesDb;
    if (this.modulesDb.id !== 0) {
      this.modulesRoot = '/';
      this.showFiles();
    } else {
      this.serverFiles = null;
    }
  }

  selectModulesRoot(root) {
    this.modulesRoot = root;
    this.showFiles();
  }

  currentModulesDb() {
    if (this.modulesDb) {
      return this.modulesDb.name;
    }

    return 'Choose Modules Database';
  }

  currentModulesRoot() {
    if (this.modulesRoot) {
      return this.modulesRoot;
    }
    return 'Choose One';
  }

  connectedServerCount() {
    return _.reduce(this.appServers, (sum, server) => {
      return sum + (server.connected ? 1 : 0);
    }, 0);
  }
}
