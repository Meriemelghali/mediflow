import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AssuranceApi } from './assurance.api';
import { Assurance, AssuranceUpdateRequest } from './assurance.models';

type PatientOption = {
  id: number;
  label: string;
};

@Component({
  selector: 'app-assurance-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './assurance.page.html',
  styleUrl: './assurance.page.css'
})
export class AssurancePageComponent {
  private readonly fb = inject(FormBuilder);

  loading = signal(false);
  error = signal<string | null>(null);
  toast = signal<string | null>(null);

  assurances = signal<Assurance[]>([]);
  selected = signal<Assurance | null>(null);

  patients: PatientOption[] = [
    { id: 1, label: '1 · Hichem B.' },
    { id: 2, label: '2 · Amina S.' },
    { id: 3, label: '3 · Selma T.' },
    { id: 4, label: '4 · Youssef M.' }
  ];

  activeCount = computed(() => this.assurances().filter(a => a.active).length);
  selectedId = computed(() => this.selected()?.id ?? null);

  patientSearchForm = this.fb.group({
    patientId: this.fb.nonNullable.control<number | null>(1, [Validators.required, Validators.min(1)])
  });

  createForm = this.fb.group({
    patientId: this.fb.nonNullable.control<number | null>(1, [Validators.required, Validators.min(1)]),
    typeAssurance: this.fb.nonNullable.control('CNAM', [Validators.required, Validators.minLength(2)]),
    tauxRemboursement: this.fb.nonNullable.control<number | null>(0.8, [Validators.required, Validators.min(0), Validators.max(1)]),
    active: this.fb.nonNullable.control(true)
  });

  editForm = this.fb.group({
    patientId: this.fb.nonNullable.control<number | null>(1, [Validators.required, Validators.min(1)]),
    typeAssurance: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    tauxRemboursement: this.fb.nonNullable.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(1)]),
    active: this.fb.nonNullable.control(true)
  });

  constructor(private readonly api: AssuranceApi) {}

  patientLabel(patientId: number | null) {
    return this.patients.find(patient => patient.id === patientId)?.label ?? `#${patientId}`;
  }

  refreshByPatient() {
    this.error.set(null);
    const patientId = this.patientSearchForm.value.patientId ?? null;
    if (!patientId) return;

    this.loading.set(true);
    this.api
      .getByPatientId(patientId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: list => {
          this.assurances.set(list);
          this.selected.set(list.length ? list[0] : null);
          if (list.length) this.syncEditFormFromSelected();
        },
        error: err => this.error.set(this.extractError(err))
      });
  }

  createAssurance() {
    this.error.set(null);
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const patientId = this.createForm.value.patientId!;
    const typeAssurance = this.createForm.value.typeAssurance!;
    const tauxRemboursement = this.createForm.value.tauxRemboursement!;
    const active = this.createForm.value.active ?? true;

    this.loading.set(true);
    this.api
      .create({ patientId, typeAssurance, tauxRemboursement, active })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: created => {
          this.patientSearchForm.patchValue({ patientId: created.patientId });
          this.toast.set('Assurance créée.');
          this.refreshByPatient();
        },
        error: err => this.error.set(this.extractError(err))
      });
  }

  toggleActive(item: Assurance) {
    this.error.set(null);
    this.loading.set(true);
    this.api
      .setActive(item.id, !item.active)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: updated => {
          this.assurances.set(this.assurances().map(a => (a.id === updated.id ? updated : a)));
          if (this.selected()?.id === updated.id) {
            this.selected.set(updated);
            this.syncEditFormFromSelected();
          }
        },
        error: err => this.error.set(this.extractError(err))
      });
  }

  select(item: Assurance) {
    this.selected.set(item);
    this.syncEditFormFromSelected();
    this.error.set(null);
  }

  saveSelected() {
    this.error.set(null);
    const selected = this.selected();
    if (!selected) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const payload: AssuranceUpdateRequest = {
      patientId: this.editForm.value.patientId!,
      typeAssurance: this.editForm.value.typeAssurance!,
      tauxRemboursement: this.editForm.value.tauxRemboursement!,
      active: this.editForm.value.active ?? true
    };

    this.loading.set(true);
    this.api
      .update(selected.id, payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: updated => {
          this.assurances.set(this.assurances().map(a => (a.id === updated.id ? updated : a)));
          this.selected.set(updated);
          this.toast.set('Assurance mise à jour.');
        },
        error: err => this.error.set(this.extractError(err))
      });
  }

  deleteSelected() {
    this.error.set(null);
    const selected = this.selected();
    if (!selected) return;

    this.loading.set(true);
    this.api
      .delete(selected.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.toast.set('Assurance supprimée.');
          this.assurances.set(this.assurances().filter(a => a.id !== selected.id));
          const nextSelected = this.assurances()[0] ?? null;
          this.selected.set(nextSelected);
          this.syncEditFormFromSelected();
        },
        error: err => this.error.set(this.extractError(err))
      });
  }

  trackById(_: number, item: Assurance) {
    return item.id;
  }

  dismissToast() {
    this.toast.set(null);
  }

  private syncEditFormFromSelected() {
    const selected = this.selected();
    if (!selected) {
      this.editForm.reset({ patientId: 1, typeAssurance: '', tauxRemboursement: null, active: true });
      return;
    }
    this.editForm.reset({
      patientId: selected.patientId,
      typeAssurance: selected.typeAssurance,
      tauxRemboursement: selected.tauxRemboursement,
      active: selected.active
    });
  }

  private extractError(err: any): string {
    if (err?.status === 0) {
      return "Impossible de traiter la requête pour le moment. Rafraîchis la page et réessaie.";
    }

    const apiError = err?.error;
    if (apiError?.error) return apiError.error;
    if (typeof apiError === 'string' && apiError.trim().length > 0) return apiError;

    return "Une erreur s'est produite. Réessaie.";
  }
}
