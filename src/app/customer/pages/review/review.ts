import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  CustomerInspectionService
} from '../../services/customer-inspection';


@Component({
  selector: 'app-review',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './review.html',
  styleUrl: './review.css',
})
export class Review {


  private readonly router = inject(Router);

  private readonly inspectionService =
    inject(CustomerInspectionService);



  inspection =
    this.inspectionService.getInspection();



  getInspectionType(): string {

    if(this.inspection.inspectionType === 'accident'){

      return 'Accident Claim Inspection';

    }


    return 'Pre-Cover Inspection';

  }



  submitInspection(): void {


    console.log(
      'Final Inspection Data:',
      this.inspection
    );


    this.router.navigate([
      '/customer/success'
    ]);


  }



  back(): void {

    this.router.navigate([
      '/customer/vehicle'
    ]);

  }


}