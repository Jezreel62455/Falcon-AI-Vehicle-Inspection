import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Router } from '@angular/router';

import {
  CustomerDetails,
  CustomerInspectionService,
} from '../../services/customer-inspection';



@Component({
  selector: 'app-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './details.html',
  styleUrl: './details.css',
})
export class Details implements OnInit {


  private readonly fb = inject(FormBuilder);

  private readonly router = inject(Router);

  private readonly inspectionService =
    inject(CustomerInspectionService);




  customerForm =
    this.fb.nonNullable.group({

      firstName: [
        '',
        Validators.required
      ],


      lastName: [
        '',
        Validators.required
      ],


      phone: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
        ],
      ],


      email: [
        '',
        [
          Validators.required,
          Validators.email,
        ],
      ],


      preferredContact: [
        'Phone'
      ],

    });







  ngOnInit(): void {


    const customer =
      this.inspectionService
      .getInspection()
      .customer;



    this.customerForm.reset({

      firstName:
        customer.firstName || '',


      lastName:
        customer.lastName || '',


      phone:
        customer.phone || '',


      email:
        customer.email || '',


      preferredContact:
        'Phone',

    });


  }








  back(): void {


    this.router.navigate([

      '/customer/instructions'

    ]);


  }








  continue(): void {


    if(this.customerForm.invalid){


      this.customerForm
      .markAllAsTouched();


      return;


    }




    const value =
      this.customerForm.getRawValue();




    const customer: CustomerDetails = {


      firstName:
        value.firstName,


      lastName:
        value.lastName,


      phone:
        value.phone,


      email:
        value.email,


    };





    this.inspectionService
    .updateCustomer(customer);





    this.router.navigate([

      '/customer/vehicle'

    ]);



  }


}