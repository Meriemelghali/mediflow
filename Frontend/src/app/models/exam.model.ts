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

export interface PageExamen {
  content: Examen[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}
