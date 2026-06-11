import { Routes } from '@angular/router';
import { AppointmentsComponent } from './components/appointments/appointments.component';
import { AssurancePageComponent } from './assurance/assurance.page';
import { ExamsComponent } from './components/exams/exams.component';
import { PharmacyComponent } from './pharmacy/pharmacy.component';

export const routes: Routes = [
  { path: '', redirectTo: 'appointments', pathMatch: 'full' },
  { path: 'appointments', component: AppointmentsComponent },
  { path: 'assurance', component: AssurancePageComponent },
  { path: 'exams', component: ExamsComponent },
  { path: 'pharmacy', component: PharmacyComponent },
];
