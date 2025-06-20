import { Component, OnInit, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
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
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule
  ],
  templateUrl: './debitmemo.component.html',
  styleUrls: ['./debitmemo.component.scss'],
  providers: [DatePipe]
})
export class DebitmemoComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;

  creditRecords: CreditDebitRecord[] = [];
  filteredRecords: CreditDebitRecord[] = [];
  paginatedRecords: CreditDebitRecord[] = [];
  
  // Table columns to display
  displayedColumns: string[] = [
    'bukrs', 'blart', 'bldat', 'budat', 'lifnr', 
    'name1', 'waers', 'hkont', 'actions'
  ];

  // Filter variables
  searchText: string = '';
  docTypeFilter: string = '';
  companyCodeFilter: string = '';
  currencyFilter: string = '';

  // Dropdown options
  docTypes: string[] = [];
  companyCodes: string[] = [];
  currencies: string[] = [];

  // Pagination variables
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  pageSizeOptions = [5, 10, 20, 50];

  isLoading: boolean = false;
  error: string = '';
  selectedRecord: CreditDebitRecord | null = null;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
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

        // Initialize filters dropdowns
        this.initFilters();
        this.applyFilters();
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

  initFilters(): void {
    // Get unique values for filters
    this.docTypes = [...new Set(this.creditRecords.map(item => item.blart))];
    this.companyCodes = [...new Set(this.creditRecords.map(item => item.bukrs))];
    this.currencies = [...new Set(this.creditRecords.map(item => item.waers))];
  }

  applyFilters(): void {
    this.filteredRecords = this.creditRecords.filter(record => {
      const matchesSearch = !this.searchText || 
        record.lifnr.toLowerCase().includes(this.searchText.toLowerCase()) || 
        record.name1.toLowerCase().includes(this.searchText.toLowerCase()) ||
        record.hkont.toLowerCase().includes(this.searchText.toLowerCase());

      const matchesDocType = !this.docTypeFilter || record.blart === this.docTypeFilter;
      const matchesCompanyCode = !this.companyCodeFilter || record.bukrs === this.companyCodeFilter;
      const matchesCurrency = !this.currencyFilter || record.waers === this.currencyFilter;

      return matchesSearch && matchesDocType && matchesCompanyCode && matchesCurrency;
    });

    this.totalPages = Math.ceil(this.filteredRecords.length / this.itemsPerPage);
    this.updatePaginatedRecords();
  }

  updatePaginatedRecords(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedRecords = this.filteredRecords.slice(startIndex, startIndex + this.itemsPerPage);
  }

  sortData(sort: { active: string; direction: string }): void {
    if (!sort.active || sort.direction === '') {
      return;
    }

    this.filteredRecords = this.filteredRecords.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'bukrs': return this.compare(a.bukrs, b.bukrs, isAsc);
        case 'blart': return this.compare(a.blart, b.blart, isAsc);
        case 'bldat': return this.compare(a.bldat, b.bldat, isAsc);
        case 'budat': return this.compare(a.budat, b.budat, isAsc);
        case 'lifnr': return this.compare(a.lifnr, b.lifnr, isAsc);
        case 'name1': return this.compare(a.name1, b.name1, isAsc);
        case 'waers': return this.compare(a.waers, b.waers, isAsc);
        case 'hkont': return this.compare(a.hkont, b.hkont, isAsc);
        default: return 0;
      }
    });

    this.updatePaginatedRecords();
  }

  compare(a: string | number, b: string | number, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedRecords();
    }
  }

  getDisplayRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredRecords.length);
    return `Showing ${start} - ${end} of ${this.filteredRecords.length} records`;
  }

  showDetails(record: CreditDebitRecord): void {
    this.selectedRecord = record;
  }

  closeDetails(): void {
    this.selectedRecord = null;
  }

  clearFilters(): void {
    this.searchText = '';
    this.docTypeFilter = '';
    this.companyCodeFilter = '';
    this.currencyFilter = '';
    this.applyFilters();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return this.datePipe.transform(dateString, 'mediumDate') || '';
  }

  convertSapDate(sapDate: string): string {
    if (!sapDate) return '';
    const timestamp = parseInt(sapDate.match(/\d+/)?.[0] || '0', 10);
    return new Date(timestamp).toISOString().split('T')[0];
  }

  formatCurrency(amount: string, currency: string): string {
    // Implement your currency formatting logic here
    return `${amount} ${currency}`;
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