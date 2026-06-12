import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-backoffice-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './backoffice-layout.component.html',
  styleUrl: './backoffice-layout.component.css'
})
export class BackofficeLayoutComponent implements OnInit, OnDestroy {
  user: any = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(u => this.user = u);
    document.body.classList.add('admin-theme');
  }

  ngOnDestroy() {
    document.body.classList.remove('admin-theme');
  }

  logout() {
    this.authService.logout();
  }

  get initials(): string {
    if (!this.user) return '';
    return `${this.user.firstName?.charAt(0) || ''}${this.user.lastName?.charAt(0) || ''}`.toUpperCase();
  }
}
