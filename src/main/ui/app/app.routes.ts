import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth-guard.service';

import { HomeComponent } from './home';
import { LoginComponent } from './login';


export const ROUTES: Routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'server/:appserverName', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'server/:appserverName/:requestId', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent }
];
