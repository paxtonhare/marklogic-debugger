import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-subsection',
  // encapsulation: ViewEncapsulation.None,
  templateUrl: './subsection.component.html',
  styleUrls: ['./subsection.component.scss']
})
export class SubsectionComponent {
  collapsed: boolean = false;
  @Input() title: string;

  constructor() {}

  isCollapsed() {
    return this.collapsed;
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }
}
