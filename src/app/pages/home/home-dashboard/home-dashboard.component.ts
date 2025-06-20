import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

interface QuotationKPIs {
  totalRFQs: number;
  uniqueTypes: number;
  recentRFQs: number;
}

interface PurchaseKPIs {
  totalOrders: number;
  totalValue: number;
  uniqueCompanies: number;
}

interface DeliveryKPIs {
  totalReceipts: number;
  uniquePlants: number;
  recentDeliveries: number;
}

interface FinancialKPIs {
  totalInvoices: number;
  agingRecords: number;
  creditMemos: number;
  debitMemos: number;
}

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatProgressSpinnerModule, 
    MatButtonModule, 
    MatIconModule
  ],
  templateUrl: './home-dashboard.component.html',
  styleUrls: ['./home-dashboard.component.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class HomeDashboardComponent implements OnInit {
  isLoading = true;
  error = '';
  vendorId = '';

  // KPI Data
  quotationKPIs: QuotationKPIs = {
    totalRFQs: 0,
    uniqueTypes: 0,
    recentRFQs: 0
  };

  purchaseKPIs: PurchaseKPIs = {
    totalOrders: 0,
    totalValue: 0,
    uniqueCompanies: 0
  };

  deliveryKPIs: DeliveryKPIs = {
    totalReceipts: 0,
    uniquePlants: 0,
    recentDeliveries: 0
  };

  financialKPIs: FinancialKPIs = {
    totalInvoices: 0,
    agingRecords: 0,
    creditMemos: 0,
    debitMemos: 0
  };

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.vendorId = localStorage.getItem('vendorId') || '';
    if (!this.vendorId) {
      this.error = 'Vendor ID not found. Please log in again.';
      this.router.navigate(['/login']);
      return;
    }
    this.loadAllData();
  }

  loadAllData(): void {
    this.isLoading = true;
    this.error = '';

    const formattedVendorId = this.vendorId.padStart(10, '0');

    // Fetch all data in parallel
    forkJoin({
      quotations: this.http.post<any>('http://localhost:3030/quotation', { vendorId: formattedVendorId })
        .pipe(catchError(() => of([]))),
      purchaseOrders: this.http.post<any>('http://localhost:3030/purchaseorder', { vendorId: formattedVendorId })
        .pipe(catchError(() => of([]))),
      deliveries: this.http.post<any>('http://localhost:3030/goods', { vendorId: formattedVendorId })
        .pipe(catchError(() => of([]))),
      invoices: this.http.post<any>('http://localhost:3030/invoice', { vendorId: formattedVendorId })
        .pipe(catchError(() => of([]))),
      aging: this.http.post<any>('http://localhost:3030/aging', { vendorId: formattedVendorId })
        .pipe(catchError(() => of([]))),
      creditMemos: this.http.post<any>('http://localhost:3030/credit', { vendorId: formattedVendorId })
        .pipe(catchError(() => of([]))),
      debitMemos: this.http.post<any>('http://localhost:3030/debit', { vendorId: formattedVendorId })
        .pipe(catchError(() => of([])))
    }).subscribe({
      next: (responses) => {
        this.processQuotationData(responses.quotations);
        this.processPurchaseOrderData(responses.purchaseOrders);
        this.processDeliveryData(responses.deliveries);
        this.processFinancialData(responses.invoices, responses.aging, responses.creditMemos, responses.debitMemos);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.error = 'Failed to load dashboard data. Please try again.';
        this.isLoading = false;
      }
    });
  }

  private processQuotationData(data: any): void {
    const quotations = Array.isArray(data) ? data : [];
    
    this.quotationKPIs = {
      totalRFQs: quotations.length,
      uniqueTypes: [...new Set(quotations.map((q: any) => q.Bsart || q.rfqType))].length,
      recentRFQs: this.getRecentCount(quotations, 'Angdt')
    };
  }

  private processPurchaseOrderData(data: any): void {
    const orders = Array.isArray(data) ? data : [];
    
    this.purchaseKPIs = {
      totalOrders: orders.length,
      totalValue: orders.reduce((sum: number, order: any) => {
        const quantity = parseFloat(order.Menge) || 0;
        const price = parseFloat(order.Netpr) || 0;
        return sum + (quantity * price);
      }, 0),
      uniqueCompanies: [...new Set(orders.map((o: any) => o.Bukrs || o.companyCode))].length
    };
  }

  private processDeliveryData(data: any): void {
    const deliveries = Array.isArray(data) ? data : [];
    
    this.deliveryKPIs = {
      totalReceipts: deliveries.length,
      uniquePlants: [...new Set(deliveries.map((d: any) => d.Werks || d.plant))].length,
      recentDeliveries: this.getRecentCount(deliveries, 'Budat')
    };
  }

  private processFinancialData(invoices: any, aging: any, creditMemos: any, debitMemos: any): void {
    const invoiceArray = Array.isArray(invoices) ? invoices : (invoices?.d?.results || []);
    const agingArray = Array.isArray(aging) ? aging : [];
    const creditArray = Array.isArray(creditMemos) ? creditMemos : [];
    const debitArray = Array.isArray(debitMemos) ? debitMemos : [];

    this.financialKPIs = {
      totalInvoices: invoiceArray.length,
      agingRecords: agingArray.length,
      creditMemos: creditArray.length,
      debitMemos: debitArray.length
    };
  }

  private getRecentCount(data: any[], dateField: string): number {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    return data.filter(item => {
      try {
        const dateStr = item[dateField];
        if (!dateStr) return false;
        
        // Handle SAP OData date format
        const timestamp = dateStr.match(/\/Date\((\d+)\)\//);
        if (timestamp) {
          const date = new Date(parseInt(timestamp[1]));
          return date >= oneMonthAgo;
        }
        
        // Handle regular date format
        const date = new Date(dateStr);
        return date >= oneMonthAgo;
      } catch {
        return false;
      }
    }).length;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  navigateToComponent(route: string): void {
    this.router.navigate([route]);
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }
}