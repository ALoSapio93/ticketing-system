import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard, managerGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) }
    ]
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'tickets', loadComponent: () => import('./features/tickets/ticket-list/ticket-list.component').then(m => m.TicketListComponent) },
      { path: 'tickets/new', loadComponent: () => import('./features/tickets/ticket-form/ticket-form.component').then(m => m.TicketFormComponent) },
      { path: 'tickets/:id', loadComponent: () => import('./features/tickets/ticket-detail/ticket-detail.component').then(m => m.TicketDetailComponent) },
      { path: 'tickets/:id/edit', loadComponent: () => import('./features/tickets/ticket-form/ticket-form.component').then(m => m.TicketFormComponent) },
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: 'users', loadComponent: () => import('./features/admin/user-management/user-management.component').then(m => m.UserManagementComponent) },
          { path: '', redirectTo: 'users', pathMatch: 'full' }
        ]
      }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
