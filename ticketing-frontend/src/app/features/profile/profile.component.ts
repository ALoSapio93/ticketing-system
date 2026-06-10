import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { TicketService } from '../../core/services/ticket.service';
import { StatsService } from '../../core/services/stats.service';
import { User, Ticket } from '../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="profile-page">
  <div class="profile-grid">
    <!-- Left: avatar + info -->
    <div class="profile-sidebar">
      <div class="card" style="text-align:center;padding:32px">
        <div class="avatar avatar-lg" [style.background]="avatarColor(user?.fullName)" style="margin:0 auto 16px">
          {{ initials(user?.fullName) }}
        </div>
        <h2>{{ user?.fullName }}</h2>
        <span class="role-badge" [class]="'role-' + user?.role">{{ roleLabel(user?.role) }}</span>
        <p class="text-muted text-sm" style="margin-top:8px">{{ user?.email }}</p>
        <p class="text-muted text-sm" *ngIf="user?.department">🏢 {{ user?.department }}</p>
        <p class="text-muted text-sm" *ngIf="user?.phone">📱 {{ user?.phone }}</p>
        <p class="text-muted text-sm" *ngIf="user?.createdAt">
          📅 Membro dal {{ user?.createdAt | date:'dd/MM/yyyy' }}
        </p>
      </div>

      <!-- User Stats -->
      <div class="card" *ngIf="userStats">
        <h3 style="font-size:14px;font-weight:700;margin-bottom:16px">Le Mie Statistiche</h3>
        <div class="profile-stat"><span>Ticket aperti da me</span><strong>{{ userStats.reportedTotal }}</strong></div>
        <div class="profile-stat"><span>Ticket assegnati a me</span><strong>{{ userStats.assignedOpen }}</strong></div>
      </div>
    </div>

    <!-- Right: forms -->
    <div class="profile-main">
      <!-- Edit profile -->
      <div class="card">
        <h3 class="section-title">Modifica Profilo</h3>
        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div class="form-group">
              <label class="form-label">Nome</label>
              <input class="form-control" formControlName="firstName">
            </div>
            <div class="form-group">
              <label class="form-label">Cognome</label>
              <input class="form-control" formControlName="lastName">
            </div>
          </div>
          <div class="form-group" style="margin-top:16px">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" formControlName="email">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
            <div class="form-group">
              <label class="form-label">Dipartimento</label>
              <input class="form-control" formControlName="department">
            </div>
            <div class="form-group">
              <label class="form-label">Telefono</label>
              <input class="form-control" formControlName="phone">
            </div>
          </div>
          <div class="success-msg" *ngIf="profileSuccess">✅ Profilo aggiornato con successo!</div>
          <div class="error-alert" *ngIf="profileError">{{ profileError }}</div>
          <button type="submit" class="btn btn-primary" style="margin-top:20px" [disabled]="savingProfile">
            {{ savingProfile ? 'Salvataggio...' : 'Salva Modifiche' }}
          </button>
        </form>
      </div>

      <!-- Change password -->
      <div class="card" style="margin-top:16px">
        <h3 class="section-title">Cambia Password</h3>
        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
          <div class="form-group">
            <label class="form-label">Password Attuale</label>
            <input type="password" class="form-control" formControlName="currentPassword"
              [class.error]="isInvalid('currentPassword')">
          </div>
          <div class="form-group" style="margin-top:16px">
            <label class="form-label">Nuova Password</label>
            <input type="password" class="form-control" formControlName="newPassword"
              [class.error]="isInvalid('newPassword')" placeholder="Min. 8 caratteri">
            <span class="form-error" *ngIf="isInvalid('newPassword')">Minimo 8 caratteri</span>
          </div>
          <div class="form-group" style="margin-top:16px">
            <label class="form-label">Conferma Nuova Password</label>
            <input type="password" class="form-control" formControlName="confirmPassword"
              [class.error]="passwordForm.errors?.['mismatch'] && passwordForm.get('confirmPassword')?.touched">
            <span class="form-error" *ngIf="passwordForm.errors?.['mismatch'] && passwordForm.get('confirmPassword')?.touched">
              Le password non coincidono
            </span>
          </div>
          <div class="success-msg" *ngIf="pwdSuccess">✅ Password cambiata con successo!</div>
          <div class="error-alert" *ngIf="pwdError">{{ pwdError }}</div>
          <button type="submit" class="btn btn-primary" style="margin-top:20px" [disabled]="savingPwd">
            {{ savingPwd ? 'Salvataggio...' : 'Cambia Password' }}
          </button>
        </form>
      </div>

      <!-- My recent tickets -->
      <div class="card" style="margin-top:16px">
        <h3 class="section-title">Miei Ticket Recenti</h3>
        <div *ngFor="let t of myTickets" class="ticket-row">
          <code style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--primary)">{{ t.ticketNumber }}</code>
          <span class="truncate" style="flex:1;font-size:13px">{{ t.title }}</span>
          <span class="badge badge-status-{{t.status}}">{{ statusLabel(t.status) }}</span>
          <span class="badge badge-priority-{{t.priority}}">{{ priorityLabel(t.priority) }}</span>
        </div>
        <div *ngIf="!myTickets.length" class="text-muted text-sm" style="padding:12px 0">
          Nessun ticket trovato
        </div>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
    .profile-page {}
    .profile-grid { display: grid; grid-template-columns: 300px 1fr; gap: 20px; }
    .profile-sidebar { display: flex; flex-direction: column; gap: 16px; }
    .profile-main {}
    .section-title { font-size: 15px; font-weight: 700; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
    .profile-stat { display: flex; justify-content: space-between; align-items: center;
      padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 13px;
      &:last-child { border-bottom: none; }
    }
    .role-badge { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .role-ROLE_ADMIN { background: var(--critical-light); color: var(--critical); }
    .role-ROLE_MANAGER { background: var(--warning-light); color: #D97706; }
    .role-ROLE_USER { background: var(--info-light); color: var(--info); }
    .success-msg { background: var(--success-light); color: #065f46; padding: 10px 14px;
      border-radius: 8px; font-size: 13px; margin-top: 12px; }
    .error-alert { background: var(--danger-light); color: var(--danger); padding: 10px 14px;
      border-radius: 8px; font-size: 13px; margin-top: 12px; }
    .ticket-row { display: flex; align-items: center; gap: 12px; padding: 10px 0;
      border-bottom: 1px solid var(--border); &:last-child { border-bottom: none; } }
    @media (max-width: 768px) { .profile-grid { grid-template-columns: 1fr; } }
  `]
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  userStats: any = null;
  myTickets: Ticket[] = [];

  profileForm: FormGroup;
  passwordForm: FormGroup;
  savingProfile = false;
  savingPwd = false;
  profileSuccess = false;
  profileError = '';
  pwdSuccess = false;
  pwdError = '';

  constructor(
    private authService: AuthService,
    private ticketService: TicketService,
    private statsService: StatsService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      department: [''],
      phone: ['']
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.user = this.authService.currentUser;
    if (this.user) {
      this.profileForm.patchValue(this.user);
    }
    this.statsService.getUserStats().subscribe(s => this.userStats = s);
    this.ticketService.getTickets({ page: 0, size: 5, sortBy: 'createdAt', sortDir: 'desc' }).subscribe(p => {
      this.myTickets = p.content;
    });
  }

  passwordMatchValidator(g: FormGroup) {
    const np = g.get('newPassword')?.value;
    const cp = g.get('confirmPassword')?.value;
    return np === cp ? null : { mismatch: true };
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    this.savingProfile = true; this.profileError = ''; this.profileSuccess = false;
    // In a real app, call a profile update endpoint
    setTimeout(() => {
      this.savingProfile = false;
      this.profileSuccess = true;
      setTimeout(() => this.profileSuccess = false, 3000);
    }, 800);
  }

  changePassword() {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    this.savingPwd = true; this.pwdError = ''; this.pwdSuccess = false;
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.savingPwd = false; this.pwdSuccess = true;
        this.passwordForm.reset();
        setTimeout(() => this.pwdSuccess = false, 3000);
      },
      error: err => {
        this.pwdError = err.error?.message || 'Errore nel cambio password';
        this.savingPwd = false;
      }
    });
  }

  isInvalid(f: string): boolean {
    const c = this.passwordForm.get(f);
    return !!(c?.invalid && c?.touched);
  }

  statusLabel(s: string): string {
    return { OPEN:'Aperto', IN_PROGRESS:'In Lavorazione', PENDING:'In Attesa', RESOLVED:'Risolto', CLOSED:'Chiuso', REJECTED:'Rifiutato' }[s] || s;
  }
  priorityLabel(p: string): string {
    return { LOW:'Bassa', MEDIUM:'Media', HIGH:'Alta', CRITICAL:'Critica' }[p] || p;
  }
  roleLabel(r?: string): string {
    return { ROLE_ADMIN:'👑 Amministratore', ROLE_MANAGER:'🔧 Manager', ROLE_USER:'👤 Utente' }[r || ''] || '';
  }
  avatarColor(name?: string): string {
    const colors = ['#4F46E5','#7C3AED','#DB2777','#DC2626','#D97706','#059669','#0891B2'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  }
  initials(name?: string): string {
    return (name || '?').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  }
}
