import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardStats } from '../models';

@Injectable({ providedIn: 'root' })
export class StatsService {
  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>('/api/stats/dashboard');
  }

  getUserStats(): Observable<any> {
    return this.http.get('/api/stats/user');
  }
}
