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
  Mblnr: string;
  Mjahr: string;
  Usnam: string;
  Ebeln: string;
  Ebelp: string;
  Matnr: string;
  Werks: string;
  Lgort: string;
  [key: string]: any;
}

@Component({
  selector: 'app-dashboard-delivery',
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
  templateUrl: './dashboard-delivery.component.html',
  styleUrls: ['./dashboard-delivery.component.scss']
})
export class DashboardDeliveryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  displayedColumns: string[] = ['Mblnr', 'Mjahr', 'Usnam', 'Ebeln', 'Ebelp', 'Matnr', 'Werks', 'Lgort', 'actions'];

filter = {
  mblnr: '',
  ebeln: ''
};

  INVOICES: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  searchText = '';
  vendorId: string = '';

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

    const formattedVendorId = this.vendorId.padStart(10, '0');

    this.http.post<any>('http://localhost:3030/goods', { vendorId: formattedVendorId })
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
          if (Array.isArray(response)) {
            this.INVOICES = this.processSapResponse(response);
            this.filteredInvoices = [...this.INVOICES];
            this.totalItems = this.INVOICES.length;
          } else {
            this.showError('Unexpected response format.');
          }
        }
      });
  }

  private processSapResponse(data: any[]): Invoice[] {
    return data.map(item => ({
      Mblnr: item.Mblnr,
      Mjahr: item.Mjahr,
      Usnam: item.Usnam,
      Ebeln: item.Ebeln,
      Ebelp: item.Ebelp,
      Matnr: item.Matnr,
      Werks: item.Werks,
      Lgort: item.Lgort
    }));
  }

  downloadPDF(lifnr: string, mblnr: string): void {
    if (!lifnr || !mblnr) {
      this.showError('Both Vendor ID and Material Document Number are required');
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const formattedLifnr = lifnr.padStart(10, '0');

    const payload = {
      
      MBLNR: mblnr,
      LIFNR: formattedLifnr
    };

    this.http.post('http://localhost:3030/goodspdf', payload, {
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
            this.handlePdfResponse(response.body, mblnr);
          } else {
            this.showError('Received empty PDF file from server');
          }
        }
      });
  }

  private handlePdfResponse(pdfBlob: Blob, documentNumber: string): void {
    const blob = new Blob([pdfBlob], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const fileName = `GoodsReceipt_${documentNumber}.pdf`;

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  applyFilter(): void {
  const searchTextLower = this.searchText.toLowerCase();

  this.filteredInvoices = this.INVOICES.filter(invoice => {
    const matchesSearchText = !this.searchText || Object.values(invoice).some(
      val => val && val.toString().toLowerCase().includes(searchTextLower)
    );

    const matchesMblnr = !this.filter.mblnr || invoice.Mblnr?.toLowerCase().includes(this.filter.mblnr.toLowerCase());
    const matchesEbeln = !this.filter.ebeln || invoice.Ebeln?.toLowerCase().includes(this.filter.ebeln.toLowerCase());

    return matchesSearchText && matchesMblnr && matchesEbeln;
  });

  this.totalItems = this.filteredInvoices.length;
  this.pageIndex = 0;
}
clearFilter(): void {
  this.searchText = '';
  this.filter = {
    mblnr: '',
    ebeln: ''
  };
  this.applyFilter();
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
      return (valueA < valueB ? -1 : 1) * (isAsc ? 1 : -1);
    });
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
