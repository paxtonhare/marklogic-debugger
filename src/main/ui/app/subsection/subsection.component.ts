import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-subsection',
  templateUrl: './subsection.component.html',
  styleUrls: ['./subsection.component.scss']
})
export class SubsectionComponent {
  collapsed: boolean = false;
  @Input() title: string;
  @Output() clickHandler: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();

  constructor() {}

  isCollapsed() {
    return this.collapsed;
  }

  onClick($event) {
    this.clickHandler.emit($event);
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }
}
