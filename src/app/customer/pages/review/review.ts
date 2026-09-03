import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { CustomerInspectionService } from '../../services/customer-inspection';
import { InspectionService } from '../../../services/inspection.service';


@Component({
  selector: 'app-review',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './review.html',
  styleUrl: './review.css'
})
export class Review {

  private readonly router =
    inject(Router);


  private readonly http =
    inject(HttpClient);


  private readonly inspectionService =
    inject(CustomerInspectionService);


  /*
   * Use the central Falcon API configuration.
   *
   * This means local development, LAN testing and
   * AWS production all use the same configuration.
   */
  private readonly apiService =
    inject(InspectionService);


  inspection =
    this.inspectionService.getInspection();


  isSubmitting =
    false;


  submitError =
    '';


  /* =======================================================
     INSPECTION TYPE
     ======================================================= */

  getInspectionType(): string {

    if (
      this.inspection.inspectionType === 'accident'
    ) {

      return 'Accident Claim Inspection';

    }


    return 'Pre-Cover Inspection';

  }


  /* =======================================================
     SUBMIT INSPECTION
     ======================================================= */

  submitInspection(): void {

    /*
     * Prevent double submission.
     *
     * This is important because the customer must only
     * be able to submit the inspection once at a time.
     */

    if (this.isSubmitting) {

      return;

    }


    this.isSubmitting =
      true;


    this.submitError =
      '';


    /*
     * Always get the latest inspection data.
     *
     * This ensures the review page does not submit an
     * older snapshot of the customer/vehicle/photos.
     */

    const inspection =
      this.inspectionService.getInspection();


    console.log(
      '======================================'
    );


    console.log(
      'SUBMITTING CUSTOMER INSPECTION'
    );


    console.log(
      'REFERENCE:',
      inspection.reference
    );


    console.log(
      'INSPECTION DATA:',
      inspection
    );


    console.log(
      '======================================'
    );


    /*
     * The reference MUST come from the backend-created
     * inspection request.
     *
     * The customer flow must never invent a reference.
     */

    if (!inspection.reference) {

      this.isSubmitting =
        false;


      this.submitError =
        'This inspection does not have a valid reference. Please restart the inspection.';


      return;

    }


    /*
     * Get the configured backend URL.
     *
     * Example local:
     *
     * http://localhost:3000/inspections
     *
     * Example AWS:
     *
     * https://your-api-url.amazonaws.com/inspections
     */

    const apiUrl =
      this.apiService.getApiBaseUrl();


    /*
     * Submit using the backend-generated reference.
     */

    const submitUrl =
      `${apiUrl}/reference/${encodeURIComponent(
        inspection.reference
      )}/submit`;


    const payload = {

      inspectionType:
        inspection.inspectionType,

      customer:
        inspection.customer,

      vehicle:
        inspection.vehicle,

      photos:
        inspection.photos,

      accidentPhotos:
        inspection.accidentPhotos

    };


    console.log(
      'SUBMIT URL:',
      submitUrl
    );


    console.log(
      'SUBMIT PAYLOAD:',
      payload
    );


    this.http
      .patch(
        submitUrl,
        payload
      )
      .subscribe({

        next: (response: any) => {

          console.log(
            '======================================'
          );


          console.log(
            'CUSTOMER INSPECTION SUBMITTED'
          );


          console.log(
            'BACKEND RESPONSE:',
            response
          );


          console.log(
            '======================================'
          );


          /*
           * Update the local inspection status so the
           * customer application knows that submission
           * completed successfully.
           */

          this.inspectionService.setStatus(
            'submitted'
          );


          this.isSubmitting =
            false;


          /*
           * Only navigate after the backend confirms
           * successful submission.
           */

          this.router.navigate([
            '/customer/success'
          ]);

        },


        error: (error: any) => {

          console.error(
            '======================================'
          );


          console.error(
            'CUSTOMER INSPECTION SUBMISSION FAILED'
          );


          console.error(
            'ERROR:',
            error
          );


          console.error(
            '======================================'
          );


          this.isSubmitting =
            false;


          this.submitError =
            error?.error?.message ??
            'Unable to submit your inspection. Please try again.';

        }

      });

  }


  /* =======================================================
     BACK
     ======================================================= */

  back(): void {

    /*
     * Do not allow the customer to navigate away while
     * the submission request is still being processed.
     */

    if (this.isSubmitting) {

      return;

    }


    this.router.navigate([
      '/customer/vehicle'
    ]);

  }

}