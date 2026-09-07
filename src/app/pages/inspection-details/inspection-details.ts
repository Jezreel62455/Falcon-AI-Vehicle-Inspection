import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  Inspection,
  InspectionService
} from '../../services/inspection.service';


@Component({
  selector: 'app-inspection-details',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl:
    './inspection-details.html',

  styleUrls: [
    './inspection-details.css'
  ]
})
export class InspectionDetails implements OnInit {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly inspectionService =
    inject(InspectionService);

  /*
   * IMPORTANT:
   * Forces Angular to refresh the view after the
   * inspection has been loaded from the API.
   */
  private readonly cdr =
    inject(ChangeDetectorRef);


  inspection:
    Inspection | null =
    null;

  isLoading =
    false;

  errorMessage =
    '';


  /* =========================================================
     INIT
     ========================================================= */

  ngOnInit(): void {

    this.loadInspection();

  }


  /* =========================================================
     LOAD INSPECTION
     ========================================================= */

  loadInspection(): void {

    const routeId =
      this.route.snapshot.paramMap.get('id');

    if (!routeId) {

      this.isLoading = false;

      this.errorMessage =
        'No inspection reference was provided.';

      this.cdr.detectChanges();

      return;
    }


    this.isLoading = true;

    this.errorMessage = '';

    this.inspection = null;

    this.cdr.detectChanges();


    /*
     * First try the database ID endpoint.
     */
    this.inspectionService
      .getInspectionById(routeId)
      .subscribe({

        next: inspection => {

          console.log(
            'INSPECTION DETAILS LOADED BY ID:',
            inspection
          );

          this.setInspection(
            inspection
          );

        },

        error: idError => {

          console.warn(
            'ID lookup failed. Trying reference lookup:',
            idError
          );

          /*
           * History may have passed the inspection
           * reference instead of the database ID.
           */
          this.loadByReference(
            routeId
          );

        }

      });

  }


  /* =========================================================
     LOAD BY REFERENCE
     ========================================================= */

  private loadByReference(
    reference: string
  ): void {

    this.inspectionService
      .getInspectionByReference(reference)
      .subscribe({

        next: inspection => {

          console.log(
            'INSPECTION DETAILS LOADED BY REFERENCE:',
            inspection
          );

          this.setInspection(
            inspection
          );

        },

        error: error => {

          console.error(
            'INSPECTION DETAILS LOOKUP FAILED:',
            error
          );

          this.inspection =
            null;

          this.isLoading =
            false;

          this.errorMessage =
            'Unable to load this inspection.';

          this.cdr.detectChanges();

        }

      });

  }


  /* =========================================================
     SET / NORMALISE INSPECTION
     ========================================================= */

  private setInspection(
    inspection: Inspection
  ): void {

    if (!inspection) {

      this.inspection =
        null;

      this.isLoading =
        false;

      this.errorMessage =
        'Inspection information was not returned.';

      this.cdr.detectChanges();

      return;
    }


    /*
     * IMPORTANT:
     *
     * The backend can return customer / vehicle / policy
     * information in different structures.
     *
     * Always normalize before displaying it.
     */
    this.inspection =
      this.inspectionService
        .normalizeInspection(
          inspection
        );


    console.log(
      'NORMALISED INSPECTION DETAILS:',
      this.inspection
    );


    /*
     * Stop the loading state.
     */
    this.isLoading =
      false;

    this.errorMessage =
      '';


    /*
     * IMPORTANT FIX:
     *
     * Explicitly tell Angular that the API response has
     * arrived and the template must be rendered again.
     */
    this.cdr.detectChanges();

  }


  /* =========================================================
     STATUS
     ========================================================= */

  getStatus(): string {

    return this.formatStatus(
      this.inspection?.status
    );

  }


  getStatusClass(): string {

    const status =
      this.normaliseStatus(
        this.inspection?.status
      );


    switch (status) {

      case 'completed':
        return 'status-completed';

      case 'submitted':
        return 'status-submitted';

      case 'review':
      case 'under-review':
        return 'status-review';

      case 'in-progress':
      case 'inprogress':
        return 'status-progress';

      case 'pending':
        return 'status-pending';

      case 'draft':
        return 'status-draft';

      default:
        return 'status-default';

    }

  }


  private normaliseStatus(
    status:
      string | undefined
  ): string {

    return (
      status ||
      'pending'
    )
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');

  }


  private formatStatus(
    status:
      string | undefined
  ): string {

    const value =
      this.normaliseStatus(
        status
      );


    switch (value) {

      case 'in-progress':
      case 'inprogress':
        return 'In Progress';

      case 'review':
      case 'under-review':
        return 'Under Review';

      case 'submitted':
        return 'Submitted';

      case 'completed':
        return 'Completed';

      case 'pending':
        return 'Pending';

      case 'draft':
        return 'Draft';

      default:

        return value
          .split('-')
          .map(
            word =>
              word.charAt(0).toUpperCase() +
              word.slice(1)
          )
          .join(' ');

    }

  }


  /* =========================================================
     INSPECTION TYPE
     ========================================================= */

  getInspectionType(): string {

    const type =
      this.inspection?.inspectionType ||
      this.inspection?.type ||
      'pre-cover';


    if (type === 'accident') {

      return 'Accident Claim Inspection';

    }


    return 'Pre-Cover Inspection';

  }


  getInspectionTypeLabel(): string {

    return this.getInspectionType();

  }


  isAccidentInspection(): boolean {

    return (
      this.inspection?.inspectionType ===
        'accident' ||

      this.inspection?.type ===
        'accident'
    );

  }


  /* =========================================================
     CUSTOMER
     ========================================================= */

  getCustomerFirstName(): string {

    return (
      this.inspection?.customer?.firstName ||
      this.inspection?.customerFirstName ||
      'Not provided'
    );

  }


  getCustomerSurname(): string {

    return (
      this.inspection?.customer?.surname ||
      this.inspection?.customer?.lastName ||
      this.inspection?.customerSurname ||
      this.inspection?.customerLastName ||
      'Not provided'
    );

  }


  getCustomerPhone(): string {

    return (
      this.inspection?.customer?.phone ||
      this.inspection?.customerPhone ||
      'Not provided'
    );

  }


  getCustomerEmail(): string {

    return (
      this.inspection?.customer?.email ||
      this.inspection?.customerEmail ||
      'Not provided'
    );

  }


  /* =========================================================
     POLICY
     ========================================================= */

  getPolicyNumber(): string {

    return (
      this.inspection?.policy?.policyNumber ||
      this.inspection?.policyNumber ||
      'Not provided'
    );

  }


  getInsuranceCompany(): string {

    return (
      this.inspection?.policy?.insuranceCompany ||
      this.inspection?.insuranceCompany ||
      'Not provided'
    );

  }


  /* =========================================================
     VEHICLE
     ========================================================= */

  getRegistration(): string {

    return (
      this.inspection?.vehicle?.registration ||
      this.inspection?.registration ||
      'Not provided'
    );

  }


  getVehicleName(): string {

    const make =
      this.inspection?.vehicle?.make ||
      this.inspection?.make ||
      '';


    const model =
      this.inspection?.vehicle?.model ||
      this.inspection?.model ||
      '';


    const result =
      `${make} ${model}`.trim();


    return (
      result ||
      'Vehicle not provided'
    );

  }


  getVehicleMake(): string {

    return (
      this.inspection?.vehicle?.make ||
      this.inspection?.make ||
      'Not provided'
    );

  }


  getVehicleModel(): string {

    return (
      this.inspection?.vehicle?.model ||
      this.inspection?.model ||
      'Not provided'
    );

  }


  getVehicleYear(): string {

    const year =
      this.inspection?.vehicle?.year ??
      this.inspection?.year;


    if (
      year !== undefined &&
      year !== null &&
      String(year).trim() !== ''
    ) {

      return String(year);

    }


    return 'Not provided';

  }


  getVehicleColour(): string {

    return (
      this.inspection?.vehicle?.colour ||
      this.inspection?.colour ||
      'Not provided'
    );

  }


  getVehicleMileage(): string {

    const mileage =
      this.inspection?.vehicle?.mileage ??
      this.inspection?.mileage;


    if (
      mileage !== undefined &&
      mileage !== null &&
      String(mileage).trim() !== ''
    ) {

      return String(mileage);

    }


    return 'Not provided';

  }


  getVehicleVin(): string {

    return (
      this.inspection?.vehicle?.vin ||
      this.inspection?.vin ||
      this.inspection?.ai?.vin ||
      'Not provided'
    );

  }


  /* =========================================================
     DATES
     ========================================================= */

  getCreatedDate(): string | null {

    return (
      this.inspection?.createdAt ||
      null
    );

  }


  formatDate(
    value:
      string | null | undefined
  ): string {

    if (!value) {

      return 'Not available';

    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return 'Not available';

    }


    return new Intl.DateTimeFormat(
      'en-ZA',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    ).format(date);

  }


  /* =========================================================
     PHOTOS
     ========================================================= */

  getPhotoCount(): number {

    const vehiclePhotos =
      Array.isArray(
        this.inspection?.photos
      )
        ? this.inspection.photos.length
        : 0;


    const accidentPhotos =
      Array.isArray(
        this.inspection?.accidentPhotos
      )
        ? this.inspection.accidentPhotos.length
        : 0;


    /*
     * Do NOT add damagePhotos separately.
     *
     * normalizeInspection() already maps damagePhotos
     * into accidentPhotos.
     */
    return (
      vehiclePhotos +
      accidentPhotos
    );

  }


  getVehiclePhotos(): any[] {

    return Array.isArray(
      this.inspection?.photos
    )
      ? this.inspection.photos
      : [];

  }


  getAccidentPhotos(): any[] {

    return Array.isArray(
      this.inspection?.accidentPhotos
    )
      ? this.inspection.accidentPhotos
      : [];

  }


  getDamagePhotos(): any[] {

    /*
     * Kept for template compatibility.
     *
     * Do not duplicate photos already normalized into
     * accidentPhotos.
     */
    return [];

  }


  getPhotoUrl(
    photo: any
  ): string {

    if (!photo) {

      return '';

    }


    const path =
      typeof photo === 'string'
        ? photo
        : (
          photo.imageUrl ||
          photo.url ||
          photo.path ||
          photo.fileName ||
          ''
        );


    return this.inspectionService
      .getPhotoUrl(path);

  }


  /* =========================================================
     REFERENCE
     ========================================================= */

  getReference(): string {

    return (
      this.inspection?.reference ||
      this.inspection?.id ||
      'Not available'
    );

  }


  /* =========================================================
     NAVIGATION
     ========================================================= */

  backToHistory(): void {

    this.router.navigate([
      '/history'
    ]);

  }


  goBack(): void {

    this.backToHistory();

  }


  retry(): void {

    this.loadInspection();

  }

}