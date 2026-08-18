import {
  Component,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
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


  /* =========================================================
     STATE
     ========================================================= */

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


  /* =========================================================
     FORM
     ========================================================= */

  requestForm =
    this.fb.nonNullable.group({

      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2)
        ]
      ],


      surname: [
        '',
        [
          Validators.required,
          Validators.minLength(2)
        ]
      ],


      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],


      phone: [
        '',
        [
          Validators.required,
          Validators.minLength(7)
        ]
      ],


      policyNumber: [
        '',
        [
          Validators.required
        ]
      ],


      insuranceCompany: [
        '',
        [
          Validators.required
        ]
      ]

    });


  /* =========================================================
     LABEL
     ========================================================= */

  get inspectionTypeLabel(): string {

    return this.inspectionType === 'accident'
      ? 'Accident Claim'
      : 'Pre-Cover Inspection';
  }


  get selectedInspectionTypeLabel(): string {

    return this.inspectionTypeLabel;
  }


  /* =========================================================
     SELECT TYPE
     
     IMPORTANT:
     Selecting a type does NOT create anything.
     ========================================================= */

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
  }


  /* =========================================================
     SUBMIT
     
     THIS IS THE ONLY PLACE THAT CREATES THE REQUEST.
     ========================================================= */

  submitRequest(
    event?: Event
  ): void {

    event?.preventDefault();


    if (this.isSubmitting) {

      return;
    }


    if (this.requestForm.invalid) {

      this.requestForm.markAllAsTouched();

      return;
    }


    this.isSubmitting =
      true;


    this.errorMessage =
      '';


    this.requestCreated =
      false;


    this.generatedReference =
      '';


    this.customerLink =
      '';


    const form =
      this.requestForm.getRawValue();


    /*
     * Generate the reference ONLY when
     * the user actually submits.
     */
    const reference =
      this.generateReference();


    const inspectionData:
      CreateInspectionRequestPayload = {

      reference,

      status:
        'pending',


      inspectionType:
        this.inspectionType,


      /* -----------------------------------------------------
         NESTED CUSTOMER
         ----------------------------------------------------- */

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


      /* -----------------------------------------------------
         NESTED POLICY
         ----------------------------------------------------- */

      policy: {

        policyNumber:
          form.policyNumber.trim(),

        insuranceCompany:
          form.insuranceCompany.trim()

      },


      /* -----------------------------------------------------
         FLAT CUSTOMER
         ----------------------------------------------------- */

      customerFirstName:
        form.firstName.trim(),

      customerSurname:
        form.surname.trim(),

      customerEmail:
        form.email.trim(),

      customerPhone:
        form.phone.trim(),


      /* -----------------------------------------------------
         FLAT POLICY
         ----------------------------------------------------- */

      policyNumber:
        form.policyNumber.trim(),

      insuranceCompany:
        form.insuranceCompany.trim(),


      /* -----------------------------------------------------
         EMPTY VEHICLE
         ----------------------------------------------------- */

      vehicle: {

        make: '',

        model: '',

        year: '',

        registration: '',

        colour: '',

        mileage: '',

        vin: ''

      },


      /* -----------------------------------------------------
         LEGACY FLAT VEHICLE FIELDS
         ----------------------------------------------------- */

      make: '',

      model: '',

      year: '',

      registration: '',

      colour: '',

      mileage: '',

      vin: '',


      /* -----------------------------------------------------
         PHOTOS
         ----------------------------------------------------- */

      photos: [],

      accidentPhotos: [],

      damagePhotos: []

    };


    console.log(
      'CREATING INSPECTION REQUEST:',
      inspectionData
    );


    this.inspectionService
      .createInspection(
        inspectionData
      )
      .pipe(

        finalize(() => {

          this.isSubmitting =
            false;

        })

      )
      .subscribe({

        next: inspection => {

          console.log(
            'INSPECTION REQUEST CREATED:',
            inspection
          );


          /*
           * Always use the reference returned
           * by the backend.
           */
          this.generatedReference =
            inspection.reference;


          /*
           * Always use the inspection type
           * returned by the backend too.
           */
          const type =
            this.inspectionService
              .normalizeInspectionType(
                inspection.inspectionType
              );


          this.customerLink =
            this.buildCustomerLink(
              type,
              inspection.reference
            );


          this.requestCreated =
            true;

        },


        error: error => {

          console.error(
            'CREATE INSPECTION REQUEST FAILED:',
            error
          );


          this.errorMessage =
            error?.error?.message ??
            error?.message ??
            'Unable to create the inspection request. Please try again.';

        }

      });
  }


  /* =========================================================
     GENERATE REFERENCE
     ========================================================= */

  private generateReference(): string {

    const timestamp =
      Date.now()
        .toString(36)
        .toUpperCase();


    const random =
      Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase();


    return `FAL-${timestamp}-${random}`;
  }


  /* =========================================================
     CUSTOMER LINK
     ========================================================= */

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


  /* =========================================================
     COPY LINK
     ========================================================= */

  copyLink(): void {

    if (!this.customerLink) {

      return;
    }


    navigator.clipboard
      .writeText(
        this.customerLink
      )
      .then(() => {

        console.log(
          'Customer inspection link copied.'
        );

      })
      .catch(error => {

        console.error(
          'Unable to copy link:',
          error
        );

      });
  }


  /* =========================================================
     CREATE ANOTHER
     ========================================================= */

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


    this.inspectionType =
      'pre-cover';


    this.requestForm.reset();
  }


  /* =========================================================
     BACK
     ========================================================= */

  cancel(): void {

    if (this.isSubmitting) {

      return;
    }


    this.router.navigate([
      '/dashboard'
    ]);
  }


  /* =========================================================
     FORM ERROR
     ========================================================= */

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