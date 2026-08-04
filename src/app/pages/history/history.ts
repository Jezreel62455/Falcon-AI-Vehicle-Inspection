import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  Router,
  RouterLink,
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
    RouterLink,
  ],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class History implements OnInit {

  private readonly inspectionService =
    inject(InspectionService);

  private readonly router =
    inject(Router);

  inspections = signal<Inspection[]>([]);

  isLoading = true;

  errorMessage = '';

  searchTerm = '';

  selectedStatus = 'ALL';

  readonly filteredInspections = computed(() => {

    const search =
      this.searchTerm
        .trim()
        .toLowerCase();

    return this.inspections().filter(inspection => {

      const matchesStatus =
        this.selectedStatus === 'ALL'
          || inspection.status === this.selectedStatus;

      if (!matchesStatus) {
        return false;
      }

      if (!search) {
        return true;
      }

      const values = [

        inspection.id,

        inspection.vehicle?.registration,

        inspection.vehicle?.make,

        inspection.vehicle?.model,

        inspection.vehicle?.year,

        inspection.vehicle?.colour,

        inspection.customer?.firstName,

        inspection.customer?.surname,

        inspection.policy?.policyNumber,

        inspection.policy?.insuranceCompany,

        inspection.inspectionType,

        inspection.status,

      ];

      return values
        .filter(value => value !== undefined && value !== null)
        .some(value =>
          String(value)
            .toLowerCase()
            .includes(search),
        );

    });

  });

  readonly submittedCount = computed(() =>
    this.inspections()
      .filter(x => x.status === 'SUBMITTED')
      .length,
  );

  readonly completedCount = computed(() =>
    this.inspections()
      .filter(x => x.status === 'COMPLETED')
      .length,
  );

  readonly preCoverCount = computed(() =>
    this.inspections()
      .filter(x =>
        (x.inspectionType ?? '')
          .toLowerCase()
          .includes('pre'),
      )
      .length,
  );

  readonly accidentCount = computed(() =>
    this.inspections()
      .filter(x =>
        (x.inspectionType ?? '')
          .toLowerCase()
          .includes('accident'),
      )
      .length,
  );

  ngOnInit(): void {

    this.loadInspections();

  }

  refresh(): void {

    this.loadInspections();

  }

  onSearch(value: string): void {

    this.searchTerm = value;

  }

  onStatusChange(value: string): void {

    this.selectedStatus = value;

  }

  trackInspection(
    index: number,
    inspection: Inspection,
  ): string | number {

    return inspection.id;

  }

  viewInspection(
    inspection: Inspection,
  ): void {

    if (!inspection.id) {

      console.error(
        'Inspection ID missing.',
        inspection,
      );

      return;

    }

    void this.router.navigate([
      '/inspection-details',
      inspection.id,
    ]);

  }

  getCustomerName(
    inspection: Inspection,
  ): string {

    const first =
      inspection.customer?.firstName ?? '';

    const surname =
      inspection.customer?.surname ?? '';

    const fullName =
      `${first} ${surname}`.trim();

    return fullName || 'Customer not supplied';

  }

  getVehicleTitle(
    inspection: Inspection,
  ): string {

    const make =
      inspection.vehicle?.make ?? '';

    const model =
      inspection.vehicle?.model ?? '';

    const title =
      `${make} ${model}`.trim();

    return title || 'Vehicle Inspection';

  }

  getRegistration(
    inspection: Inspection,
  ): string {

    return (
      inspection.vehicle?.registration
      || 'Registration pending'
    );

  }

  getPolicyNumber(
    inspection: Inspection,
  ): string {

    return (
      inspection.policy?.policyNumber
      || 'No policy number'
    );

  }

  getInsuranceCompany(
    inspection: Inspection,
  ): string {

    return (
      inspection.policy?.insuranceCompany
      || 'Insurance company not supplied'
    );

  }

  getInspectionType(
    inspection: Inspection,
  ): string {

    return (
      inspection.inspectionType
      || 'Pre-Cover Inspection'
    );

  }

  getStatusClass(
    status: string,
  ): string {

    switch ((status ?? '').toUpperCase()) {

      case 'COMPLETED':
        return 'status-completed';

      case 'PROCESSING':
        return 'status-processing';

      case 'PENDING':
        return 'status-pending';

      case 'SUBMITTED':
        return 'status-submitted';

      case 'FAILED':
        return 'status-failed';

      default:
        return 'status-default';

    }

  }

  formatDate(
    value: string | Date,
  ): string {

    if (!value) {

      return '-';

    }

    return new Date(value)
      .toLocaleString();

  }

  private loadInspections(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.inspectionService
      .getInspections()
      .subscribe({

       next: inspections => {

  this.inspections.set(
    Array.isArray(inspections)
      ? inspections
      : [],
  );

  this.isLoading = false;

},

        error: error => {

          console.error(
            error,
          );

          this.errorMessage =
            'Unable to load inspection history.';

          this.inspections.set([]);

          this.isLoading = false;

        },

      });

  }

}