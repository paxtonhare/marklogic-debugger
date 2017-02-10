import { Component, ElementRef, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-file-browser',
  templateUrl: './file-browser.component.html',
  styleUrls: ['./file-browser.component.scss']
})
export class FileBrowserComponent {
  @Input() selectedUri: string;
  @Input() currentChild: any;
  @Input() fileSets: Array<any>;
  @Output() fileShown = new EventEmitter();
  @Input() isRoot: boolean = true;

  constructor(protected el: ElementRef) {
  }

  getEntryIcon(child) {
    if (child.type === 'dir') {
      return child.collapsed ? 'fa-folder-o' : 'fa-folder-open-o';
    }
    return 'fa-file-o';
  }

  isSelected(child) {
    return this.selectedUri && (this.selectedUri === child.uri);
  }

  entryClicked(entry) {
    if (entry.type === 'dir') {
      entry.collapsed = !(!!entry.collapsed);
    } else {
      this.selectedUri = entry.uri;
      this.currentChild = entry;
      this.fileShown.next(entry);
    }
  }

  fileClicked($event) {
    this.fileShown.next($event);
  }
}
