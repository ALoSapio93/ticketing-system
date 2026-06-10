import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { Ticket, Comment, TicketHistory, TicketStatus, User } from '../../../core/models';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
<div class="detail-page" *ngIf="ticket && !loading">
  <!-- Header -->
  <div class="detail-header">
    <div class="header-left">
      <a routerLink="/tickets" class="btn btn-ghost btn-sm">← Torna alla lista</a>
      <div class="ticket-number-badge">{{ ticket.ticketNumber }}</div>
    </div>
    <div class="header-right">
      <a [routerLink]="['/tickets', ticket.id, 'edit']" class="btn btn-ghost btn-sm">✏️ Modifica</a>
      <div class="status-changer" *ngIf="authService.isManagerOrAdmin || canChangeStatus()">
        <select class="form-control form-control-sm" [(ngModel)]="newStatus" (change)="updateStatus()">
          <option *ngFor="let s of statuses" [value]="s.value">{{ s.label }}</option>
        </select>
      </div>
    </div>
  </div>

  <div class="detail-grid">
    <!-- Main content -->
    <div class="detail-main">
      <!-- Ticket info -->
      <div class="card">
        <div class="ticket-title-section">
          <h1>{{ ticket.title }}</h1>
          <div class="ticket-badges">
            <span class="badge badge-type-{{ticket.type}}">{{ typeLabel(ticket.type) }}</span>
            <span class="badge badge-priority-{{ticket.priority}}">{{ priorityLabel(ticket.priority) }}</span>
            <span class="badge badge-status-{{ticket.status}}">{{ statusLabel(ticket.status) }}</span>
          </div>
        </div>
        <div class="ticket-description">
          <h3>Descrizione</h3>
          <p>{{ ticket.description }}</p>
        </div>
      </div>

      <!-- Comments -->
      <div class="card">
        <h3 class="section-title">Commenti ({{ comments.length }})</h3>
        <div class="comments-list">
          <div class="comment" *ngFor="let c of comments" [class.internal]="c.internal">
            <div class="avatar avatar-sm" [style.background]="avatarColor(c.author.fullName)">
              {{ initials(c.author.fullName) }}
            </div>
            <div class="comment-body">
              <div class="comment-header">
                <strong>{{ c.author.fullName }}</strong>
                <span class="internal-tag" *ngIf="c.internal">🔒 Interno</span>
                <span class="text-muted text-sm">{{ c.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <p class="comment-text">{{ c.content }}</p>
            </div>
          </div>
          <div class="empty-state" *ngIf="!comments.length" style="padding:30px">
            <div class="icon">💬</div>
            <p>Nessun commento ancora</p>
          </div>
        </div>

        <!-- New comment -->
        <div class="new-comment" *ngIf="ticket.status !== 'CLOSED'">
          <div class="avatar avatar-sm" [style.background]="avatarColor(authService.currentUser?.fullName || '')">
            {{ initials(authService.currentUser?.fullName || '?') }}
          </div>
          <div class="comment-input-area">
            <textarea class="form-control" [(ngModel)]="newComment" rows="3"
              placeholder="Aggiungi un commento..."></textarea>
            <div class="comment-actions">
              <label class="internal-checkbox" *ngIf="authService.isManagerOrAdmin">
                <input type="checkbox" [(ngModel)]="isInternal">
                <span>🔒 Commento interno (non visibile agli utenti base)</span>
              </label>
              <button class="btn btn-primary btn-sm" (click)="addComment()" [disabled]="!newComment.trim() || addingComment">
                {{ addingComment ? 'Invio...' : 'Invia' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- History -->
      <div class="card">
        <h3 class="section-title" style="cursor:pointer" (click)="showHistory = !showHistory">
          📋 Cronologia Modifiche {{ showHistory ? '▲' : '▼' }}
        </h3>
        <div class="history-list" *ngIf="showHistory">
          <div class="history-item" *ngFor="let h of history">
            <div class="history-dot"></div>
            <div class="history-content">
              <div class="history-header">
                <strong>{{ h.changedBy.fullName }}</strong>
                <span class="text-muted text-sm">{{ h.changedAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <p class="text-sm">
                Modificato <strong>{{ fieldLabel(h.fieldChanged) }}</strong>:
                <span class="old-val" *ngIf="h.oldValue">{{ h.oldValue }}</span>
                <span *ngIf="h.oldValue"> → </span>
                <span class="new-val">{{ h.newValue }}</span>
              </p>
            </div>
          </div>
          <div *ngIf="!history.length" class="text-muted text-sm" style="padding:16px">
            Nessuna modifica registrata
          </div>
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <div class="detail-sidebar">
      <div class="card">
        <h3 class="section-title">Dettagli</h3>
        <div class="detail-field">
          <span class="field-label">Reporter</span>
          <div class="user-cell">
            <div class="avatar avatar-sm" [style.background]="avatarColor(ticket.reporter.fullName)">
              {{ initials(ticket.reporter.fullName) }}
            </div>
            <div>
              <div style="font-weight:600;font-size:13px">{{ ticket.reporter.fullName }}</div>
              <div class="text-muted text-sm">{{ ticket.reporter.email }}</div>
            </div>
          </div>
        </div>
        <div class="detail-field">
          <span class="field-label">Assegnatario</span>
          <div *ngIf="!editingAssignee">
            <div class="user-cell" *ngIf="ticket.assignee">
              <div class="avatar avatar-sm" [style.background]="avatarColor(ticket.assignee.fullName)">
                {{ initials(ticket.assignee.fullName) }}
              </div>
              <span style="font-size:13px;font-weight:600">{{ ticket.assignee.fullName }}</span>
            </div>
            <span *ngIf="!ticket.assignee" class="text-muted text-sm">Non assegnato</span>
            <button *ngIf="authService.isManagerOrAdmin" class="btn btn-ghost btn-sm"
              style="margin-top:8px" (click)="editingAssignee=true">✏️ Modifica</button>
          </div>
          <div *ngIf="editingAssignee">
            <select class="form-control" [(ngModel)]="selectedAssigneeId">
              <option value="">Nessuno</option>
              <option *ngFor="let u of users" [value]="u.id">{{ u.fullName }}</option>
            </select>
            <div style="display:flex;gap:8px;margin-top:8px">
              <button class="btn btn-primary btn-sm" (click)="saveAssignee()">Salva</button>
              <button class="btn btn-ghost btn-sm" (click)="editingAssignee=false">Annulla</button>
            </div>
          </div>
        </div>
        <div class="detail-field" *ngIf="ticket.department">
          <span class="field-label">Dipartimento</span>
          <span class="text-sm">{{ ticket.department }}</span>
        </div>
        <div class="detail-field" *ngIf="ticket.category">
          <span class="field-label">Categoria</span>
          <span class="text-sm">{{ categoryLabel(ticket.category) }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">Creato il</span>
          <span class="text-sm">{{ ticket.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>
        <div class="detail-field" *ngIf="ticket.updatedAt">
          <span class="field-label">Aggiornato il</span>
          <span class="text-sm">{{ ticket.updatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>
        <div class="detail-field" *ngIf="ticket.dueDate">
          <span class="field-label">Scadenza</span>
          <span class="text-sm" [class.overdue]="isOverdue()">
            {{ ticket.dueDate | date:'dd/MM/yyyy HH:mm' }}
            <span *ngIf="isOverdue()" style="color:var(--danger)"> ⚠️ Scaduto</span>
          </span>
        </div>
        <div class="detail-field" *ngIf="ticket.resolvedAt">
          <span class="field-label">Risolto il</span>
          <span class="text-sm" style="color:var(--success)">{{ ticket.resolvedAt | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>
      </div>

      <!-- Quick status actions -->
      <div class="card" *ngIf="quickActions.length">
        <h3 class="section-title">Azioni Rapide</h3>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button *ngFor="let a of quickActions" class="btn" [class]="a.class" (click)="setStatus(a.status)">
            {{ a.icon }} {{ a.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<div *ngIf="loading" style="display:flex;justify-content:center;padding:80px">
  <div class="spinner"></div>
</div>`,
  styles: [`
    .detail-page { display: flex; flex-direction: column; gap: 16px; }
    .detail-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .header-left, .header-right { display: flex; align-items: center; gap: 12px; }
    .ticket-number-badge { font-family: 'JetBrains Mono',monospace; font-size: 13px; font-weight: 700;
      background: var(--primary-light); color: var(--primary); padding: 6px 12px; border-radius: 8px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
    .detail-main { display: flex; flex-direction: column; gap: 16px; }
    .detail-sidebar { display: flex; flex-direction: column; gap: 16px; }
    .ticket-title-section { margin-bottom: 20px;
      h1 { font-size: 22px; font-weight: 800; margin-bottom: 12px; }
    }
    .ticket-badges { display: flex; gap: 8px; flex-wrap: wrap; }
    .ticket-description { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);
      h3 { font-size: 14px; font-weight: 700; margin-bottom: 8px; }
      p { font-size: 14px; line-height: 1.7; color: var(--text); white-space: pre-wrap; }
    }
    .section-title { font-size: 15px; font-weight: 700; margin-bottom: 16px;
      padding-bottom: 12px; border-bottom: 1px solid var(--border); }
    .comments-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
    .comment { display: flex; gap: 12px; padding: 12px; border-radius: 10px;
      &.internal { background: #FFFBEB; border-left: 3px solid var(--warning); }
    }
    .comment-body { flex: 1; }
    .comment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .internal-tag { font-size: 11px; font-weight: 600; color: #D97706; background: var(--warning-light);
      padding: 2px 6px; border-radius: 4px; }
    .comment-text { font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
    .new-comment { display: flex; gap: 12px; padding-top: 16px; border-top: 1px solid var(--border); }
    .comment-input-area { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .comment-actions { display: flex; align-items: center; justify-content: space-between; }
    .internal-checkbox { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; }
    .history-list { display: flex; flex-direction: column; gap: 0; }
    .history-item { display: flex; gap: 12px; padding: 12px 0;
      border-bottom: 1px solid var(--border); &:last-child { border-bottom: none; }
    }
    .history-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary);
      margin-top: 6px; flex-shrink: 0; }
    .history-content { flex: 1; }
    .history-header { display: flex; gap: 8px; align-items: center; margin-bottom: 4px; }
    .old-val { text-decoration: line-through; color: var(--danger); font-size: 13px; }
    .new-val { color: var(--success); font-weight: 600; font-size: 13px; }
    .detail-field { display: flex; flex-direction: column; gap: 4px; padding: 10px 0;
      border-bottom: 1px solid var(--border); &:last-child { border-bottom: none; }
    }
    .field-label { font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .05em; color: var(--text-muted); }
    .user-cell { display: flex; align-items: center; gap: 8px; }
    .overdue { color: var(--danger) !important; }
    @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
  `]
})
export class TicketDetailComponent implements OnInit {
  ticket: Ticket | null = null;
  comments: Comment[] = [];
  history: TicketHistory[] = [];
  users: User[] = [];
  loading = true;
  showHistory = false;
  newComment = '';
  isInternal = false;
  addingComment = false;
  editingAssignee = false;
  selectedAssigneeId: number | '' = '';
  newStatus = '';

  statuses = [
    { value: TicketStatus.OPEN, label: 'Aperto' },
    { value: TicketStatus.IN_PROGRESS, label: 'In Lavorazione' },
    { value: TicketStatus.PENDING, label: 'In Attesa' },
    { value: TicketStatus.RESOLVED, label: 'Risolto' },
    { value: TicketStatus.CLOSED, label: 'Chiuso' },
    { value: TicketStatus.REJECTED, label: 'Rifiutato' }
  ];

  get quickActions(): any[] {
    if (!this.ticket) return [];
    const s = this.ticket.status;
    const actions: any[] = [];
    if (s === TicketStatus.OPEN) actions.push({ status: TicketStatus.IN_PROGRESS, label: 'Prendi in carico', icon: '⚡', class: 'btn btn-primary btn-sm' });
    if (s === TicketStatus.IN_PROGRESS) {
      actions.push({ status: TicketStatus.RESOLVED, label: 'Segna come Risolto', icon: '✅', class: 'btn btn-success btn-sm' });
      actions.push({ status: TicketStatus.PENDING, label: 'Metti in Attesa', icon: '⏸', class: 'btn btn-ghost btn-sm' });
    }
    if (s === TicketStatus.RESOLVED) actions.push({ status: TicketStatus.CLOSED, label: 'Chiudi Ticket', icon: '🔒', class: 'btn btn-ghost btn-sm' });
    return this.authService.isManagerOrAdmin ? actions : [];
  }

  constructor(
    private route: ActivatedRoute,
    private ticketService: TicketService,
    private userService: UserService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    const id = +this.route.snapshot.params['id'];
    this.load(id);
    if (this.authService.isManagerOrAdmin) {
      this.userService.getAllActive().subscribe(u => this.users = u);
    }
  }

  load(id: number) {
    this.loading = true;
    this.ticketService.getTicket(id).subscribe({
      next: t => {
        this.ticket = t;
        this.newStatus = t.status;
        this.selectedAssigneeId = t.assignee?.id || '';
        this.loading = false;
        this.ticketService.getComments(id).subscribe(c => this.comments = c);
        this.ticketService.getHistory(id).subscribe(h => this.history = h);
      },
      error: () => this.loading = false
    });
  }

  addComment() {
    if (!this.newComment.trim() || !this.ticket) return;
    this.addingComment = true;
    this.ticketService.addComment(this.ticket.id, this.newComment, this.isInternal).subscribe({
      next: c => {
        this.comments.push(c);
        this.newComment = '';
        this.isInternal = false;
        this.addingComment = false;
      },
      error: () => this.addingComment = false
    });
  }

  updateStatus() {
    if (!this.ticket || this.newStatus === this.ticket.status) return;
    this.ticketService.updateTicket(this.ticket.id, { status: this.newStatus as TicketStatus }).subscribe(t => {
      this.ticket = t;
      this.ticketService.getHistory(t.id).subscribe(h => this.history = h);
    });
  }

  setStatus(status: TicketStatus) {
    if (!this.ticket) return;
    this.ticketService.updateTicket(this.ticket.id, { status }).subscribe(t => {
      this.ticket = t;
      this.newStatus = t.status;
      this.ticketService.getHistory(t.id).subscribe(h => this.history = h);
    });
  }

  saveAssignee() {
    if (!this.ticket) return;
    this.ticketService.updateTicket(this.ticket.id, { assigneeId: this.selectedAssigneeId || undefined }).subscribe(t => {
      this.ticket = t;
      this.editingAssignee = false;
    });
  }

  canChangeStatus(): boolean {
    if (!this.ticket || !this.authService.currentUser) return false;
    return this.ticket.assignee?.id === this.authService.currentUser.id;
  }

  isOverdue(): boolean {
    if (!this.ticket?.dueDate) return false;
    return new Date(this.ticket.dueDate) < new Date() && !['RESOLVED','CLOSED'].includes(this.ticket.status);
  }

  typeLabel(t: string): string {
    return { BUG:'🐛 Bug', FEATURE_REQUEST:'✨ Feature', SUPPORT:'🆘 Supporto', INCIDENT:'🚨 Incidente', CHANGE_REQUEST:'🔄 Modifica', TASK:'📌 Task' }[t] || t;
  }
  statusLabel(s: string): string {
    return { OPEN:'Aperto', IN_PROGRESS:'In Lavorazione', PENDING:'In Attesa', RESOLVED:'Risolto', CLOSED:'Chiuso', REJECTED:'Rifiutato' }[s] || s;
  }
  priorityLabel(p: string): string {
    return { LOW:'🟢 Bassa', MEDIUM:'🟡 Media', HIGH:'🔴 Alta', CRITICAL:'🔥 Critica' }[p] || p;
  }
  categoryLabel(c: string): string {
    return { IT_INFRASTRUCTURE:'🖥 IT Infrastruttura', SOFTWARE:'💻 Software', HARDWARE:'🖨 Hardware',
      NETWORK:'🌐 Network', SECURITY:'🔒 Security', HR:'👥 HR', FINANCE:'💰 Finance', GENERAL:'📋 Generale' }[c] || c;
  }
  fieldLabel(f: string): string {
    return { title:'Titolo', description:'Descrizione', status:'Stato', priority:'Priorità',
      type:'Tipo', assignee:'Assegnatario' }[f] || f;
  }
  avatarColor(name: string): string {
    const colors = ['#4F46E5','#7C3AED','#DB2777','#DC2626','#D97706','#059669','#0891B2'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  }
  initials(name: string): string {
    return (name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}
