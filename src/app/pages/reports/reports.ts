import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { InspectionService } from '../../services/inspection.service';

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

  inspections: any[] = [];

  filteredInspections: any[] = [];

  searchTerm = '';

  selectedStatus = 'all';

  selectedType = 'all';

  isLoading = true;

  errorMessage = '';

  totalInspections = 0;

  submittedInspections = 0;

  preCoverInspections = 0;

  accidentInspections = 0;

  ngOnInit(): void {

    this.loadInspections();

  }

  private loadInspections(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.inspectionService
      .getInspections()
      .subscribe({

        next: (data: any[] | null | undefined) => {

          this.inspections = Array.isArray(data)
            ? data
            : [];

          this.calculateStatistics();

          this.applyFilters();

          this.isLoading = false;

        },

        error: (error: unknown) => {

          console.error(
            'Failed to load reports:',
            error
          );

          this.inspections = [];

          this.filteredInspections = [];

          this.errorMessage =
            'Failed to load reports.';

          this.isLoading = false;

        }

      });

  }

  private calculateStatistics(): void {

    this.totalInspections =
      this.inspections.length;

    this.submittedInspections =
      this.inspections.filter(
        inspection =>
          this.getStatus(inspection)
            .toLowerCase() === 'submitted'
      ).length;

    this.preCoverInspections =
      this.inspections.filter(
        inspection =>
          this.getInspectionType(inspection)
            .toLowerCase()
            .includes('pre')
      ).length;

    this.accidentInspections =
      this.inspections.filter(
        inspection => {

          const type =
            this.getInspectionType(inspection)
              .toLowerCase();

          return (
            type.includes('accident') ||
            type.includes('claim')
          );

        }
      ).length;

  }

  applyFilters(): void {

    const search =
      this.searchTerm
        .toLowerCase()
        .trim();

    this.filteredInspections =
      this.inspections.filter(

        inspection => {

          const customerName =
            this.getCustomerName(inspection)
              .toLowerCase();

          const registration =
            this.getVehicleRegistration(inspection)
              .toLowerCase();

          const type =
            this.getInspectionType(inspection)
              .toLowerCase();

          const status =
            this.getStatus(inspection)
              .toLowerCase();

          const matchesSearch =
            !search ||
            customerName.includes(search) ||
            registration.includes(search) ||
            type.includes(search) ||
            status.includes(search);

          const matchesStatus =
            this.selectedStatus === 'all' ||
            status ===
              this.selectedStatus.toLowerCase();

          const matchesType =
            this.selectedType === 'all' ||
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
    inspection: any
  ): void {

    const id =
      inspection?.id;

    if (
      id === undefined ||
      id === null ||
      id === ''
    ) {

      console.error(
        'Cannot open inspection because the inspection ID is missing.',
        inspection
      );

      return;

    }

    this.router.navigate([
      '/inspection-details',
      id
    ]);

  }

  getCustomerName(
    inspection: any
  ): string {

    const customer =
      inspection?.customer;

    if (!customer) {

      return 'Unknown Customer';

    }

    return (

      `${customer.firstName || ''} ` +
      `${customer.surname || ''}`

    ).trim() || 'Unknown Customer';

  }

  getVehicleRegistration(
    inspection: any
  ): string {

    return (
      inspection?.vehicle?.registration
      || 'N/A'
    );

  }

  getInspectionType(
    inspection: any
  ): string {

    return (
      inspection?.inspectionType
      || inspection?.type
      || 'N/A'
    );

  }

  getStatus(
    inspection: any
  ): string {

    return (
      inspection?.status
      || 'Unknown'
    );

  }

  getStatusClass(
    inspection: any
  ): string {

    return this
      .getStatus(inspection)
      .toLowerCase()
      .replace(/\s+/g, '-');

  }

  trackByInspection(
    index: number,
    inspection: any
  ): string | number {

    return (
      inspection?.id
      || index
    );

  }

}