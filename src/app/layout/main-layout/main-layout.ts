import {
  Component,
  inject
} from '@angular/core';

import {
  Router,
  RouterOutlet
} from '@angular/router';


@Component({
  selector: 'app-main-layout',
  standalone: true,

  imports: [
    RouterOutlet
  ],

  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css']
})
export class MainLayoutComponent {

  private readonly router = inject(Router);


  /* =========================================================
     SIDEBAR STATE
  ========================================================= */

  isSidebarCollapsed = false;

  isMobileSidebarOpen = false;


  /* =========================================================
     USER
  ========================================================= */

  userName = 'Falcon User';

  userRole = 'Administrator';

  userInitials = 'FU';


  /* =========================================================
     SIDEBAR
  ========================================================= */

  toggleSidebar(): void {
    this.isSidebarCollapsed =
      !this.isSidebarCollapsed;
  }


  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen =
      !this.isMobileSidebarOpen;
  }


  closeMobileSidebar(): void {
    this.isMobileSidebarOpen = false;
  }


  /* =========================================================
     NAVIGATION
  ========================================================= */

  navigateToNewInspection(): void {
    this.closeMobileSidebar();

    this.router.navigate([
      '/create-inspection-request'
    ]);
  }


  goToDashboard(): void {
    this.closeMobileSidebar();

    this.router.navigate([
      '/dashboard'
    ]);
  }


  goToHistory(): void {
    this.closeMobileSidebar();

    this.router.navigate([
      '/history'
    ]);
  }


  /*
   * IMPORTANT:
   * Reports remains Reports.
   * It uses the /reports route.
   */

  goToReports(): void {
    this.closeMobileSidebar();

    this.router.navigate([
      '/reports'
    ]);
  }


  goToSettings(): void {
    this.closeMobileSidebar();

    this.router.navigate([
      '/settings'
    ]);
  }


  /* =========================================================
     ACTIVE NAVIGATION
  ========================================================= */

  isActive(route: string): boolean {
    return this.router.url === route ||
      this.router.url.startsWith(route + '/');
  }


  /* =========================================================
     LOGOUT
  ========================================================= */

  logout(): void {
    /*
     * Keep this simple for now.
     * If your existing project already has logout logic,
     * that logic can remain here instead.
     */

    this.router.navigate([
      '/login'
    ]);
  }

}