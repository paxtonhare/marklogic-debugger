import {
  Component,
  Input,
  OnInit,
  OnChanges,
  Output,
  ViewChild,
  EventEmitter,
  forwardRef
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Breakpoint } from '../marklogic';

import * as CodeMirror from 'codemirror';
require('codemirror/mode/xquery/xquery');
require('codemirror/mode/javascript/javascript');
require('codemirror/addon/selection/mark-selection');

/**
 * CodeMirror component
 * Usage :
 * <codemirror [(ngModel)]="data" [config]="{...}"></ckeditor>
 */
@Component({
  selector: 'app-codemirror',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CodemirrorComponent),
      multi: true
    }
  ],
  template: `<textarea #host></textarea>`,
})
export class CodemirrorComponent implements OnInit, OnChanges {

  @Input() config;

  @Input() breakpoints: Array<Breakpoint>;

  @Output() change = new EventEmitter();
  @ViewChild('host') host;

  private _value = '';
  private _line: number = null;
  private _showLine: number = null;
  private _expression: string;

  private currentStatement: CodeMirror.TextMarker;

  @Output() instance: CodeMirror.EditorFromTextArea = null;

  /**
   * Constructor
   */
  constructor() {}

  get value(): any { return this._value; };

  get line(): number { return this._line + 1; };
  @Input() set line(l: number) {
    if (l === null) {
      this._line = null;
      return;
    }
    this._line = l - 1;
    if (this.instance) {
      this.instance.clearGutter('currentlines');
      this.instance.setGutterMarker(this._line, 'currentlines', this.makeLineMarker());
      this.jumpToLine(this._line);
      this.highlightExpression();
    }
  }

  get showLine(): number { return this._showLine + 1; };
  @Input() set showLine(l: number) {
    if (l === null) {
      this._showLine = null;
      return;
    }

    this._showLine = l - 1;
    if (this.instance) {
      this.jumpToLine(this._showLine);
    }
  }

  get expression(): string { return this._expression; }
  @Input() set expression(e: string) {
    this._expression = e;
    this.jumpToLine(this._line);
    this.highlightExpression();
  }

  ngOnInit() {
    this.config = this.config || {};
    this.codemirrorInit(this.config);
  }

  ngOnChanges(changes: any) {
    if (changes.breakpoints && changes.breakpoints.currentValue) {
      this.updateBreakpoints();
    }
  }

  /**
   * Initialize codemirror
   */
  codemirrorInit(config) {
    this.instance = CodeMirror.fromTextArea(this.host.nativeElement, config);
    this.instance.on('change', () => {
      this.updateValue(this.instance.getValue());
      if (this._line !== null) {
        this.line = this._line + 1;
      }
    });
    setTimeout(() => {
      this.instance.refresh();
      if (this.line !== null) {
        if (this._showLine) {
          this.jumpToLine(this._showLine);
        } else {
          this.jumpToLine(this._line);
        }
        this.highlightExpression();
      }
    }, 250);

    Object.keys(config.events).map((key) => {
      this.instance.on(key, config.events[key]);
    });

  }

  makeBreakpoint(enabled: boolean) {
    const marker = document.createElement('div');
    marker.className = 'breakpoint' + (enabled ? '-enabled' : '-disabled');
    marker.innerHTML = '◉';
    return marker;
  }

  makeLineMarker() {
    const marker = document.createElement('div');
    marker.className = 'current-line';
    marker.innerHTML = '➡';
    return marker;
  }

  /**
   * Value update process
   */
  updateValue(value) {
    this.updateBreakpoints();

    this.onChange(value);
    this.onTouched();
    this.change.emit(value);
  }

  updateBreakpoints() {
    if (this.instance) {
      this.instance.clearGutter('breakpoints');
      if (this.breakpoints) {
        for (let breakpoint of this.breakpoints) {
          this.instance.setGutterMarker(breakpoint.line, 'breakpoints', this.makeBreakpoint(breakpoint.enabled));
        }
      }
    }
  }

  /**
   * Implements ControlValueAccessor
   */
  writeValue(value) {
    this._value = value || '';
    if (this.instance) {
      this.instance.setValue(this._value);
      this.jumpToLine(this._line);
      this.onChange(value);
      if (this.instance) {
        this.highlightExpression();
      }
    }
  }


  jumpToLine(line: number) {
    if (this.instance && line && this._value !== '' && this._value.split(/[\r\n]/).length > line) {
      this.instance.scrollIntoView({line: line, ch: 0}, 40);
    }
  }

  highlightExpression() {
    if (this.currentStatement) {
      this.currentStatement.clear();
      this.currentStatement = null;
    }

    if (this._value === '' || !this._expression || (this._line === null)) {
      return;
    }
    const lines = this._value.split(/[\r\n]/);

    let startLine = -1;
    let startChar = -1;
    let endLine = -1;
    let endChar = -1;
    let pos = 0;
    let i = this._line;
    let j = 0;

    let state = 'scanning';

    let reset = () => {
      startLine = -1;
      startChar = -1;
      endLine = -1;
      endChar = -1;
      pos = 0;
      state = 'scanning';
    }

    let peak = () => {
      if (i < lines.length && j < lines[i].length) {
        return lines[i][j];
      }
      return null;
    };

    let eat = () => {
      do {
        j++;
        while (i < lines.length && j > (lines[i].length - 1)) {
          j = 0;
          i++;
        }
      } while (i < lines.length && lines[i][j] === ' ');
    };

    let eatExpr = () => {
      do {
        pos++;
      } while(this._expression[pos] === ' ')
    }

    while (state !== 'done' && peak() !== null) {
      switch(state) {
        case 'scanning':
          if (peak() === this._expression[pos]) {
            state = 'start';
            startLine = i;
            startChar = j;
            eatExpr();
            eat();
          } else if (this._expression.substring(pos).startsWith('fn:') && peak() === this._expression[pos + 'fn:'.length]) {
            state = 'start';
            startLine = i;
            startChar = j;
            pos += 'fn:'.length;
          } else if (this._expression.substring(pos).startsWith('fn:unordered(') && peak() === this._expression[pos + 'fn:unordered('.length]) {
            state = 'start';
            startLine = i;
            startChar = j;
            pos += 'fn:unordered('.length;
          } else if (this._expression.substring(pos).startsWith('descendant::') && peak() === this._expression[pos + 'descendant::'.length]) {
            state = 'start';
            startLine = i;
            startChar = j;
            pos += 'descendant::'.length;
          }
          else {
            eat();
          }
          break;
        case 'comment':
          if (peak() === ':') {
            eat();
            if (peak() === ')') {
              state = 'start';
              eat();
            }
            continue;
          }
          eat();
          break;
        case 'start':
          if (peak() === this._expression[pos] ||
            (
              (peak() === '"' || peak() === '\'') &&
              (this._expression[pos] === '"' || this._expression[pos] === '\'')
            )) {
            eatExpr();
            if (pos > (this._expression.length - 1)) {
              state = 'done';
              endLine = i;
              endChar = j;
            }
          } else if (peak() === '(' || peak() === ')') {
            eat();
            if (peak() === ':') {
              state = 'comment';
              eat();
            }
            continue;
          } else if (peak() === '/' && this._expression[pos] === 'd') {
            if (this._expression.substring(pos).startsWith('descendant::')) {
              pos += 'descendant::'.length;
            } else {
              reset();
            }
          } else if (this._expression[pos] === 'f') {
            if (this._expression.substring(pos).startsWith('fn:unordered(')) {
              pos += 'fn:unordered('.length;
              continue;
            } else if (this._expression.substring(pos).startsWith('fn:')) {
              pos += 'fn:'.length;
              continue;
            } else {
              reset();
            }
          } else if (this._expression[pos] === ')') {
            eatExpr();
            continue;
          } else if (this._expression.substring(pos).startsWith('..."')) {
            if (peak() === '"' || peak() === '\'') {
              pos += '..."'.length;
            }
          } else {
            reset();
            continue;
          }
          eat();
          break;
      }
    }

    if (state === 'done') {
        this.currentStatement = this.instance.getDoc().markText({line: startLine, ch: startChar}, {line: endLine, ch: endChar + 1}, {className: 'current-statement'});
    }
  }

  onChange(_) {}
  onTouched() {}
  registerOnChange(fn) { this.onChange = fn; }
  registerOnTouched(fn) { this.onTouched = fn; }
}
