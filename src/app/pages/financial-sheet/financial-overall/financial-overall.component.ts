import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { forkJoin } from 'rxjs';
import { SafeDatePipe } from '../../../pipes/safe-date.pipe';
import { CustomerService } from '../../../../services/customer.service';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sales-data',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    NgChartsModule,
    MatTabsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatGridListModule,
    SafeDatePipe,
    MatIconModule
  ],
  templateUrl: './financial-overall.component.html',
  styleUrls: ['./financial-overall.component.scss'],
  providers: [DatePipe]
})
export class FinancialOverallComponent implements OnInit {
  // Data arrays
  salesOrders: any[] = [];
  inquiries: any[] = [];
  delivery: any[] = [];
  agingDetails: any[] = [];
  
  isLoading: boolean = true;
  error: string = '';
  dateRange: string = 'month';
  activeTab: string = 'summary';

  // KPI Metrics
  kpis = {
    totalInquiries: 0,
    totalOrders: 0,
    totalDeliveries: 0,
    totalRevenue: 0,
    outstandingPayments: 0,
    deliveryFulfillmentRate: 0,
    onTimeDeliveryRate: 0,
    avgOrderValue: 0,
    topCustomer: '',
    pendingDeliveries: 0,
    overduePayments: 0
  };

  // Chart Configurations
  inquiryTrendData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Inquiries',
      borderColor: '#3f51b5',
      backgroundColor: 'rgba(63, 81, 181, 0.2)',
      fill: true,
      tension: 0.4
    }]
  };

  deliveryStatusData: ChartData<'doughnut'> = {
    labels: ['Completed', 'Pending', 'In Transit'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#4caf50', '#ff9800', '#2196f3'],
      hoverOffset: 4
    }]
  };

  salesTrendData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Sales Revenue',
      borderColor: '#673ab7',
      backgroundColor: 'rgba(103, 58, 183, 0.2)',
      fill: true,
      tension: 0.4
    }]
  };

 
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { 
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      x: {
        grid: { display: false }
      }
    },
    plugins: {
      legend: { 
        display: true,
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    }
  };
  paymentChartOptions: { responsive: boolean; scales: { y: { beginAtZero: boolean; title: { display: boolean; text: string; }; }; x: { title: { display: boolean; text: string; }; }; }; plugins: { tooltip: { callbacks: { label: (context: { dataset: { data: any[]; }; raw: number; }) => string; }; }; legend: { display: boolean; }; }; } | undefined;
  paymentStatusData: { labels: string[]; datasets: { label: string; data: number[]; backgroundColor: string[]; borderColor: string[]; borderWidth: number; }[]; } | undefined;
  inquiryTrendOptions: { responsive: boolean; plugins: { legend: { position: string; }; tooltip: { callbacks: { label: (context: any) => string; }; }; }; scales: { y: { beginAtZero: boolean; title: { display: boolean; text: string; }; ticks: { stepSize: number; }; }; x: { title: { display: boolean; text: string; }; }; }; } | undefined;

  constructor(
    private customerservice: CustomerService,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    const customerId = localStorage.getItem('customerId');
    if (!customerId) {
      this.showError('Customer ID not found');
      this.isLoading = false;
      return;
    }

    const sapCustomerId = customerId.padStart(10, '0');
    console.log('Formatted SAP Customer ID:', sapCustomerId);

    forkJoin({
      salesOrders: this.customerservice.getSalesOrderData(sapCustomerId),
      inquiries: this.customerservice.getInquiryData(sapCustomerId),
      deliveries: this.customerservice.getDeliveryData(sapCustomerId),
      agingDetails: this.customerservice.getAgingData(sapCustomerId)
    }).subscribe({
      next: (responses) => {
        this.processApiResponses(responses);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('API Error:', err);
        this.showError('Failed to load data. Please try again.');
        this.isLoading = false;
      }
    });
  }

  private processApiResponses(responses: any): void {
    this.salesOrders = this.extractArrayData(responses.salesOrders, 'salesOrders');
    this.inquiries = this.extractArrayData(responses.inquiries, 'inquiries');
    this.delivery = this.extractArrayData(responses.deliveries, 'delivery');
    this.agingDetails = this.extractArrayData(responses.agingDetails, 'agingDetails');

    console.log('Processed Data:', {
      salesOrders: this.salesOrders,
      inquiries: this.inquiries,
      delivery: this.delivery,
      agingDetails: this.agingDetails
    });

    if (this.salesOrders.length === 0 && 
        this.inquiries.length === 0 && 
        this.delivery.length === 0) {
      this.showError('No data found for this customer');
    }

    this.calculateKPIs();
    this.updateCharts();
  }

  private extractArrayData(response: any, dataKey: string): any[] {
    if (!response) return [];
    
    if (Array.isArray(response)) {
      return response;
    } else if (response[dataKey] && Array.isArray(response[dataKey])) {
      return response[dataKey];
    } else if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  }

  calculateKPIs(): void {
    // Initialize all KPIs
    this.resetKPIs();

    // Only calculate if we have data
    if (this.hasData()) {
      this.calculateBasicCounts();
      this.calculateFinancialMetrics();
      this.calculateDeliveryMetrics();
      this.calculateCustomerMetrics();
    }
  }

  private resetKPIs(): void {
    this.kpis = {
      totalInquiries: 0,
      totalOrders: 0,
      totalDeliveries: 0,
      totalRevenue: 0,
      outstandingPayments: 0,
      deliveryFulfillmentRate: 0,
      onTimeDeliveryRate: 0,
      avgOrderValue: 0,
      topCustomer: 'N/A',
      pendingDeliveries: 0,
      overduePayments: 0
    };
  }

  private hasData(): boolean {
    return this.salesOrders.length > 0 || 
           this.inquiries.length > 0 || 
           this.delivery.length > 0;
  }

  private calculateBasicCounts(): void {
    this.kpis.totalInquiries = this.inquiries.length;
    this.kpis.totalOrders = this.salesOrders.length;
    this.kpis.totalDeliveries = this.delivery.length;
  }

  private calculateFinancialMetrics(): void {
    this.kpis.totalRevenue = this.safeReduce(this.salesOrders, 'NETWR', 'netValue');
    this.kpis.outstandingPayments = this.safeReduce(this.agingDetails, 'NETWR', 'netValue');
    this.kpis.avgOrderValue = this.kpis.totalOrders > 0 
      ? this.kpis.totalRevenue / this.kpis.totalOrders 
      : 0;
  }

  private safeReduce(items: any[], ...fieldNames: string[]): number {
    return items.reduce((sum, item) => {
      const value = this.getNumericValue(item, fieldNames);
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
  }

  private getNumericValue(item: any, fieldNames: string[]): number {
    for (const field of fieldNames) {
      if (item[field] !== undefined && item[field] !== null) {
        return parseFloat(item[field]);
      }
    }
    return 0;
  }

  private calculateDeliveryMetrics(): void {
    const totalOrderedQuantity = this.safeReduce(this.salesOrders, 'KWMENG', 'orderQty');
    const totalDeliveredQuantity = this.safeReduce(this.delivery, 'LFIMG', 'deliveryQty');
    
    this.kpis.deliveryFulfillmentRate = totalOrderedQuantity > 0 
      ? (totalDeliveredQuantity / totalOrderedQuantity) * 100 
      : 0;

    const onTimeDeliveries = this.delivery.filter(delivery => {
      try {
        const deliveryDate = new Date(delivery.LFDAT || delivery.deliveryDate);
        const requestedDate = new Date(delivery.VDATU || delivery.requestedDate);
        return deliveryDate <= requestedDate;
      } catch {
        return false;
      }
    }).length;
    
    this.kpis.onTimeDeliveryRate = this.kpis.totalDeliveries > 0 
      ? (onTimeDeliveries / this.kpis.totalDeliveries) * 100 
      : 0;

    this.kpis.pendingDeliveries = this.delivery.filter(delivery => 
      (delivery.GBSTK || delivery.status || '').toString().toUpperCase() !== 'C'
    ).length;
  }

  private calculateCustomerMetrics(): void {
    const customerRevenue = new Map<string, number>();
    
    this.salesOrders.forEach(order => {
      const customerId = order.KUNNR || order.customerId || 'N/A';
      const current = customerRevenue.get(customerId) || 0;
      const value = this.getNumericValue(order, ['NETWR', 'netValue']);
      customerRevenue.set(customerId, current + value);
    });
    
    const sortedCustomers = Array.from(customerRevenue.entries()).sort(([, a], [, b]) => b - a);
    this.kpis.topCustomer = sortedCustomers[0]?.[0] || 'N/A';
    
    this.kpis.overduePayments = this.agingDetails.filter(item => {
      const aging = this.getNumericValue(item, ['AGING', 'aging']);
      return aging > 0;
    }).length;
  }

  updateCharts(): void {
    this.updateInquiryTrend();
    this.updateDeliveryStatus();
    this.updateSalesTrend();
    this.updatePaymentStatus();
  }
updateInquiryTrend(): void {
    if (!this.inquiries || this.inquiries.length === 0) {
        console.warn('No inquiry data available');
        return;
    }

    const monthlyInquiries = new Map<string, number>();
    const currentYear = new Date().getFullYear();
    
    this.inquiries.forEach(inquiry => {
        try {
            // Use createdDate as primary field from your data structure
            const dateStr = inquiry.createdDate;
            
            // Skip invalid dates like "0000-00-00"
            if (!dateStr || dateStr.startsWith('0000-00-00')) {
                return;
            }
            
            const date = new Date(dateStr);
            
            // Validate date - skip if invalid or in the far future
            if (isNaN(date.getTime()) ){
                console.warn('Invalid inquiry date:', dateStr, inquiry);
                return;
            }
            
            // Skip dates more than 10 years in the future
            if (date.getFullYear() > currentYear + 10) {
                console.warn('Future inquiry date:', dateStr, inquiry);
                return;
            }
            
            const monthKey = new DatePipe('en-US').transform(date, 'MMM yyyy') || '';
            monthlyInquiries.set(monthKey, (monthlyInquiries.get(monthKey) || 0) + 1);
        } catch (e) {
            console.error('Error processing inquiry date:', e, inquiry);
        }
    });

    // Sort months chronologically
    const sortedMonths = Array.from(monthlyInquiries.keys()).sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime();
    });

    // Prepare chart data
    this.inquiryTrendData = {
        labels: sortedMonths,
        datasets: [{
            label: 'Number of Inquiries',
            data: sortedMonths.map(month => monthlyInquiries.get(month) || 0),
            backgroundColor: 'rgba(63, 81, 181, 0.5)',
            borderColor: '#3f51b5',
            borderWidth: 2,
            tension: 0.4,
            fill: true
        }]
    };

    // Chart options
    this.inquiryTrendOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        return `${context.dataset.label}: ${context.raw}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Inquiries'
                },
                ticks: {
                    stepSize: 1
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Month'
                }
            }
        }
    };
}
  
  updateSalesTrend(): void {
    const monthlySales = new Map<string, number>();
    
    this.salesOrders.forEach(order => {
      try {
        const date = new Date(order.ERDAT || order.orderDate);
        const monthKey = new SafeDatePipe(this.datePipe).transform(date, 'MMM yyyy');
        const current = monthlySales.get(monthKey) || 0;
        const value = this.getNumericValue(order, ['NETWR', 'netValue']);
        monthlySales.set(monthKey, current + value);
      } catch (e) {
        console.error('Error processing sales order date:', e);
      }
    });

    const sortedMonths = Array.from(monthlySales.keys()).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime());
    
    this.salesTrendData = {
      ...this.salesTrendData,
      labels: sortedMonths,
      datasets: [{
        ...this.salesTrendData.datasets[0],
        data: sortedMonths.map(month => monthlySales.get(month) || 0)
      }]
    };
  }

 updatePaymentStatus(): void {
    if (!this.agingDetails || this.agingDetails.length === 0) {
        console.warn('No aging details available');
        return;
    }

    // Calculate counts based on payment status and aging
    const overdueCount = this.agingDetails.filter(item => {
        const aging = parseInt(item.aging) || 0;
        const status = (item.paymentStatus || '').toString().toLowerCase();
        return aging > 0 || status.includes('overdue');
    }).length;

    const notDueCount = this.agingDetails.length - overdueCount;

    // Prepare data for bar chart
    this.paymentStatusData = {
        labels: ['Overdue', 'Not Due'],
        datasets: [{
            label: 'Payment Status',
            data: [overdueCount, notDueCount],
            backgroundColor: [
                '#f44336', // Red for overdue
                '#4caf50'  // Green for not due
            ],
            borderColor: [
                '#d32f2f',
                '#388e3c'
            ],
            borderWidth: 1
        }]
    }
     this.paymentChartOptions = {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Invoices'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Payment Status'
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context: { dataset: { data: any[]; }; raw: number; }) => {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const value = context.raw as number;
                        const percentage = Math.round((value / total) * 100);
                        return `${value} (${percentage}%)`;
                    }
                }
            },
            legend: {
                display: false
            }
        }
    };
  }
  setDateRange(range: string): void {
    this.dateRange = range;
    this.updateCharts();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getTopProducts(): any[] {
    const productMap = new Map<string, { units: number, revenue: number }>();
    
    this.salesOrders.forEach(order => {
      const productKey = order.MATNR || order.materialNumber || 'Unknown';
      const current = productMap.get(productKey) || { units: 0, revenue: 0 };
      
      productMap.set(productKey, {
        units: current.units + this.getNumericValue(order, ['KWMENG', 'orderQty']),
        revenue: current.revenue + this.getNumericValue(order, ['NETWR', 'netValue'])
      });
    });

    return Array.from(productMap.entries())
      .map(([product, data]) => ({
        product,
        units: data.units,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }
  updateDeliveryStatus(): void {
    // First check if we have delivery data
    if (!this.delivery || this.delivery.length === 0) {
        console.warn('No delivery data available');
        return;
    }

    // Use overallStatus as the status field (from your data structure)
    const statusCounts = {
        completed: this.delivery.filter(d => 
            (d.overallStatus || d.GBSTK || d.status || d.deliveryStatus || '').toString().toUpperCase() === 'C'
        ).length,
        pending: this.delivery.filter(d => 
            (d.overallStatus || d.GBSTK || d.status || d.deliveryStatus || '').toString().toUpperCase() === 'P'
        ).length,
        inTransit: this.delivery.filter(d => 
            (d.overallStatus || d.GBSTK || d.status || d.deliveryStatus || '').toString().toUpperCase() === 'A' ||
            (d.overallStatus || d.GBSTK || d.status || d.deliveryStatus || '').toString().toUpperCase() === 'I'
        ).length
    };

    console.log('Delivery Status Counts:', statusCounts);

    this.deliveryStatusData = {
        labels: ['Completed', 'Pending', 'In Transit'],
        datasets: [{
            data: [statusCounts.completed, statusCounts.pending, statusCounts.inTransit],
            backgroundColor: ['#4caf50', '#ff9800', '#2196f3']
        }]
    };
}

  formatCurrency(value: number, currency: string = 'USD'): string {
    return `${currency} ${value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}