import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Notification, Page } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  unreadCount$ = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {}

  getNotifications(page = 0, size = 20): Observable<Page<Notification>> {
    return this.http.get<Page<Notification>>(`/api/notifications?page=${page}&size=${size}`);
  }

  getUnreadCount(): Observable<{count: number}> {
    return this.http.get<{count: number}>('/api/notifications/unread-count').pipe(
      tap(res => this.unreadCount$.next(res.count))
    );
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>('/api/notifications/mark-all-read', {}).pipe(
      tap(() => this.unreadCount$.next(0))
    );
  }

  markRead(id: number): Observable<void> {
    return this.http.patch<void>(`/api/notifications/${id}/read`, {});
  }
}
