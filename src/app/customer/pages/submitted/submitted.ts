import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  CustomerInspectionService
} from '../../services/customer-inspection';


@Component({
  selector: 'app-submitted',
  standalone: true,
  imports: [],
  templateUrl: './submitted.html',
  styleUrl: './submitted.css',
})
export class Submitted {

  private readonly router = inject(Router);

  private readonly inspectionService =
    inject(CustomerInspectionService);



  inspectionReference = '';



  ngOnInit(): void {

    this.generateInspectionReference();

  }



  private generateInspectionReference(): void {

    const date =
      new Date()
        .toISOString()
        .slice(0,10)
        .replace(/-/g,'');


    const random =
      Math.floor(
        Math.random() * 90000
      ) + 10000;



    this.inspectionReference =
      `FAL-${date}-${random}`;


    /*
      Temporary storage.

      Later this will come from:
      Backend
        ↓
      Database
        ↓
      Generated Inspection ID
    */

    localStorage.setItem(
      'falconInspectionReference',
      this.inspectionReference
    );

  }



  goHome(): void {

    this.router.navigate([
      '/customer/welcome'
    ]);

  }



  viewStatus(): void {

    this.router.navigate([
      '/customer/success'
    ]);

  }

}