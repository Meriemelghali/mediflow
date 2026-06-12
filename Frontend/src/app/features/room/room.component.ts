import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomService } from './room.service';
import { Room, Bed, RoomType, BedStatus, PatientOption } from './room.model';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css']
})
export class RoomComponent implements OnInit {
  rooms: Room[] = [];
  filteredRooms: Room[] = [];
  patients: PatientOption[] = [];
  
  selectedRoom: Room | null = null;
  selectedRoomBeds: Bed[] = [];
  
  loading: boolean = false;
  
  // Modal toggles
  showAddRoomModal: boolean = false;
  showEditRoomModal: boolean = false;
  showAddBedModal: boolean = false;
  showEditBedModal: boolean = false;
  showAdmitModal: boolean = false;
  
  // Form objects
  newRoom: Partial<Room> = {
    roomNumber: '',
    service: '',
    type: 'SIMPLE',
    capacity: 1,
    description: '',
    active: true
  };
  
  newBed: Partial<Bed> = {
    bedNumber: '',
    notes: '',
    status: 'AVAILABLE'
  };

  editRoom: Partial<Room> = {};
  editBed: Partial<Bed> = {};
  
  selectedBed: Bed | null = null;
  admitPatientId: number = 0;
  
  // Search & Filter
  searchKeyword: string = '';
  selectedServiceFilter: string = '';
  servicesList: string[] = [];

  constructor(private readonly roomService: RoomService) {}

  ngOnInit(): void {
    this.loadRooms();
    this.loadPatients();
  }

  loadRooms(): void {
    this.loading = true;
    this.roomService.getRooms().subscribe({
      next: (data) => {
        this.rooms = data;
        this.extractServices();
        this.applyFilters();
        
        // If a room was selected, refresh its beds too
        if (this.selectedRoom) {
          const updated = this.rooms.find(r => r.id === this.selectedRoom?.id);
          if (updated) {
            this.selectRoom(updated);
          }
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load rooms:', err);
        this.loading = false;
      }
    });
  }

  loadPatients(): void {
    this.roomService.getPatients().subscribe({
      next: (data) => {
        this.patients = data;
      },
      error: (err) => {
        console.error('Failed to load patients:', err);
      }
    });
  }

  extractServices(): void {
    const services = this.rooms.map(r => r.service).filter(s => !!s);
    this.servicesList = Array.from(new Set(services)).sort();
  }

  applyFilters(): void {
    this.filteredRooms = this.rooms.filter(room => {
      const matchesKeyword = room.roomNumber.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
                             (room.description && room.description.toLowerCase().includes(this.searchKeyword.toLowerCase())) ||
                             room.service.toLowerCase().includes(this.searchKeyword.toLowerCase());
      
      const matchesService = !this.selectedServiceFilter || room.service === this.selectedServiceFilter;
      
      return matchesKeyword && matchesService;
    });
  }

  selectRoom(room: Room): void {
    this.selectedRoom = room;
    if (room.id) {
      this.roomService.getBeds(room.id).subscribe({
        next: (data) => {
          this.selectedRoomBeds = data;
        },
        error: (err) => {
          console.error(`Failed to load beds for room ${room.id}:`, err);
        }
      });
    }
  }

  // Add Room Methods
  openAddRoomModal(): void {
    this.newRoom = {
      roomNumber: '',
      service: '',
      type: 'SIMPLE',
      capacity: 1,
      description: '',
      active: true
    };
    this.showAddRoomModal = true;
  }

  closeAddRoomModal(): void {
    this.showAddRoomModal = false;
  }

  openEditRoomModal(room: Room, event?: Event): void {
    event?.stopPropagation();
    this.editRoom = { ...room };
    this.showEditRoomModal = true;
  }

  closeEditRoomModal(): void {
    this.showEditRoomModal = false;
    this.editRoom = {};
  }

  submitRoom(): void {
    if (!this.newRoom.roomNumber || !this.newRoom.service) {
      alert('Veuillez remplir le numéro de chambre et le service');
      return;
    }
    this.roomService.addRoom(this.newRoom).subscribe({
      next: () => {
        this.closeAddRoomModal();
        this.loadRooms();
      },
      error: (err) => {
        alert('Erreur lors de la création de la chambre : ' + (err.error?.message || err.message));
      }
    });
  }

  submitEditRoom(): void {
    if (!this.editRoom.id) return;
    if (!this.editRoom.roomNumber || !this.editRoom.service || !this.editRoom.capacity) {
      alert('Veuillez remplir le numero, le service et la capacite');
      return;
    }

    this.roomService.updateRoom(this.editRoom.id, this.editRoom).subscribe({
      next: (updated) => {
        this.closeEditRoomModal();
        this.selectedRoom = updated;
        this.loadRooms();
      },
      error: (err) => {
        alert('Erreur lors de la modification de la chambre : ' + (err.error?.message || err.message));
      }
    });
  }

  deleteRoom(id: number, event: Event): void {
    event.stopPropagation();
    if (confirm('Voulez-vous vraiment supprimer cette chambre ?')) {
      this.roomService.deleteRoom(id).subscribe({
        next: () => {
          if (this.selectedRoom?.id === id) {
            this.selectedRoom = null;
            this.selectedRoomBeds = [];
          }
          this.loadRooms();
        },
        error: (err) => {
          alert('Erreur lors de la suppression de la chambre : ' + (err.error?.message || err.message));
        }
      });
    }
  }

  // Add Bed Methods
  openAddBedModal(): void {
    if (!this.selectedRoom) return;
    if (this.selectedRoomBeds.length >= this.selectedRoom.capacity) {
      alert('Impossible d\'ajouter un lit : la capacite maximale de cette chambre est atteinte.');
      return;
    }
    this.newBed = {
      bedNumber: `${this.selectedRoom.roomNumber}-${this.selectedRoomBeds.length + 1}`,
      notes: '',
      status: 'AVAILABLE'
    };
    this.showAddBedModal = true;
  }

  closeAddBedModal(): void {
    this.showAddBedModal = false;
  }

  submitBed(): void {
    if (!this.selectedRoom || !this.selectedRoom.id) return;
    if (!this.newBed.bedNumber) {
      alert('Veuillez entrer un numéro de lit');
      return;
    }
    this.roomService.addBed(this.selectedRoom.id, this.newBed).subscribe({
      next: () => {
        this.closeAddBedModal();
        this.selectRoom(this.selectedRoom!);
        this.loadRooms();
      },
      error: (err) => {
        alert('Erreur lors de la création du lit : ' + (err.error?.message || err.message));
      }
    });
  }

  openEditBedModal(bed: Bed): void {
    this.selectedBed = bed;
    this.editBed = { ...bed };
    this.showEditBedModal = true;
  }

  closeEditBedModal(): void {
    this.showEditBedModal = false;
    this.selectedBed = null;
    this.editBed = {};
  }

  submitEditBed(): void {
    if (!this.selectedBed?.id) return;
    if (!this.editBed.bedNumber) {
      alert('Veuillez entrer un numero de lit');
      return;
    }

    this.roomService.updateBed(this.selectedBed.id, this.editBed).subscribe({
      next: () => {
        this.closeEditBedModal();
        if (this.selectedRoom) {
          this.selectRoom(this.selectedRoom);
        }
        this.loadRooms();
      },
      error: (err) => {
        alert('Erreur lors de la modification du lit : ' + (err.error?.message || err.message));
      }
    });
  }

  deleteBed(bed: Bed): void {
    if (!bed.id) return;
    if (confirm(`Voulez-vous vraiment supprimer le lit ${bed.bedNumber} ?`)) {
      this.roomService.deleteBed(bed.id).subscribe({
        next: () => {
          if (this.selectedRoom) {
            this.selectRoom(this.selectedRoom);
          }
          this.loadRooms();
        },
        error: (err) => {
          alert('Erreur lors de la suppression du lit : ' + (err.error?.message || err.message));
        }
      });
    }
  }

  // Patient admission methods
  openAdmitModal(bed: Bed): void {
    this.selectedBed = bed;
    this.admitPatientId = this.patients.length > 0 ? this.patients[0].id : 0;
    this.showAdmitModal = true;
  }

  closeAdmitModal(): void {
    this.showAdmitModal = false;
    this.selectedBed = null;
  }

  submitAdmission(): void {
    if (!this.selectedBed || !this.selectedBed.id || !this.admitPatientId) {
      alert('Informations invalides pour l\'admission');
      return;
    }

    const patient = this.patients.find(p => p.id === Number(this.admitPatientId));
    if (!patient) {
      alert('Patient non trouvé');
      return;
    }

    const cleanPatientName = patient.label.split(' · ')[1] || patient.label;

    this.roomService.admitPatient(this.selectedBed.id, patient.id, cleanPatientName).subscribe({
      next: (res) => {
        alert(res.message || 'Patient admis avec succès !');
        this.closeAdmitModal();
        if (this.selectedRoom) {
          this.selectRoom(this.selectedRoom);
        }
        this.loadRooms();
      },
      error: (err) => {
        alert('Erreur d\'admission : ' + (err.error?.message || err.message));
      }
    });
  }

  releaseBed(bedId: number): void {
    if (confirm('Voulez-vous libérer ce lit (le mettre en nettoyage) ?')) {
      this.roomService.releaseBed(bedId).subscribe({
        next: () => {
          if (this.selectedRoom) {
            this.selectRoom(this.selectedRoom);
          }
          this.loadRooms();
        },
        error: (err) => {
          alert('Erreur lors de la libération du lit : ' + (err.error?.message || err.message));
        }
      });
    }
  }



  markBedAvailable(bedId: number): void {
    this.roomService.updateBedStatus(bedId, 'AVAILABLE').subscribe({
      next: () => {
        if (this.selectedRoom) {
          this.selectRoom(this.selectedRoom);
        }
        this.loadRooms();
      },
      error: (err) => {
        alert('Erreur lors du changement de statut : ' + (err.error?.message || err.message));
      }
    });
  }

  markBedMaintenance(bedId: number): void {
    this.roomService.updateBedStatus(bedId, 'MAINTENANCE').subscribe({
      next: () => {
        if (this.selectedRoom) {
          this.selectRoom(this.selectedRoom);
        }
        this.loadRooms();
      },
      error: (err) => {
        alert('Erreur lors du changement de statut : ' + (err.error?.message || err.message));
      }
    });
  }

  // Style helper methods
  getRoomTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      SIMPLE: 'Simple',
      DOUBLE: 'Double',
      VIP: 'VIP',
      ICU: 'Soins Intensifs (ICU)',
      PEDIATRIC: 'Pédiatrie',
      MATERNITY: 'Maternité'
    };
    return labels[type] || type;
  }

  getBedStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      AVAILABLE: 'Disponible',
      OCCUPIED: 'Occupé',
      CLEANING: 'Nettoyage',
      MAINTENANCE: 'Maintenance',
      RESERVED: 'Réservé'
    };
    return labels[status] || status;
  }

  getBedStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getOccupancyRate(room: Room): number {
    if (!room.capacity) return 0;
    const occupied = room.occupiedBeds || 0;
    return Math.round((occupied / room.capacity) * 100);
  }
}
