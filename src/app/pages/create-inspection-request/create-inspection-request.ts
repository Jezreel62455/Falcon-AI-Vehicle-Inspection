import {
  Component,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';


@Component({
  selector: 'app-create-inspection-request',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule
  ],

  templateUrl:
    './create-inspection-request.html',

  styleUrl:
    './create-inspection-request.css'
})


export class CreateInspectionRequest {


  private readonly fb =
    inject(FormBuilder);


  private readonly router =
    inject(Router);


  private readonly route =
    inject(ActivatedRoute);



  inspectionType =
    'pre-cover';



  submitted =
    false;



  requestForm =
    this.fb.group({

      firstName: [
        '',
        Validators.required
      ],

      surname: [
        '',
        Validators.required
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      phone: [
        '',
        Validators.required
      ],


      policyNumber: [
        '',
        Validators.required
      ],


      insuranceCompany: [
        '',
        Validators.required
      ],


      inspectionType: [
        'pre-cover',
        Validators.required
      ]

    });





  ngOnInit(): void {


    const type =
      this.route.snapshot.queryParamMap.get('type');


    if (type) {

      this.inspectionType =
        type;


      this.requestForm.patchValue({

        inspectionType:
          type

      });

    }


  }





  submitRequest(): void {


    this.submitted =
      true;


    if (
      this.requestForm.invalid
    ) {

      return;

    }



    console.log(
      'INSPECTION REQUEST:',
      this.requestForm.value
    );


    /*
      Next step:

      Send request to backend
      Generate secure customer link
      Send SMS/email
    */


  }





  cancel(): void {


    void this.router.navigate(
      ['/']
    );


  }


}