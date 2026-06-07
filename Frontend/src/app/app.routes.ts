import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'assurance'
  },
  {
    path: 'assurance',
    loadComponent: () => import('./assurance/assurance.page').then(m => m.AssurancePageComponent)
  }
];
