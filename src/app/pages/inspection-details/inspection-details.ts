import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject
} from '@angular/core';
import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { InspectionService } from '../../services/inspection.service';

@Component({
  selector: 'app-inspection-details',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './inspection-details.html',
  styleUrl: './inspection-details.css'
})
export class InspectionDetails implements OnInit {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly inspectionService =
    inject(InspectionService);

  inspection: any = null;

  isLoading = true;

  errorMessage = '';

  ngOnInit(): void {

    this.route.paramMap.subscribe({

      next: (params) => {

        const id =
          params.get('id');

        if (!id) {

          this.inspection = null;

          this.errorMessage =
            'Inspection ID not found.';

          this.isLoading = false;

          return;
        }

        this.loadInspection(id);

      },

      error: (error) => {

        console.error(
          'Failed to read inspection route:',
          error
        );

        this.inspection = null;

        this.errorMessage =
          'Unable to open inspection.';

        this.isLoading = false;

      }

    });

  }

  private loadInspection(
    id: string
  ): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.inspection = null;

    this.inspectionService
      .getInspectionById(id)
      .subscribe({

        next: (inspection) => {

          this.inspection = inspection;

          this.isLoading = false;

        },

        error: (error) => {

          console.error(
            'Failed to load inspection details:',
            error
          );

          this.inspection = null;

          this.errorMessage =
            'Failed to load inspection details.';

          this.isLoading = false;

        }

      });

  }

  goBack(): void {

    this.router.navigate([
      '/history'
    ]);

  }

}