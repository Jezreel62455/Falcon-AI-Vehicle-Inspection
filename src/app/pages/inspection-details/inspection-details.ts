import {
  CommonModule
} from '@angular/common';

import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

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

  styleUrl:
    './inspection-details.css'
})


export class InspectionDetails
  implements OnInit {


  private readonly route =
    inject(ActivatedRoute);


  private readonly router =
    inject(Router);


  private readonly inspectionService =
    inject(InspectionService);


  private readonly changeDetectorRef =
    inject(ChangeDetectorRef);



  inspection:
    Inspection | null =
    null;



  isLoading =
    true;



  errorMessage =
    '';



  ngOnInit(): void {


    const id =
      this.route.snapshot.paramMap.get('id');


    if (!id) {

      this.isLoading = false;

      this.errorMessage =
        'Inspection ID not found.';

      this.changeDetectorRef.detectChanges();

      return;

    }


    this.loadInspection(id);

  }





  private loadInspection(
    id: string
  ): void {


    this.isLoading = true;

    this.errorMessage = '';



    this.inspectionService
      .getInspectionById(id)
      .subscribe({


        next:
        (
          inspection: Inspection
        ) => {


          this.inspection =
            inspection;


          this.isLoading =
            false;



          console.log(
            'INSPECTION DETAILS:',
            this.inspection
          );



          this.changeDetectorRef.detectChanges();


        },



        error:
        (
          error: unknown
        ) => {


          console.error(
            'FAILED TO LOAD INSPECTION:',
            error
          );



          this.inspection =
            null;



          this.errorMessage =
            'Failed to load inspection details.';



          this.isLoading =
            false;



          this.changeDetectorRef.detectChanges();


        }


      });


  }





  getPhotoUrl(
    path?: string | null
  ): string {


    if (!path) {

      return '';

    }


    return this.inspectionService
      .getPhotoUrl(path);


  }





  getCustomerName(): string {


    if (!this.inspection) {

      return 'Customer';

    }


    const customer =
      this.inspection.customer;


    return (

      `${customer?.firstName ?? ''} ${customer?.surname ?? ''}`

    ).trim()

    || 'Customer';


  }





getRegistration(): string {

  if (!this.inspection) {
    return 'Registration unavailable';
  }

  return (
    this.inspection.vehicle?.registration
    ??
    'Registration unavailable'
  );

}


  getInspectionType(): string {


    return (

      this.inspection?.inspectionType

      ||

      'Vehicle Inspection'

    );


  }





  getStatus(): string {


    return (

      this.inspection?.status

      ||

      'SUBMITTED'

    );


  }





  getPhotoCount(): number {


    return (

      this.inspection?.photos?.length

      ||

      0

    );


  }





  isAccidentInspection(): boolean {


    return (

      this.inspection?.inspectionType

      ===

      'accident'

    );


  }





getVehicleField(
  field: keyof NonNullable<Inspection['vehicle']>
): string {

  if (!this.inspection) {
    return 'Not provided';
  }


  const value =
    this.inspection.vehicle?.[field];


  return String(
    value ?? 'Not provided'
  );

}

  goBack(): void {


    void this.router.navigate(
      ['/history']
    );


  }


}