import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Room, Bed, PatientOption } from './room.model';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private readonly baseUrl = '/api/rooms';
  private readonly collectionUrl = '/api/rooms/';
  private readonly userUrl = '/api/user';

  constructor(private readonly http: HttpClient) {}

  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(this.collectionUrl);
  }

  getRoomById(id: number): Observable<Room> {
    return this.http.get<Room>(`${this.baseUrl}/${id}`);
  }

  addRoom(room: Partial<Room>): Observable<Room> {
    return this.http.post<Room>(this.collectionUrl, room);
  }

  updateRoom(id: number, room: Partial<Room>): Observable<Room> {
    return this.http.put<Room>(`${this.baseUrl}/${id}`, room);
  }

  deleteRoom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getBeds(roomId: number): Observable<Bed[]> {
    return this.http.get<Bed[]>(`${this.baseUrl}/${roomId}/beds`);
  }

  addBed(roomId: number, bed: Partial<Bed>): Observable<Bed> {
    return this.http.post<Bed>(`${this.baseUrl}/${roomId}/beds`, bed);
  }

  updateBed(bedId: number, bed: Partial<Bed>): Observable<Bed> {
    return this.http.put<Bed>(`${this.baseUrl}/beds/${bedId}`, bed);
  }

  updateBedStatus(bedId: number, status: Bed['status'], notes?: string): Observable<Bed> {
    return this.http.put<Bed>(`${this.baseUrl}/beds/${bedId}/status`, { status, notes });
  }

  deleteBed(bedId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/beds/${bedId}`);
  }



  admitPatient(bedId: number, patientId: number, patientName: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/beds/${bedId}/admit`, {
      patientId,
      patientName
    });
  }

  releaseBed(bedId: number): Observable<Bed> {
    return this.http.put<Bed>(`${this.baseUrl}/beds/${bedId}/release`, {});
  }

  getPatients(): Observable<PatientOption[]> {
    return this.http.get<any[]>(this.userUrl).pipe(
      map(users => 
        users
          .filter(u => u.roles?.includes('PATIENT') || u.activeRole === 'PATIENT')
          .map(u => ({
            id: u.patientCode,
            label: `${u.firstName} ${u.lastName} (Code: ${u.patientCode})`
          }))
      )
    );
  }
}
