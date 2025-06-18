import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { HomeDashboardComponent } from './pages/home/home-dashboard/home-dashboard.component';
import { EmptyRouteComponent } from './pages/empty-route/empty-route.component';

// Dashboard components
import { DashboardInquiryComponent } from './pages/dashboard/dashboard-inquiry/dashboard-inquiry.component';//quotation
import { DashboardSaleOrderComponent } from './pages/dashboard/dashboard-sale-order/dashboard-sale-order.component';
import { DashboardDeliveryComponent } from './pages/dashboard/dashboard-delivery/dashboard-delivery.component';

// Financial components
import { FinancialInvoiceComponent } from './pages/financial-sheet/financial-invoice/financial-invoice.component';
import { FinancialAgingComponent } from './pages/financial-sheet/financial-aging/financial-aging.component';
import { FinancialMemoComponent } from './pages/financial-sheet/financial-memo/financial-memo.component';
import { FinancialOverallComponent } from './pages/financial-sheet/financial-overall/financial-overall.component';
import { CreditmemoComponent } from './pages/financial-sheet/financial-memo/creditmemo/creditmemo.component';
import { DebitmemoComponent } from './pages/financial-sheet/financial-memo/debitmemo/debitmemo.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent,
    children: [
      {
        path: '',
        component: HomeDashboardComponent, // Show dashboard on /home
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        children: [
          { 
            path: '', 
            component: HomeDashboardComponent, // Show dashboard on /home/dashboard
            pathMatch: 'full' 
          },
          { path: 'inquiry', component: DashboardInquiryComponent },
          { path: 'sales-order', component: DashboardSaleOrderComponent },
          { path: 'delivery', component: DashboardDeliveryComponent }
        ]
      },
      {
  path: 'financial',
  children: [
    { path: 'invoice', component: FinancialInvoiceComponent },
    { path: 'aging', component: FinancialAgingComponent },
    { 
      path: 'memo', 
      component: FinancialMemoComponent,
      children: [
        { path: 'creditmemo', component: CreditmemoComponent },
        { path: 'debitmemo', component: DebitmemoComponent },
        { path: '', redirectTo: 'creditmemo', pathMatch: 'full' }
      ]
    },
    { path: 'overall', component: FinancialOverallComponent }
  ]
},
      {
        path: 'profile',
        component: ProfileComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
