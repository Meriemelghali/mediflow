import { Routes } from '@angular/router';
import { AppointmentsComponent } from './components/appointments/appointments.component';

export const routes: Routes = [
  { path: '', redirectTo: 'appointments', pathMatch: 'full' },
  { path: 'appointments', component: AppointmentsComponent },
];
