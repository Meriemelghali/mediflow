import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './app/layouts/auth-layout/auth-layout.component';
import { authGuard } from './app/core/guards/auth.guard';

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
  {
    path: 'forgot-password',
    loadComponent: () => import('./app/core/Auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password/:token',
    loadComponent: () => import('./app/core/Auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
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
];
