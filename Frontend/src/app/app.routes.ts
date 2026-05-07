import { Routes } from '@angular/router';
import { AppointmentsComponent } from './components/appointments/appointments.component';
import { ExamsComponent } from './components/exams/exams.component';

export const routes: Routes = [
  { path: '', redirectTo: 'appointments', pathMatch: 'full' },
  { path: 'appointments', component: AppointmentsComponent },
  { path: 'exams', component: ExamsComponent },
];
