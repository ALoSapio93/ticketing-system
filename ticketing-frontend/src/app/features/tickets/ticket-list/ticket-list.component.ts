import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';
import { AuthService } from '../../../core/services/auth.service';
import { Ticket, TicketFilter, TicketPriority, TicketStatus, TicketType, Page } from '../../../core/models';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
<div class="ticket-list-page">
  <!-- Toolbar -->
  <div class="toolbar">
    <div class="search-box" style="flex:1;max-width:360px">
      <span class="search-icon">🔍</span>
      <input class="form-control" [(ngModel)]="filter.search" (ngModelChange)="onSearch()"
        placeholder="Cerca per titolo o numero ticket...">
    </div>
    <div class="filters">
      <select class="form-control" [(ngModel)]="filter.status" (change)="loadTickets()">
        <option value="">Tutti gli stati</option>
        <option *ngFor="let s of statuses" [value]="s.value">{{ s.label }}</option>
      </select>
      <select class="form-control" [(ngModel)]="filter.priority" (change)="loadTickets()">
        <option value="">Tutte le priorità</option>
        <option *ngFor="let p of priorities" [value]="p.value">{{ p.label }}</option>
      </select>
      <select class="form-control" [(ngModel)]="filter.type" (change)="loadTickets()">
        <option value="">Tutti i tipi</option>
        <option *ngFor="let t of types" [value]="t.value">{{ t.label }}</option>
      </select>
    </div>
    <a routerLink="/tickets/new" class="btn btn-primary">
      <span>➕</span> Nuovo Ticket
    </a>
  </div>

  <!-- Table -->
  <div class="card" style="padding:0;overflow:hidden">
    <div class="table-wrapper" *ngIf="!loading">
      <table>
        <thead>
          <tr>
            <th style="cursor:pointer" (click)="sortBy('ticketNumber')">
              # Numero {{ getSortIcon('ticketNumber') }}
            </th>
            <th>Titolo</th>
            <th>Tipo</th>
            <th style="cursor:pointer" (click)="sortBy('priority')">
              Priorità {{ getSortIcon('priority') }}
            </th>
            <th style="cursor:pointer" (click)="sortBy('status')">
              Stato {{ getSortIcon('status') }}
            </th>
            <th>Reporter</th>
            <th>Assegnatario</th>
            <th style="cursor:pointer" (click)="sortBy('createdAt')">
              Data {{ getSortIcon('createdAt') }}
            </th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of tickets" [routerLink]="['/tickets', t.id]" style="cursor:pointer">
            <td>
              <code class="ticket-num">{{ t.ticketNumber }}</code>
            </td>
            <td>
              <div class="ticket-title-cell">
                <span class="truncate" style="max-width:260px;display:block">{{ t.title }}</span>
                <div class="ticket-meta" *ngIf="t.commentCount || t.attachmentCount">
                  <span *ngIf="t.commentCount" class="meta-badge">💬 {{ t.commentCount }}</span>
                  <span *ngIf="t.attachmentCount" class="meta-badge">📎 {{ t.attachmentCount }}</span>
                </div>
              </div>
            </td>
            <td><span class="badge badge-type-{{t.type}}">{{ typeLabel(t.type) }}</span></td>
            <td>
              <span class="badge badge-priority-{{t.priority}}">
                {{ priorityIcon(t.priority) }} {{ priorityLabel(t.priority) }}
              </span>
            </td>
            <td><span class="badge badge-status-{{t.status}}">{{ statusLabel(t.status) }}</span></td>
            <td>
              <div class="user-cell">
                <div class="avatar avatar-sm" [style.background]="avatarColor(t.reporter.fullName)">
                  {{ initials(t.reporter.fullName) }}
                </div>
                <span class="text-sm">{{ t.reporter.fullName }}</span>
              </div>
            </td>
            <td>
              <div class="user-cell" *ngIf="t.assignee; else unassigned">
                <div class="avatar avatar-sm" [style.background]="avatarColor(t.assignee.fullName)">
                  {{ initials(t.assignee.fullName) }}
                </div>
                <span class="text-sm">{{ t.assignee.fullName }}</span>
              </div>
              <ng-template #unassigned>
                <span class="text-muted text-sm">Non assegnato</span>
              </ng-template>
            </td>
            <td>
              <div>
                <div class="text-sm">{{ t.createdAt | date:'dd/MM/yy' }}</div>
                <div class="text-muted" style="font-size:11px">{{ t.createdAt | date:'HH:mm' }}</div>
              </div>
            </td>
            <td (click)="$event.stopPropagation()">
              <div class="action-btns">
                <a [routerLink]="['/tickets', t.id]" class="btn btn-ghost btn-sm" title="Visualizza">👁</a>
                <a [routerLink]="['/tickets', t.id, 'edit']" class="btn btn-ghost btn-sm" title="Modifica">✏️</a>
                <button *ngIf="authService.isManagerOrAdmin" class="btn btn-ghost btn-sm"
                  (click)="deleteTicket(t)" title="Elimina">🗑</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div *ngIf="loading" style="display:flex;justify-content:center;padding:60px">
      <div class="spinner"></div>
    </div>

    <div *ngIf="!loading && !tickets.length" class="empty-state">
      <div class="icon">🎫</div>
      <h3>Nessun ticket trovato</h3>
      <p>Prova a modificare i filtri o crea un nuovo ticket</p>
      <a routerLink="/tickets/new" class="btn btn-primary">Crea Ticket</a>
    </div>
  </div>

  <!-- Pagination -->
  <div class="pagination-bar" *ngIf="totalPages > 1">
    <span class="text-muted text-sm">
      {{ totalElements }} ticket totali - Pagina {{ currentPage + 1 }} di {{ totalPages }}
    </span>
    <div class="pagination">
      <button class="page-btn" [disabled]="currentPage === 0" (click)="goToPage(0)">«</button>
      <button class="page-btn" [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)">‹</button>
      <button class="page-btn" *ngFor="let p of getPageNumbers()"
        [class.active]="p === currentPage" (click)="goToPage(p)">{{ p + 1 }}</button>
      <button class="page-btn" [disabled]="currentPage === totalPages - 1" (click)="goToPage(currentPage + 1)">›</button>
      <button class="page-btn" [disabled]="currentPage === totalPages - 1" (click)="goToPage(totalPages - 1)">»</button>
    </div>
  </div>
</div>`,
  styles: [`
    .ticket-list-page { display: flex; flex-direction: column; gap: 16px; }
    .toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .filters { display: flex; gap: 8px; }
    .filters .form-control { min-width: 140px; font-size: 13px; padding: 8px 12px; }
    .ticket-num { font-family: 'JetBrains Mono', monospace; font-size: 11px; background: var(--bg); padding: 3px 7px; border-radius: 4px; }
    .ticket-title-cell { display: flex; flex-direction: column; gap: 4px; }
    .ticket-meta { display: flex; gap: 8px; }
    .meta-badge { font-size: 11px; color: var(--text-muted); }
    .user-cell { display: flex; align-items: center; gap: 8px; }
    .action-btns { display: flex; gap: 4px; }
    .pagination-bar { display: flex; align-items: center; justify-content: space-between; }
    @media (max-width: 768px) { .toolbar { flex-direction: column; align-items: stretch; }
      .filters { flex-wrap: wrap; } }
  `]
})
export class TicketListComponent implements OnInit {
  tickets: Ticket[] = [];
  loading = false;
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 10;
  searchTimer: any;

  filter: TicketFilter = { page: 0, size: 10, sortBy: 'createdAt', sortDir: 'desc' };

  statuses = [
    { value: TicketStatus.OPEN, label: 'Aperto' },
    { value: TicketStatus.IN_PROGRESS, label: 'In Lavorazione' },
    { value: TicketStatus.PENDING, label: 'In Attesa' },
    { value: TicketStatus.RESOLVED, label: 'Risolto' },
    { value: TicketStatus.CLOSED, label: 'Chiuso' },
    { value: TicketStatus.REJECTED, label: 'Rifiutato' }
  ];
  priorities = [
    { value: TicketPriority.CRITICAL, label: '🔥 Critica' },
    { value: TicketPriority.HIGH, label: '🔴 Alta' },
    { value: TicketPriority.MEDIUM, label: '🟡 Media' },
    { value: TicketPriority.LOW, label: '🟢 Bassa' }
  ];
  types = [
    { value: TicketType.BUG, label: '🐛 Bug' },
    { value: TicketType.FEATURE_REQUEST, label: '✨ Feature' },
    { value: TicketType.SUPPORT, label: '🆘 Supporto' },
    { value: TicketType.INCIDENT, label: '🚨 Incidente' },
    { value: TicketType.CHANGE_REQUEST, label: '🔄 Modifica' },
    { value: TicketType.TASK, label: '📌 Task' }
  ];

  constructor(private ticketService: TicketService, public authService: AuthService) {}

  ngOnInit() { this.loadTickets(); }

  loadTickets() {
    this.loading = true;
    this.filter.page = this.currentPage;
    this.ticketService.getTickets(this.filter).subscribe({
      next: (page: Page<Ticket>) => {
        this.tickets = page.content;
        this.totalPages = page.totalPages;
        this.totalElements = page.totalElements;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.currentPage = 0; this.loadTickets(); }, 400);
  }

  sortBy(field: string) {
    if (this.filter.sortBy === field) {
      this.filter.sortDir = this.filter.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.filter.sortBy = field; this.filter.sortDir = 'desc';
    }
    this.loadTickets();
  }

  getSortIcon(field: string): string {
    if (this.filter.sortBy !== field) return '';
    return this.filter.sortDir === 'asc' ? '↑' : '↓';
  }

  goToPage(p: number) { this.currentPage = p; this.loadTickets(); }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages - 1, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  deleteTicket(t: Ticket) {
    if (!confirm(`Eliminare il ticket ${t.ticketNumber}?`)) return;
    this.ticketService.deleteTicket(t.id).subscribe(() => this.loadTickets());
  }

  typeLabel(t: string): string {
    const m: Record<string,string> = { BUG:'Bug', FEATURE_REQUEST:'Feature', SUPPORT:'Supporto', INCIDENT:'Incidente', CHANGE_REQUEST:'Modifica', TASK:'Task' };
    return m[t] || t;
  }
  statusLabel(s: string): string {
    const m: Record<string,string> = { OPEN:'Aperto', IN_PROGRESS:'In Lavorazione', PENDING:'In Attesa', RESOLVED:'Risolto', CLOSED:'Chiuso', REJECTED:'Rifiutato' };
    return m[s] || s;
  }
  priorityLabel(p: string): string {
    const m: Record<string,string> = { LOW:'Bassa', MEDIUM:'Media', HIGH:'Alta', CRITICAL:'Critica' };
    return m[p] || p;
  }
  priorityIcon(p: string): string {
    const m: Record<string,string> = { LOW:'🟢', MEDIUM:'🟡', HIGH:'🔴', CRITICAL:'🔥' };
    return m[p] || '';
  }
  avatarColor(name: string): string {
    const colors = ['#4F46E5','#7C3AED','#DB2777','#DC2626','#D97706','#059669','#0891B2'];
    return colors[name.charCodeAt(0) % colors.length];
  }
  initials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}
