import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, FormsModule, HttpClientModule],
})
export class LoginComponent {
  vendorId = '';
  password = '';
  showPassword = false;
  errorMessage: string = '';

  constructor(private router: Router, private http: HttpClient) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
  if (!this.vendorId || !this.password) {
    this.errorMessage = 'Vendor ID and Password are required';
    alert(this.errorMessage);
    return;
  }

  const payload = {
    vendorId: this.vendorId,
    password: this.password
  };

  const nodeUrl = 'http://localhost:3030/login';

  this.http.post<any>(nodeUrl, payload).subscribe({
    next: (response) => {
      if (response.Status === 'S') {
        localStorage.setItem('vendorId', this.vendorId);
        alert('Login successful!');
        this.router.navigate(['/home']);
      } else {
        this.errorMessage = response.Message || 'Login failed';
        alert(this.errorMessage);
      }
    },
    error: (error) => {
      this.errorMessage = error.error?.Message || 'Server error. Please try again later.';
      alert(this.errorMessage);
      console.error('Login error:', error);
    },
  });
  }}