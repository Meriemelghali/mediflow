export interface Medication {
  id?: number;
  name: string;
  description?: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  manufacturer?: string;
  expirationDate?: string;
}

export interface Dispensing {
  id?: number;
  medicationId: number;
  patientId: number;
  quantity: number;
  totalAmount: number;
  dispensingDate?: string;
  invoiceId?: number;
}

export interface DispensingRequest {
  medicationId: number;
  patientId: number;
  quantity: number;
}

export interface PatientOption {
  id: number;
  label: string;
}

export interface User {
  patientCode: number;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  phone?: string;
}
