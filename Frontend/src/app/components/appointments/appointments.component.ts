import { Component, OnInit, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../services/appointment.service';
import { Appointment, AppointmentStatus } from '../../models/appointment.model';
import { AppointmentFormComponent } from '../appointment-form/appointment-form.component';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, AppointmentFormComponent],
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.css'
})
export class AppointmentsComponent implements OnInit {
  appointments: Appointment[] = [];
  filtered: Appointment[] = [];
  loading = false;
  error = '';

  searchQuery = '';
  statusFilter = '';

  showModal = false;
  editingAppointment: Appointment | null = null;
  deletingId: number | null = null;

  constructor(private appointmentService: AppointmentService) {
    afterNextRender(() => this.load());
  }

  ngOnInit() {}

  load() {
    this.loading = true;
    this.error = '';
    this.appointmentService.getAll().subscribe({
      next: (data) => {
        this.appointments = data.sort(
          (a, b) =>
            new Date(b.appointmentDate).getTime() -
            new Date(a.appointmentDate).getTime()
        );
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.error =
          'Impossible de charger les rendez-vous. Vérifiez que Spring Boot est démarré sur le port 8082.';
        this.loading = false;
      },
    });
  }

  applyFilters() {
    let result = [...this.appointments];

    if (this.statusFilter) {
      result = result.filter((a) => a.status === this.statusFilter);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.reason.toLowerCase().includes(q) ||
          String(a.patientId).includes(q) ||
          String(a.doctorId).includes(q) ||
          (a.notes && a.notes.toLowerCase().includes(q))
      );
    }

    this.filtered = result;
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.applyFilters();
  }

  get stats() {
    return {
      total: this.appointments.length,
      scheduled: this.appointments.filter((a) => a.status === 'SCHEDULED').length,
      confirmed: this.appointments.filter((a) => a.status === 'CONFIRMED').length,
      completed: this.appointments.filter((a) => a.status === 'COMPLETED').length,
      cancelled: this.appointments.filter((a) => a.status === 'CANCELLED').length,
    };
  }

  openCreate() {
    this.editingAppointment = null;
    this.showModal = true;
  }

  openEdit(appointment: Appointment) {
    this.editingAppointment = { ...appointment };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingAppointment = null;
  }

  onSaved() {
    this.closeModal();
    this.load();
  }

  confirmDelete(id: number) {
    this.deletingId = id;
  }

  cancelDelete() {
    this.deletingId = null;
  }

  executeDelete() {
    if (this.deletingId === null) return;
    const id = this.deletingId;
    this.deletingId = null;
    this.appointmentService.delete(id).subscribe({
      next: () => this.load(),
      error: () => {
        this.error = 'Erreur lors de la suppression. Réessayez.';
      },
    });
  }

  cycleStatus(appointment: Appointment) {
    const order: AppointmentStatus[] = [
      'SCHEDULED',
      'CONFIRMED',
      'COMPLETED',
      'CANCELLED',
    ];
    const next = order[(order.indexOf(appointment.status) + 1) % order.length];
    this.appointmentService.updateStatus(appointment.id!, next).subscribe({
      next: () => this.load(),
      error: () => {
        this.error = 'Erreur lors de la mise à jour du statut.';
      },
    });
  }

  statusLabel(status: AppointmentStatus): string {
    const map: Record<AppointmentStatus, string> = {
      SCHEDULED: 'Programmé',
      CONFIRMED: 'Confirmé',
      COMPLETED: 'Terminé',
      CANCELLED: 'Annulé',
    };
    return map[status];
  }

  formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  formatTime(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  truncate(text: string, max = 44): string {
    return text?.length > max ? text.substring(0, max) + '…' : text;
  }

  skeletonRows = [1, 2, 3, 4, 5];
}
