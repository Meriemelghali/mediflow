import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AssuranceApi } from './assurance.api';
import { Assurance, AssuranceCreateRequest, AssuranceUpdateRequest } from './assurance.models';

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
export class AssurancePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);

  loading = signal(false);
  error = signal<string | null>(null);
  toast = signal<string | null>(null);

  assurances = signal<Assurance[]>([]);
  selected = signal<Assurance | null>(null);
  modalMode = signal<'create' | 'edit' | null>(null);

  patients: PatientOption[] = [
    { id: 1, label: '1 · Test Patient One' },
    { id: 2, label: '2 · Test Patient Two' }
  ];

  activeCount = computed(() => this.assurances().filter(a => a.active).length);
  selectedId = computed(() => this.selected()?.id ?? null);
  isModalOpen = computed(() => this.modalMode() !== null);
  isEditMode = computed(() => this.modalMode() === 'edit');

  patientSearchForm = this.fb.group({
    patientId: this.fb.nonNullable.control<number | null>(1, [Validators.required, Validators.min(1)])
  });

  modalForm = this.fb.group({
    patientId: this.fb.nonNullable.control<number | null>(1, [Validators.required, Validators.min(1)]),
    typeAssurance: this.fb.nonNullable.control('CNAM', [Validators.required, Validators.minLength(2)]),
    tauxRemboursement: this.fb.nonNullable.control<number | null>(0.8, [Validators.required, Validators.min(0), Validators.max(1)]),
    active: this.fb.nonNullable.control(true)
  });

  constructor(private readonly api: AssuranceApi) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.refreshByPatient();
    }
  }

  patientLabel(patientId: number | null) {
    if (patientId === null || patientId === undefined) {
      return 'Aucun patient';
    }

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
          if (list.length && this.isEditMode()) {
            this.syncModalFormFromSelected();
          }
        },
        error: err => this.error.set(this.extractError(err))
      });
  }

  openCreateModal() {
    this.modalMode.set('create');
    this.selected.set(null);
    this.modalForm.reset({
      patientId: this.patientSearchForm.value.patientId ?? 1,
      typeAssurance: 'CNAM',
      tauxRemboursement: 0.8,
      active: true
    });
    this.error.set(null);
  }

  openEditModal(item: Assurance) {
    this.selected.set(item);
    this.modalMode.set('edit');
    this.syncModalFormFromSelected();
    this.error.set(null);
  }

  closeModal() {
    this.modalMode.set(null);
    this.selected.set(null);
    this.error.set(null);
  }

  submitModal() {
    this.error.set(null);
    if (this.modalForm.invalid) {
      this.modalForm.markAllAsTouched();
      return;
    }

    const payload: AssuranceCreateRequest = {
      patientId: this.modalForm.value.patientId!,
      typeAssurance: this.modalForm.value.typeAssurance!,
      tauxRemboursement: this.modalForm.value.tauxRemboursement!,
      active: this.modalForm.value.active ?? true
    };

    if (this.isEditMode() && this.selected()) {
      this.updateAssurance(this.selected()!, payload as AssuranceUpdateRequest);
      return;
    }

    this.createAssurance(payload);
  }

  private createAssurance(payload: AssuranceCreateRequest) {
    this.loading.set(true);
    this.api
      .create(payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: created => {
          this.patientSearchForm.patchValue({ patientId: created.patientId });
          this.toast.set('Assurance créée.');
          this.modalMode.set(null);
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
            this.syncModalFormFromSelected();
          }
        },
        error: err => this.error.set(this.extractError(err))
      });
  }

  select(item: Assurance) {
    this.selected.set(item);
  }

  editFromRow(item: Assurance) {
    this.openEditModal(item);
  }

  private updateAssurance(selected: Assurance, payload: AssuranceUpdateRequest) {
    this.loading.set(true);
    this.api
      .update(selected.id, payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: updated => {
          this.assurances.set(this.assurances().map(a => (a.id === updated.id ? updated : a)));
          this.selected.set(updated);
          this.toast.set('Assurance mise à jour.');
          this.modalMode.set(null);
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
          this.modalMode.set(null);
          this.assurances.set(this.assurances().filter(a => a.id !== selected.id));
          const nextSelected = this.assurances()[0] ?? null;
          this.selected.set(nextSelected);
          this.syncModalFormFromSelected();
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

  private syncModalFormFromSelected() {
    const selected = this.selected();
    if (!selected) {
      this.modalForm.reset({ patientId: 1, typeAssurance: 'CNAM', tauxRemboursement: 0.8, active: true });
      return;
    }

    this.modalForm.reset({
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
