import { Component, OnInit, OnDestroy, afterNextRender } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  currentTime = new Date();
  private clockSub?: Subscription;

  ngOnInit() {
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
