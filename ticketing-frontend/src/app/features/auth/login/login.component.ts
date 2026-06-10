import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
<div class="auth-page">
  <div class="auth-left">
    <div class="auth-brand">
      <span class="brand-icon">🎫</span>
      <h1>TicketFlow</h1>
      <p>Sistema di gestione ticket aziendale</p>
    </div>
    <div class="auth-features">
      <div class="feature-item">✅ Gestione bug e incidenti</div>
      <div class="feature-item">✅ Tracciamento feature request</div>
      <div class="feature-item">✅ Dashboard e statistiche</div>
      <div class="feature-item">✅ Notifiche in tempo reale</div>
    </div>
  </div>

  <div class="auth-right">
    <div class="auth-card">
      <div class="auth-header">
        <h2>Accedi</h2>
        <p>Inserisci le tue credenziali</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" formControlName="email"
            placeholder="email@azienda.com"
            [class.error]="form.get('email')?.invalid && form.get('email')?.touched">
          <span class="form-error" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
            Inserisci un'email valida
          </span>
        </div>

        <div class="form-group" style="margin-top:16px">
          <label class="form-label">Password</label>
          <div style="position:relative">
            <input [type]="showPassword ? 'text' : 'password'" class="form-control"
              formControlName="password" placeholder="••••••••"
              [class.error]="form.get('password')?.invalid && form.get('password')?.touched">
            <button type="button" class="pwd-toggle" (click)="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁' }}
            </button>
          </div>
          <span class="form-error" *ngIf="form.get('password')?.invalid && form.get('password')?.touched">
            Password obbligatoria
          </span>
        </div>

        <div class="error-alert" *ngIf="errorMsg">{{ errorMsg }}</div>

        <button type="submit" class="btn btn-primary w-full" style="margin-top:24px" [disabled]="loading">
          <span *ngIf="loading" class="spinner-sm"></span>
          {{ loading ? 'Accesso...' : 'Accedi' }}
        </button>
      </form>

      <div class="auth-hint">
        <p><strong>Credenziali demo:</strong></p>
        <p>Admin: admin&#64;company.com / Admin123!</p>
        <p>Manager: manager&#64;company.com / Manager123!</p>
        <p>User: laura&#64;company.com / User123!</p>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .auth-page { display: flex; height: 100vh; overflow: hidden; }
    .auth-left {
      flex: 1; background: var(--bg-sidebar); display: flex; flex-direction: column;
      justify-content: center; padding: 60px; gap: 40px;
    }
    .auth-brand { .brand-icon { font-size: 48px; display: block; margin-bottom: 12px; }
      h1 { color: #fff; font-size: 36px; font-weight: 800; }
      p { color: rgba(255,255,255,.6); font-size: 16px; margin-top: 8px; }
    }
    .auth-features { display: flex; flex-direction: column; gap: 12px;
      .feature-item { color: rgba(255,255,255,.8); font-size: 15px; }
    }
    .auth-right {
      width: 480px; display: flex; align-items: center; justify-content: center;
      background: var(--bg); padding: 40px;
    }
    .auth-card { width: 100%; max-width: 400px; }
    .auth-header { margin-bottom: 32px;
      h2 { font-size: 28px; font-weight: 800; }
      p { color: var(--text-muted); margin-top: 4px; }
    }
    .pwd-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; font-size: 16px; }
    .error-alert { background: var(--danger-light); color: var(--danger); padding: 10px 14px;
      border-radius: 8px; font-size: 13px; font-weight: 500; margin-top: 16px; }
    .auth-hint { margin-top: 24px; padding: 14px; background: var(--bg); border-radius: 8px;
      font-size: 12px; line-height: 1.8; color: var(--text-muted); border: 1px solid var(--border); }
    .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.3);
      border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 768px) { .auth-left { display: none; } .auth-right { width: 100%; } }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  showPassword = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.errorMsg = '';
    const { email, password } = this.form.value;
    this.authService.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMsg = err.status === 401 ? 'Email o password non corretti' : 'Errore di connessione';
        this.loading = false;
      }
    });
  }
}
