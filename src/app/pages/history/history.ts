import { CommonModule } from '@angular/common';

import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  Inspection,
  InspectionService
} from '../../services/inspection.service';


@Component({
  selector: 'app-history',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './history.html',

  styleUrl: './history.css'
})
export class History implements OnInit {

  private readonly inspectionService =
    inject(InspectionService);

  private readonly router =
    inject(Router);

  private readonly cdr =
    inject(ChangeDetectorRef);


  /* =========================================================
     DATA
  ========================================================= */

  inspections: Inspection[] = [];

  isLoading = true;

  errorMessage = '';


  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  ngOnInit(): void {

    this.loadInspections();

  }


  /* =========================================================
     LOAD INSPECTIONS
  ========================================================= */

  private loadInspections(): void {

    this.isLoading = true;

    this.errorMessage = '';


    this.inspectionService
      .getInspections()
      .subscribe({

        next: (data) => {

          this.inspections =
            Array.isArray(data)
              ? data
              : [];


          this.isLoading = false;


          /*
           * Force the same immediate UI refresh
           * used by Reports.
           */
          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Failed to load inspection history:',
            error
          );


          this.inspections = [];

          this.errorMessage =
            'Unable to load inspection history. Please try again.';

          this.isLoading = false;


          this.cdr.detectChanges();

        }

      });

  }


  /* =========================================================
     CUSTOMER
  ========================================================= */

  getCustomerName(
    inspection: Inspection
  ): string {

    const firstName =
      inspection.customer?.firstName
      || '';

    const surname =
      inspection.customer?.surname
      || '';


    const fullName =
      `${firstName} ${surname}`.trim();


    return fullName || 'Unknown Customer';

  }


  /* =========================================================
     VEHICLE
  ========================================================= */

  getVehicleRegistration(
    inspection: Inspection
  ): string {

    return (
      inspection.vehicle?.registration
      || '-'
    );

  }


  getVehicleMake(
    inspection: Inspection
  ): string {

    return (
      inspection.vehicle?.make
      || 'Not provided'
    );

  }


  getVehicleModel(
    inspection: Inspection
  ): string {

    return (
      inspection.vehicle?.model
      || 'Not provided'
    );

  }


  getVehicleYear(
    inspection: Inspection
  ): string | number {

    return (
      inspection.vehicle?.year
      || 'Not provided'
    );

  }


  getVehicleColour(
    inspection: Inspection
  ): string {

    return (
      inspection.vehicle?.colour
      || 'Not provided'
    );

  }


  getVehicleMileage(
    inspection: Inspection
  ): string | number {

    return (
      inspection.vehicle?.mileage
      || 'Not provided'
    );

  }


  /* =========================================================
     INSPECTION TYPE
  ========================================================= */

  getInspectionType(
    inspection: Inspection
  ): string {

    return (
      inspection.inspectionType
      || 'Pre-Cover Inspection'
    );

  }


  /* =========================================================
     STATUS
  ========================================================= */

  getStatus(
    inspection: Inspection
  ): string {

    return (
      inspection.status
      || 'Unknown'
    );

  }


  getStatusClass(
    inspection: Inspection
  ): string {

    switch (
      this.getStatus(inspection)
        .toUpperCase()
    ) {

      case 'COMPLETED':

        return 'status-approved';


      case 'PROCESSING':

        return 'status-processing';


      case 'UNDER REVIEW':

      case 'REVIEW':

        return 'status-under-review';


      case 'PENDING':

        return 'status-pending';


      case 'SUBMITTED':

        return 'status-submitted';


      case 'FAILED':

        return 'status-rejected';


      default:

        return 'status-submitted';

    }

  }


  /* =========================================================
     VIEW INSPECTION
     
     IMPORTANT:
     This is deliberately the same pattern as Reports.
     One click -> router.navigate()
  ========================================================= */

  viewInspection(
    inspection: Inspection
  ): void {

    if (!inspection?.id) {

      console.error(
        'Cannot open inspection. Inspection ID is missing:',
        inspection
      );

      return;

    }


    console.log(
      'Opening inspection:',
      inspection.id
    );


    void this.router.navigate([
      '/inspection-details',
      inspection.id
    ]);

  }


  /* =========================================================
     CREATE INSPECTION
  ========================================================= */

  createInspection(): void {

    void this.router.navigateByUrl(
      '/create-inspection-request'
    );

  }


  /* =========================================================
     TRACKING
  ========================================================= */

  trackByInspection(
    index: number,
    inspection: Inspection
  ): string | number {

    return (
      inspection.id
      || index
    );

  }

}