import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth-guard.service';

import { HomeComponent } from './home';
import { LoginComponent } from './login';
// import { SettingsComponent } from './settings';

export const ROUTES: Routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'server', component: HomeComponent, canActivate: [AuthGuard] },
  // { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent }
];
