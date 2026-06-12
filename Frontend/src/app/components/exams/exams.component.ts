import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExamService } from './exam.service';
import {
  Examen, ExamRequestDTO, ExamResponseDTO,
  ExamStatus, PageExamen, Patient, Resultat, ResultatRequestDTO
} from './exam.model';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exams.component.html',
  styleUrls: ['./exams.component.css']
})
export class ExamsComponent implements OnInit, OnDestroy {
  exams: Examen[] = [];
  patients: Patient[] = [];
  totalPages: number = 0;
  currentPage: number = 0;
  pageSize: number = 5;
  keyword: string = '';
  statusFilter: ExamStatus | '' = '';
  loading: boolean = false;

  // Modals
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  showDetailsModal: boolean = false;
  showResultsModal: boolean = false;
  showStatusModal: boolean = false;

  // Formulaires
  newExam: ExamRequestDTO = { nomExamen: '', patientId: 0, status: ExamStatus.PLANIFIE };
  selectedExam: Examen | null = null;
  editExamDTO: ExamRequestDTO = { nomExamen: '', patientId: 0 };

  // Résultats
  newResult: ResultatRequestDTO = { valeur: '', unite: '' };
  editingResult: Resultat | null = null;
  editResultDTO: ResultatRequestDTO = { valeur: '', unite: '' };

  // Vue détails Feign
  selectedFullDetails: ExamResponseDTO | null = null;

  // Changement de statut
  pendingStatusChange: { exam: Examen; newStatus: ExamStatus } | null = null;

  // Toasts
  toasts: Toast[] = [];
  private toastCounter = 0;
  private toastTimers: any[] = [];

  // Pour les templates
  readonly ExamStatus = ExamStatus;
  readonly statusLabels: Record<ExamStatus, string> = {
    PLANIFIE: 'Planifié',
    EN_COURS: 'En cours',
    TERMINE: 'Terminé',
    ANNULE: 'Annulé'
  };

  readonly statusOptions: ExamStatus[] = [
    ExamStatus.PLANIFIE,
    ExamStatus.EN_COURS,
    ExamStatus.TERMINE,
    ExamStatus.ANNULE
  ];

  constructor(private examService: ExamService) {}

  ngOnInit(): void {
    this.loadPatients();
    this.loadExams();
  }

  ngOnDestroy(): void {
    this.toastTimers.forEach(t => clearTimeout(t));
  }

  // ─── Toast system ───────────────────────────────────────────────────────────

  showToast(message: string, type: Toast['type'] = 'success'): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, message, type });
    const timer = setTimeout(() => this.dismissToast(id), 4000);
    this.toastTimers.push(timer);
  }

  dismissToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  // ─── Data loading ────────────────────────────────────────────────────────────

  loadPatients(): void {
    this.examService.getPatients().subscribe({
      next: data => this.patients = data,
      error: err => this.showToast('Impossible de charger les patients.', 'warning')
    });
  }

  getPatientName(id: number): string {
    const p = this.patients.find(p => p.id === id);
    return p ? `${p.nom} ${p.prenom}` : `Patient #${id}`;
  }

  loadExams(page: number = 0): void {
    this.loading = true;
    this.examService.getExams(page, this.pageSize, this.keyword || undefined, this.statusFilter || undefined)
      .subscribe({
        next: (data) => {
          this.exams = data.content;
          this.totalPages = data.totalPages;
          this.currentPage = data.number;
          this.loading = false;
        },
        error: (err) => {
          this.showToast(err.message || 'Erreur de chargement des examens.', 'error');
          this.loading = false;
        }
      });
  }

  onSearch(): void {
    this.loadExams(0);
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.loadExams(page);
    }
  }

  // ─── Création ────────────────────────────────────────────────────────────────

  openAddModal(): void {
    this.newExam = { nomExamen: '', patientId: 0, status: ExamStatus.PLANIFIE };
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  createExam(): void {
    if (!this.newExam.nomExamen?.trim()) {
      this.showToast('Le nom de l\'examen est requis.', 'warning');
      return;
    }
    if (!this.newExam.patientId) {
      this.showToast('Veuillez sélectionner un patient.', 'warning');
      return;
    }
    this.examService.createExam(this.newExam).subscribe({
      next: () => {
        this.closeAddModal();
        this.loadExams(0);
        this.showToast('Examen créé avec succès.', 'success');
      },
      error: (err) => this.showToast(err.message, 'error')
    });
  }

  // ─── Modification ────────────────────────────────────────────────────────────

  openEditModal(exam: Examen): void {
    this.selectedExam = { ...exam };
    this.editExamDTO = {
      nomExamen: exam.nomExamen,
      patientId: exam.patientId,
      status: exam.status
    };
    this.showEditModal = true;
  }

  updateExam(): void {
    if (!this.selectedExam?.id) return;
    if (!this.editExamDTO.nomExamen?.trim()) {
      this.showToast('Le nom de l\'examen est requis.', 'warning');
      return;
    }
    this.examService.updateExam(this.selectedExam.id, this.editExamDTO).subscribe({
      next: () => {
        this.showEditModal = false;
        this.loadExams(this.currentPage);
        this.showToast('Examen mis à jour.', 'success');
      },
      error: (err) => this.showToast(err.message, 'error')
    });
  }

  // ─── Suppression ─────────────────────────────────────────────────────────────

  deleteExam(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer cet examen ?')) {
      this.examService.deleteExam(id).subscribe({
        next: () => {
          this.loadExams(this.currentPage);
          this.showToast('Examen supprimé.', 'success');
        },
        error: (err) => this.showToast(err.message, 'error')
      });
    }
  }

  // ─── Changement de statut ────────────────────────────────────────────────────

  openStatusModal(exam: Examen): void {
    this.pendingStatusChange = { exam, newStatus: exam.status };
    this.showStatusModal = true;
  }

  confirmStatusChange(): void {
    if (!this.pendingStatusChange) return;
    const { exam, newStatus } = this.pendingStatusChange;

    this.examService.updateStatus(exam.id!, newStatus).subscribe({
      next: () => {
        this.showStatusModal = false;
        this.pendingStatusChange = null;
        this.loadExams(this.currentPage);
        const msg = newStatus === ExamStatus.TERMINE
          ? 'Statut mis à TERMINÉ — une facture a été envoyée via RabbitMQ.'
          : `Statut mis à ${this.statusLabels[newStatus]}.`;
        this.showToast(msg, newStatus === ExamStatus.TERMINE ? 'info' : 'success');
      },
      error: (err) => {
        this.showStatusModal = false;
        this.showToast(err.message, 'error');
      }
    });
  }

  // ─── Résultats ───────────────────────────────────────────────────────────────

  openResultsModal(exam: Examen): void {
    this.selectedExam = { ...exam };
    this.newResult = { valeur: '', unite: '' };
    this.editingResult = null;
    this.showResultsModal = true;
  }

  addResult(): void {
    if (!this.selectedExam?.id) return;
    if (!this.newResult.valeur.trim()) {
      this.showToast('La valeur est requise.', 'warning');
      return;
    }
    this.examService.addResult(this.selectedExam.id, this.newResult).subscribe({
      next: (res) => {
        if (!this.selectedExam!.resultats) this.selectedExam!.resultats = [];
        this.selectedExam!.resultats.push(res);
        this.newResult = { valeur: '', unite: '' };
        this.loadExams(this.currentPage);
        this.showToast('Résultat ajouté.', 'success');
      },
      error: (err) => this.showToast(err.message, 'error')
    });
  }

  startEditResult(r: Resultat): void {
    this.editingResult = r;
    this.editResultDTO = { valeur: r.valeur, unite: r.unite };
  }

  saveEditResult(): void {
    if (!this.editingResult?.id) return;
    this.examService.updateResult(this.editingResult.id, this.editResultDTO).subscribe({
      next: (updated) => {
        if (this.selectedExam?.resultats) {
          const idx = this.selectedExam.resultats.findIndex(r => r.id === updated.id);
          if (idx !== -1) this.selectedExam.resultats[idx] = updated;
        }
        this.editingResult = null;
        this.showToast('Résultat mis à jour.', 'success');
      },
      error: (err) => this.showToast(err.message, 'error')
    });
  }

  cancelEditResult(): void {
    this.editingResult = null;
  }

  deleteResult(id: number): void {
    if (confirm('Supprimer ce résultat ?')) {
      this.examService.deleteResult(id).subscribe({
        next: () => {
          if (this.selectedExam) {
            this.selectedExam.resultats = this.selectedExam.resultats?.filter(r => r.id !== id);
          }
          this.showToast('Résultat supprimé.', 'success');
        },
        error: (err) => this.showToast(err.message, 'error')
      });
    }
  }

  // ─── Détails Feign ───────────────────────────────────────────────────────────

  viewFullDetails(id: number): void {
    this.loading = true;
    this.examService.getFullDetails(id).subscribe({
      next: (data) => {
        this.selectedFullDetails = data;
        this.showDetailsModal = true;
        this.loading = false;
      },
      error: (err) => {
        this.showToast(err.message || 'Impossible de charger les détails.', 'error');
        this.loading = false;
      }
    });
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedFullDetails = null;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  trackById(index: number, exam: Examen): number {
    return exam.id ?? index;
  }

  getStatusClass(status: ExamStatus | string): string {
    return `status-${status}`;
  }

  isCanTerminate(status: ExamStatus): boolean {
    return status === ExamStatus.EN_COURS;
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
}
