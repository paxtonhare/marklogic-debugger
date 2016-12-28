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
import { SubsectionComponent } from './subsection';
import { MarkLogicService } from './marklogic';
import { ROUTES } from './app.routes';

@NgModule({
  declarations: [
    AppComponent,
    FileBrowserComponent,
    HeaderComponent,
    HomeComponent,
    LoginComponent,
    SubsectionComponent,
    CodemirrorComponent
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
  providers: [
    AUTH_PROVIDERS,
    MarkLogicService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
