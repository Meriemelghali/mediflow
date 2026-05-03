import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppointmentService } from '../../services/appointment.service';
import { Appointment, AppointmentRequest, AppointmentStatus } from '../../models/appointment.model';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './appointment-form.component.html',
  styleUrl: './appointment-form.component.css',
})
export class AppointmentFormComponent implements OnInit, OnChanges {
  @Input() appointment: Appointment | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  submitting = false;
  apiError = '';

  statuses: { value: AppointmentStatus; label: string; color: string }[] = [
    { value: 'SCHEDULED', label: 'Programmé',  color: '#3b82f6' },
    { value: 'CONFIRMED', label: 'Confirmé',   color: '#10b981' },
    { value: 'COMPLETED', label: 'Terminé',    color: '#8b5cf6' },
    { value: 'CANCELLED', label: 'Annulé',     color: '#ef4444' },
  ];

  get isEdit(): boolean {
    return !!this.appointment?.id;
  }

  constructor(private fb: FormBuilder, private svc: AppointmentService) {}

  ngOnInit() {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['appointment'] && this.form) {
      this.fillForm();
    }
  }

  private buildForm() {
    this.form = this.fb.group({
      patientId: [null, [Validators.required, Validators.min(1)]],
      doctorId: [null, [Validators.required, Validators.min(1)]],
      appointmentDate: ['', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      status: ['SCHEDULED', Validators.required],
      notes: ['', Validators.maxLength(500)],
    });
    this.fillForm();
  }

  private fillForm() {
    if (!this.form) return;
    this.apiError = '';

    if (this.appointment) {
      const dateStr = this.appointment.appointmentDate
        ? this.appointment.appointmentDate.substring(0, 16)
        : '';
      this.form.patchValue({
        patientId: this.appointment.patientId,
        doctorId: this.appointment.doctorId,
        appointmentDate: dateStr,
        reason: this.appointment.reason,
        status: this.appointment.status || 'SCHEDULED',
        notes: this.appointment.notes || '',
      });
    } else {
      this.form.reset({ status: 'SCHEDULED' });
    }
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.submitting = true;
    this.apiError = '';

    const v = this.form.value;
    const request: AppointmentRequest = {
      patientId: Number(v.patientId),
      doctorId: Number(v.doctorId),
      appointmentDate: v.appointmentDate + ':00',
      reason: v.reason.trim(),
      status: v.status,
      notes: v.notes?.trim() || undefined,
    };

    const obs = this.isEdit
      ? this.svc.update(this.appointment!.id!, request)
      : this.svc.create(request);

    obs.subscribe({
      next: () => {
        this.submitting = false;
        this.saved.emit();
      },
      error: (err) => {
        this.submitting = false;
        if (err?.status === 0) {
          this.apiError =
            'Connexion impossible. Vérifiez que Spring Boot est démarré sur le port 8082.';
        } else if (err?.error?.message) {
          this.apiError = err.error.message;
        } else {
          this.apiError = 'Une erreur est survenue. Vérifiez les champs saisis.';
        }
      },
    });
  }
}
