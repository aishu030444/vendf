import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, Subject, takeUntil, throwError } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface Invoice {
  Belnr: string;         // Document Number
  Bukrs: string;         // Company Code
  Gjahr: string;         // Fiscal Year
  Bldat: string;         // Document Date
  Budat: string;         // Posting Date
  Lifnr: string;         // Vendor ID
  Waers: string;         // Currency
  Blart: string;         // Document Type
  Name1: string;         // Vendor Name
  [key: string]: any;    // Index signature
}

@Component({
  selector: 'app-financial-invoice',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatSortModule,
    MatTooltipModule,
    MatSnackBarModule,
    DatePipe
  ],
  templateUrl: './financial-invoice.component.html',
  styleUrls: ['./financial-invoice.component.scss']
})
export class FinancialInvoiceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Columns to display - aligned with backend response
  displayedColumns: string[] = [
    'Belnr',       // Document Number
    'Bukrs',       // Company Code
    'Gjahr',       // Fiscal Year
    'Bldat',       // Document Date
    'Lifnr',       // Vendor ID
    'Name1',       // Vendor Name
    'actions'      // Download action
  ];

  columnHeaders: { [key: string]: string } = {
    'Belnr': 'Document Number',
    'Bukrs': 'Company Code',
    'Gjahr': 'Fiscal Year',
    'Bldat': 'Document Date',
    'Lifnr': 'Vendor ID',
    'Name1': 'Vendor Name',
    'actions': 'Download'
  };
 hoveredRow: string | null = null;
  INVOICES: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  searchText = '';
  vendorId: string = '';

  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalItems = 0;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadVendorId();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadVendorId(): void {
    this.vendorId = localStorage.getItem('vendorId') || '';
    if (!this.vendorId) {
      this.showError('Vendor ID not found. Please log in again.');
      return;
    }
    this.fetchInvoiceData();
  }

  fetchInvoiceData(): void {
    if (!this.vendorId) return;

    this.isLoading = true;
    this.errorMessage = null;

    // Format vendor ID to 10 digits as expected by SAP
    const formattedVendorId = this.vendorId.padStart(10, '0');

    this.http.post<any>('http://localhost:3030/invoice', { 
      vendorId: formattedVendorId 
    })
      .pipe(
        takeUntil(this.destroy$),
        catchError((error: HttpErrorResponse) => {
          this.showError(this.getErrorMessage(error));
          return throwError(() => error);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response && response.d && response.d.results) {
            this.INVOICES = this.processSapResponse(response.d.results);
            this.filteredInvoices = [...this.INVOICES];
            this.totalItems = this.INVOICES.length;
          } else if (Array.isArray(response)) {
            this.INVOICES = this.processSapResponse(response);
            this.filteredInvoices = [...this.INVOICES];
            this.totalItems = this.INVOICES.length;
          } else {
            this.showError('No invoice data found for this vendor');
            this.INVOICES = [];
            this.filteredInvoices = [];
            this.totalItems = 0;
          }
        }
      });
  }

  private processSapResponse(data: any[]): Invoice[] {
    return data.map(item => ({
      Belnr: item.Belnr,
      Bukrs: item.Bukrs,
      Gjahr: item.Gjahr,
      Bldat: this.convertSapDate(item.Bldat),
      Budat: this.convertSapDate(item.Budat),
      Lifnr: item.Lifnr,
      Waers: item.Waers,
      Blart: item.Blart,
      Name1: item.Name1
    }));
  }

  private convertSapDate(sapDate: string): string {
    if (!sapDate) return '';
    // Handle both /Date(ts)/ format and regular dates
    const match = sapDate.match(/\/Date\((\d+)\)\//);
    if (match) {
      return new Date(parseInt(match[1])).toISOString();
    }
    return sapDate;
  }

  downloadPDF(lifnr: string, belnr: string): void {
    if (!lifnr || !belnr) {
      this.showError('Both Vendor ID and Document Number are required');
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    // Format vendor ID to 10 digits as expected by SAP
    const formattedLifnr = lifnr.padStart(10, '0');

    const payload = {
      LIFNR: formattedLifnr,
      BELNR: belnr
    };

    console.log('Requesting PDF with payload:', payload);

    this.http.post('http://localhost:3030/invoicepdf', payload, { 
      responseType: 'blob',
      observe: 'response'
    })
      .pipe(
        takeUntil(this.destroy$),
        catchError((error: HttpErrorResponse) => {
          this.isLoading = false;
          let errorMsg = 'Failed to download invoice';
          
          if (error.status === 400) {
            errorMsg = error.error?.message || 'Invalid request parameters';
          } else if (error.status === 404) {
            errorMsg = 'Invoice document not found in SAP';
          }
          
          this.showError(errorMsg);
          return throwError(() => new Error(errorMsg));
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.body && response.body.size > 0) {
            this.handlePdfResponse(response.body, belnr);
          } else {
            this.showError('Received empty PDF file from server');
          }
        }
      });
  }

  private handlePdfResponse(pdfBlob: Blob, documentNumber: string): void {
    const blob = new Blob([pdfBlob], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const fileName = `Invoice_${documentNumber}.pdf`;

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }
clearFilters(): void {
    this.searchText = '';
    this.pageIndex = 0;
    this.applyFilter();
  }

  applyFilter(): void {
    if (!this.searchText) {
      this.filteredInvoices = [...this.INVOICES];
    } else {
      const searchTextLower = this.searchText.toLowerCase();
      this.filteredInvoices = this.INVOICES.filter(invoice => 
        Object.values(invoice).some(
          val => val && val.toString().toLowerCase().includes(searchTextLower)
      ));
    }
    this.totalItems = this.filteredInvoices.length;
    this.pageIndex = 0;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  onSortChange(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      this.filteredInvoices = [...this.filteredInvoices];
      return;
    }

    this.filteredInvoices = this.filteredInvoices.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      const valueA = a[sort.active];
      const valueB = b[sort.active];
      
      // Handle date comparison
      if (sort.active === 'Bldat' || sort.active === 'Budat') {
        return this.compareDates(valueA, valueB, isAsc);
      }
      
      // Standard comparison
      return (valueA < valueB ? -1 : 1) * (isAsc ? 1 : -1);
    });
  }

  private compareDates(dateA: string, dateB: string, isAsc: boolean): number {
    const timeA = new Date(dateA).getTime();
    const timeB = new Date(dateB).getTime();
    return (timeA < timeB ? -1 : 1) * (isAsc ? 1 : -1);
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Network error. Please check your connection.';
    } else if (error.status === 400) {
      return error.error?.message || 'Invalid request. Please check vendor ID.';
    } else if (error.status === 401) {
      return 'Authentication failed. Please log in again.';
    } else if (error.status === 404) {
      return error.error?.message || 'No invoices found for this vendor.';
    } else if (error.status === 500) {
      return 'SAP system returned an error. Please try again later.';
    } else {
      return error.error?.message || 'Failed to process request. Please try again later.';
    }
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  clearError(): void {
    this.errorMessage = null;
  }
}