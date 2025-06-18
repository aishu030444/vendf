import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSortModule } from '@angular/material/sort';

@Component({
  selector: 'app-debitmemo',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    FormsModule,
    MatSortModule
  ],
  templateUrl: './debitmemo.component.html',
  styleUrls: ['./debitmemo.component.scss'],
  providers: [DatePipe]
})
export class DebitmemoComponent implements OnInit {

  creditRecords: CreditDebitRecord[] = [];

  displayedColumns: string[] = [
    'gjahr', 'bukrs', 'blart', 'waers', 'bldat', 'budat',
    'lifnr', 'name1', 'buzei', 'shkzg', 'hkont', 'sgtxt',
    'kostl', 'augdt', 'augbl'
  ];

  isLoading: boolean = false;
  error: string = '';

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const vendorId = localStorage.getItem('vendorId');
      if (vendorId) {
        this.loadCreditRecords(vendorId);
      } else {
        this.error = 'Vendor ID not found. Please log in.';
        this.snackBar.open(this.error, 'Close', { duration: 5000 });
      }
    }
  }

  
  loadCreditRecords(vendorId: string): void {
    this.isLoading = true;
    this.error = '';

    this.http.post<any>('http://localhost:3030/debit', { vendorId: vendorId }).subscribe({
      next: (response) => {
        this.creditRecords = (response || []).map((item: any) => ({
          gjahr: item.Gjahr,
          bukrs: item.Bukrs,
          blart: item.Blart,
          waers: item.Waers,
          bldat: this.convertSapDate(item.Bldat),
          budat: this.convertSapDate(item.Budat),
          lifnr: item.Lifnr,
          name1: item.Name1,
          buzei: item.Buzei,
          shkzg: item.Shkzg,
          hkont: item.Hkont,
          sgtxt: item.Sgtxt,
          kostl: item.Kostl,
          augdt: item.Augdt ? this.convertSapDate(item.Augdt) : '',
          augbl: item.Augbl
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('API Error:', err);
        this.error = 'Failed to load debit records. Please try again.';
        this.snackBar.open(this.error, 'Close', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }

  convertSapDate(sapDate: string): string {
    if (!sapDate) return '';
    const timestamp = parseInt(sapDate.match(/\d+/)?.[0] || '0', 10);
    return new Date(timestamp).toISOString().split('T')[0];
  }

}

export interface CreditDebitRecord {
  gjahr: string;
  bukrs: string;
  blart: string;
  waers: string;
  bldat: string;
  budat: string;
  lifnr: string;
  name1: string;
  buzei: string;
  shkzg: string;
  hkont: string;
  sgtxt: string;
  kostl: string;
  augdt: string;
  augbl: string;
}
