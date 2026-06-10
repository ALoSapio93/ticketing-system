import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TicketService } from '../../../core/services/ticket.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { TicketType, TicketPriority, TicketCategory, TicketStatus, User } from '../../../core/models';

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
<div class="form-page">
  <div class="form-header">
    <a routerLink="/tickets" class="btn btn-ghost btn-sm">← Torna alla lista</a>
    <h2>{{ isEdit ? 'Modifica Ticket' : 'Crea Nuovo Ticket' }}</h2>
    <p class="text-muted text-sm">{{ isEdit ? 'Aggiorna i dettagli del ticket' : 'Compila tutti i campi obbligatori' }}</p>
  </div>

  <form [formGroup]="form" (ngSubmit)="onSubmit()" *ngIf="!loading">
    <div class="form-grid">
      <!-- Left -->
      <div class="form-col">
        <div class="card">
          <h3 class="section-title">Informazioni Principali</h3>

          <div class="form-group">
            <label class="form-label">Titolo <span class="required">*</span></label>
            <input class="form-control" formControlName="title"
              placeholder="Descrizione breve del problema o richiesta"
              [class.error]="isInvalid('title')">
            <span class="form-error" *ngIf="isInvalid('title')">Il titolo è obbligatorio</span>
          </div>

          <div class="form-group" style="margin-top:16px">
            <label class="form-label">Descrizione <span class="required">*</span></label>
            <textarea class="form-control" formControlName="description" rows="6"
              placeholder="Descrizione dettagliata: passi per riprodurre, comportamento atteso, screenshot..."
              [class.error]="isInvalid('description')"></textarea>
            <span class="form-error" *ngIf="isInvalid('description')">La descrizione è obbligatoria</span>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
            <div class="form-group">
              <label class="form-label">Tipo <span class="required">*</span></label>
              <select class="form-control" formControlName="type" [class.error]="isInvalid('type')">
                <option value="">Seleziona tipo</option>
                <option *ngFor="let t of types" [value]="t.value">{{ t.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priorità <span class="required">*</span></label>
              <select class="form-control" formControlName="priority" [class.error]="isInvalid('priority')">
                <option value="">Seleziona priorità</option>
                <option *ngFor="let p of priorities" [value]="p.value">{{ p.label }}</option>
              </select>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
            <div class="form-group">
              <label class="form-label">Categoria</label>
              <select class="form-control" formControlName="category">
                <option value="">Seleziona categoria</option>
                <option *ngFor="let c of categories" [value]="c.value">{{ c.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Dipartimento</label>
              <input class="form-control" formControlName="department" placeholder="es. IT, HR, Finance">
            </div>
          </div>
        </div>
      </div>

      <!-- Right -->
      <div class="form-col">
        <div class="card">
          <h3 class="section-title">Assegnazione & Scadenza</h3>

          <div class="form-group" *ngIf="authService.isManagerOrAdmin">
            <label class="form-label">Assegna a</label>
            <select class="form-control" formControlName="assigneeId">
              <option value="">Nessun assegnatario</option>
              <option *ngFor="let u of users" [value]="u.id">{{ u.fullName }} ({{ u.department || 'N/A' }})</option>
            </select>
          </div>

          <div class="form-group" style="margin-top:16px">
            <label class="form-label">Data di scadenza</label>
            <input type="datetime-local" class="form-control" formControlName="dueDate">
          </div>

          <div class="form-group" style="margin-top:16px" *ngIf="isEdit && authService.isManagerOrAdmin">
            <label class="form-label">Stato</label>
            <select class="form-control" formControlName="status">
              <option *ngFor="let s of statuses" [value]="s.value">{{ s.label }}</option>
            </select>
          </div>
        </div>

        <!-- Priority preview -->
        <div class="priority-card" *ngIf="form.get('priority')?.value">
          <div class="priority-preview" [class]="'priority-' + form.get('priority')?.value?.toLowerCase()">
            <span class="priority-icon">{{ getPriorityIcon(form.get('priority')?.value) }}</span>
            <div>
              <div style="font-weight:700">Priorità {{ getPriorityLabel(form.get('priority')?.value) }}</div>
              <div style="font-size:12px;opacity:.8">{{ getPriorityDesc(form.get('priority')?.value) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div class="error-alert" *ngIf="errorMsg" style="margin-top:16px">{{ errorMsg }}</div>

    <!-- Actions -->
    <div class="form-actions">
      <a routerLink="/tickets" class="btn btn-ghost">Annulla</a>
      <button type="submit" class="btn btn-primary" [disabled]="submitting">
        <span *ngIf="submitting">⏳</span>
        {{ submitting ? 'Salvataggio...' : (isEdit ? 'Aggiorna Ticket' : 'Crea Ticket') }}
      </button>
    </div>
  </form>

  <div *ngIf="loading" style="display:flex;justify-content:center;padding:60px">
    <div class="spinner"></div>
  </div>
</div>`,
  styles: [`
    .form-page { display: flex; flex-direction: column; gap: 20px; max-width: 1000px; }
    .form-header { display: flex; flex-direction: column; gap: 4px; }
    .form-header h2 { font-size: 22px; font-weight: 800; margin-top: 8px; }
    .form-grid { display: grid; grid-template-columns: 1fr 380px; gap: 20px; }
    .section-title { font-size: 15px; font-weight: 700; margin-bottom: 20px;
      padding-bottom: 12px; border-bottom: 1px solid var(--border); }
    .required { color: var(--danger); }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
    .error-alert { background: var(--danger-light); color: var(--danger); padding: 12px 16px;
      border-radius: 8px; font-size: 14px; }
    .priority-card { margin-top: 16px; }
    .priority-preview { display: flex; align-items: center; gap: 12px; padding: 16px;
      border-radius: 10px; }
    .priority-low { background: var(--success-light); color: #065f46; }
    .priority-medium { background: var(--info-light); color: #1e3a8a; }
    .priority-high { background: var(--warning-light); color: #92400e; }
    .priority-critical { background: var(--critical-light); color: #4c1d95; }
    .priority-icon { font-size: 28px; }
    @media (max-width: 800px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class TicketFormComponent implements OnInit {
  form: FormGroup;
  isEdit = false;
  ticketId: number | null = null;
  loading = false;
  submitting = false;
  errorMsg = '';
  users: User[] = [];

  types = [
    { value: TicketType.BUG, label: '🐛 Bug' },
    { value: TicketType.FEATURE_REQUEST, label: '✨ Feature Request' },
    { value: TicketType.SUPPORT, label: '🆘 Supporto' },
    { value: TicketType.INCIDENT, label: '🚨 Incidente' },
    { value: TicketType.CHANGE_REQUEST, label: '🔄 Richiesta Modifica' },
    { value: TicketType.TASK, label: '📌 Task' }
  ];
  priorities = [
    { value: TicketPriority.LOW, label: '🟢 Bassa' },
    { value: TicketPriority.MEDIUM, label: '🟡 Media' },
    { value: TicketPriority.HIGH, label: '🔴 Alta' },
    { value: TicketPriority.CRITICAL, label: '🔥 Critica' }
  ];
  categories = [
    { value: 'IT_INFRASTRUCTURE', label: '🖥 IT Infrastructure' },
    { value: 'SOFTWARE', label: '💻 Software' },
    { value: 'HARDWARE', label: '🖨 Hardware' },
    { value: 'NETWORK', label: '🌐 Network' },
    { value: 'SECURITY', label: '🔒 Security' },
    { value: 'HR', label: '👥 HR' },
    { value: 'FINANCE', label: '💰 Finance' },
    { value: 'GENERAL', label: '📋 Generale' }
  ];
  statuses = [
    { value: TicketStatus.OPEN, label: 'Aperto' },
    { value: TicketStatus.IN_PROGRESS, label: 'In Lavorazione' },
    { value: TicketStatus.PENDING, label: 'In Attesa' },
    { value: TicketStatus.RESOLVED, label: 'Risolto' },
    { value: TicketStatus.CLOSED, label: 'Chiuso' },
    { value: TicketStatus.REJECTED, label: 'Rifiutato' }
  ];

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private userService: UserService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      type: ['', Validators.required],
      priority: ['', Validators.required],
      category: [''],
      department: [''],
      assigneeId: [''],
      dueDate: [''],
      status: [TicketStatus.OPEN]
    });
  }

  ngOnInit() {
    this.ticketId = this.route.snapshot.params['id'] ? +this.route.snapshot.params['id'] : null;
    this.isEdit = !!this.ticketId && this.route.snapshot.url.some(s => s.path === 'edit');
    if (this.authService.isManagerOrAdmin) {
      this.userService.getAllActive().subscribe(users => this.users = users);
    }
    if (this.isEdit && this.ticketId) {
      this.loading = true;
      this.ticketService.getTicket(this.ticketId).subscribe({
        next: t => {
          this.form.patchValue({
            title: t.title, description: t.description, type: t.type,
            priority: t.priority, category: t.category || '', department: t.department || '',
            assigneeId: t.assignee?.id || '', status: t.status,
            dueDate: t.dueDate ? t.dueDate.substring(0, 16) : ''
          });
          this.loading = false;
        },
        error: () => this.loading = false
      });
    }
  }

  isInvalid(f: string): boolean {
    const c = this.form.get(f);
    return !!(c?.invalid && c?.touched);
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true; this.errorMsg = '';
    const val = this.form.value;
    const payload: any = {
      title: val.title, description: val.description, type: val.type, priority: val.priority,
      category: val.category || null, department: val.department || null,
      assigneeId: val.assigneeId || null,
      dueDate: val.dueDate ? val.dueDate + ':00' : null
    };

    const obs = this.isEdit && this.ticketId
      ? this.ticketService.updateTicket(this.ticketId, { ...payload, status: val.status })
      : this.ticketService.createTicket(payload);

    obs.subscribe({
      next: t => this.router.navigate(['/tickets', t.id]),
      error: err => {
        this.errorMsg = err.error?.message || 'Errore durante il salvataggio';
        this.submitting = false;
      }
    });
  }

  getPriorityIcon(p: string): string {
    return { LOW:'🟢', MEDIUM:'🟡', HIGH:'🔴', CRITICAL:'🔥' }[p] || '';
  }
  getPriorityLabel(p: string): string {
    return { LOW:'Bassa', MEDIUM:'Media', HIGH:'Alta', CRITICAL:'Critica' }[p] || p;
  }
  getPriorityDesc(p: string): string {
    return {
      LOW: 'Da gestire in tempi normali',
      MEDIUM: 'Da gestire entro pochi giorni',
      HIGH: 'Da gestire entro 24 ore',
      CRITICAL: 'Richiede intervento immediato'
    }[p] || '';
  }
}
