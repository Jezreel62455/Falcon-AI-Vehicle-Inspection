import { Routes } from '@angular/router';

import { authGuard } from './auth/guards/auth-guard';


export const routes: Routes = [

  /* =========================================================
     DEFAULT
  ========================================================= */

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },


  /* =========================================================
     AUTH
  ========================================================= */

  {
    path: 'login',

    loadComponent: () =>
      import('./auth/login/login')
        .then(m => m.Login)
  },


  /* =========================================================
     CUSTOMER INSPECTION PORTAL
     PUBLIC - NO LOGIN REQUIRED
  ========================================================= */

  {
    path: 'customer',

    children: [

      /* -------------------------------------------------------
         ADMIN GENERATED CUSTOMER LINK

         /customer/start/pre-cover/FAL-123456
         /customer/start/accident/FAL-123456
      ------------------------------------------------------- */

      {
        path: 'start/:type/:reference',

        loadComponent: () =>
          import('./customer/pages/welcome/welcome')
            .then(m => m.Welcome)
      },


      {
        path: 'welcome',

        loadComponent: () =>
          import('./customer/pages/welcome/welcome')
            .then(m => m.Welcome)
      },


      {
        path: 'instructions',

        loadComponent: () =>
          import('./customer/pages/instructions/instructions')
            .then(m => m.Instructions)
      },


      {
        path: 'details',

        loadComponent: () =>
          import('./customer/pages/details/details')
            .then(m => m.Details)
      },


      {
        path: 'vehicle',

        loadComponent: () =>
          import('./customer/pages/vehicle/vehicle')
            .then(m => m.Vehicle)
      },


      {
        path: 'inspection',

        loadComponent: () =>
          import('./customer/pages/inspection/inspection')
            .then(m => m.Inspection)
      },


      {
        path: 'review',

        loadComponent: () =>
          import('./customer/pages/review/review')
            .then(m => m.Review)
      },


      {
        path: 'submitted',

        loadComponent: () =>
          import('./customer/pages/submitted/submitted')
            .then(m => m.Submitted)
      },


      {
        path: 'success',

        loadComponent: () =>
          import('./customer/pages/success/success')
            .then(m => m.Success)
      },


      /* -------------------------------------------------------
         CUSTOMER DEFAULT
      ------------------------------------------------------- */

      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'welcome'
      }

    ]
  },


  /* =========================================================
     ADMIN APPLICATION
     PROTECTED
  ========================================================= */

  {
    path: '',

    canActivate: [
      authGuard
    ],

    loadComponent: () =>
      import('./layout/main-layout/main-layout')
        .then(m => m.MainLayoutComponent),

    children: [

      /* -------------------------------------------------------
         DASHBOARD
      ------------------------------------------------------- */

      {
        path: 'dashboard',

        loadComponent: () =>
          import('./pages/dashboard/dashboard')
            .then(m => m.Dashboard)
      },


      /* -------------------------------------------------------
         CREATE INSPECTION REQUEST
      ------------------------------------------------------- */

      {
        path: 'create-inspection-request',

        loadComponent: () =>
          import('./pages/create-inspection-request/create-inspection-request')
            .then(m => m.CreateInspectionRequestPage)
      },


      /* -------------------------------------------------------
         NEW INSPECTION
      ------------------------------------------------------- */

      {
        path: 'new-inspection',

        loadComponent: () =>
          import('./pages/new-inspection/new-inspection')
            .then(m => m.NewInspection)
      },


      /* -------------------------------------------------------
         HISTORY
      ------------------------------------------------------- */

      {
        path: 'history',

        loadComponent: () =>
          import('./pages/history/history')
            .then(m => m.History)
      },


      /* -------------------------------------------------------
         INSPECTION DETAILS
      ------------------------------------------------------- */

      {
        path: 'inspection-details/:id',

        loadComponent: () =>
          import('./pages/inspection-details/inspection-details')
            .then(m => m.InspectionDetails)
      },


      /* -------------------------------------------------------
         REPORTS
      ------------------------------------------------------- */

      {
        path: 'reports',

        loadComponent: () =>
          import('./pages/reports/reports')
            .then(m => m.Reports)
      },


      /* -------------------------------------------------------
         SETTINGS
      ------------------------------------------------------- */

      {
        path: 'settings',

        loadComponent: () =>
          import('./pages/settings/settings')
            .then(m => m.Settings)
      },


      /* -------------------------------------------------------
         ADMIN DEFAULT
      ------------------------------------------------------- */

      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }

    ]
  },


  /* =========================================================
     FALLBACK
  ========================================================= */

  {
    path: '**',
    redirectTo: 'login'
  }

];