import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Page, User } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private api = '/api/admin/users';

  constructor(private http: HttpClient) {}

  getUsers(search?: string, page = 0, size = 10): Observable<Page<User>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('search', search);
    return this.http.get<Page<User>>(this.api, { params });
  }

  getAllActive(): Observable<User[]> {
    return this.http.get<User[]>(`${this.api}/all`);
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.api}/${id}`);
  }

  createUser(data: any): Observable<User> {
    return this.http.post<User>(this.api, data);
  }

  updateUser(id: number, data: any): Observable<User> {
    return this.http.put<User>(`${this.api}/${id}`, data);
  }

  toggleStatus(id: number): Observable<void> {
    return this.http.patch<void>(`${this.api}/${id}/toggle`, {});
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
