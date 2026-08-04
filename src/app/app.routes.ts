import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'create-inspection-request',
        loadComponent: () =>
        import('./pages/create-inspection-request/create-inspection-request').then(
        (m) => m.CreateInspectionRequest
   ),
      },
      {
        path: 'new-inspection',
        loadComponent: () =>
          import('./pages/new-inspection/new-inspection').then(
            (m) => m.NewInspection
          ),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./pages/history/history').then((m) => m.History),
      },
      {
        path: 'inspection-details/:id',
        loadComponent: () =>
        import('./pages/inspection-details/inspection-details').then(
        (m) => m.InspectionDetails
       ),
      },
            {
        path: 'reports',
        loadComponent: () =>
        import('./pages/reports/reports').then(
        (m) => m.Reports
       ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings').then((m) => m.Settings),
      },
    ],
  },
];