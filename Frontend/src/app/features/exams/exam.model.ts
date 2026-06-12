export enum ExamStatus {
  PLANIFIE = 'PLANIFIE',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE'
}

export interface Patient {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
}

export interface Resultat {
  id?: number;
  valeur: string;
  unite: string;
}

export interface Examen {
  id?: number;
  nomExamen: string;
  dateExamen?: string;
  patientId: number;
  status: ExamStatus;
  resultats?: Resultat[];
}

/** Correspond au ExamRequestDTO du backend */
export interface ExamRequestDTO {
  nomExamen: string;
  patientId: number;
  status?: ExamStatus;
}

/** Correspond au ResultatRequestDTO du backend */
export interface ResultatRequestDTO {
  valeur: string;
  unite: string;
}

/** Correspond au ExamResponseDTO du backend (appel /full via Feign) */
export interface ExamResponseDTO {
  examen: Examen;
  patient: Patient | null;
  bills: BillDTO[] | null;
}

export interface BillDTO {
  reference: string;
  montantTotal: number;
  statut: string; // NON_PAYE | PAYE
}

export interface PageExamen {
  content: Examen[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

/** Message de retour d'erreur standardisé du backend */
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
}
