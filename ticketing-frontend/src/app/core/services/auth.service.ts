import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse, Role, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem('user');
    if (stored) this.currentUserSubject.next(JSON.parse(stored));
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === Role.ADMIN;
  }

  get isManagerOrAdmin(): boolean {
    return this.currentUser?.role === Role.ADMIN || this.currentUser?.role === Role.MANAGER;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password }).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  register(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', data).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<AuthResponse>('/api/auth/refresh', { refreshToken }).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  handleUnauthorized(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        this.isRefreshing = false;
        this.logout();
        return throwError(() => new Error('Sessione scaduta'));
      }

      return this.http.post<AuthResponse>('/api/auth/refresh', { refreshToken }).pipe(
        tap(res => this.handleAuth(res)),
        switchMap(res => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(res.accessToken);
          const retried = req.clone({ headers: req.headers.set('Authorization', `Bearer ${res.accessToken}`) });
          return next(retried);
        }),
        catchError(err => {
          this.isRefreshing = false;
          this.logout();
          return throwError(() => err);
        })
      );
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        const retried = req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) });
        return next(retried);
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>('/api/auth/change-password', { currentPassword, newPassword });
  }

  getMe(): Observable<User> {
    return this.http.get<User>('/api/auth/me').pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
      })
    );
  }

  private handleAuth(res: AuthResponse): void {
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }
}
