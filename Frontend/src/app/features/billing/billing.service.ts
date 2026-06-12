import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Facture, Paiement } from './billing.model';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private readonly factureUrl = '/api/factures';
  private readonly paiementUrl = '/api/paiements';

  constructor(private readonly http: HttpClient) {}

  getFactures(): Observable<Facture[]> {
    return this.http.get<Facture[]>(this.factureUrl);
  }

  getFactureById(id: number): Observable<Facture> {
    return this.http.get<Facture>(`${this.factureUrl}/${id}`);
  }

  createFacture(facture: Facture): Observable<Facture> {
    return this.http.post<Facture>(this.factureUrl, facture);
  }

  updateFacture(id: number, facture: Facture): Observable<Facture> {
    return this.http.put<Facture>(`${this.factureUrl}/${id}`, facture);
  }

  deleteFacture(id: number): Observable<void> {
    return this.http.delete<void>(`${this.factureUrl}/${id}`);
  }

  createFromAppointment(appointmentId: number): Observable<Facture> {
    return this.http.post<Facture>(`${this.factureUrl}/from-appointment/${appointmentId}`, {});
  }

  createFromRoom(roomId: number, days: number): Observable<Facture> {
    return this.http.post<Facture>(`${this.factureUrl}/from-room/${roomId}?days=${days}`, {});
  }

  ajouterPaiement(paiement: { datePaiement: string; montant: number; methodePaiement: string; facture: { id: number } }): Observable<Paiement> {
    return this.http.post<Paiement>(this.paiementUrl, paiement);
  }
}
