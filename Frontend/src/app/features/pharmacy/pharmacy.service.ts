import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Medication, Dispensing, DispensingRequest, PatientOption, User } from './pharmacy.models';

@Injectable({
  providedIn: 'root'
})
export class PharmacyService {
  private readonly medBase = '/api/pharmacy/medications';
  private readonly dispBase = '/api/pharmacy/dispensings';
  private readonly userBase = '/api/user';

  constructor(private readonly http: HttpClient) {}

  getMedications(): Observable<Medication[]> {
    return this.http.get<Medication[]>(this.medBase);
  }

  getMedicationById(id: number): Observable<Medication> {
    return this.http.get<Medication>(`${this.medBase}/${id}`);
  }

  createMedication(medication: Medication): Observable<Medication> {
    return this.http.post<Medication>(this.medBase, medication);
  }

  updateMedication(id: number, medication: Medication): Observable<Medication> {
    return this.http.put<Medication>(`${this.medBase}/${id}`, medication);
  }

  deleteMedication(id: number): Observable<void> {
    return this.http.delete<void>(`${this.medBase}/${id}`);
  }

  getLowStock(threshold: number = 10): Observable<Medication[]> {
    return this.http.get<Medication[]>(`${this.medBase}/low-stock?threshold=${threshold}`);
  }

  getDispensings(): Observable<Dispensing[]> {
    return this.http.get<Dispensing[]>(this.dispBase);
  }

  dispense(request: DispensingRequest): Observable<Dispensing> {
    return this.http.post<Dispensing>(this.dispBase, request);
  }

  getDispensingsByPatient(patientId: number): Observable<Dispensing[]> {
    return this.http.get<Dispensing[]>(`${this.dispBase}/patient/${patientId}`);
  }

  getPatients(): Observable<PatientOption[]> {
    return this.http.get<User[]>(this.userBase).pipe(
      map(users =>
        users
          .filter(u => u.role === 'PATIENT')
          .map(u => ({
            id: u.patientCode,
            label: `${u.patientCode} · ${u.firstName} ${u.lastName}`
          }))
      )
    );
  }
}
