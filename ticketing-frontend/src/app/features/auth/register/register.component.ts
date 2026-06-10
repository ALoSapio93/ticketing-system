import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
<div class="auth-page">
  <div class="auth-left">
    <div class="auth-brand">
      <span class="brand-icon">🎫</span>
      <h1>TicketFlow</h1>
      <p>Registra il tuo account aziendale</p>
    </div>
  </div>
  <div class="auth-right">
    <div class="auth-card">
      <div class="auth-header">
        <h2>Registrazione</h2>
        <p>Crea il tuo account</p>
      </div>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">Nome</label>
            <input class="form-control" formControlName="firstName" placeholder="Mario"
              [class.error]="isInvalid('firstName')">
          </div>
          <div class="form-group">
            <label class="form-label">Cognome</label>
            <input class="form-control" formControlName="lastName" placeholder="Rossi"
              [class.error]="isInvalid('lastName')">
          </div>
        </div>
        <div class="form-group" style="margin-top:12px">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" formControlName="email"
            placeholder="mario@azienda.com" [class.error]="isInvalid('email')">
          <span class="form-error" *ngIf="isInvalid('email')">Email non valida</span>
        </div>
        <div class="form-group" style="margin-top:12px">
          <label class="form-label">Dipartimento</label>
          <input class="form-control" formControlName="department" placeholder="IT, HR, Finance...">
        </div>
        <div class="form-group" style="margin-top:12px">
          <label class="form-label">Password</label>
          <input type="password" class="form-control" formControlName="password"
            placeholder="Min. 8 caratteri" [class.error]="isInvalid('password')">
          <span class="form-error" *ngIf="isInvalid('password')">Minimo 8 caratteri</span>
        </div>
        <div class="error-alert" *ngIf="errorMsg">{{ errorMsg }}</div>
        <button type="submit" class="btn btn-primary w-full" style="margin-top:24px" [disabled]="loading">
          {{ loading ? 'Registrazione...' : 'Registrati' }}
        </button>
      </form>
      <p style="text-align:center;margin-top:20px;font-size:14px;color:var(--text-muted)">
        Hai già un account? <a routerLink="/auth/login" style="color:var(--primary);font-weight:600">Accedi</a>
      </p>
    </div>
  </div>
</div>`,
  styles: [`
    .auth-page{display:flex;height:100vh;overflow:hidden}
    .auth-left{flex:1;background:var(--bg-sidebar);display:flex;flex-direction:column;justify-content:center;padding:60px;gap:40px}
    .auth-brand .brand-icon{font-size:48px;display:block;margin-bottom:12px}
    .auth-brand h1{color:#fff;font-size:36px;font-weight:800}
    .auth-brand p{color:rgba(255,255,255,.6);font-size:16px;margin-top:8px}
    .auth-right{width:520px;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:40px}
    .auth-card{width:100%;max-width:440px}
    .auth-header{margin-bottom:28px}
    .auth-header h2{font-size:28px;font-weight:800}
    .auth-header p{color:var(--text-muted);margin-top:4px}
    .error-alert{background:var(--danger-light);color:var(--danger);padding:10px 14px;border-radius:8px;font-size:13px;font-weight:500;margin-top:16px}
    @media(max-width:768px){.auth-left{display:none}.auth-right{width:100%}}
  `]
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      department: [''],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.errorMsg = '';
    this.authService.register(this.form.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMsg = err.error?.message || 'Errore durante la registrazione';
        this.loading = false;
      }
    });
  }
}
