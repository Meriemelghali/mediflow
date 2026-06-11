import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
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

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => {
        if (res && res.token) {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('token', res.token);
            localStorage.setItem('currentUser', JSON.stringify(res.user));
          }
          this.currentUserSubject.next(res.user);
        }
      })
    );
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
        // Sync with backend so future token refresh or sessions know the active role
        this.http.put(`${this.apiUrl}/${user._id}/role`, { role: newRole }).subscribe({
           error: (err) => console.error("Could not sync role change to backend", err)
        });
     }
  }
}
