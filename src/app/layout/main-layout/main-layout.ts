import { CommonModule } from '@angular/common';

import {
  Component,
  inject
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';


@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayoutComponent {


  private readonly router =
    inject(Router);


  isSidebarCollapsed = false;

  isMobileSidebarOpen = false;



  toggleSidebar(): void {

    this.isSidebarCollapsed =
      !this.isSidebarCollapsed;

  }



  toggleMobileSidebar(): void {

    this.isMobileSidebarOpen =
      !this.isMobileSidebarOpen;

  }



  closeMobileSidebar(): void {

    this.isMobileSidebarOpen =
      false;

  }



  navigateToNewInspection(): void {

    this.closeMobileSidebar();

    this.router.navigate([
      '/create-inspection-request'
    ]);

  }



  goToDashboard(): void {

    this.closeMobileSidebar();

    this.router.navigateByUrl('/');

  }


}