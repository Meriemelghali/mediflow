export interface Room {
  id?: number;
  roomNumber: string;
  service: string;
  type: RoomType;
  capacity: number;
  description?: string;
  active?: boolean;
  beds?: Bed[];
  availableBeds?: number;
  occupiedBeds?: number;
}

export interface Bed {
  id?: number;
  bedNumber: string;
  status: BedStatus;
  patientId?: number;
  patientName?: string;
  occupiedAt?: string;
  notes?: string;
  active?: boolean;
}

export type RoomType = 'SIMPLE' | 'DOUBLE' | 'VIP' | 'ICU' | 'PEDIATRIC' | 'MATERNITY';

export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE' | 'RESERVED';

export interface PatientOption {
  id: number;
  label: string;
}
