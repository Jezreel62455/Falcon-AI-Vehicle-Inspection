import {
  CommonModule,
} from '@angular/common';

import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';

import {
  Router,
} from '@angular/router';

import {
  Inspection,
  InspectionService,
} from '../../services/inspection.service';


@Component({
  selector: 'app-history',

  standalone: true,

  imports: [
    CommonModule,
  ],

  templateUrl: './history.html',

  styleUrls: [
    './history.css',
  ],
})
export class History
  implements OnInit {

  private readonly inspectionService =
    inject(InspectionService);

  private readonly router =
    inject(Router);

  private readonly cdr =
    inject(ChangeDetectorRef);


  inspections: Inspection[] = [];

  isLoading = true;

  errorMessage = '';

  deletingInspectionId: string | null = null;


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  ngOnInit(): void {

    this.loadInspections();

  }


  // =========================================================
  // LOAD INSPECTIONS
  // =========================================================

  private loadInspections(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.inspectionService
      .getInspections()
      .subscribe({

        next: (
          inspections
        ) => {

          this.inspections =
            inspections ?? [];

          this.isLoading = false;

          this.cdr.detectChanges();

        },

        error: (
          error
        ) => {

          console.error(
            'Failed to load inspections:',
            error
          );

          this.isLoading = false;

          this.errorMessage =
            'Failed to load inspection history. Please try again.';

          this.cdr.detectChanges();

        },

      });

  }


  // =========================================================
  // CUSTOMER
  // =========================================================

  getCustomerName(
    inspection: Inspection
  ): string {

    const data =
      inspection as any;

    const firstName =
      data?.customerFirstName ??
      data?.customer?.firstName ??
      '';

    const lastName =
      data?.customerLastName ??
      data?.customer?.lastName ??
      '';

    const fullName =
      `${firstName} ${lastName}`.trim();

    return (
      fullName ||
      data?.customer?.name ||
      'Customer not provided'
    );

  }


  // =========================================================
  // VEHICLE
  // =========================================================

  getVehicleRegistration(
    inspection: Inspection
  ): string {

    const data =
      inspection as any;

    return (
      data?.vehicleRegistration ??
      data?.vehicle?.registration ??
      data?.vehicle?.registrationNumber ??
      'Not provided'
    );

  }


  getVehicleMake(
    inspection: Inspection
  ): string {

    const data =
      inspection as any;

    return (
      data?.vehicleMake ??
      data?.vehicle?.make ??
      'Not provided'
    );

  }


  getVehicleModel(
    inspection: Inspection
  ): string {

    const data =
      inspection as any;

    return (
      data?.vehicleModel ??
      data?.vehicle?.model ??
      'Not provided'
    );

  }


  getVehicleYear(
    inspection: Inspection
  ): string {

    const data =
      inspection as any;

    const year =
      data?.vehicleYear ??
      data?.vehicle?.year;

    if (
      year === null ||
      year === undefined ||
      year === ''
    ) {

      return 'Not provided';

    }

    return String(year);

  }


  getVehicleColour(
    inspection: Inspection
  ): string {

    const data =
      inspection as any;

    return (
      data?.vehicleColour ??
      data?.vehicle?.colour ??
      data?.vehicle?.color ??
      'Not provided'
    );

  }


  getVehicleMileage(
    inspection: Inspection
  ): string {

    const data =
      inspection as any;

    const mileage =
      data?.vehicleMileage ??
      data?.vehicle?.mileage;

    if (
      mileage === null ||
      mileage === undefined ||
      mileage === ''
    ) {

      return 'Not provided';

    }

    return String(mileage);

  }


  // =========================================================
  // INSPECTION TYPE
  // =========================================================

  getInspectionType(
    inspection: Inspection
  ): string {

    const data =
      inspection as any;

    const type =
      data?.inspectionType;

    if (
      type === 'accident' ||
      type === 'accident-claim' ||
      type === 'accident_claim'
    ) {

      return 'Accident Claim Inspection';

    }

    if (
      type === 'pre-cover' ||
      type === 'pre_cover'
    ) {

      return 'Pre-Cover Inspection';

    }

    return (
      type ||
      'Inspection'
    );

  }


  // =========================================================
  // STATUS
  // =========================================================

  getStatus(
    inspection: Inspection
  ): string {

    const data =
      inspection as any;

    const status =
      data?.status;

    if (!status) {

      return 'Pending';

    }

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1)
    );

  }


  getStatusClass(
    inspection: Inspection
  ): string {

    const data =
      inspection as any;

    const status =
      (
        data?.status ??
        ''
      ).toLowerCase();

    switch (status) {

      case 'completed':
        return 'status-completed';

      case 'submitted':
        return 'status-submitted';

      case 'in-progress':
      case 'in_progress':
        return 'status-in-progress';

      case 'processing':
        return 'status-processing';

      case 'failed':
        return 'status-failed';

      case 'pending':
      default:
        return 'status-pending';

    }

  }


  // =========================================================
  // VIEW DETAILS
  // =========================================================
  //
  // KEEP THIS EXACTLY AS A NORMAL SINGLE CLICK.
  //
  // No:
  // - setTimeout
  // - double-click handling
  // - extra subscriptions
  // - reload
  // - artificial delays
  //
  // =========================================================

  viewInspection(
    inspection: Inspection
  ): void {

    if (!inspection?.id) {

      console.error(
        'Cannot view inspection: missing inspection ID',
        inspection
      );

      return;

    }

    console.log(
      'Opening inspection:',
      inspection.id
    );

    this.router.navigate([
      '/inspection-details',
      inspection.id,
    ]);

  }


  // =========================================================
  // DELETE INSPECTION
  // =========================================================

  deleteInspection(
    inspection: Inspection
  ): void {

    if (!inspection?.id) {

      console.error(
        'Cannot delete inspection: missing inspection ID',
        inspection
      );

      return;

    }

    /*
     * Prevent multiple delete requests from being
     * triggered while one deletion is already running.
     */
    if (
      this.deletingInspectionId !== null
    ) {

      return;

    }

    const customerName =
      this.getCustomerName(
        inspection
      );

    const data =
      inspection as any;

    const reference =
      data?.reference ??
      inspection.id;


    const confirmed =
      window.confirm(
        `Are you sure you want to delete this inspection?\n\n` +
        `Customer: ${customerName}\n` +
        `Reference: ${reference}\n\n` +
        `This action cannot be undone.`
      );


    if (!confirmed) {

      return;

    }


    this.deletingInspectionId =
      inspection.id;

    this.cdr.detectChanges();


    this.inspectionService
      .deleteInspection(
        inspection.id
      )
      .subscribe({

        next: () => {

          console.log(
            'Inspection deleted successfully:',
            inspection.id
          );


          /*
           * Remove only the deleted inspection from
           * the existing History list.
           *
           * We do NOT reload the page.
           * We do NOT navigate.
           * We do NOT touch View Details.
           */
          this.inspections =
            this.inspections.filter(
              item =>
                item.id !==
                inspection.id
            );


          this.deletingInspectionId =
            null;

          this.cdr.detectChanges();

        },


        error: (
          error
        ) => {

          console.error(
            'Failed to delete inspection:',
            error
          );


          this.deletingInspectionId =
            null;

          this.errorMessage =
            'Failed to delete the inspection. Please try again.';

          this.cdr.detectChanges();

        },

      });

  }


  // =========================================================
  // CREATE INSPECTION
  // =========================================================

  createInspection(): void {

    this.router.navigate([
      '/create-inspection-request',
    ]);

  }


  // =========================================================
  // TRACK BY
  // =========================================================

  trackByInspection(
    index: number,
    inspection: Inspection
  ): string | number {

    return (
      inspection.id ??
      index
    );

  }

}