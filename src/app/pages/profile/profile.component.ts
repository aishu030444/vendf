import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  vendorProfile: any = null;
  error: string = '';
  isLoading: boolean = false;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const  vendorId= localStorage.getItem('vendorId');
    if (vendorId) {
      this.loadVendorProfile(vendorId);
    } else {
      this.error = 'Vendor ID not found. Please log in.';
      this.router.navigate(['/login']);
    }
  }

  loadVendorProfile(vendorId: string): void {
    this.isLoading = true;
    this.error = '';
    
    this.http.post<any>('http://localhost:3030/profile', { vendorId: vendorId }).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.d) { // SAP OData response structure
          const profile = response.d;
          
          this.vendorProfile = {
            vendorId: profile.Lifnr,
            name: profile.Name1,
            shortName: profile.Sortl,
            address: {
              street: profile.Stras,
              city: profile.Ort01,
              postalCode: profile.Pstlz,
              country: profile.Land1,
              region: profile.Regio
            },
            contact: {
              phone: profile.Telf1 || 'Not provided',
              email: profile.SmtpAddr || 'Not provided' // Add if available in response
            },
            metadata: {
              type: response.__metadata?.type,
              uri: response.__metadata?.uri
            }
          };
        } else {
          this.error = 'No profile data found';
          this.vendorProfile = null;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.error?.message || 'Unable to load vendor profile';
        this.vendorProfile = null;
        console.error('Profile load error:', err);
      }
    });
  }

  get fullAddress(): string {
    if (!this.vendorProfile) return '';
    const addr = this.vendorProfile.address;
    return `${addr.street}, ${addr.city}, ${addr.postalCode}, ${addr.country}`;
  }
}