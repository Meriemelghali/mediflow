import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExamService } from '../../services/exam.service';
import { Examen, ExamStatus, PageExamen, Patient, Resultat } from '../../models/exam.model';

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exams.component.html',
  styleUrls: ['./exams.component.css']
})
export class ExamsComponent implements OnInit {
  exams: Examen[] = [];
  patients: Patient[] = [];
  totalPages: number = 0;
  currentPage: number = 0;
  pageSize: number = 5;
  keyword: string = '';
  statusFilter: ExamStatus | '' = '';
  loading: boolean = false;
  
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  showDetailsModal: boolean = false;
  showResultsModal: boolean = false;
  
  newExam: Partial<Examen> = {
    nomExamen: '',
    patientId: 0,
    status: ExamStatus.PLANIFIE
  };

  selectedExam: Examen | null = null;
  newResult: Resultat = { valeur: '', unite: '' };
  
  selectedFullDetails: any = null;

  constructor(private examService: ExamService) {}

  ngOnInit(): void {
    this.loadPatients();
    this.loadExams();
  }

  loadPatients(): void {
    this.examService.getPatients().subscribe(data => this.patients = data);
  }

  getPatientName(id: number): string {
    const p = this.patients.find(p => p.id === id);
    return p ? `${p.nom} ${p.prenom}` : `Patient #${id}`;
  }

  loadExams(page: number = 0): void {
    this.loading = true;
    this.examService.getExams(page, this.pageSize, this.keyword, this.statusFilter || undefined)
      .subscribe({
        next: (data) => {
          this.exams = data.content;
          this.totalPages = data.totalPages;
          this.currentPage = data.number;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
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

  openAddModal(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  createExam(): void {
    this.examService.createExam(this.newExam).subscribe(() => {
      this.closeAddModal();
      this.loadExams(0);
      this.newExam = { nomExamen: '', patientId: 0, status: ExamStatus.PLANIFIE };
    });
  }

  deleteExam(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer cet examen ?')) {
      this.examService.deleteExam(id).subscribe(() => this.loadExams(this.currentPage));
    }
  }

  openEditModal(exam: Examen): void {
    this.selectedExam = { ...exam };
    this.showEditModal = true;
  }

  updateExam(): void {
    if (this.selectedExam && this.selectedExam.id) {
      this.examService.updateExam(this.selectedExam.id, this.selectedExam).subscribe(() => {
        this.showEditModal = false;
        this.loadExams(this.currentPage);
      });
    }
  }

  openResultsModal(exam: Examen): void {
    this.selectedExam = exam;
    this.showResultsModal = true;
  }

  addResult(): void {
    if (this.selectedExam && this.selectedExam.id) {
      this.examService.addResult(this.selectedExam.id, this.newResult).subscribe(res => {
        this.selectedExam?.resultats?.push(res);
        this.newResult = { valeur: '', unite: '' };
        this.loadExams(this.currentPage); // Pour rafraichir le statut si passé en EN_COURS
      });
    }
  }

  deleteResult(id: number): void {
    if (confirm('Supprimer ce résultat ?')) {
      this.examService.deleteResult(id).subscribe(() => {
        if (this.selectedExam) {
          this.selectedExam.resultats = this.selectedExam.resultats?.filter(r => r.id !== id);
        }
      });
    }
  }

  viewFullDetails(id: number): void {
    this.loading = true;
    this.examService.getFullDetails(id).subscribe((data) => {
      this.selectedFullDetails = data;
      this.showDetailsModal = true;
      this.loading = false;
    }, () => this.loading = false);
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedFullDetails = null;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }
}
