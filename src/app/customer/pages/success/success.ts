import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  CustomerInspectionService
} from '../../services/customer-inspection';


@Component({
  selector: 'app-success',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './success.html',
  styleUrls: ['./success.css'],
})
export class Success {


  private readonly router = inject(Router);


  private readonly inspectionService =
    inject(CustomerInspectionService);



  inspection: any;


  inspectionReference = '';


  submittedDate = new Date();



  ngOnInit(): void {


    this.inspection =
      this.inspectionService.getInspection();



    this.inspectionReference =
      this.inspection?.reference
      ||
      'FAL-PENDING';


  }




  getInspectionType(): string {


    if (!this.inspection?.inspectionType) {


      return 'Pre-Cover Inspection';


    }



    return this.inspection.inspectionType === 'accident'

      ? 'Accident Claim Inspection'

      : 'Pre-Cover Inspection';



  }





  getSubmissionDate(): string {


    return this.submittedDate
      .toLocaleString();


  }





  getVehicleName(): string {


    if (!this.inspection?.vehicle) {


      return 'Vehicle Pending';


    }



    return (

      `${this.inspection.vehicle.make || ''} ${this.inspection.vehicle.model || ''}`

    ).trim()

    ||

    'Vehicle Pending';



  }





  getRegistration(): string {


    return (

      this.inspection?.vehicle?.registration

    )

    ||

    'Pending';



  }





  returnHome(): void {


    this.router.navigate([

      '/customer/welcome'

    ]);


  }


}