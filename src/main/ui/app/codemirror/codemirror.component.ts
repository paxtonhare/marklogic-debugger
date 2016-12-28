// Imports
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
  private _line: number;
  private _expression: string;

  @Output() instance: CodeMirror.EditorFromTextArea = null;

  /**
   * Constructor
   */
  constructor() {}

  get value(): any { return this._value; };
  @Input() set value(v) {
    if (v !== this._value) {
      this._value = v;
      this.jumpToLine();
      this.onChange(v);
      if (this.instance) {
        this.highlightExpression();
      }
    }
  }

  get line(): number { return this._line + 1; };
  @Input() set line(l: number) {
    // if (this._line && this.instance) {
    //   this.instance.removeLineClass(this._line, 'background', 'current-line');
    //   this.instance.removeLineClass(this._line, 'gutter', 'current-line');
    // }
    if (l === null) {
      this._line = null;
      return;
    }
    this._line = l - 1;
    if (this.instance) {
      this.jumpToLine();
      this.highlightExpression();
    }
  }

  get expression(): string { return this._expression; }
  @Input() set expression(e: string) {
    this._expression = e;
    this.jumpToLine();
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
    });
    setTimeout(() => {
      this.instance.refresh();
      if (this.line !== null) {
        this.jumpToLine();
        this.highlightExpression();
      }
    }, 250);

    Object.keys(config.events).map((key) => {
      this.instance.on(key, config.events[key]);
    });

  }

  makeMarker() {
    const marker = document.createElement('div');
    marker.className = 'breakpoint'; // style.color = '#822';
    marker.innerHTML = '●';
    return marker;
  }

  /**
   * Value update process
   */
  updateValue(value) {
    this.updateBreakpoints();

    this.value = value;
    this.onChange(value);
    this.onTouched();
    this.change.emit(value);
  }

  updateBreakpoints() {
    if (this.instance) {
      this.instance.clearGutter('breakpoints');
      if (this.breakpoints) {
        for (let breakpoint of this.breakpoints) {
          this.instance.setGutterMarker(breakpoint.line, 'breakpoints', this.makeMarker());
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
    }
  }


  jumpToLine() {
    if (this.instance && this._line && this._value !== '') {
      // const t = this.instance.charCoords({line: line, ch: 0}, "local").top;
      // const middleHeight = this.instance.getScrollerElement().offsetHeight / 2;
      this.instance.scrollIntoView({line: this._line, ch: 0}, 20);
      // this.instance.addLineClass(line, 'background', 'current-line')
      // this.instance.addLineClass(line, 'gutter', 'current-line')
    }
  }

  highlightExpression() {
    if (this._value === '' || !this._expression || !this._line) {
      return;
    }
    const lines = this._value.split(/[\r\n]/);
    let i = this._line;
    let done: boolean = false;
    let endLine: number = this._line;

    while (!done) {
      let line = lines[i];
      //  || line.includes(this._expression)
      done = !(this._expression.includes(line));
      endLine = i;
      // this.currentEndLine = i;
      if (!done) {
        i++;
        if (i >= lines.length) {
          break;
        }
      }
    }

    if (endLine > this._line) {
      for( let j = this._line; j < endLine; j++) {
        this.instance.addLineClass(j, 'background', 'current-line');
        this.instance.addLineClass(j, 'gutter', 'current-line');
      }
    }
    else {
      i = this._line;
      let line = lines[i];
      if (line) {
        let start: number = line.indexOf(this._expression);
        if (start >= 0) {
          let end = start + this._expression.length;
          this.instance.getDoc().setSelection({line: this._line, ch: start}, {line: this._line, ch: end});
        }
        // do something with part of the line

      }
    }
  }

  onChange(_) {}
  onTouched() {}
  registerOnChange(fn) { this.onChange = fn; }
  registerOnTouched(fn) { this.onTouched = fn; }
}
