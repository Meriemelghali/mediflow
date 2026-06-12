import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

const KEYCLOAK_TOKEN_URL = 'http://localhost:8080/realms/mediflow-realm/protocol/openid-connect/token';
const KEYCLOAK_CLIENT_ID = 'mediflow-frontend';

interface KeycloakTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Conservé pour mot de passe oublié / réinitialisation (toujours géré par user-service)
  private apiUrl = 'http://localhost:8081/api/user';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    if (isPlatformBrowser(this.platformId)) {
      const user = localStorage.getItem('currentUser');
      if (user) {
        this.currentUserSubject.next(JSON.parse(user));
      }
    }
  }

  /**
   * Décode le payload d'un JWT (base64url) sans dépendance externe.
   */
  private decodeJwt(token: string): any {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  }

  /**
   * Authentification via Keycloak (Resource Owner Password Credentials).
   */
  login(email: string, password: string): Observable<KeycloakTokenResponse> {
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', KEYCLOAK_CLIENT_ID);
    body.set('username', email);
    body.set('password', password);

    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

    return this.http.post<KeycloakTokenResponse>(KEYCLOAK_TOKEN_URL, body.toString(), { headers }).pipe(
      tap(res => {
        if (res && res.access_token) {
          const claims = this.decodeJwt(res.access_token);
          const roles: string[] = (claims.realm_access && claims.realm_access.roles) || [];

          const user = {
            id: claims.sub,
            email: claims.preferred_username,
            firstName: claims.given_name,
            lastName: claims.family_name,
            roles,
            activeRole: roles[0] || null
          };

          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('token', res.access_token);
            localStorage.setItem('currentUser', JSON.stringify(user));
          }
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reset-password`, { token, newPassword });
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken() {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  getCurrentUser() {
    return this.currentUserSubject.value;
  }

  switchRole(newRole: string) {
     const user = this.getCurrentUser();
     if (user && user.roles.includes(newRole)) {
        user.activeRole = newRole;
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        }
        this.currentUserSubject.next(user);
     }
  }
}
