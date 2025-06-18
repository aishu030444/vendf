import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-financial-sheet',
  template: `
    <router-outlet></router-outlet>
  `,
  styles: [],
  imports:[RouterModule]
})
export class FinancialSheetComponent { }