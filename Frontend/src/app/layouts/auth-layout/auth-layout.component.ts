import { Component, OnDestroy, OnInit, afterNextRender } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.css'
})
export class AuthLayoutComponent implements OnInit, OnDestroy {
  currentTime = new Date();
  private clockSub?: Subscription;
  
  user: any = null;
  isProfileMenuOpen = false;
  isRoleMenuOpen = false;
  isDarkTheme = true;

  constructor(private authService: AuthService) {
    afterNextRender(() => {
      this.clockSub = interval(1000).subscribe(() => {
        this.currentTime = new Date();
      });
      // Apply theme on load
      this.applyTheme();
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  ngOnDestroy() {
    this.clockSub?.unsubscribe();
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    if (!this.isProfileMenuOpen) this.isRoleMenuOpen = false;
  }

  toggleRoleMenu(event: Event) {
    event.stopPropagation();
    this.isRoleMenuOpen = !this.isRoleMenuOpen;
  }

  switchRole(role: string, event: Event) {
    event.stopPropagation();
    this.authService.switchRole(role);
    this.isRoleMenuOpen = false;
  }

  toggleTheme(event: Event) {
    event.stopPropagation();
    this.isDarkTheme = !this.isDarkTheme;
    this.applyTheme();
  }

  private applyTheme() {
    // Basic implementation for dark/light theme switching via body class
    if (this.isDarkTheme) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }

  logout() {
    this.authService.logout();
  }

  get initials(): string {
    if (!this.user) return '';
    return `${this.user.firstName?.charAt(0) || ''}${this.user.lastName?.charAt(0) || ''}`.toUpperCase();
  }

  get timeString(): string {
    return this.currentTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  get dateString(): string {
    return this.currentTime.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }
}
