import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './app/layouts/auth-layout/auth-layout.component';
import { BackofficeLayoutComponent } from './app/layouts/backoffice-layout/backoffice-layout.component';
import { authGuard } from './app/core/guards/auth.guard';
import { adminGuard } from './app/core/guards/admin.guard';

export const routes: Routes = [
  // par défaut
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./app/core/Auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./app/core/Auth/register/register.component').then(m => m.RegisterComponent)
  },

  // ── Dashboard principal (sidebar commune) ──
  {
    path: 'dashboard',
    component: AuthLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'appointments',
        loadComponent: () => import('./app/features/appointment/appointments/appointments.component').then(m => m.AppointmentsComponent)
      },
      {
        path: 'assurance',
        loadComponent: () => import('./app/features/assurance/assurance.page').then(m => m.AssurancePageComponent)
      },
      {
        path: 'exams',
        loadComponent: () => import('./app/features/exams/exams.component').then(m => m.ExamsComponent)
      },
      {
        path: 'pharmacy',
        loadComponent: () => import('./app/features/pharmacy/pharmacy.component').then(m => m.PharmacyComponent)
      },
      {
        path: 'billing',
        loadComponent: () => import('./app/features/billing/billing.component').then(m => m.BillingComponent)
      },
    ]
  },

  // ── Administration (navbar admin dédiée) ──
  {
    path: 'admin',
    component: BackofficeLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: 'backoffice',
        loadComponent: () => import('./app/features/backoffice/backoffice.component').then(m => m.BackofficeComponent)
      },
      { path: '', redirectTo: 'backoffice', pathMatch: 'full' }
    ]
  },
];
