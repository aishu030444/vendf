import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-dashboard-purchase-order',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
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
    MatTooltipModule,
    MatCardModule,
    MatExpansionModule
  ],
  templateUrl: './dashboard-sale-order.component.html',
  styleUrls: ['./dashboard-sale-order.component.scss'],
  providers: [DatePipe]
})
export class DashboardSaleOrderComponent implements OnInit {

  purchaseOrders: PurchaseOrder[] = [];
  filteredPurchaseOrders: PurchaseOrder[] = [];

  displayedColumns: string[] = [
    'purchaseOrderNo', 'orderType', 'createdDate', 'vendor', 'companyCode', 
    'purchOrg', 'purchGroup', 'currency', 'material', 'quantity', 'netPrice', 'actions'
  ];

  isLoading: boolean = false;
  error: string = '';
  hoveredRow: string | null = null;
pageSize = 10;
pageIndex = 0;
pagedPurchaseOrders: PurchaseOrder[] = [];

onPageChange(event: PageEvent): void {
  this.pageSize = event.pageSize;
  this.pageIndex = event.pageIndex;
  this.updatePagedData();
}

updatePagedData(): void {
  const startIndex = this.pageIndex * this.pageSize;
  const endIndex = startIndex + this.pageSize;
  this.pagedPurchaseOrders = this.filteredPurchaseOrders.slice(startIndex, endIndex);
}
  // Filter properties
  searchText: string = '';
  orderTypeFilter: string = '';
  dateRangeFilter: { start: Date | null; end: Date | null } = { start: null, end: null };
  orderTypes: string[] = [];
  selectedOrder: PurchaseOrder | null = null;
  panelOpenState = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    const vendorId = localStorage.getItem('vendorId');
    if (vendorId) {
      this.loadPurchaseOrders(vendorId);
    } else {
      this.error = 'Vendor ID not found. Please log in.';
      this.snackBar.open(this.error, 'Close', { duration: 5000 });
      this.router.navigate(['/login']);
    }
  }

  loadPurchaseOrders(vendorId: string): void {
    this.isLoading = true;
    this.error = '';

    this.http.post<any>('http://localhost:3030/purchaseorder', { vendorId }).subscribe({
      next: (response) => {
        console.log('Purchase orders response:', response);

        // Process the response data
        const ordersRaw = Array.isArray(response) ? response : (response.purchaseOrders || []);

        this.purchaseOrders = ordersRaw.map((item: any) => ({
          purchaseOrderNo: item.Ebeln,
          itemNo: item.Ebelp,
          orderType: item.Bsart,
          createdDate: item.Aedat,
          createdBy: item.Ernam,
          vendor: item.Lifnr,
          companyCode: item.Bukrs,
          purchOrg: item.Ekorg,
          purchGroup: item.Ekgrp,
          currency: item.Waers,
          material: item.Matnr,
          quantity: parseFloat(item.Menge) || 0,
          netPrice: parseFloat(item.Netpr) || 0,
          orderCategory: item.Bstyp,
          rawCreatedDate: this.parseODataDate(item.Aedat),
          totalValue: (parseFloat(item.Menge) || 0) * (parseFloat(item.Netpr) || 0)
        }));

        this.filteredPurchaseOrders = [...this.purchaseOrders];
        this.orderTypes = [...new Set(this.purchaseOrders.map(item => item.orderType))];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Unable to load purchase orders. Please try again later.';
        this.snackBar.open(this.error, 'Close', { duration: 5000 });
        this.isLoading = false;
        console.error('Purchase order load error:', err);
      }
    });
  }

  parseODataDate(odataDateString: string | null): Date | undefined {
    if (!odataDateString) return undefined;
    const timestamp = parseInt(odataDateString.replace('/Date(', '').replace(')/', ''), 10);
    return new Date(timestamp);
  }

  formatDate(odataDateString: string): string {
    if (!odataDateString) return '';
    const date = this.parseODataDate(odataDateString);
    return date ? this.datePipe.transform(date, 'mediumDate') || '' : '';
  }

  formatCurrency(value: number, currency: string): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR'
    }).format(value);
  }

  applyFilters(): void {
    this.filteredPurchaseOrders = this.purchaseOrders.filter(order => {
      // Search text filter
      const matchesSearch = !this.searchText ||
        order.purchaseOrderNo.toLowerCase().includes(this.searchText.toLowerCase()) ||
        order.material.toLowerCase().includes(this.searchText.toLowerCase()) ||
        order.vendor.toLowerCase().includes(this.searchText.toLowerCase());

      // Order type filter
      const matchesOrderType = !this.orderTypeFilter ||
        order.orderType === this.orderTypeFilter;

      // Date range filter
      let matchesDateRange = true;
      if (this.dateRangeFilter.start || this.dateRangeFilter.end) {
        const orderDate = order.rawCreatedDate;
        if (!orderDate) return false;
        
        const start = this.dateRangeFilter.start ? new Date(this.dateRangeFilter.start) : null;
        const end = this.dateRangeFilter.end ? new Date(this.dateRangeFilter.end) : null;

        if (start && orderDate < start) matchesDateRange = false;
        if (end && orderDate > end) matchesDateRange = false;
      }

      return matchesSearch && matchesOrderType && matchesDateRange;
    });
  }

  clearFilters(): void {
    this.searchText = '';
    this.orderTypeFilter = '';
    this.dateRangeFilter = { start: null, end: null };
    this.filteredPurchaseOrders = [...this.purchaseOrders];
  }

  sortData(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      this.filteredPurchaseOrders = [...this.filteredPurchaseOrders];
      return;
    }

    this.filteredPurchaseOrders = this.filteredPurchaseOrders.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'purchaseOrderNo': return compare(a.purchaseOrderNo, b.purchaseOrderNo, isAsc);
        case 'createdDate': return compare(a.rawCreatedDate!, b.rawCreatedDate!, isAsc);
        case 'material': return compare(a.material, b.material, isAsc);
        case 'quantity': return compare(a.quantity, b.quantity, isAsc);
        case 'netPrice': return compare(a.netPrice, b.netPrice, isAsc);
        default: return 0;
      }
    });
  }

  viewDetails(orderNo: string): void {
    const order = this.purchaseOrders.find(o => o.purchaseOrderNo === orderNo);
    if (order) {
      this.selectedOrder = order;
      this.panelOpenState = true;
    } else {
      this.snackBar.open('Purchase order not found', 'Close', { duration: 3000 });
    }
  }

  downloadDocument(orderNo: string): void {
    // Implement document download logic
    this.snackBar.open(`Downloading document for PO ${orderNo}`, 'Close', { duration: 3000 });
  }
}

export interface PurchaseOrder {
  purchaseOrderNo: string;
  itemNo: string;
  orderType: string;
  createdDate: string; // raw OData date string
  createdBy: string;
  vendor: string;
  companyCode: string;
  purchOrg: string;
  purchGroup: string;
  currency: string;
  material: string;
  quantity: number;
  netPrice: number;
  orderCategory: string;
  rawCreatedDate?: Date;
  totalValue: number;
  
}

function compare(a: number | string | Date, b: number | string | Date, isAsc: boolean): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}