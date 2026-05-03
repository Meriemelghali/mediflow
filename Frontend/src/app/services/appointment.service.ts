import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment, AppointmentRequest, AppointmentStatus } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly BASE = 'http://localhost:8082/api/appointments';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.BASE);
  }

  getById(id: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.BASE}/${id}`);
  }

  getByPatientId(patientId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.BASE}/patient/${patientId}`);
  }

  getByDoctorId(doctorId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.BASE}/doctor/${doctorId}`);
  }

  create(request: AppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.BASE, request);
  }

  update(id: number, request: AppointmentRequest): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.BASE}/${id}`, request);
  }

  updateStatus(id: number, status: AppointmentStatus): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.BASE}/${id}/status`, null, {
      params: { status }
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }
}
