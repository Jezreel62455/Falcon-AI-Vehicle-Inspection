import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
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


  private route =
    inject(ActivatedRoute);


  private router =
    inject(Router);


  private inspectionService =
    inject(InspectionService);


  private changeDetectorRef =
    inject(ChangeDetectorRef);


  inspection: any =
    null;


  isLoading =
    true;


  errorMessage =
    '';


  ngOnInit():
    void {


    const id =
      this.route.snapshot.paramMap.get(
        'id'
      );


    console.log(
      'DETAILS PAGE ID:',
      id
    );


    if (!id) {


      this.errorMessage =
        'Inspection ID was not provided.';


      this.isLoading =
        false;


      return;

    }


    this.inspectionService

      .getInspectionById(
        id
      )

      .subscribe({

        next:
          (data) => {


            console.log(
              'INSPECTION DETAILS RECEIVED:',
              data
            );


            this.inspection =
              data;


            this.isLoading =
              false;


            this.changeDetectorRef
              .detectChanges();


          },


        error:
          (error) => {


            console.error(
              'FAILED TO LOAD INSPECTION:',
              error
            );


            this.errorMessage =
              'Unable to load this inspection.';


            this.isLoading =
              false;


            this.changeDetectorRef
              .detectChanges();


          }

      });

  }


  goBack():
    void {


    this.router.navigate([
      '/history'
    ]);

  }

}