import { Component, OnInit, HostListener } from '@angular/core';

import { MdlDialogReference } from 'angular2-mdl';

@Component({
  selector: 'app-startup',
  templateUrl: './startup.component.html',
  styleUrls: ['./startup.component.scss']
})
export class StartupComponent implements OnInit {
  showOnStartup: boolean;

  constructor(private dialog: MdlDialogReference) { }

  ngOnInit() {
    this.showOnStartup = (localStorage.getItem('_show_welcome_') !== 'false');
  }

  hide() {
    this.dialog.hide();
  }

  @HostListener('keydown.esc')
  public onEsc(): void {
    this.cancel();
  }

  cancel() {
    localStorage.setItem('_show_welcome_', this.showOnStartup.toString());
    this.hide();
  }

}
