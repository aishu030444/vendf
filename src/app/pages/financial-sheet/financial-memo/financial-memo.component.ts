import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CreditmemoComponent } from './creditmemo/creditmemo.component';
import { DebitmemoComponent } from './debitmemo/debitmemo.component';

@Component({
  selector: 'app-memo',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    CreditmemoComponent, 
    DebitmemoComponent
  ],
  templateUrl: './financial-memo.component.html',
  styleUrls: ['./financial-memo.component.scss']
})
export class FinancialMemoComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Initialize view based on current route
    const currentPath = this.router.url.split('/').pop();
    if (currentPath === 'creditmemo') {
      this.view = 'credit';
    } else if (currentPath === 'debitmemo') {
      this.view = 'debit';
    } else {
      this.view = 'credit'; // Default to credit
      this.router.navigate(['creditmemo'], { relativeTo: this.route });
    }
  }

  view: 'credit' | 'debit' = 'credit';

  showCredit() {
    this.view = 'credit';
    this.router.navigate(['creditmemo'], { relativeTo: this.route });
  }

  showDebit() {
    this.view = 'debit';
    this.router.navigate(['debitmemo'], { relativeTo: this.route });
  }
}