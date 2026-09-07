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
  Router,
  RouterLink
} from '@angular/router';

import {
  InspectionService
} from '../../services/inspection.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})


export class Dashboard implements OnInit {


  private readonly inspectionService =
    inject(InspectionService);


  private readonly changeDetector =
    inject(ChangeDetectorRef);


  public readonly router =
    inject(Router);



  inspections: any[] = [];

  filteredInspections: any[] = [];


  isLoading = true;

  errorMessage = '';



  totalInspections = 0;

  submittedInspections = 0;

  completedInspections = 0;

  underReviewInspections = 0;




  ngOnInit(): void {

    this.loadDashboardData();

  }





  private loadDashboardData(): void {


    this.isLoading = true;


    this.inspectionService
      .getInspections()
      .subscribe({

        next: (response:any) => {


          console.log(
            'DASHBOARD DATA:',
            response
          );



          this.inspections =
            Array.isArray(response)
              ? response
              : [];



          this.filteredInspections =
            [...this.inspections];



          this.calculateStatistics();



          this.isLoading = false;



          // FIX FIRST LOAD ISSUE
          setTimeout(() => {

            this.changeDetector.detectChanges();

          });


        },



        error:(error)=>{


          console.error(
            'Dashboard error:',
            error
          );


          this.inspections = [];

          this.filteredInspections = [];


          this.errorMessage =
            'Unable to load inspections.';


          this.isLoading = false;



          this.changeDetector.detectChanges();


        }


      });


  }







  private calculateStatistics():void {


    this.totalInspections =
      this.inspections.length;



    this.submittedInspections =
      this.inspections.filter(
        item =>
          this.normaliseStatus(
            item.status
          )
          ===
          'submitted'
      )
      .length;



    this.completedInspections =
      this.inspections.filter(
        item => {

          const status =
            this.normaliseStatus(
              item.status
            );


          return (
            status === 'completed'
            ||
            status === 'approved'
          );

        }
      )
      .length;



    this.underReviewInspections =
      this.inspections.filter(
        item =>
          this.normaliseStatus(
            item.status
          )
          ===
          'under-review'
      )
      .length;


  }







  private normaliseStatus(
    status:any
  ):string {


    return String(status || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g,'-');


  }







  getRecentInspections():any[] {


    return [
      ...this.inspections
    ]
    .sort(
      (a,b)=>{

        return (

          new Date(
            b.createdAt || 0
          ).getTime()

          -

          new Date(
            a.createdAt || 0
          ).getTime()

        );

      }
    )
    .slice(0,5);


  }








  getCustomerName(
    inspection:any
  ):string {


    return (

      `${inspection?.customer?.firstName || ''}
       ${inspection?.customer?.surname || ''}`

    )
    .trim()

    ||
    'Unknown Customer';


  }








  getVehicleRegistration(
    inspection:any
  ):string {


    return (

      inspection?.vehicle?.registration

      ||

      'N/A'

    );


  }








  getInspectionType(
    inspection:any
  ):string {


    const type =
      String(
        inspection?.inspectionType
        ||
        ''
      )
      .toLowerCase();



    if(type.includes('accident')){

      return 'Accident Claim';

    }


    if(type.includes('pre')){

      return 'Pre-Cover';

    }


    return 'Inspection';


  }








  getStatus(
    inspection:any
  ):string {


    return String(
      inspection?.status
      ||
      'SUBMITTED'
    )
    .replace(
      /-/g,
      ' '
    )
    .toUpperCase();


  }








  getStatusClass(
    inspection:any
  ):string {


    return this.normaliseStatus(
      inspection?.status
    );


  }








  getDate(
    inspection:any
  ):Date|null {


    return inspection?.createdAt

      ?

      new Date(
        inspection.createdAt
      )

      :

      null;


  }








  openInspection(
    inspection:any
  ):void {


    if(!inspection?.id){

      return;

    }



    this.router.navigate([

      '/inspection-details',

      inspection.id

    ]);


  }



}