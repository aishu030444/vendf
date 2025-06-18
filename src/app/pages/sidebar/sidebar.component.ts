import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [CommonModule,RouterModule]
})
export class SidebarComponent {
  dashboardOpen = false;
  financialOpen = false;

  constructor(private router: Router) {}

  toggleDashboard() {
    this.dashboardOpen = !this.dashboardOpen;
    if (this.dashboardOpen) {
      this.financialOpen = false;
    }
  }

  toggleFinancial() {
    this.financialOpen = !this.financialOpen;
    if (this.financialOpen) {
      this.dashboardOpen = false;
    }
  }

  isDashboardActive(): boolean {
    return this.router.url.includes('/home/dashboard');
  }

  isProfileActive(): boolean {
    return this.router.url.includes('/home/profile');
  }

  isFinancialActive(): boolean {
    return this.router.url.includes('/home/financial');
  }

  logout() {
    // Implement logout logic here
    this.router.navigate(['/login']);
  }
}
