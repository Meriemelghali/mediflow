export type Assurance = {
  id: number;
  patientId: number;
  typeAssurance: string;
  tauxRemboursement: number;
  active: boolean;
};

export type AssuranceCreateRequest = {
  patientId: number;
  typeAssurance: string;
  tauxRemboursement: number;
  active?: boolean;
};

export type AssuranceUpdateRequest = {
  patientId: number;
  typeAssurance: string;
  tauxRemboursement: number;
  active: boolean;
};
