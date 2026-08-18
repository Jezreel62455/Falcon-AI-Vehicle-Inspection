import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  InspectionService,
  InspectionType
} from '../../../services/inspection.service';

import {
  CustomerInspectionService
} from '../../services/customer-inspection';


@Component({

  selector:
    'app-welcome',

  standalone:
    true,

  imports: [
    CommonModule
  ],

  templateUrl:
    './welcome.html',

  styleUrls: [
    './welcome.css'
  ]
})
export class Welcome
  implements OnInit {


  private readonly router =
    inject(Router);


  private readonly route =
    inject(ActivatedRoute);


  private readonly inspectionService =
    inject(InspectionService);


  private readonly customerInspectionService =
    inject(CustomerInspectionService);


  /*
   * =========================================================
   * STATE
   * =========================================================
   */

  selectedInspectionType:
    InspectionType | null =
    null;


  reference:
    string | null =
    null;


  isCustomerLink =
    false;


  isStarting =
    false;


  errorMessage =
    '';


  /*
   * =========================================================
   * INIT
   * =========================================================
   */

  ngOnInit(): void {

    const type =
      this.route.snapshot
        .paramMap
        .get('type');


    const reference =
      this.route.snapshot
        .paramMap
        .get('reference');


    console.log(
      'WELCOME ROUTE:',
      {
        type,
        reference
      }
    );


    /*
     * =======================================================
     * ADMIN GENERATED LINK
     * =======================================================
     */

    if (
      reference &&
      (
        type === 'pre-cover' ||
        type === 'accident'
      )
    ) {

      this.reference =
        reference;


      this.selectedInspectionType =
        type;


      this.isCustomerLink =
        true;


      this.isStarting =
        false;


      this.errorMessage =
        '';


      console.log(
        'ADMIN CUSTOMER LINK DETECTED:',
        {
          type,
          reference
        }
      );


      return;
    }


    /*
     * =======================================================
     * NORMAL CUSTOMER FLOW
     * =======================================================
     */

    this.selectedInspectionType =
      null;


    this.reference =
      null;


    this.isCustomerLink =
      false;


    this.isStarting =
      false;


    this.errorMessage =
      '';
  }


  /*
   * =========================================================
   * SELECT INSPECTION TYPE
   * =========================================================
   */

  selectInspectionType(
    type: InspectionType
  ): void {

    /*
     * NEVER allow type changes from an admin-generated link.
     */

    if (
      this.isCustomerLink
    ) {

      return;
    }


    /*
     * NEVER allow type changes while starting.
     */

    if (
      this.isStarting
    ) {

      return;
    }


    this.errorMessage =
      '';


    this.selectedInspectionType =
      type;


    /*
     * Start a completely fresh inspection.
     */

    this.customerInspectionService
      .startNewInspection(
        type
      );


    console.log(
      'NORMAL CUSTOMER INSPECTION STARTED:',
      type
    );
  }


  /*
   * =========================================================
   * CONTINUE
   * =========================================================
   */

  continueInspection(): void {

    if (
      !this.selectedInspectionType
    ) {

      return;
    }


    if (
      this.isStarting
    ) {

      return;
    }


    this.errorMessage =
      '';


    this.isStarting =
      true;


    /*
     * =======================================================
     * ADMIN GENERATED REQUEST
     * =======================================================
     */

    if (
      this.isCustomerLink &&
      this.reference
    ) {

      this.loadLinkedInspection();

      return;
    }


    /*
     * =======================================================
     * NORMAL CUSTOMER FLOW
     * =======================================================
     */

    void this.router.navigate(
      [
        '/customer/instructions'
      ],
      {
        queryParams: {

          type:
            this.selectedInspectionType

        }
      }
    ).catch(
      () => {

        this.isStarting =
          false;


        this.errorMessage =
          'Unable to start the inspection.';
      }
    );
  }


  /*
   * =========================================================
   * LOAD ADMIN-GENERATED REQUEST
   * =========================================================
   */

  private loadLinkedInspection(): void {

    if (
      !this.reference ||
      !this.selectedInspectionType
    ) {

      this.isStarting =
        false;


      this.errorMessage =
        'The inspection link is incomplete.';


      return;
    }


    console.log(
      'LOADING ADMIN INSPECTION:',
      {
        reference:
          this.reference,

        expectedType:
          this.selectedInspectionType
      }
    );


    this.inspectionService
      .getInspectionByReference(
        this.reference
      )
      .subscribe({

        /*
         * ===================================================
         * SUCCESS
         * ===================================================
         */

        next:
          inspection => {

            console.log(
              'ADMIN INSPECTION LOADED:',
              inspection
            );


            /*
             * =================================================
             * VERIFY REFERENCE
             * =================================================
             */

            if (
              inspection.reference !==
              this.reference
            ) {

              console.error(
                'REFERENCE MISMATCH',
                {
                  expected:
                    this.reference,

                  received:
                    inspection.reference
                }
              );


              this.isStarting =
                false;


              this.errorMessage =
                'The inspection reference is invalid.';


              return;
            }


            /*
             * =================================================
             * VERIFY TYPE
             * =================================================
             */

            if (
              inspection.inspectionType !==
              this.selectedInspectionType
            ) {

              console.error(
                'INSPECTION TYPE MISMATCH',
                {
                  urlType:
                    this.selectedInspectionType,

                  backendType:
                    inspection.inspectionType,

                  reference:
                    inspection.reference
                }
              );


              this.isStarting =
                false;


              this.errorMessage =
                'The inspection type does not match this request.';


              return;
            }


            /*
             * =================================================
             * CREATE COMPLETELY FRESH CUSTOMER INSPECTION
             * =================================================
             *
             * IMPORTANT:
             *
             * We use the admin reference.
             *
             * We DO NOT create a new reference.
             *
             * We DO NOT copy the old vehicle.
             *
             * We DO NOT copy photos.
             */

            this.customerInspectionService
              .startNewInspection(
                inspection.inspectionType,
                inspection.reference
              );


            /*
             * =================================================
             * PREFILL CUSTOMER ONLY
             * =================================================
             */

            this.customerInspectionService
              .updateCustomer({

                firstName:
                  inspection.customer?.firstName ??
                  inspection.customerFirstName ??
                  '',

                lastName:
                  inspection.customer?.lastName ??
                  inspection.customer?.surname ??
                  inspection.customerSurname ??
                  '',

                phone:
                  inspection.customer?.phone ??
                  inspection.customerPhone ??
                  '',

                email:
                  inspection.customer?.email ??
                  inspection.customerEmail ??
                  ''
              });


            /*
             * =================================================
             * NAVIGATE
             * =================================================
             */

            void this.router.navigate(
              [
                '/customer/instructions'
              ],
              {
                queryParams: {

                  type:
                    inspection.inspectionType,

                  reference:
                    inspection.reference

                }
              }
            ).catch(
              () => {

                this.isStarting =
                  false;


                this.errorMessage =
                  'Unable to continue with this inspection.';
              }
            );
          },


        /*
         * ===================================================
         * ERROR
         * ===================================================
         */

        error:
          error => {

            console.error(
              'COULD NOT LOAD CUSTOMER INSPECTION',
              error
            );


            this.isStarting =
              false;


            this.errorMessage =
              'We could not load this inspection request. Please check the link and try again.';
          }

      });
  }


  /*
   * =========================================================
   * BACK
   * =========================================================
   */

  goBack(): void {

    if (
      this.isStarting
    ) {

      return;
    }


    void this.router.navigate([
      '/'
    ]);
  }


  /*
   * =========================================================
   * TYPE HELPERS
   * =========================================================
   */

  isPreCover(): boolean {

    return (
      this.selectedInspectionType ===
      'pre-cover'
    );
  }


  isAccident(): boolean {

    return (
      this.selectedInspectionType ===
      'accident'
    );
  }
}