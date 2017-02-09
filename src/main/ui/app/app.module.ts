import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { MdlModule } from 'angular2-mdl';
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
    StartupComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(ROUTES, { useHash: true }),
    // MaterialModule.forRoot()
    MdlModule,
    GridManiaModule
  ],
  entryComponents: [
    ErrorComponent,
    StartupComponent
  ],
  providers: [
    AUTH_PROVIDERS,
    MarkLogicService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
