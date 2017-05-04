import { Component, HostListener, Inject } from '@angular/core';

import { MdlDialogReference } from '@angular-mdl/core';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss']
})
export class ErrorComponent {
  error: string;

  constructor(
    private dialog: MdlDialogReference,
    @Inject('error') error: string
  ) {
    this.error = error;
  }

  hide() {
    this.dialog.hide();
  }

  @HostListener('keydown.esc')
  public onEsc(): void {
    this.cancel();
  }

  cancel() {
    this.hide();
  }
}
