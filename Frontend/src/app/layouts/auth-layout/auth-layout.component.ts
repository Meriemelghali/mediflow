import { Component, OnDestroy, OnInit, afterNextRender } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { AssuranceApi } from '../../features/assurance/assurance.api';
import { AppointmentService } from '../../features/appointment/appointment.service';

interface MqNotification {
  id: number;
  message: string;
  queue: string;
  isFading: boolean;
}

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

  mqNotifications: MqNotification[] = [];
  private nextNotifId = 0;
  private knownAssuranceEvents: Set<string> = new Set();
  private knownAppointmentEvents: Set<string> = new Set();
  private isFirstAssurancePoll = true;
  private isFirstAppointmentPoll = true;
  private eventPollingSub?: Subscription;

  constructor(
    private authService: AuthService,
    private assuranceApi: AssuranceApi,
    private appointmentService: AppointmentService
  ) {
    afterNextRender(() => {
      this.clockSub = interval(1000).subscribe(() => {
        this.currentTime = new Date();
      });
      // Apply theme on load
      this.applyTheme();
      // Start polling for RabbitMQ events
      this.startEventPolling();
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  private startEventPolling() {
    this.eventPollingSub = interval(3000).subscribe(() => {
      this.pollAssuranceEvents();
      this.pollAppointmentEvents();
    });
    // Initial immediate fetch
    this.pollAssuranceEvents();
    this.pollAppointmentEvents();
  }

  private pollAssuranceEvents() {
    this.assuranceApi.getEvents().subscribe({
      next: (events) => {
        if (this.isFirstAssurancePoll) {
          // Pre-populate history on login/load
          events.forEach(e => this.knownAssuranceEvents.add(e));
          this.isFirstAssurancePoll = false;
          return;
        }
        events.forEach(event => {
          if (!this.knownAssuranceEvents.has(event)) {
            this.knownAssuranceEvents.add(event);
            this.triggerNotification(event, 'assurance.events');
          }
        });
      },
      error: () => {}
    });
  }

  private pollAppointmentEvents() {
    this.appointmentService.getEvents().subscribe({
      next: (events) => {
        if (this.isFirstAppointmentPoll) {
          // Pre-populate history on login/load
          events.forEach(e => this.knownAppointmentEvents.add(e));
          this.isFirstAppointmentPoll = false;
          return;
        }
        events.forEach(event => {
          if (!this.knownAppointmentEvents.has(event)) {
            this.knownAppointmentEvents.add(event);
            this.triggerNotification(event, 'appointment.events.demo');
          }
        });
      },
      error: () => {}
    });
  }

  private triggerNotification(message: string, queue: string) {
    const id = this.nextNotifId++;
    const notif: MqNotification = {
      id,
      message,
      queue,
      isFading: false
    };
    this.mqNotifications.push(notif);

    // Auto fade-out and dismiss after 6 seconds total
    setTimeout(() => {
      this.fadeMqNotification(id);
    }, 5700);
  }

  fadeMqNotification(id: number) {
    const notif = this.mqNotifications.find(n => n.id === id);
    if (notif) {
      notif.isFading = true;
      setTimeout(() => {
        this.mqNotifications = this.mqNotifications.filter(n => n.id !== id);
      }, 300);
    }
  }

  dismissMqNotification(id: number) {
    this.mqNotifications = this.mqNotifications.filter(n => n.id !== id);
  }

  ngOnDestroy() {
    this.clockSub?.unsubscribe();
    this.eventPollingSub?.unsubscribe();
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
