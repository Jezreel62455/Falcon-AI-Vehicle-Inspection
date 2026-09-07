import {
  Component,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  finalize
} from 'rxjs';

import {
  InspectionService,
  InspectionType,
  CreateInspectionRequestPayload
} from '../../services/inspection.service';


@Component({
  selector: 'app-create-inspection-request',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule
  ],

  templateUrl:
    './create-inspection-request.html',

  styleUrls: [
    './create-inspection-request.css'
  ]
})
export class CreateInspectionRequestPage {

  private readonly fb =
    inject(FormBuilder);

  private readonly router =
    inject(Router);

  private readonly inspectionService =
    inject(InspectionService);

  /*
   * IMPORTANT
   *
   * Angular 21 can use newer change-detection behaviour.
   *
   * Explicitly requesting a view refresh after the HTTP
   * response prevents the "created but only appears after
   * clicking something else" behaviour.
   */
  private readonly changeDetector =
    inject(ChangeDetectorRef);


  // =========================================================
  // STATE
  // =========================================================

  inspectionType:
    InspectionType =
    'pre-cover';

  isSubmitting =
    false;

  requestCreated =
    false;

  generatedReference =
    '';

  customerLink =
    '';

  errorMessage =
    '';

  copied =
    false;


  // =========================================================
  // FORM
  // =========================================================

  requestForm =
    this.fb.nonNullable.group({

      firstName: [
        ''
      ],

      surname: [
        ''
      ],

      email: [
        ''
      ],

      phone: [
        ''
      ],

      policyNumber: [
        ''
      ],

      insuranceCompany: [
        ''
      ]

    });


  // =========================================================
  // INSPECTION TYPE LABEL
  // =========================================================

  get inspectionTypeLabel(): string {

    return this.inspectionType === 'accident'
      ? 'Accident Claim'
      : 'Pre-Cover Inspection';

  }


  // =========================================================
  // SELECT INSPECTION TYPE
  // =========================================================

  selectInspectionType(
    type: InspectionType
  ): void {

    if (this.isSubmitting) {
      return;
    }


    this.inspectionType =
      type;

    this.errorMessage =
      '';

    /*
     * Immediately refresh the selected inspection type.
     */
    this.changeDetector.detectChanges();

  }


  // =========================================================
  // SUBMIT REQUEST
  // =========================================================

  submitRequest(
    event?: Event
  ): void {

    /*
     * Prevent the browser's native form submission.
     */
    event?.preventDefault();


    /*
     * Prevent accidental double submission.
     */
    if (this.isSubmitting) {
      return;
    }


    /*
     * Reset the previous state.
     */
    this.isSubmitting =
      true;

    this.requestCreated =
      false;

    this.generatedReference =
      '';

    this.customerLink =
      '';

    this.errorMessage =
      '';

    this.copied =
      false;


    /*
     * Force the button to immediately change from:
     *
     * Create Inspection Request
     *
     * to:
     *
     * Creating Request...
     */
    this.changeDetector.detectChanges();


    const form =
      this.requestForm.getRawValue();


    /*
     * IMPORTANT:
     *
     * The frontend does NOT generate the reference.
     *
     * The NestJS backend generates the secure reference.
     */

    const inspectionData:
      CreateInspectionRequestPayload = {

      status:
        'pending',

      inspectionType:
        this.inspectionType,


      // -----------------------------------------------------
      // CUSTOMER
      // -----------------------------------------------------

      customer: {

        firstName:
          form.firstName.trim(),

        surname:
          form.surname.trim(),

        email:
          form.email.trim(),

        phone:
          form.phone.trim()

      },


      customerFirstName:
        form.firstName.trim(),

      customerSurname:
        form.surname.trim(),

      customerEmail:
        form.email.trim(),

      customerPhone:
        form.phone.trim(),


      // -----------------------------------------------------
      // POLICY
      // -----------------------------------------------------

      policy: {

        policyNumber:
          form.policyNumber.trim(),

        insuranceCompany:
          form.insuranceCompany.trim()

      },

      policyNumber:
        form.policyNumber.trim(),

      insuranceCompany:
        form.insuranceCompany.trim(),


      // -----------------------------------------------------
      // VEHICLE
      // -----------------------------------------------------

      vehicle: {

        make:
          '',

        model:
          '',

        year:
          '',

        registration:
          '',

        colour:
          '',

        mileage:
          '',

        vin:
          ''

      },


      make:
        '',

      model:
        '',

      year:
        '',

      registration:
        '',

      colour:
        '',

      mileage:
        '',

      vin:
        '',


      // -----------------------------------------------------
      // PHOTOS
      // -----------------------------------------------------

      photos:
        [],

      accidentPhotos:
        [],

      damagePhotos:
        []

    };


    console.log(
      '======================================'
    );

    console.log(
      'CREATING INSPECTION REQUEST'
    );

    console.log(
      'TYPE:',
      this.inspectionType
    );

    console.log(
      'REQUEST DATA:',
      inspectionData
    );

    console.log(
      '======================================'
    );


    this.inspectionService
      .createInspection(
        inspectionData
      )
      .pipe(

        finalize(() => {

          /*
           * The HTTP request has finished regardless of
           * success or failure.
           */

          this.isSubmitting =
            false;

          /*
           * Make sure the button immediately returns to
           * its normal state.
           */
          this.changeDetector.detectChanges();

        })

      )
      .subscribe({

        // ===================================================
        // SUCCESS
        // ===================================================

        next: response => {

          console.log(
            '======================================'
          );

          console.log(
            'CREATE REQUEST RESPONSE'
          );

          console.log(
            response
          );

          console.log(
            '======================================'
          );


          /*
           * Support both:
           *
           * {
           *   id,
           *   reference,
           *   secureLink
           * }
           *
           * and:
           *
           * {
           *   inspection: {
           *     ...
           *   }
           * }
           */

          const createdInspection =
            response?.inspection ??
            response;


          /*
           * The reference MUST come from NestJS.
           */

          const returnedReference =
            response?.reference ??
            createdInspection?.reference ??
            '';


          if (!returnedReference) {

            console.error(
              'Inspection was created but no reference was returned.',
              response
            );


            this.errorMessage =
              'The inspection was created, but the server did not return a secure reference. Please check the backend response.';


            /*
             * Explicitly refresh the screen so the error
             * appears immediately.
             */
            this.changeDetector.detectChanges();

            return;
          }


          /*
           * Normalise inspection type.
           */

          const returnedType =
            this.inspectionService
              .normalizeInspectionType(

                response?.inspectionType ??
                createdInspection?.inspectionType ??
                this.inspectionType

              );


          /*
           * Store backend reference.
           */

          this.generatedReference =
            returnedReference;


          /*
           * Prefer the secure link generated by NestJS.
           */

          const backendLink =
            response?.secureLink ??
            response?.inspectionUrl ??
            response?.url ??
            createdInspection?.secureLink ??
            createdInspection?.inspectionUrl ??
            '';


          if (backendLink) {

            this.customerLink =
              backendLink;

          } else {

            /*
             * Only use this fallback if the backend didn't
             * provide a link.
             */

            this.customerLink =
              this.buildCustomerLink(
                returnedType,
                returnedReference
              );

          }


          /*
           * THIS IS THE IMPORTANT PART.
           *
           * The request is already created in the database.
           *
           * Now immediately switch the page from the form
           * to the success screen.
           */

          this.requestCreated =
            true;


          console.log(
            '======================================'
          );

          console.log(
            'REQUEST CREATED SUCCESSFULLY'
          );

          console.log(
            'REFERENCE:',
            this.generatedReference
          );

          console.log(
            'CUSTOMER LINK:',
            this.customerLink
          );

          console.log(
            '======================================'
          );


          /*
           * Force Angular to render the success state NOW.
           *
           * This prevents the user having to click Accident
           * Claim, Dashboard, or anywhere else before the
           * success panel appears.
           */
          this.changeDetector.detectChanges();

        },


        // ===================================================
        // ERROR
        // ===================================================

        error: error => {

          console.error(
            '======================================'
          );

          console.error(
            'CREATE INSPECTION REQUEST FAILED'
          );

          console.error(
            error
          );

          console.error(
            '======================================'
          );


          this.errorMessage =
            error?.error?.message ??
            error?.message ??
            'Unable to create the inspection request. Please try again.';


          /*
           * Make the error state visible immediately.
           */
          this.changeDetector.detectChanges();

        }

      });

  }


  // =========================================================
  // BUILD CUSTOMER LINK
  // =========================================================

  private buildCustomerLink(
    type: InspectionType,
    reference: string
  ): string {

    return (
      `${window.location.origin}` +
      `/customer/start/${type}/` +
      `${encodeURIComponent(reference)}`
    );

  }


  // =========================================================
  // COPY LINK
  // =========================================================

  copyLink(): void {

    if (!this.customerLink) {
      return;
    }


    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {

      navigator.clipboard
        .writeText(
          this.customerLink
        )
        .then(() => {

          this.showCopiedState();

        })
        .catch(error => {

          console.error(
            'Unable to copy link:',
            error
          );

          this.copyLinkFallback();

        });

      return;
    }


    this.copyLinkFallback();

  }


  // =========================================================
  // COPY FALLBACK
  // =========================================================

  private copyLinkFallback(): void {

    try {

      const textarea =
        document.createElement(
          'textarea'
        );


      textarea.value =
        this.customerLink;


      textarea.style.position =
        'fixed';

      textarea.style.opacity =
        '0';


      document.body.appendChild(
        textarea
      );


      textarea.focus();

      textarea.select();


      const successful =
        document.execCommand(
          'copy'
        );


      document.body.removeChild(
        textarea
      );


      if (successful) {

        this.showCopiedState();

      } else {

        console.error(
          'Fallback copy failed.'
        );

      }

    } catch (error) {

      console.error(
        'Unable to copy customer link:',
        error
      );

    }

  }


  // =========================================================
  // COPIED STATE
  // =========================================================

  private showCopiedState(): void {

    this.copied =
      true;


    this.changeDetector.detectChanges();


    setTimeout(() => {

      this.copied =
        false;

      this.changeDetector.detectChanges();

    }, 2500);

  }


  // =========================================================
  // CREATE ANOTHER REQUEST
  // =========================================================

  createAnotherRequest(): void {

    if (this.isSubmitting) {
      return;
    }


    this.requestCreated =
      false;

    this.generatedReference =
      '';

    this.customerLink =
      '';

    this.errorMessage =
      '';

    this.copied =
      false;

    this.inspectionType =
      'pre-cover';


    this.requestForm.reset();


    this.changeDetector.detectChanges();

  }


  // =========================================================
  // BACK TO DASHBOARD
  // =========================================================

  cancel(): void {

    if (this.isSubmitting) {
      return;
    }


    this.router.navigate([
      '/dashboard'
    ]);

  }


  // =========================================================
  // FORM ERROR
  // =========================================================

  hasError(
    controlName: string
  ): boolean {

    const control =
      this.requestForm.get(
        controlName
      );


    return !!(
      control &&
      control.touched &&
      control.invalid
    );

  }

}