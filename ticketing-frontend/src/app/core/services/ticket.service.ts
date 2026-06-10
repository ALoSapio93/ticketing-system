import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment, CreateTicketRequest, Page, Ticket, TicketFilter, TicketHistory, UpdateTicketRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private api = '/api/tickets';

  constructor(private http: HttpClient) {}

  getTickets(filter: TicketFilter = {}): Observable<Page<Ticket>> {
    let params = new HttpParams();
    Object.entries(filter).forEach(([k, v]) => { if (v != null) params = params.set(k, v); });
    return this.http.get<Page<Ticket>>(this.api, { params });
  }

  getTicket(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.api}/${id}`);
  }

  createTicket(data: CreateTicketRequest): Observable<Ticket> {
    return this.http.post<Ticket>(this.api, data);
  }

  updateTicket(id: number, data: UpdateTicketRequest): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.api}/${id}`, data);
  }

  deleteTicket(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  getComments(ticketId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.api}/${ticketId}/comments`);
  }

  addComment(ticketId: number, content: string, internal = false): Observable<Comment> {
    return this.http.post<Comment>(`${this.api}/${ticketId}/comments`, { content, internal });
  }

  getHistory(ticketId: number): Observable<TicketHistory[]> {
    return this.http.get<TicketHistory[]>(`${this.api}/${ticketId}/history`);
  }
}
