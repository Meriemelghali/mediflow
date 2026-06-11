export interface Paiement {
  id?: number;
  datePaiement: string; // Format YYYY-MM-DD
  montant: number;
  methodePaiement: string; // CASH, CARD, etc.
}

export interface Facture {
  id?: number;
  reference: string;
  montantTotal: number;
  statut: string; // EN_ATTENTE, PAYEE, etc.
  paiements?: Paiement[];
}
