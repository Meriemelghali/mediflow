import { Component, OnDestroy, afterNextRender } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.css'
})
export class AuthLayoutComponent implements OnDestroy {
  currentTime = new Date();
  private clockSub?: Subscription;

  constructor() {
    afterNextRender(() => {
      this.clockSub = interval(1000).subscribe(() => {
        this.currentTime = new Date();
      });
    });
  }

  ngOnDestroy() {
    this.clockSub?.unsubscribe();
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
