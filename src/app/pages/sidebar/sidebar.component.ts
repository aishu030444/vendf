import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [CommonModule, RouterModule]
})
export class SidebarComponent {
  dashboardOpen = false;
  financialOpen = false;
  isCollapsed = false;

  constructor(private router: Router) {}

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    // Close submenus when collapsing
    if (this.isCollapsed) {
      this.dashboardOpen = false;
      this.financialOpen = false;
    }
  }

  toggleDashboard() {
    if (!this.isCollapsed) {
      this.dashboardOpen = !this.dashboardOpen;
      if (this.dashboardOpen) {
        this.financialOpen = false;
      }
    }
  }

  toggleFinancial() {
    if (!this.isCollapsed) {
      this.financialOpen = !this.financialOpen;
      if (this.financialOpen) {
        this.dashboardOpen = false;
      }
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
    // Clear localStorage and navigate to login
    localStorage.removeItem('vendorId');
    this.router.navigate(['/login']);
  }
}