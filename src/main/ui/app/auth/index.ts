import {
  Http, Request, RequestOptionsArgs, Response,
  RequestOptions, ConnectionBackend, Headers, XHRBackend
} from '@angular/http';
import { AuthGuard } from './auth-guard.service';
import { AuthService } from './auth.service';
import { HTTP_PROVIDER } from './http-interceptor';

export const AUTH_PROVIDERS = [
  AuthGuard,
  AuthService,
  HTTP_PROVIDER
];

export * from './auth.service';
export * from './auth.model';
