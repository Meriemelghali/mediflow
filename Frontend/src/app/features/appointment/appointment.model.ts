export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id?: number;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  reason: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt?: string;
}

export interface AppointmentRequest {
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  reason: string;
  status?: AppointmentStatus;
  notes?: string;
}
