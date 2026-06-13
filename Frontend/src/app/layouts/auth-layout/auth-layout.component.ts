import { Component, OnDestroy, OnInit, afterNextRender, HostListener } from '@angular/core';
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

interface PersistentNotification {
  id: number;
  title: string;
  body: string;
  icon: string;
  type: string;
  unread: boolean;
  time: string;
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

  // RabbitMQ Events state
  mqNotifications: MqNotification[] = [];
  persistentNotifications: PersistentNotification[] = [];
  isNotifPanelOpen = false;
  private nextNotifId = 0;
  
  private lastAssuranceCount = 0;
  private lastAppointmentCount = 0;
  private isFirstAssurancePoll = true;
  private isFirstAppointmentPoll = true;
  private eventPollingSub?: Subscription;

  get unreadCount(): number {
    return this.persistentNotifications.filter(n => n.unread).length;
  }

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

  @HostListener('document:click')
  closeDropdowns() {
    this.isProfileMenuOpen = false;
    this.isRoleMenuOpen = false;
    this.isNotifPanelOpen = false;
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
        if (!events) return;
        
        if (this.isFirstAssurancePoll) {
          this.lastAssuranceCount = events.length;
          this.isFirstAssurancePoll = false;
          return;
        }

        if (events.length < this.lastAssuranceCount) {
          // Reset tracker if backend was restarted
          this.lastAssuranceCount = events.length;
        }

        // Process only newly appended events
        if (events.length > this.lastAssuranceCount) {
          for (let i = this.lastAssuranceCount; i < events.length; i++) {
            this.triggerNotification(events[i], 'assurance.events');
          }
          this.lastAssuranceCount = events.length;
        }
      },
      error: (err) => {
        console.error('Error polling assurance events:', err);
      }
    });
  }

  private pollAppointmentEvents() {
    this.appointmentService.getEvents().subscribe({
      next: (events) => {
        if (!events) return;
        
        if (this.isFirstAppointmentPoll) {
          this.lastAppointmentCount = events.length;
          this.isFirstAppointmentPoll = false;
          return;
        }

        if (events.length < this.lastAppointmentCount) {
          // Reset tracker if backend was restarted
          this.lastAppointmentCount = events.length;
        }

        // Process only newly appended events
        if (events.length > this.lastAppointmentCount) {
          for (let i = this.lastAppointmentCount; i < events.length; i++) {
            this.triggerNotification(events[i], 'appointment.events.demo');
          }
          this.lastAppointmentCount = events.length;
        }
      },
      error: (err) => {
        console.error('Error polling appointment events:', err);
      }
    });
  }

  private formatMessage(msg: string): { title: string; body: string; icon: string; type: string } {
    // Clean listener prefix
    const cleanMsg = msg.replace(/^\[.*?EventListener\]\s*/, '');
    
    // Quick patient mapping helper
    const getPatientName = (idStr: string) => {
      const id = parseInt(idStr, 10);
      if (id === 1) return 'Test Patient One';
      if (id === 2) return 'Test Patient Two';
      return `Patient #${id}`;
    };

    // 1. Appointment Event
    // Expected: RDV #<id> planifié pour patient #?<id> le <date>
    const aptMatch = cleanMsg.match(/RDV\s+#?(\d+).*patient\s+#?(\d+).*le\s+(.+)/i);
    if (aptMatch) {
      const [_, aptId, patientId, dateStr] = aptMatch;
      const patientName = getPatientName(patientId);
      
      let formattedDate = dateStr;
      try {
        formattedDate = new Date(dateStr).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {}

      return {
        title: 'Consultation planifiée',
        body: `Rendez-vous #${aptId} programmé pour ${patientName} le ${formattedDate}.`,
        icon: 'calendar',
        type: 'appointment'
      };
    }

    // 2. Assurance Event
    // Expected: Police d'assurance créée pour patient <id>, taux=<taux>, active=<active>
    const assuranceMatch = cleanMsg.match(/Police.*assurance.*patient\s+#?(\d+).*taux=([\d\.]+)/i);
    if (assuranceMatch) {
      const [_, patientId, taux] = assuranceMatch;
      const patientName = getPatientName(patientId);
      const percentTaux = Math.round(parseFloat(taux) * 100);

      return {
        title: 'Assurance créée',
        body: `Couverture d'assurance créée pour ${patientName} (Taux: ${percentTaux}%).`,
        icon: 'shield',
        type: 'assurance'
      };
    }

    return {
      title: 'Flux Temps Réel',
      body: cleanMsg,
      icon: 'bell',
      type: 'generic'
    };
  }

  private triggerNotification(message: string, queue: string) {
    const formatted = this.formatMessage(message);
    const id = this.nextNotifId++;
    
    // 1. Add to toast alerts
    const notif: MqNotification = {
      id,
      message: formatted.body,
      queue,
      isFading: false
    };
    this.mqNotifications.push(notif);

    // Auto fade-out and dismiss toast after 6s
    setTimeout(() => {
      this.fadeMqNotification(id);
    }, 5700);

    // 2. Add to persistent list
    const timeStr = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    const persistentNotif: PersistentNotification = {
      id,
      title: formatted.title,
      body: formatted.body,
      icon: formatted.icon,
      type: formatted.type,
      unread: true,
      time: timeStr
    };
    this.persistentNotifications.unshift(persistentNotif);
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

  markAsRead(id: number) {
    const notif = this.persistentNotifications.find(n => n.id === id);
    if (notif) {
      notif.unread = false;
    }
  }

  deletePersistentNotification(id: number, event: Event) {
    event.stopPropagation();
    this.persistentNotifications = this.persistentNotifications.filter(n => n.id !== id);
  }

  clearAllNotifications() {
    this.persistentNotifications = [];
  }

  ngOnDestroy() {
    this.clockSub?.unsubscribe();
    this.eventPollingSub?.unsubscribe();
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    if (this.isProfileMenuOpen) {
      this.isRoleMenuOpen = false;
      this.isNotifPanelOpen = false;
    }
  }

  toggleNotificationPanel(event: Event) {
    event.stopPropagation();
    this.isNotifPanelOpen = !this.isNotifPanelOpen;
    if (this.isNotifPanelOpen) {
      this.isProfileMenuOpen = false;
      this.isRoleMenuOpen = false;
    }
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
