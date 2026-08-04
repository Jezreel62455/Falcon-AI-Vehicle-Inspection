import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  Inspection,
  InspectionService
} from '../../services/inspection.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit {

  private readonly inspectionService =
    inject(InspectionService);

  private readonly router =
    inject(Router);

  inspections: Inspection[] = [];

  filteredInspections: Inspection[] = [];

  isLoading = true;

  errorMessage = '';

  searchTerm = '';

  selectedStatus = 'all';

  selectedType = 'all';

  /* ===================================================
     DASHBOARD STATISTICS
  =================================================== */

  totalInspections = 0;

  submittedInspections = 0;

  completedInspections = 0;

  underReviewInspections = 0;

  preCoverInspections = 0;

  accidentInspections = 0;

  averageMileage = 0;

  averageVehicleAge = 0;

  mostCommonColour = '-';

  averageAiConfidence = 96;

  averageDamageSeverity = 0;

  estimatedRepairExposure = 0;

  highestRiskVehicle = '-';

  ngOnInit(): void {

    this.loadInspections();

  }

  private loadInspections(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.inspectionService
      .getInspections()
      .subscribe({

        next: inspections => {

          this.inspections = inspections;

          this.calculateStatistics();

          this.applyFilters();

          this.isLoading = false;

        },

        error: error => {

          console.error(
            'Failed to load reports',
            error
          );

          this.inspections = [];

          this.filteredInspections = [];

          this.errorMessage =
            'Unable to load inspection reports.';

          this.isLoading = false;

        }

      });

  }

  private calculateStatistics(): void {

    this.totalInspections =
      this.inspections.length;

    this.submittedInspections =
      this.inspections.filter(x =>
        this.getStatus(x)
          .toUpperCase() === 'SUBMITTED'
      ).length;

    this.completedInspections =
      this.inspections.filter(x =>
        this.getStatus(x)
          .toUpperCase() === 'COMPLETED'
      ).length;

    this.underReviewInspections =
      this.inspections.filter(x =>
        this.getStatus(x)
          .toUpperCase().includes('REVIEW')
      ).length;

    this.preCoverInspections =
      this.inspections.filter(x =>
        this.getInspectionType(x)
          .toLowerCase()
          .includes('pre')
      ).length;

    this.accidentInspections =
      this.inspections.filter(x =>
        this.getInspectionType(x)
          .toLowerCase()
          .includes('accident')
      ).length;
          /* ==============================================
       Average Mileage
    ============================================== */

    const mileageValues =
      this.inspections
        .map(x => Number(x.vehicle?.mileage) || 0)
        .filter(x => x > 0);

    this.averageMileage =
      mileageValues.length > 0
        ? Math.round(
            mileageValues.reduce(
              (a, b) => a + b,
              0
            ) / mileageValues.length
          )
        : 0;


    /* ==============================================
       Average Vehicle Age
    ============================================== */

    const currentYear =
      new Date().getFullYear();

    const ages =
      this.inspections
        .map(x => {

          const year =
            Number(x.vehicle?.year);

          return year > 1900
            ? currentYear - year
            : 0;

        })
        .filter(x => x > 0);

    this.averageVehicleAge =
      ages.length > 0
        ? Math.round(
            ages.reduce(
              (a, b) => a + b,
              0
            ) / ages.length
          )
        : 0;


    /* ==============================================
       Most Common Vehicle Colour
    ============================================== */

    const colourCount:
      Record<string, number> = {};

    this.inspections.forEach(x => {

      const colour =
        (x.vehicle?.colour || '')
          .trim();

      if (!colour) {

        return;

      }

      colourCount[colour] =
        (colourCount[colour] || 0) + 1;

    });

    const colours =
      Object.entries(colourCount);

    this.mostCommonColour =
      colours.length
        ? colours.sort(
            (a, b) => b[1] - a[1]
          )[0][0]
        : '-';


    /* ==============================================
       Demo AI Statistics
       (Will come from AWS later)
    ============================================== */

    this.averageAiConfidence = 96;

    this.averageDamageSeverity =
      this.accidentInspections > 0
        ? 18
        : 0;

    this.estimatedRepairExposure =
      this.accidentInspections * 14500;

    this.highestRiskVehicle =
      this.inspections.length
        ? this.getVehicleRegistration(
            this.inspections[0]
          )
        : '-';

  }

  applyFilters(): void {

    const search =
      this.searchTerm
        .trim()
        .toLowerCase();

    this.filteredInspections =
      this.inspections.filter(
        inspection => {

          const customer =
            this.getCustomerName(
              inspection
            ).toLowerCase();

          const registration =
            this.getVehicleRegistration(
              inspection
            ).toLowerCase();

          const type =
            this.getInspectionType(
              inspection
            ).toLowerCase();

          const status =
            this.getStatus(
              inspection
            ).toLowerCase();

          const matchesSearch =

            search === ''

            ||

            customer.includes(search)

            ||

            registration.includes(search)

            ||

            type.includes(search)

            ||

            status.includes(search);

          const matchesStatus =

            this.selectedStatus === 'all'

            ||

            status ===
            this.selectedStatus.toLowerCase();

          const matchesType =

            this.selectedType === 'all'

            ||

            type.includes(
              this.selectedType.toLowerCase()
            );

          return (

            matchesSearch &&

            matchesStatus &&

            matchesType

          );

        }

      );

  }
    viewInspection(
    inspection: Inspection
  ): void {

    if (!inspection.id) {

      console.error(
        'Inspection ID missing.',
        inspection
      );

      return;

    }

    void this.router.navigate([
      '/inspection-details',
      inspection.id
    ]);

  }

  getCustomerName(
    inspection: Inspection
  ): string {

    const first =
      inspection.customer.firstName ?? '';

    const surname =
      inspection.customer.surname ?? '';

    const fullName =
      `${first} ${surname}`.trim();

    return fullName || 'Unknown Customer';

  }

  getVehicleRegistration(
    inspection: Inspection
  ): string {

    return (
      inspection.vehicle.registration ||
      '-'
    );

  }

  getInspectionType(
    inspection: Inspection
  ): string {

    return (
      inspection.inspectionType ||
      'Pre-Cover Inspection'
    );

  }

  getStatus(
    inspection: Inspection
  ): string {

    return (
      inspection.status ||
      'Unknown'
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

  getPreCoverPercentage(): number {

    if (this.totalInspections === 0) {

      return 0;

    }

    return Math.round(
      (this.preCoverInspections /
        this.totalInspections) * 100
    );

  }

  getAccidentPercentage(): number {

    if (this.totalInspections === 0) {

      return 0;

    }

    return Math.round(
      (this.accidentInspections /
        this.totalInspections) * 100
    );

  }

  trackByInspection(
    index: number,
    inspection: Inspection
  ): string | number {

    return inspection.id;

  }

}