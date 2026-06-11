import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Examen, PageExamen, ExamStatus, Resultat, Patient } from './exam.model';

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private apiUrl = 'http://localhost:8080/api/exams';

  constructor(private http: HttpClient) { }

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>('http://localhost:8080/api/user/api/patients');
  }

  getExams(page: number = 0, size: number = 10, keyword?: string, status?: ExamStatus): Observable<PageExamen> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', 'id')
      .set('direction', 'desc');

    if (keyword) params = params.set('keyword', keyword);
    if (status) params = params.set('status', status);

    return this.http.get<PageExamen>(`${this.apiUrl}/search`, { params });
  }

  createExam(exam: Partial<Examen>): Observable<Examen> {
    return this.http.post<Examen>(this.apiUrl, exam);
  }

  updateExam(id: number, exam: Partial<Examen>): Observable<Examen> {
    return this.http.put<Examen>(`${this.apiUrl}/${id}`, exam);
  }

  getFullDetails(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/full`);
  }

  updateStatus(id: number, status: ExamStatus): Observable<Examen> {
    return this.http.patch<Examen>(`${this.apiUrl}/${id}/status`, {}, {
      params: new HttpParams().set('status', status)
    });
  }

  addResult(examId: number, result: Resultat): Observable<Resultat> {
    return this.http.post<Resultat>(`${this.apiUrl}/${examId}/results`, result);
  }

  deleteResult(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/results/${id}`);
  }

  deleteExam(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
