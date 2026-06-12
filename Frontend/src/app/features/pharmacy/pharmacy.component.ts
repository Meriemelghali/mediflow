import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { PharmacyService } from './pharmacy.service';
import { Medication, Dispensing, DispensingRequest, PatientOption } from './pharmacy.models';

@Component({
  selector: 'app-pharmacy',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pharmacy.component.html',
  styleUrl: './pharmacy.component.css'
})
export class PharmacyComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly pharmacyService = inject(PharmacyService);

  // Core signals
  loading = signal(false);
  error = signal<string | null>(null);
  toast = signal<string | null>(null);
  activeTab = signal<'medications' | 'dispensings'>('medications');

  // Data signals
  medications = signal<Medication[]>([]);
  dispensings = signal<Dispensing[]>([]);
  patients = signal<PatientOption[]>([]);
  selectedMedication = signal<Medication | null>(null);

  // Filters
  medicationSearch = signal('');
  categoryFilter = signal('');
  lowStockOnly = signal(false);
  dispensingPatientFilter = signal<number | null>(null);
  patientSearch = signal('');
  isPatientDropdownOpen = signal(false);

  // Modal control
  modalMode = signal<'create' | 'edit' | 'dispense' | null>(null);

  // Forms
  medicationForm = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    description: this.fb.nonNullable.control(''),
    category: this.fb.nonNullable.control('Antalgique', [Validators.required]),
    unitPrice: this.fb.nonNullable.control<number>(0.0, [Validators.required, Validators.min(0)]),
    currentStock: this.fb.nonNullable.control<number>(0, [Validators.required, Validators.min(0)]),
    manufacturer: this.fb.nonNullable.control(''),
    expirationDate: this.fb.nonNullable.control('')
  });

  dispenseForm = this.fb.group({
    medicationId: this.fb.nonNullable.control<number | null>(null, [Validators.required]),
    patientId: this.fb.nonNullable.control<number | null>(null, [Validators.required]),
    quantity: this.fb.nonNullable.control<number>(1, [Validators.required, Validators.min(1)])
  });

  // Computed properties
  filteredPatients = computed(() => {
    const search = this.patientSearch().toLowerCase().trim();
    if (!search) return this.patients();
    return this.patients().filter(p => p.label.toLowerCase().includes(search));
  });

  selectedPatientLabel = computed(() => {
    const id = this.dispenseForm.controls.patientId.value;
    if (!id) return '';
    const pat = this.patients().find(p => p.id === id);
    return pat ? pat.label : '';
  });

  filteredMedications = computed(() => {
    let list = this.medications();
    const search = this.medicationSearch().toLowerCase().trim();
    const cat = this.categoryFilter();
    const lowStock = this.lowStockOnly();

    if (search) {
      list = list.filter(m => m.name.toLowerCase().includes(search) || (m.manufacturer && m.manufacturer.toLowerCase().includes(search)));
    }
    if (cat) {
      list = list.filter(m => m.category === cat);
    }
    if (lowStock) {
      list = list.filter(m => m.currentStock < 10);
    }
    return list;
  });

  filteredDispensings = computed(() => {
    let list = this.dispensings();
    const patientId = this.dispensingPatientFilter();
    if (patientId !== null) {
      list = list.filter(d => d.patientId === patientId);
    }
    return list;
  });

  categories = computed(() => {
    const list = this.medications().map(m => m.category);
    return Array.from(new Set(list));
  });

  // Statistics
  totalMedicationsCount = computed(() => this.medications().length);
  lowStockCount = computed(() => this.medications().filter(m => m.currentStock < 10).length);
  totalDispensingsCount = computed(() => this.dispensings().length);
  totalPharmacyValue = computed(() => {
    return this.medications().reduce((acc, curr) => acc + (curr.unitPrice * curr.currentStock), 0);
  });

  isModalOpen = computed(() => this.modalMode() !== null);
  isEditMode = computed(() => this.modalMode() === 'edit');
  isDispenseMode = computed(() => this.modalMode() === 'dispense');

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAll();
    }
  }

  loadAll() {
    this.loading.set(true);
    this.error.set(null);

    // Fetch patients
    this.pharmacyService.getPatients().subscribe({
      next: p => this.patients.set(p),
      error: err => console.error('Failed to load patients', err)
    });

    // Fetch medications
    this.pharmacyService.getMedications().subscribe({
      next: meds => {
        this.medications.set(meds);
        this.loadDispensings();
      },
      error: err => {
        this.error.set(this.extractError(err));
        this.loading.set(false);
      }
    });
  }

  loadDispensings() {
    this.pharmacyService.getDispensings().subscribe({
      next: disp => {
        this.dispensings.set(disp);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(this.extractError(err));
        this.loading.set(false);
      }
    });
  }

  // Tabs
  setTab(tab: 'medications' | 'dispensings') {
    this.activeTab.set(tab);
    this.error.set(null);
  }

  // Modals
  openCreateModal() {
    this.modalMode.set('create');
    this.selectedMedication.set(null);
    this.medicationForm.reset({
      name: '',
      description: '',
      category: 'Antalgique',
      unitPrice: 0.0,
      currentStock: 0,
      manufacturer: '',
      expirationDate: ''
    });
    this.error.set(null);
  }

  openEditModal(med: Medication) {
    this.selectedMedication.set(med);
    this.modalMode.set('edit');
    this.medicationForm.reset({
      name: med.name,
      description: med.description || '',
      category: med.category,
      unitPrice: med.unitPrice,
      currentStock: med.currentStock,
      manufacturer: med.manufacturer || '',
      expirationDate: med.expirationDate || ''
    });
    this.error.set(null);
  }

  openDispenseModal(med?: Medication) {
    this.modalMode.set('dispense');
    this.dispenseForm.reset({
      medicationId: med ? (med.id ?? null) : null,
      patientId: null,
      quantity: 1
    });
    this.error.set(null);
  }

  closeModal() {
    this.modalMode.set(null);
    this.selectedMedication.set(null);
    this.error.set(null);
  }

  // Actions
  submitMedication() {
    if (this.medicationForm.invalid) {
      this.medicationForm.markAllAsTouched();
      return;
    }

    const val = this.medicationForm.getRawValue();
    const payload: Medication = {
      name: val.name,
      description: val.description,
      category: val.category,
      unitPrice: val.unitPrice,
      currentStock: val.currentStock,
      manufacturer: val.manufacturer || undefined,
      expirationDate: val.expirationDate || undefined
    };

    this.loading.set(true);
    this.error.set(null);

    if (this.isEditMode() && this.selectedMedication()) {
      const id = this.selectedMedication()!.id!;
      this.pharmacyService.updateMedication(id, payload).pipe(
        finalize(() => this.loading.set(false))
      ).subscribe({
        next: updated => {
          this.medications.set(this.medications().map(m => m.id === id ? updated : m));
          this.toast.set('Médicament mis à jour avec succès.');
          this.closeModal();
        },
        error: err => this.error.set(this.extractError(err))
      });
    } else {
      this.pharmacyService.createMedication(payload).pipe(
        finalize(() => this.loading.set(false))
      ).subscribe({
        next: created => {
          this.medications.set([...this.medications(), created]);
          this.toast.set('Médicament créé avec succès.');
          this.closeModal();
        },
        error: err => this.error.set(this.extractError(err))
      });
    }
  }

  deleteMedication(id: number) {
    if (!confirm('Voulez-vous vraiment supprimer ce médicament ?')) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.pharmacyService.deleteMedication(id).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        this.medications.set(this.medications().filter(m => m.id !== id));
        this.toast.set('Médicament supprimé avec succès.');
        this.closeModal();
      },
      error: err => this.error.set(this.extractError(err))
    });
  }

  submitDispense() {
    if (this.dispenseForm.invalid) {
      this.dispenseForm.markAllAsTouched();
      return;
    }

    const val = this.dispenseForm.getRawValue();
    const req: DispensingRequest = {
      medicationId: val.medicationId!,
      patientId: val.patientId!,
      quantity: val.quantity
    };

    // Verify stock first
    const med = this.medications().find(m => m.id === req.medicationId);
    if (med && med.currentStock < req.quantity) {
      this.error.set(`Stock insuffisant. Disponible : ${med.currentStock}`);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.pharmacyService.dispense(req).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: created => {
        this.toast.set('Médicament distribué avec succès. Facture générée.');
        // Refresh medications and dispensings
        this.loadAll();
        this.closeModal();
        this.setTab('dispensings');
      },
      error: err => this.error.set(this.extractError(err))
    });
  }

  // Filter handlers
  updateSearch(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.medicationSearch.set(val);
  }

  updateCategory(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    this.categoryFilter.set(val);
  }

  toggleLowStock(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    this.lowStockOnly.set(checked);
  }

  updatePatientFilter(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    this.dispensingPatientFilter.set(val ? Number(val) : null);
  }

  updatePatientSearch(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.patientSearch.set(val);
    this.isPatientDropdownOpen.set(true);
    if (this.dispenseForm.controls.patientId.value !== null) {
      this.dispenseForm.patchValue({ patientId: null });
    }
  }

  selectPatient(pat: PatientOption) {
    this.dispenseForm.patchValue({ patientId: pat.id });
    this.patientSearch.set('');
    this.isPatientDropdownOpen.set(false);
  }

  onPatientSearchBlur() {
    setTimeout(() => {
      this.isPatientDropdownOpen.set(false);
      if (!this.dispenseForm.controls.patientId.value) {
        this.patientSearch.set('');
      }
    }, 200);
  }

  // Helper displays
  getMedicationName(id: number): string {
    const med = this.medications().find(m => m.id === id);
    return med ? med.name : `Médicament #${id}`;
  }

  getPatientLabel(id: number): string {
    const p = this.patients().find(pat => pat.id === id);
    return p ? p.label : `Patient #${id}`;
  }

  dismissToast() {
    this.toast.set(null);
  }

  private extractError(err: any): string {
    if (err?.status === 0) {
      return "Le service de pharmacie n'est pas accessible. Assurez-vous qu'il est en cours d'exécution.";
    }
    const apiError = err?.error;
    if (apiError?.message) return apiError.message;
    if (typeof apiError === 'string' && apiError.trim().length > 0) return apiError;
    return "Une erreur s'est produite lors de l'appel au service.";
  }
}
