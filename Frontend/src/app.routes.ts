import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './app/layouts/auth-layout/auth-layout.component';
import { authGuard } from './app/core/guards/auth.guard';

export const routes: Routes = [
  // par défaut
  { path: '', redirectTo: 'appointments', pathMatch: 'full' },
  {
    path: '',
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
