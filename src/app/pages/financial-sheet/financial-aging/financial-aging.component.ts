import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Aging {
  Lifnr: string;
  Name1: string;
  Bukrs: string;
  Gjahr: string;
  Blart: string;
  Waers: string;
  Bldat: string;
  Budat: string;
  Buzei: string;
  Wrbtr: string;
  Dmbtr: string;
  Shkzg: string;
  Hkont: string;
  Faedt: string;
  Aging: string;
  rawFaedt?: Date;
  rawWrbtr?: number;
}

@Component({
  selector: 'app-financial-sheet-aging',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    MatSortModule,
    MatTooltipModule
  ],
  templateUrl: './financial-aging.component.html',
  styleUrls: ['./financial-aging.component.scss'],
  providers: [DatePipe]
})
export class FinancialAgingComponent implements OnInit {
  agings: Aging[] = [];
  filteredAgings: Aging[] = [];
  displayedColumns: string[] = [
    'Lifnr', 'Name1', 'Bukrs', 'Gjahr', 'Waers', 'Bldat',
     'Faedt', 'Aging' ,'actions'
  ];
  isLoading: boolean = false;
  error: string = '';

  // Filters
  searchText: string = '';
  currencyFilter: string = '';
  agingBucketFilter: string = '';
  currencies: string[] = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const vendorId = localStorage.getItem('vendorId');
      if (vendorId) {
        this.loadAgingData(vendorId);
      } else {
        this.error = 'Vendor ID not found. Please log in.';
        this.snackBar.open(this.error, 'Close', { duration: 5000 });
        this.router.navigate(['/login']);
      }
    }
  }

  loadAgingData(vendorId: string): void {
    this.isLoading = true;
    this.http.post<any>('http://localhost:3030/aging', { vendorId }).subscribe({
      next: (response: any[]) => {
        this.agings = response.map(item => ({
          ...item,
          Bldat: this.parseSapDate(item.Bldat),
          Budat: this.parseSapDate(item.Budat),
          Faedt: this.parseSapDate(item.Faedt),
          rawFaedt: this.parseSapDateToDate(item.Faedt),
          rawWrbtr: parseFloat(item.Wrbtr)
        }));
        this.filteredAgings = [...this.agings];
        this.currencies = [...new Set(this.agings.map(a => a.Waers))];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Unable to load aging data.';
        this.snackBar.open(this.error, 'Close', { duration: 5000 });
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  parseSapDate(sapDate: string): string {
    if (!sapDate) return '';
    
    // Handle both /Date(timestamp)/ format and regular dates
    const timestampMatch = sapDate.match(/\/Date\((\d+)\)\//);
    if (timestampMatch) {
      const date = new Date(parseInt(timestampMatch[1]));
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
    }
    
    // If it's already in a valid format, return as-is
    return sapDate;
  }

  parseSapDateToDate(sapDate: string): Date | undefined {
    if (!sapDate) return undefined;
    
    const timestampMatch = sapDate.match(/\/Date\((\d+)\)\//);
    if (timestampMatch) {
      return new Date(parseInt(timestampMatch[1]));
    }
    
    // Try to parse as regular date string
    const date = new Date(sapDate);
    return isNaN(date.getTime()) ? undefined : date;
  }

  clearFilters(): void {
    this.searchText = '';
    this.currencyFilter = '';
    this.agingBucketFilter = '';
    this.filteredAgings = [...this.agings];
  }

  applyFilters(): void {
    this.filteredAgings = this.agings.filter(a => {
      const matchesSearch = !this.searchText ||
        a.Lifnr.includes(this.searchText) ||
        a.Name1.toLowerCase().includes(this.searchText.toLowerCase());

      const matchesCurrency = !this.currencyFilter || a.Waers === this.currencyFilter;
      const matchesAging = !this.agingBucketFilter || a.Aging === this.agingBucketFilter;

      return matchesSearch && matchesCurrency && matchesAging;
    });
  }

  sortData(sort: Sort): void {
    const data = [...this.filteredAgings];
    if (!sort.active || sort.direction === '') {
      this.filteredAgings = data;
      return;
    }

    this.filteredAgings = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'Lifnr': return compare(a.Lifnr, b.Lifnr, isAsc);
        case 'Name1': return compare(a.Name1, b.Name1, isAsc);
        case 'Wrbtr': return compare(a.rawWrbtr!, b.rawWrbtr!, isAsc);
        case 'Faedt': return compare(a.rawFaedt!, b.rawFaedt!, isAsc);
        default: return 0;
      }
    });
  }

  viewDetails(lifnr: string): void {
    const aging = this.agings.find(a => a.Lifnr === lifnr);
    this.router.navigate(['/home/dashboard/aging', lifnr], {
      state: { agingData: aging }
    });
  }

  formatDate(date: string): string {
    try {
      // First try to parse as SAP date format
      const timestampMatch = date.match(/\/Date\((\d+)\)\//);
      if (timestampMatch) {
        const parsedDate = new Date(parseInt(timestampMatch[1]));
        return this.datePipe.transform(parsedDate, 'dd/MM/yyyy') || 'N/A';
      }
      
      // If not SAP format, try to parse as regular date
      return this.datePipe.transform(date, 'dd/MM/yyyy') || 'N/A';
    } catch (e) {
      console.error('Error formatting date:', date, e);
      return 'N/A';
    }
  }

  formatAmount(amount: string, currency: string): string {
    if (!amount || !currency) return 'N/A';
    const num = parseFloat(amount);
    return `${currency} ${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  getAgingClass(aging: string): string {
    switch (aging) {
      case 'Future Due': return 'not-due';
      case 'Due': return 'due';
      case 'Overdue': return 'overdue';
      default: return '';
    }
  }

  getPaymentStatusClass(aging: string): string {
    switch (aging) {
      case 'Future Due': return 'status-future';
      case '0-30 Days': return 'status-low';
      case '31-60 Days': return 'status-medium';
      case '61-90 Days': return 'status-high';
      case '> 90 Days': return 'status-critical';
      default: return 'status-unknown';
    }
  }

  getPaymentStatusIcon(aging: string): string {
    switch (aging) {
      case 'Future Due': return 'schedule';
      case '0-30 Days': return 'check_circle';
      case '31-60 Days': return 'hourglass_bottom';
      case '61-90 Days': return 'warning';
      case '> 90 Days': return 'error';
      default: return 'help';
    }
  }

  getPaymentStatusText(aging: string): string {
    switch (aging) {
      case 'Future Due': return 'Not Due Yet';
      case '0-30 Days': return 'Due Recently';
      case '31-60 Days': return 'Overdue (1–2 months)';
      case '61-90 Days': return 'Overdue (2–3 months)';
      case '> 90 Days': return 'Overdue (90+ days)';
      default: return 'Unknown';
    }
  }
}

function compare(a: number | string | Date, b: number | string | Date, isAsc: boolean): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}