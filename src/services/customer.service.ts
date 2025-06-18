import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getSalesOrderData(customerId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/salesorder`, { CUSTNO: customerId }).pipe(
      catchError(error => {
        console.error('Sales Order Error:', error);
        return of({ salesOrders: [] }); // Return empty array on error
      })
    );
  }

  getInquiryData(customerId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/inquiry`, { CUSTNO: customerId }).pipe(
      catchError(error => {
        console.error('Inquiry Error:', error);
        return of({ inquiries: [] });
      })
    );
  }
  getAgingData(customerId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/aging`, { CUSTNO: customerId }).pipe(
      catchError(error => {
        console.error('Inquiry Error:', error);
        return of({ inquiries: [] });
      })
    );
  }

  getDeliveryData(customerId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/delivery`, { CUSTNO: customerId }).pipe(
      catchError(error => {
        console.error('Delivery Error:', error);
        return of({ delivery: [] });
      })
    );
  }
}