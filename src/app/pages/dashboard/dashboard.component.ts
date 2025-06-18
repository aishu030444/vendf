import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router } from 'express';

@Component({
  selector: 'app-dashboard',
  template: `
    <router-outlet></router-outlet>
  `,
  styles: [],
imports:[RouterOutlet]
})
export class DashboardComponent { }