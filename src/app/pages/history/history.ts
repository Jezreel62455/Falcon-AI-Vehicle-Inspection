import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { InspectionService } from '../../services/inspection.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './history.html',
  styleUrl: './history.css'
})
export class History implements OnInit {

  private readonly inspectionService =
    inject(InspectionService);

  private readonly router =
    inject(Router);

  inspections: any[] = [];

  isLoading = true;

  errorMessage = '';

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

          this.isLoading = false;
        },

        error: (error: unknown) => {

          console.error(
            'Failed to load inspections:',
            error
          );

          this.inspections = [];

          this.errorMessage =
            'Unable to load inspection history. Please try again.';

          this.isLoading = false;
        }

      });

  }

  viewInspection(
    inspection: any
  ): void {

    const id = inspection?.id;

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

}