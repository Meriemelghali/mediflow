import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roles: string[];
  activeRole: string;
  isActive: boolean;
  patientCode: number;
  createdAt: string;
}

@Component({
  selector: 'app-backoffice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './backoffice.component.html',
  styleUrl: './backoffice.component.css'
})
export class BackofficeComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = true;
  searchQuery = '';
  filterRole = 'ALL';
  filterStatus = 'ALL';

  selectedUser: User | null = null;
  showModal = false;
  modalTab: 'roles' | 'status' = 'roles';

  availableRoles = ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'PHARMACIST'];
  
  notification = { show: false, message: '', type: 'success' };

  private apiUrl = 'http://localhost:8081/api/user';

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.http.get<User[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.users = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.loading = false;
      }
    });
  }

  applyFilters() {
    this.filteredUsers = this.users.filter(u => {
      const matchSearch = !this.searchQuery ||
        u.firstName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        u.lastName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchRole = this.filterRole === 'ALL' || u.roles.includes(this.filterRole);
      const matchStatus = this.filterStatus === 'ALL' ||
        (this.filterStatus === 'ACTIVE' && u.isActive) ||
        (this.filterStatus === 'INACTIVE' && !u.isActive);
      
      return matchSearch && matchRole && matchStatus;
    });
  }

  openModal(user: User, tab: 'roles' | 'status' = 'roles') {
    this.selectedUser = { ...user };
    this.modalTab = tab;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedUser = null;
  }

  addRole(role: string) {
    if (this.selectedUser && !this.selectedUser.roles.includes(role)) {
      this.selectedUser.roles = [...this.selectedUser.roles, role];
    }
  }

  removeRole(role: string) {
    if (this.selectedUser && this.selectedUser.roles.length > 1) {
      this.selectedUser.roles = this.selectedUser.roles.filter(r => r !== role);
      if (this.selectedUser.activeRole === role) {
        this.selectedUser.activeRole = this.selectedUser.roles[0];
      }
    }
  }

  saveRoles() {
    if (!this.selectedUser) return;
    // Save the activeRole (which triggers adding to roles array in backend)
    const lastRole = this.selectedUser.activeRole;
    
    // We need to sync all roles. We'll update active role for each new role
    const updates = this.selectedUser.roles.map(role =>
      this.http.put(`${this.apiUrl}/${this.selectedUser!._id}/role`, { role }).toPromise()
    );

    Promise.all(updates).then(() => {
      // Set the desired activeRole
      this.http.put(`${this.apiUrl}/${this.selectedUser!._id}/role`, { role: lastRole }).subscribe({
        next: () => {
          this.showNotification('Rôles mis à jour avec succès !', 'success');
          this.loadUsers();
          this.closeModal();
        },
        error: () => this.showNotification('Erreur lors de la mise à jour', 'error')
      });
    });
  }

  toggleStatus() {
    if (!this.selectedUser) return;
    const newStatus = !this.selectedUser.isActive;
    this.http.put(`${this.apiUrl}/${this.selectedUser._id}/status`, { isActive: newStatus }).subscribe({
      next: () => {
        this.showNotification(
          `Compte ${newStatus ? 'activé' : 'désactivé'} avec succès !`,
          newStatus ? 'success' : 'warning'
        );
        this.loadUsers();
        this.closeModal();
      },
      error: () => this.showNotification('Erreur lors de la mise à jour du statut', 'error')
    });
  }

  get stats() {
    return {
      total: this.users.length,
      active: this.users.filter(u => u.isActive).length,
      admins: this.users.filter(u => u.roles.includes('ADMIN')).length,
      doctors: this.users.filter(u => u.roles.includes('DOCTOR')).length,
    };
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  showNotification(message: string, type: 'success' | 'error' | 'warning') {
    this.notification = { show: true, message, type };
    setTimeout(() => this.notification.show = false, 3500);
  }

  getRoleBadgeClass(role: string): string {
    const map: { [key: string]: string } = {
      ADMIN: 'badge-admin',
      DOCTOR: 'badge-doctor',
      NURSE: 'badge-nurse',
      PHARMACIST: 'badge-pharmacist',
      PATIENT: 'badge-patient'
    };
    return map[role] || 'badge-patient';
  }

  initials(user: User): string {
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  }
}
