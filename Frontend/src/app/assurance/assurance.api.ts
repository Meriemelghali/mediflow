import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Assurance, AssuranceCreateRequest, AssuranceUpdateRequest } from './assurance.models';

@Injectable({ providedIn: 'root' })
export class AssuranceApi {
  private readonly baseUrl = '/api/assurance';

  constructor(private readonly http: HttpClient) {}

  create(payload: AssuranceCreateRequest): Observable<Assurance> {
    return this.http.post<Assurance>(`${this.baseUrl}/`, payload);
  }

  getById(id: number): Observable<Assurance> {
    return this.http.get<Assurance>(`${this.baseUrl}/${id}`);
  }

  getByPatientId(patientId: number): Observable<Assurance[]> {
    return this.http.get<Assurance[]>(`${this.baseUrl}?patientId=${patientId}`);
  }

  setActive(id: number, value: boolean): Observable<Assurance> {
    return this.http.patch<Assurance>(`${this.baseUrl}/${id}/active?value=${value}`, null);
  }

  update(id: number, payload: AssuranceUpdateRequest): Observable<Assurance> {
    return this.http.put<Assurance>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
