import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { MdlModule } from '@angular-mdl/core';
import { GridManiaModule } from './grid';

import { CodemirrorComponent } from './codemirror';
import { AUTH_PROVIDERS } from './auth';

import { AppComponent } from './app.component';
import { FileBrowserComponent } from './file-browser';
import { HeaderComponent } from './header';
import { HomeComponent } from './home';
import { LoginComponent } from './login';
import { ErrorComponent } from './error';
import { SubsectionComponent } from './subsection';
import { MarkLogicService } from './marklogic';
import { ROUTES } from './app.routes';
import { StartupComponent } from './help';

import { TruncateCharactersPipe } from 'ng2-truncate/dist/truncate-characters.pipe'
import { TruncateWordsPipe } from 'ng2-truncate/dist/truncate-words.pipe';
import { SettingsComponent, SettingsService } from './settings'


@NgModule({
  declarations: [
    AppComponent,
    FileBrowserComponent,
    HeaderComponent,
    HomeComponent,
    LoginComponent,
    ErrorComponent,
    SubsectionComponent,
    CodemirrorComponent,
    StartupComponent,
    TruncateCharactersPipe,
    TruncateWordsPipe,
    SettingsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(ROUTES, { useHash: true }),
    MdlModule,
    GridManiaModule
  ],
  entryComponents: [
    ErrorComponent,
    StartupComponent
  ],
  providers: [
    AUTH_PROVIDERS,
    MarkLogicService,
    SettingsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
