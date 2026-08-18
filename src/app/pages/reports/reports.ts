import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  Inspection,
  InspectionService
} from '../../services/inspection.service';


@Component({
  selector: 'app-reports',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './reports.html',
  styleUrl: './reports.css'
})


export class Reports implements OnInit {


  private readonly inspectionService =
    inject(InspectionService);


  private readonly router =
    inject(Router);


  private readonly cdr =
    inject(ChangeDetectorRef);



  inspections: Inspection[] = [];

  filteredInspections: Inspection[] = [];



  isLoading = true;

  errorMessage = '';



  searchTerm = '';

  selectedStatus = 'all';

  selectedType = 'all';



  // ==============================
  // STATISTICS
  // ==============================


  totalInspections = 0;

  submittedInspections = 0;

  completedInspections = 0;

  underReviewInspections = 0;



  preCoverInspections = 0;

  accidentInspections = 0;



  averageMileage = 0;

  averageVehicleAge = 0;

  mostCommonColour = '-';



  averageAiConfidence = 96;

  averageDamageSeverity = 0;

  estimatedRepairExposure = 0;

  highestRiskVehicle = '-';



  ngOnInit(): void {

    this.loadReports();

  }




  private loadReports(): void {


    this.isLoading = true;


    this.inspectionService
      .getInspections()
      .subscribe({


        next: (data) => {


          this.inspections = data || [];


          this.calculateStatistics();


          this.applyFilters();



          this.isLoading = false;



          /*
             Same fix we used on Dashboard.
             Forces Angular to refresh immediately
             after async data arrives.
          */

          this.cdr.detectChanges();



        },


        error: (error) => {


          console.error(
            'Reports loading failed',
            error
          );


          this.errorMessage =
            'Unable to load inspection reports.';


          this.inspections = [];

          this.filteredInspections = [];


          this.isLoading = false;


          this.cdr.detectChanges();


        }


      });


  }





  private calculateStatistics(): void {


    this.totalInspections =
      this.inspections.length;



    this.submittedInspections =
      this.inspections.filter(
        inspection =>
          this.getStatus(inspection)
            .toUpperCase()
            === 'SUBMITTED'
      ).length;



    this.completedInspections =
      this.inspections.filter(
        inspection =>
          this.getStatus(inspection)
            .toUpperCase()
            === 'COMPLETED'
      ).length;



    this.underReviewInspections =
      this.inspections.filter(
        inspection =>
          this.getStatus(inspection)
            .toUpperCase()
            .includes('REVIEW')
      ).length;




    this.preCoverInspections =
      this.inspections.filter(
        inspection =>
          this.getInspectionType(inspection)
            .toLowerCase()
            .includes('pre')
      ).length;




    this.accidentInspections =
      this.inspections.filter(
        inspection =>
          this.getInspectionType(inspection)
            .toLowerCase()
            .includes('accident')
      ).length;



    this.calculateVehicleMetrics();



  }
    private calculateVehicleMetrics(): void {


    // ==============================
    // Average Mileage
    // ==============================


    const mileageValues =
      this.inspections
        .map(
          inspection =>
            Number(
              inspection.vehicle?.mileage
            ) || 0
        )
        .filter(
          mileage =>
            mileage > 0
        );


    this.averageMileage =
      mileageValues.length
        ? Math.round(
            mileageValues.reduce(
              (total, value) =>
                total + value,
              0
            )
            /
            mileageValues.length
          )
        : 0;




    // ==============================
    // Average Vehicle Age
    // ==============================


    const currentYear =
      new Date().getFullYear();



    const ages =
      this.inspections
        .map(
          inspection => {


            const year =
              Number(
                inspection.vehicle?.year
              );


            return year > 1900
              ? currentYear - year
              : 0;


          }
        )
        .filter(
          age =>
            age > 0
        );



    this.averageVehicleAge =
      ages.length
        ? Math.round(
            ages.reduce(
              (total, value) =>
                total + value,
              0
            )
            /
            ages.length
          )
        : 0;




    // ==============================
    // Most Common Colour
    // ==============================


    const colours:
      Record<string, number> = {};



    this.inspections.forEach(
      inspection => {


        const colour =
          inspection.vehicle?.colour
            ?.trim();



        if (!colour) {

          return;

        }


        colours[colour] =
          (
            colours[colour] || 0
          ) + 1;


      }
    );



    const colourList =
      Object.entries(colours);



    this.mostCommonColour =
      colourList.length
        ? colourList.sort(
            (a, b) =>
              b[1] - a[1]
          )[0][0]
        : '-';





    // ==============================
    // AI PLACEHOLDER METRICS
    // ==============================


    this.averageAiConfidence = 96;



    this.averageDamageSeverity =
      this.accidentInspections > 0
        ? 18
        : 0;



    this.estimatedRepairExposure =
      this.accidentInspections *
      14500;



    this.highestRiskVehicle =
      this.inspections.length
        ? this.getVehicleRegistration(
            this.inspections[0]
          )
        : '-';


  }







  // ==============================
  // FILTERING
  // ==============================


  applyFilters(): void {


    const search =
      this.searchTerm
        .trim()
        .toLowerCase();



    this.filteredInspections =
      this.inspections.filter(
        inspection => {



          const customer =
            this.getCustomerName(
              inspection
            )
            .toLowerCase();



          const registration =
            this.getVehicleRegistration(
              inspection
            )
            .toLowerCase();



          const type =
            this.getInspectionType(
              inspection
            )
            .toLowerCase();



          const status =
            this.getStatus(
              inspection
            )
            .toLowerCase();




          const matchesSearch =

            !search

            ||

            customer.includes(search)

            ||

            registration.includes(search)

            ||

            type.includes(search)

            ||

            status.includes(search);





          const matchesStatus =

            this.selectedStatus === 'all'

            ||

            status ===
            this.selectedStatus
              .toLowerCase();





          const matchesType =

            this.selectedType === 'all'

            ||

            type.includes(
              this.selectedType
                .toLowerCase()
            );





          return (

            matchesSearch

            &&

            matchesStatus

            &&

            matchesType

          );


        }
      );


  }







  // ==============================
  // TEMPLATE HELPERS
  // ==============================


  getCustomerName(
    inspection: Inspection
  ): string {


    const first =
      inspection.customer?.firstName
      || '';



    const surname =
      inspection.customer?.surname
      || '';



    return (

      `${first} ${surname}`
        .trim()

      ||

      'Unknown Customer'

    );


  }





  getVehicleRegistration(
    inspection: Inspection
  ): string {


    return (

      inspection.vehicle?.registration

      ||

      '-'

    );


  }





  getInspectionType(
    inspection: Inspection
  ): string {


    return (

      inspection.inspectionType

      ||

      'Pre-Cover Inspection'

    );


  }





  getStatus(
    inspection: Inspection
  ): string {


    return (

      inspection.status

      ||

      'Unknown'

    );


  }
    getStatusClass(
    inspection: Inspection
  ): string {


    switch (

      this.getStatus(inspection)
        .toUpperCase()

    ) {


      case 'COMPLETED':

        return 'status-approved';



      case 'PROCESSING':

        return 'status-processing';



      case 'UNDER REVIEW':

      case 'REVIEW':

        return 'status-under-review';



      case 'PENDING':

        return 'status-pending';



      case 'SUBMITTED':

        return 'status-submitted';



      case 'FAILED':

        return 'status-rejected';



      default:

        return 'status-submitted';


    }


  }





  // ==============================
  // INSPECTION NAVIGATION
  // ==============================


  viewInspection(
    inspection: Inspection
  ): void {


    if (!inspection.id) {


      console.error(
        'Inspection ID missing',
        inspection
      );


      return;


    }



    void this.router.navigate([

      '/inspection-details',

      inspection.id

    ]);


  }





  // ==============================
  // REPORT PERCENTAGES
  // ==============================


  getPreCoverPercentage(): number {


    if (
      this.totalInspections === 0
    ) {

      return 0;

    }



    return Math.round(

      (

        this.preCoverInspections

        /

        this.totalInspections

      )

      *

      100

    );


  }





  getAccidentPercentage(): number {


    if (
      this.totalInspections === 0
    ) {

      return 0;

    }



    return Math.round(

      (

        this.accidentInspections

        /

        this.totalInspections

      )

      *

      100

    );


  }





  // ==============================
  // TRACKING
  // ==============================


  trackByInspection(
    index: number,
    inspection: Inspection
  ): string | number {


    return (

      inspection.id

      ||

      index

    );


  }


}