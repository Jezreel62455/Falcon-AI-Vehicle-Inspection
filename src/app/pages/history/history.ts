import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { RouterLink } from '@angular/router';

import { InspectionService } from '../../services/inspection.service';


@Component({

  selector: 'app-history',

  standalone: true,

  imports: [

    CommonModule,

    RouterLink

  ],

  templateUrl:
    './history.html',

  styleUrl:
    './history.css'

})


export class History
  implements OnInit {


  private inspectionService =
    inject(InspectionService);


  private changeDetectorRef =
    inject(ChangeDetectorRef);


  inspections:
    any[] =
    [];


  isLoading =
    true;


  errorMessage =
    '';


  ngOnInit():
    void {


    console.log(
      'HISTORY COMPONENT CREATED'
    );


    this.loadInspections();

  }


  loadInspections():
    void {


    this.isLoading =
      true;


    this.errorMessage =
      '';


    this.inspectionService

      .getInspections()

      .subscribe({

        next:
          (data: any[]) => {


            console.log(

              'INSPECTIONS LOADED:',

              data

            );


            this.inspections =
              data;


            this.isLoading =
              false;


            this.changeDetectorRef
              .detectChanges();

          },


        error:
          (error: any) => {


            console.error(

              'Failed to load inspections:',

              error

            );


            this.errorMessage =

              'Unable to load inspection history. Please try again.';


            this.isLoading =
              false;


            this.changeDetectorRef
              .detectChanges();

          }

      });

  }

}