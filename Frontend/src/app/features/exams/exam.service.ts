import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Examen, ExamRequestDTO, ResultatRequestDTO,
  PageExamen, ExamStatus, Resultat, Patient,
  ExamResponseDTO
} from './exam.model';

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  // Toutes les requêtes passent par l'API Gateway via le proxy Angular (proxy.conf.json → http://localhost:8090)
  private readonly apiUrl = '/api/exams';
  private readonly userApiUrl = '/api/user/api/patients';

  constructor(private http: HttpClient) { }

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.userApiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getExams(page: number = 0, size: number = 10, keyword?: string, status?: ExamStatus): Observable<PageExamen> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', 'id')
      .set('direction', 'desc');

    if (keyword) params = params.set('keyword', keyword);
    if (status) params = params.set('status', status);

    return this.http.get<PageExamen>(`${this.apiUrl}/search`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getExamById(id: number): Observable<Examen> {
    return this.http.get<Examen>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getExamsByPatient(patientId: number): Observable<Examen[]> {
    return this.http.get<Examen[]>(`${this.apiUrl}/patient/${patientId}`).pipe(
      catchError(this.handleError)
    );
  }

  /** POST /api/exams — envoie un ExamRequestDTO */
  createExam(dto: ExamRequestDTO): Observable<Examen> {
    return this.http.post<Examen>(this.apiUrl, dto).pipe(
      catchError(this.handleError)
    );
  }

  /** PUT /api/exams/{id} — envoie un ExamRequestDTO (champs null ignorés côté backend) */
  updateExam(id: number, dto: ExamRequestDTO): Observable<Examen> {
    return this.http.put<Examen>(`${this.apiUrl}/${id}`, dto).pipe(
      catchError(this.handleError)
    );
  }

  deleteExam(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * PATCH /api/exams/{id}/status
   * Si status === TERMINE → le backend envoie un message RabbitMQ au billing-service
   */
  updateStatus(id: number, status: ExamStatus): Observable<Examen> {
    return this.http.patch<Examen>(`${this.apiUrl}/${id}/status`, {}, {
      params: new HttpParams().set('status', status)
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * GET /api/exams/{id}/full
   * Retourne les infos de l'examen enrichies par Feign Client (patient + factures)
   */
  getFullDetails(id: number): Observable<ExamResponseDTO> {
    return this.http.get<ExamResponseDTO>(`${this.apiUrl}/${id}/full`).pipe(
      catchError(this.handleError)
    );
  }

  /** POST /api/exams/{examId}/results — envoie un ResultatRequestDTO */
  addResult(examId: number, dto: ResultatRequestDTO): Observable<Resultat> {
    return this.http.post<Resultat>(`${this.apiUrl}/${examId}/results`, dto).pipe(
      catchError(this.handleError)
    );
  }

  /** PUT /api/exams/results/{id} — envoie un ResultatRequestDTO */
  updateResult(id: number, dto: ResultatRequestDTO): Observable<Resultat> {
    return this.http.put<Resultat>(`${this.apiUrl}/results/${id}`, dto).pipe(
      catchError(this.handleError)
    );
  }

  deleteResult(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/results/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Une erreur inattendue est survenue.';
    if (error.status === 0) {
      message = 'Impossible de joindre le serveur. Vérifiez votre connexion.';
    } else if (error.status === 401) {
      message = 'Session expirée. Veuillez vous reconnecter.';
    } else if (error.status === 403) {
      message = 'Accès refusé. Vous n\'avez pas les droits nécessaires.';
    } else if (error.status === 404) {
      message = error.error?.message || 'Ressource introuvable.';
    } else if (error.status === 400 || error.status === 422) {
      message = error.error?.message || 'Données invalides.';
    } else if (error.error?.message) {
      message = error.error.message;
    }
    return throwError(() => ({ status: error.status, message }));
  }
}
