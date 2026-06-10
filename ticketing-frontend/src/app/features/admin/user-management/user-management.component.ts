import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { User, Role, Page } from '../../../core/models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
<div class="users-page">
  <!-- Header -->
  <div class="page-header">
    <div>
      <p class="text-muted text-sm">Gestisci utenti, ruoli e accessi al sistema</p>
    </div>
    <button class="btn btn-primary" (click)="openModal()">➕ Nuovo Utente</button>
  </div>

  <!-- Stats -->
  <div class="users-stats">
    <div class="card stat-mini">
      <div class="stat-mini-value">{{ totalElements }}</div>
      <div class="stat-mini-label">Utenti Totali</div>
    </div>
    <div class="card stat-mini">
      <div class="stat-mini-value" style="color:var(--critical)">{{ countByRole(Role.ADMIN) }}</div>
      <div class="stat-mini-label">Amministratori</div>
    </div>
    <div class="card stat-mini">
      <div class="stat-mini-value" style="color:var(--warning)">{{ countByRole(Role.MANAGER) }}</div>
      <div class="stat-mini-label">Manager</div>
    </div>
    <div class="card stat-mini">
      <div class="stat-mini-value" style="color:var(--info)">{{ countByRole(Role.USER) }}</div>
      <div class="stat-mini-label">Utenti</div>
    </div>
  </div>

  <!-- Search -->
  <div class="search-box">
    <span class="search-icon">🔍</span>
    <input class="form-control" [(ngModel)]="searchTerm" (ngModelChange)="onSearch()"
      placeholder="Cerca per nome, cognome o email...">
  </div>

  <!-- Table -->
  <div class="card" style="padding:0;overflow:hidden">
    <div class="table-wrapper" *ngIf="!loading">
      <table>
        <thead>
          <tr>
            <th>Utente</th><th>Email</th><th>Ruolo</th>
            <th>Dipartimento</th><th>Stato</th><th>Ultimo Accesso</th><th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let u of users">
            <td>
              <div class="user-cell">
                <div class="avatar avatar-sm" [style.background]="avatarColor(u.fullName)">
                  {{ initials(u.fullName) }}
                </div>
                <div>
                  <div style="font-weight:600;font-size:14px">{{ u.fullName }}</div>
                  <div class="text-muted" style="font-size:11px">ID: {{ u.id }}</div>
                </div>
              </div>
            </td>
            <td class="text-sm">{{ u.email }}</td>
            <td><span class="role-badge" [class]="'role-' + u.role">{{ roleLabel(u.role) }}</span></td>
            <td class="text-sm text-muted">{{ u.department || '—' }}</td>
            <td>
              <span class="status-dot" [class.active]="u.enabled">
                {{ u.enabled ? '✅ Attivo' : '❌ Disattivo' }}
              </span>
            </td>
            <td class="text-sm text-muted">
              {{ u.lastLogin ? (u.lastLogin | date:'dd/MM/yy HH:mm') : 'Mai' }}
            </td>
            <td>
              <div class="action-btns">
                <button class="btn btn-ghost btn-sm" (click)="openModal(u)" title="Modifica">✏️</button>
                <button class="btn btn-ghost btn-sm" (click)="toggleStatus(u)" [title]="u.enabled ? 'Disattiva' : 'Attiva'">
                  {{ u.enabled ? '🚫' : '✅' }}
                </button>
                <button class="btn btn-ghost btn-sm" (click)="deleteUser(u)" title="Elimina"
                  style="color:var(--danger)">🗑</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div *ngIf="loading" style="display:flex;justify-content:center;padding:60px">
      <div class="spinner"></div>
    </div>
    <div *ngIf="!loading && !users.length" class="empty-state">
      <div class="icon">👥</div>
      <h3>Nessun utente trovato</h3>
    </div>
  </div>

  <!-- Pagination -->
  <div class="pagination-bar" *ngIf="totalPages > 1">
    <div class="pagination">
      <button class="page-btn" [disabled]="currentPage===0" (click)="goToPage(0)">«</button>
      <button class="page-btn" [disabled]="currentPage===0" (click)="goToPage(currentPage-1)">‹</button>
      <button class="page-btn" *ngFor="let p of getPageNumbers()" [class.active]="p===currentPage" (click)="goToPage(p)">{{ p+1 }}</button>
      <button class="page-btn" [disabled]="currentPage===totalPages-1" (click)="goToPage(currentPage+1)">›</button>
      <button class="page-btn" [disabled]="currentPage===totalPages-1" (click)="goToPage(totalPages-1)">»</button>
    </div>
  </div>
</div>

<!-- Modal -->
<div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
  <div class="modal" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <h2>{{ editingUser ? 'Modifica Utente' : 'Nuovo Utente' }}</h2>
      <button class="btn btn-ghost btn-icon" (click)="closeModal()">✕</button>
    </div>
    <form [formGroup]="userForm" (ngSubmit)="saveUser()">
      <div class="modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">Nome *</label>
            <input class="form-control" formControlName="firstName" [class.error]="isInvalid('firstName')">
          </div>
          <div class="form-group">
            <label class="form-label">Cognome *</label>
            <input class="form-control" formControlName="lastName" [class.error]="isInvalid('lastName')">
          </div>
        </div>
        <div class="form-group" style="margin-top:12px">
          <label class="form-label">Email *</label>
          <input type="email" class="form-control" formControlName="email" [class.error]="isInvalid('email')">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
          <div class="form-group">
            <label class="form-label">Ruolo *</label>
            <select class="form-control" formControlName="role">
              <option [value]="Role.USER">Utente</option>
              <option [value]="Role.MANAGER">Manager</option>
              <option [value]="Role.ADMIN">Amministratore</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Dipartimento</label>
            <input class="form-control" formControlName="department" placeholder="IT, HR...">
          </div>
        </div>
        <div class="form-group" style="margin-top:12px">
          <label class="form-label">Telefono</label>
          <input class="form-control" formControlName="phone" placeholder="+39 333 1234567">
        </div>
        <div class="form-group" style="margin-top:12px">
          <label class="form-label">{{ editingUser ? 'Nuova Password (lascia vuoto per non cambiare)' : 'Password *' }}</label>
          <input type="password" class="form-control" formControlName="password"
            [class.error]="isInvalid('password')" placeholder="Min. 8 caratteri">
        </div>
        <div class="error-alert" *ngIf="modalError" style="margin-top:12px">{{ modalError }}</div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" (click)="closeModal()">Annulla</button>
        <button type="submit" class="btn btn-primary" [disabled]="saving">
          {{ saving ? 'Salvataggio...' : (editingUser ? 'Aggiorna' : 'Crea Utente') }}
        </button>
      </div>
    </form>
  </div>
</div>`,
  styles: [`
    .users-page { display: flex; flex-direction: column; gap: 16px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; }
    .users-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .stat-mini { padding: 16px; text-align: center; }
    .stat-mini-value { font-size: 28px; font-weight: 800; }
    .stat-mini-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
    .role-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .role-ROLE_ADMIN { background: var(--critical-light); color: var(--critical); }
    .role-ROLE_MANAGER { background: var(--warning-light); color: #D97706; }
    .role-ROLE_USER { background: var(--info-light); color: var(--info); }
    .user-cell { display: flex; align-items: center; gap: 10px; }
    .action-btns { display: flex; gap: 4px; }
    .pagination-bar { display: flex; justify-content: center; }
    .error-alert { background: var(--danger-light); color: var(--danger); padding: 10px 14px; border-radius: 8px; font-size: 13px; }
    @media (max-width: 768px) { .users-stats { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  loading = false;
  searchTerm = '';
  searchTimer: any;
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  showModal = false;
  editingUser: User | null = null;
  userForm: FormGroup;
  saving = false;
  modalError = '';
  Role = Role;

  constructor(private userService: UserService, private fb: FormBuilder) {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: [Role.USER, Validators.required],
      department: [''],
      phone: [''],
      password: ['']
    });
  }

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.loading = true;
    this.userService.getUsers(this.searchTerm || undefined, this.currentPage).subscribe({
      next: (p: Page<User>) => {
        this.users = p.content; this.totalPages = p.totalPages;
        this.totalElements = p.totalElements; this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.currentPage = 0; this.loadUsers(); }, 400);
  }

  openModal(user?: User) {
    this.editingUser = user || null;
    this.modalError = '';
    if (user) {
      this.userForm.patchValue({ ...user, password: '' });
      if (!this.editingUser) {
        this.userForm.get('password')?.clearValidators();
      }
    } else {
      this.userForm.reset({ role: Role.USER });
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    }
    this.userForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  closeModal() { this.showModal = false; this.editingUser = null; }

  saveUser() {
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    this.saving = true; this.modalError = '';
    const data = this.userForm.value;
    const obs = this.editingUser
      ? this.userService.updateUser(this.editingUser.id, data)
      : this.userService.createUser(data);
    obs.subscribe({
      next: () => { this.saving = false; this.closeModal(); this.loadUsers(); },
      error: err => { this.modalError = err.error?.message || 'Errore'; this.saving = false; }
    });
  }

  toggleStatus(u: User) {
    this.userService.toggleStatus(u.id).subscribe(() => this.loadUsers());
  }

  deleteUser(u: User) {
    if (!confirm(`Eliminare l'utente ${u.fullName}?`)) return;
    this.userService.deleteUser(u.id).subscribe(() => this.loadUsers());
  }

  countByRole(role: Role): number {
    return this.users.filter(u => u.role === role).length;
  }

  goToPage(p: number) { this.currentPage = p; this.loadUsers(); }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages - 1, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  isInvalid(f: string): boolean {
    const c = this.userForm.get(f);
    return !!(c?.invalid && c?.touched);
  }

  roleLabel(r: Role): string {
    return { [Role.ADMIN]: '👑 Admin', [Role.MANAGER]: '🔧 Manager', [Role.USER]: '👤 Utente' }[r] || r;
  }
  avatarColor(name: string): string {
    const colors = ['#4F46E5','#7C3AED','#DB2777','#DC2626','#D97706','#059669','#0891B2'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  }
  initials(name: string): string {
    return (name || '?').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  }
}
