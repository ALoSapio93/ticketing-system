import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { User, Role } from '../../../core/models';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
<div class="app-shell">
  <!-- Sidebar -->
  <aside class="sidebar" [class.collapsed]="sidebarCollapsed">
    <div class="sidebar-header">
      <div class="logo">
        <span class="logo-icon">🎫</span>
        <span class="logo-text" *ngIf="!sidebarCollapsed">TicketFlow</span>
      </div>
      <button class="collapse-btn" (click)="sidebarCollapsed = !sidebarCollapsed">
        {{ sidebarCollapsed ? '→' : '←' }}
      </button>
    </div>

    <nav class="sidebar-nav">
      <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
        <span class="nav-icon">📊</span>
        <span class="nav-label" *ngIf="!sidebarCollapsed">Dashboard</span>
      </a>
      <a routerLink="/tickets" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-item">
        <span class="nav-icon">🎫</span>
        <span class="nav-label" *ngIf="!sidebarCollapsed">Tutti i Ticket</span>
      </a>
      <a routerLink="/tickets/new" routerLinkActive="active" class="nav-item">
        <span class="nav-icon">➕</span>
        <span class="nav-label" *ngIf="!sidebarCollapsed">Nuovo Ticket</span>
      </a>
      <ng-container *ngIf="authService.isAdmin">
        <div class="nav-section" *ngIf="!sidebarCollapsed">AMMINISTRAZIONE</div>
        <a routerLink="/admin/users" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">👥</span>
          <span class="nav-label" *ngIf="!sidebarCollapsed">Utenti</span>
        </a>
      </ng-container>
    </nav>

    <div class="sidebar-footer" *ngIf="!sidebarCollapsed">
      <div class="user-card">
        <div class="avatar avatar-sm" [style.background]="getAvatarColor(currentUser?.fullName)">
          {{ getInitials(currentUser?.fullName) }}
        </div>
        <div class="user-info">
          <div class="user-name">{{ currentUser?.fullName }}</div>
          <div class="user-role">{{ getRoleLabel(currentUser?.role) }}</div>
        </div>
      </div>
    </div>
  </aside>

  <!-- Main -->
  <div class="main-area">
    <!-- Topbar -->
    <header class="topbar">
      <div class="topbar-left">
        <h1 class="page-title">{{ getPageTitle() }}</h1>
      </div>
      <div class="topbar-right">
        <!-- Notifications -->
        <div class="notif-wrapper" (click)="toggleNotifications()">
          <button class="btn btn-icon btn-ghost notif-btn">
            🔔
            <span class="notif-badge" *ngIf="(notifService.unreadCount$ | async)! > 0">
              {{ notifService.unreadCount$ | async }}
            </span>
          </button>
          <div class="notif-dropdown" *ngIf="showNotifications" (click)="$event.stopPropagation()">
            <div class="notif-header">
              <span>Notifiche</span>
              <button class="btn btn-sm btn-ghost" (click)="markAllRead()">Segna tutte lette</button>
            </div>
            <div class="notif-list">
              <div *ngFor="let n of notifications" class="notif-item" [class.unread]="!n.read">
                <div class="notif-title">{{ n.title }}</div>
                <div class="notif-msg">{{ n.message }}</div>
                <div class="notif-time text-muted text-sm">{{ n.createdAt | date:'dd/MM HH:mm' }}</div>
              </div>
              <div *ngIf="notifications.length === 0" class="notif-empty">Nessuna notifica</div>
            </div>
          </div>
        </div>

        <!-- User menu -->
        <div class="user-menu-wrapper" (click)="toggleUserMenu()">
          <div class="avatar avatar-sm" [style.background]="getAvatarColor(currentUser?.fullName)" style="cursor:pointer">
            {{ getInitials(currentUser?.fullName) }}
          </div>
          <div class="user-dropdown" *ngIf="showUserMenu" (click)="$event.stopPropagation()">
            <a routerLink="/profile" class="dropdown-item" (click)="showUserMenu=false">👤 Profilo</a>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item danger" (click)="logout()">🚪 Esci</button>
          </div>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="content">
      <router-outlet />
    </main>
  </div>
</div>
  `,
  styles: [`
    .app-shell { display: flex; height: 100vh; overflow: hidden; }

    .sidebar {
      width: 260px; background: var(--bg-sidebar); display: flex; flex-direction: column;
      transition: width .2s; flex-shrink: 0; overflow: hidden;
      &.collapsed { width: 68px; }
    }
    .sidebar-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 16px; border-bottom: 1px solid rgba(255,255,255,.1);
    }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-icon { font-size: 24px; }
    .logo-text { color: #fff; font-weight: 800; font-size: 18px; white-space: nowrap; }
    .collapse-btn { background: transparent; border: none; color: rgba(255,255,255,.5);
      cursor: pointer; font-size: 16px; padding: 4px; }

    .sidebar-nav { flex: 1; padding: 16px 8px; display: flex; flex-direction: column; gap: 4px; }
    .nav-section { font-size: 10px; font-weight: 700; color: rgba(255,255,255,.3);
      letter-spacing: .1em; padding: 12px 8px 4px; text-transform: uppercase; }
    .nav-item {
      display: flex; align-items: center; gap: 10px; padding: 10px 12px;
      border-radius: 10px; color: rgba(255,255,255,.7); text-decoration: none;
      font-size: 14px; font-weight: 500; transition: all .15s; white-space: nowrap;
      &:hover { background: rgba(255,255,255,.1); color: #fff; }
      &.active { background: var(--primary); color: #fff; }
    }
    .nav-icon { font-size: 18px; flex-shrink: 0; width: 24px; text-align: center; }

    .sidebar-footer { padding: 16px; border-top: 1px solid rgba(255,255,255,.1); }
    .user-card { display: flex; align-items: center; gap: 10px; }
    .user-name { color: #fff; font-size: 13px; font-weight: 600; }
    .user-role { color: rgba(255,255,255,.5); font-size: 11px; }

    .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px; height: 64px; background: var(--bg-card);
      border-bottom: 1px solid var(--border); flex-shrink: 0;
    }
    .page-title { font-size: 20px; font-weight: 800; }
    .topbar-right { display: flex; align-items: center; gap: 12px; }

    .notif-wrapper, .user-menu-wrapper { position: relative; }
    .notif-btn { position: relative; font-size: 18px; }
    .notif-badge {
      position: absolute; top: 4px; right: 4px; background: var(--danger);
      color: #fff; border-radius: 999px; font-size: 10px; font-weight: 700;
      min-width: 18px; height: 18px; display: flex; align-items: center;
      justify-content: center; padding: 0 4px; border: 2px solid var(--bg-card);
    }
    .notif-dropdown, .user-dropdown {
      position: absolute; top: calc(100% + 8px); right: 0; background: var(--bg-card);
      border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-lg);
      z-index: 100; min-width: 300px;
    }
    .notif-header { display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-bottom: 1px solid var(--border); font-weight: 600; }
    .notif-list { max-height: 320px; overflow-y: auto; }
    .notif-item { padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer;
      &.unread { background: var(--primary-light); }
      &:hover { background: var(--bg); }
    }
    .notif-title { font-weight: 600; font-size: 13px; }
    .notif-msg { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
    .notif-empty { padding: 24px; text-align: center; color: var(--text-muted); font-size: 14px; }

    .user-dropdown { min-width: 180px; padding: 8px; }
    .dropdown-item { display: flex; align-items: center; gap: 8px; padding: 10px 12px;
      border-radius: 8px; font-size: 14px; text-decoration: none; color: var(--text);
      cursor: pointer; background: transparent; border: none; width: 100%; text-align: left;
      &:hover { background: var(--bg); }
      &.danger { color: var(--danger); }
    }
    .dropdown-divider { height: 1px; background: var(--border); margin: 4px 0; }

    .content { flex: 1; overflow-y: auto; padding: 24px; }
  `]
})
export class LayoutComponent implements OnInit {
  sidebarCollapsed = false;
  showNotifications = false;
  showUserMenu = false;
  notifications: any[] = [];

  constructor(
    public authService: AuthService,
    public notifService: NotificationService
  ) {}

  ngOnInit() {
    this.loadNotifications();
    this.notifService.getUnreadCount().subscribe();
  }

  get currentUser(): User | null { return this.authService.currentUser; }

  loadNotifications() {
    this.notifService.getNotifications().subscribe(page => this.notifications = page.content.slice(0, 10));
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
    if (this.showNotifications) this.loadNotifications();
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }

  markAllRead() {
    this.notifService.markAllRead().subscribe(() => this.loadNotifications());
  }

  logout() { this.authService.logout(); }

  getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getAvatarColor(name?: string): string {
    const colors = ['#4F46E5','#7C3AED','#DB2777','#DC2626','#D97706','#059669','#0891B2'];
    if (!name) return colors[0];
    return colors[name.charCodeAt(0) % colors.length];
  }

  getRoleLabel(role?: Role): string {
    const map: Record<string, string> = { ROLE_ADMIN: 'Amministratore', ROLE_MANAGER: 'Manager', ROLE_USER: 'Utente' };
    return role ? map[role] ?? role : '';
  }

  getPageTitle(): string {
    const path = window.location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/tickets/new')) return 'Nuovo Ticket';
    if (path.includes('/tickets/') && path.includes('/edit')) return 'Modifica Ticket';
    if (path.includes('/tickets/')) return 'Dettaglio Ticket';
    if (path.includes('/tickets')) return 'Gestione Ticket';
    if (path.includes('/admin/users')) return 'Gestione Utenti';
    if (path.includes('/profile')) return 'Profilo';
    return 'TicketFlow';
  }
}
