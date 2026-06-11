import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from './billing.service';
import { Facture, Paiement } from './billing.model';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css']
})
export class BillingComponent implements OnInit {
  factures: Facture[] = [];
  filteredFactures: Facture[] = [];
  searchKeyword: string = '';
  statusFilter: string = '';
  loading: boolean = false;

  // Stats
  totalBilled: number = 0;
  totalPaid: number = 0;
  totalPending: number = 0;

  // Modals status
  showCreateModal: boolean = false;
  showDetailsModal: boolean = false;

  // Creation form state
  createMode: 'manual' | 'appointment' | 'room' = 'manual';
  newFacture: Partial<Facture> = {
    reference: '',
    montantTotal: 0,
    statut: 'EN_ATTENTE'
  };
  appointmentSvcId: number | null = null;
  roomSvcId: number | null = null;
  roomDays: number = 1;

  // Details & Payment form state
  selectedFacture: Facture | null = null;
  newPayment: Partial<Paiement> = {
    datePaiement: new Date().toISOString().substring(0, 10),
    montant: 0,
    methodePaiement: 'CASH'
  };

  constructor(private readonly billingService: BillingService) {}

  ngOnInit(): void {
    this.loadFactures();
  }

  loadFactures(): void {
    this.loading = true;
    this.billingService.getFactures().subscribe({
      next: (data) => {
        // Trier par ID décroissant
        this.factures = data.sort((a, b) => (b.id || 0) - (a.id || 0));

        // ── Auto-passage en PAYEE ──
        // Si les paiements couvrent le montant total mais le statut est encore EN_ATTENTE
        const updates: Promise<void>[] = [];
        for (const f of this.factures) {
          if (f.statut !== 'PAYEE' && f.id) {
            const paidSum = (f.paiements || []).reduce((sum, p) => sum + (p.montant || 0), 0);
            if (paidSum >= (f.montantTotal || 0)) {
              f.statut = 'PAYEE';
              updates.push(
                new Promise<void>(resolve => {
                  this.billingService.updateFacture(f.id!, f).subscribe({ next: () => resolve(), error: () => resolve() });
                })
              );
            }
          }
        }

        this.calculateStats();
        this.filterFactures();
        this.loading = false;

        // Si la facture sélectionnée est affichée, on la rafraîchit également
        if (this.selectedFacture) {
          const updated = this.factures.find(f => f.id === this.selectedFacture!.id);
          if (updated) {
            this.selectedFacture = updated;
          }
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des factures:', err);
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.totalBilled = 0;
    this.totalPaid = 0;
    this.totalPending = 0;

    for (const f of this.factures) {
      this.totalBilled += f.montantTotal || 0;
      
      let invoicePaidSum = 0;
      if (f.paiements) {
        for (const p of f.paiements) {
          invoicePaidSum += p.montant || 0;
        }
      }
      this.totalPaid += invoicePaidSum;
    }
    
    this.totalPending = Math.max(0, this.totalBilled - this.totalPaid);
  }

  filterFactures(): void {
    this.filteredFactures = this.factures.filter(f => {
      const matchesKeyword = f.reference.toLowerCase().includes(this.searchKeyword.toLowerCase());
      const matchesStatus = this.statusFilter === '' || f.statut === this.statusFilter;
      return matchesKeyword && matchesStatus;
    });
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getFriendlyStatus(status: string): string {
    switch (status) {
      case 'PAYEE':
        return 'Payée';
      case 'EN_ATTENTE':
        return 'En attente';
      default:
        return status;
    }
  }

  getPaymentsCount(f: Facture): number {
    return f.paiements ? f.paiements.length : 0;
  }

  getPaidSum(): number {
    if (!this.selectedFacture || !this.selectedFacture.paiements) return 0;
    return this.selectedFacture.paiements.reduce((sum, p) => sum + (p.montant || 0), 0);
  }

  getRemainingDue(): number {
    if (!this.selectedFacture) return 0;
    return Math.max(0, this.selectedFacture.montantTotal - this.getPaidSum());
  }

  // Modals actions
  openCreateModal(): void {
    this.createMode = 'manual';
    this.newFacture = { reference: '', montantTotal: 0, statut: 'EN_ATTENTE' };
    this.appointmentSvcId = null;
    this.roomSvcId = null;
    this.roomDays = 1;
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  setCreateMode(mode: 'manual' | 'appointment' | 'room'): void {
    this.createMode = mode;
  }

  submitCreateFacture(): void {
    if (this.createMode === 'manual') {
      const reqFacture: Facture = {
        reference: this.newFacture.reference || 'REF-' + Date.now(),
        montantTotal: this.newFacture.montantTotal || 0,
        statut: this.newFacture.statut || 'EN_ATTENTE'
      };
      this.billingService.createFacture(reqFacture).subscribe({
        next: () => {
          this.closeCreateModal();
          this.loadFactures();
        },
        error: (err) => console.error(err)
      });
    } else if (this.createMode === 'appointment') {
      if (!this.appointmentSvcId) return;
      this.billingService.createFromAppointment(this.appointmentSvcId).subscribe({
        next: () => {
          this.closeCreateModal();
          this.loadFactures();
        },
        error: (err) => {
          alert('Erreur: Rendez-vous introuvable ou déjà facturé.');
          console.error(err);
        }
      });
    } else if (this.createMode === 'room') {
      if (!this.roomSvcId) return;
      this.billingService.createFromRoom(this.roomSvcId, this.roomDays).subscribe({
        next: () => {
          this.closeCreateModal();
          this.loadFactures();
        },
        error: (err) => {
          alert('Erreur: Chambre introuvable ou erreur de génération.');
          console.error(err);
        }
      });
    }
  }

  deleteFacture(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer cette facture ?')) {
      this.billingService.deleteFacture(id).subscribe({
        next: () => this.loadFactures(),
        error: (err) => console.error(err)
      });
    }
  }

  openDetailsModal(f: Facture): void {
    // Recharger la facture avec ses détails de paiement les plus récents
    if (f.id) {
      this.billingService.getFactureById(f.id).subscribe({
        next: (data) => {
          this.selectedFacture = data;
          this.newPayment = {
            datePaiement: new Date().toISOString().substring(0, 10),
            montant: this.getRemainingDue(), // Suggérer le reste à payer par défaut
            methodePaiement: 'CASH'
          };
          this.showDetailsModal = true;
        },
        error: (err) => console.error(err)
      });
    }
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedFacture = null;
  }

  submitAddPayment(): void {
    if (!this.selectedFacture || !this.selectedFacture.id) return;
    
    const reqPayment = {
      datePaiement: this.newPayment.datePaiement || new Date().toISOString().substring(0, 10),
      montant: this.newPayment.montant || 0,
      methodePaiement: this.newPayment.methodePaiement || 'CASH',
      facture: { id: this.selectedFacture.id }
    };

    this.billingService.ajouterPaiement(reqPayment).subscribe({
      next: (savedPayment) => {
        if (!this.selectedFacture!.paiements) {
          this.selectedFacture!.paiements = [];
        }
        this.selectedFacture!.paiements.push(savedPayment);

        // Si le reste dû est 0 ou négatif, on marque automatiquement comme PAYEE
        const paidSum = this.getPaidSum();
        if (paidSum >= this.selectedFacture!.montantTotal) {
          this.selectedFacture!.statut = 'PAYEE';
          this.billingService.updateFacture(this.selectedFacture!.id!, this.selectedFacture!).subscribe({
            next: () => this.loadFactures()
          });
        } else {
          this.loadFactures();
        }

        // Réinitialiser le formulaire
        this.newPayment = {
          datePaiement: new Date().toISOString().substring(0, 10),
          montant: this.getRemainingDue(),
          methodePaiement: 'CASH'
        };
      },
      error: (err) => {
        alert("Erreur lors de l'enregistrement du paiement");
        console.error(err);
      }
    });
  }

  updateStatusDirect(newStatus: string): void {
    if (!this.selectedFacture || !this.selectedFacture.id) return;
    this.selectedFacture.statut = newStatus;
    this.billingService.updateFacture(this.selectedFacture.id, this.selectedFacture).subscribe({
      next: () => this.loadFactures(),
      error: (err) => console.error(err)
    });
  }
}
