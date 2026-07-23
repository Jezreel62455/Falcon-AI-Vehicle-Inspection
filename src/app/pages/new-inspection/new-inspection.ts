import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  ReactiveFormsModule,
  FormBuilder,
  Validators
} from '@angular/forms';

import { ActivatedRoute } from '@angular/router';

import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { InspectionService } from '../../services/inspection.service';


interface InspectionPhoto {

  id: string;

  title: string;

  description: string;

  file: File | null;

  preview: string | null;

  required: boolean;

}


@Component({

  selector: 'app-new-inspection',

  standalone: true,

  imports: [

    CommonModule,

    ReactiveFormsModule,

    MatStepperModule,

    MatButtonModule,

    MatInputModule,

    MatFormFieldModule,

    MatCardModule,

    MatSelectModule,

    MatIconModule

  ],

  templateUrl: './new-inspection.html',

  styleUrl: './new-inspection.css'

})


export class NewInspection implements OnInit {


  private fb =
    inject(FormBuilder);


  private route =
    inject(ActivatedRoute);


  private inspectionService =
    inject(InspectionService);


  inspectionType:
    'pre-cover' | 'accident' =
    'pre-cover';


  inspectionTitle =
    'Pre-Cover Vehicle Inspection';


  inspectionDescription =
    'Complete this inspection before your vehicle receives full insurance cover.';


  inspectionSubmitted =
    false;


  isSubmitting =
    false;


  currentPhotoIndex =
    0;


  allRequiredPhotosComplete =
    false;


  damagePhotos:
    File[] =
    [];


  damagePhotoPreviews:
    string[] =
    [];


  customerForm =
    this.fb.group({

      firstName:
        ['', Validators.required],

      surname:
        ['', Validators.required],

      phone:
        [''],

      email:
        ['']

    });


  policyForm =
    this.fb.group({

      policy:
        ['', Validators.required],

      company:
        ['']

    });


  vehicleForm =
    this.fb.group({

      registration:
        ['', Validators.required],

      vin:
        [''],

      make:
        [''],

      model:
        [''],

      year:
        [''],

      colour:
        [''],

      mileage:
        ['']

    });


  photos:
    InspectionPhoto[] = [

      {

        id:
          'front',

        title:
          'Front of Vehicle',

        description:
          'Capture a clear image showing the entire front of the vehicle.',

        file:
          null,

        preview:
          null,

        required:
          true

      },

      {

        id:
          'rear',

        title:
          'Rear of Vehicle',

        description:
          'Capture a clear image showing the entire rear of the vehicle.',

        file:
          null,

        preview:
          null,

        required:
          true

      },

      {

        id:
          'left-side',

        title:
          'Left Side',

        description:
          'Capture the complete left side of the vehicle.',

        file:
          null,

        preview:
          null,

        required:
          true

      },

      {

        id:
          'right-side',

        title:
          'Right Side',

        description:
          'Capture the complete right side of the vehicle.',

        file:
          null,

        preview:
          null,

        required:
          true

      },

      {

        id:
          'front-left',

        title:
          'Front Left Corner',

        description:
          'Capture the front-left corner of the vehicle.',

        file:
          null,

        preview:
          null,

        required:
          true

      },

      {

        id:
          'front-right',

        title:
          'Front Right Corner',

        description:
          'Capture the front-right corner of the vehicle.',

        file:
          null,

        preview:
          null,

        required:
          true

      },

      {

        id:
          'rear-left',

        title:
          'Rear Left Corner',

        description:
          'Capture the rear-left corner of the vehicle.',

        file:
          null,

        preview:
          null,

        required:
          true

      },

      {

        id:
          'rear-right',

        title:
          'Rear Right Corner',

        description:
          'Capture the rear-right corner of the vehicle.',

        file:
          null,

        preview:
          null,

        required:
          true

      },

      {

        id:
          'odometer',

        title:
          'Odometer',

        description:
          'Capture the dashboard showing the current mileage.',

        file:
          null,

        preview:
          null,

        required:
          true

      },

      {

        id:
          'vin',

        title:
          'VIN Number',

        description:
          'Capture a clear image of the vehicle identification number.',

        file:
          null,

        preview:
          null,

        required:
          true

      },

      {

        id:
          'interior',

        title:
          'Vehicle Interior',

        description:
          'Capture a clear image showing the interior of the vehicle.',

        file:
          null,

        preview:
          null,

        required:
          true

      },

      {

        id:
          'engine',

        title:
          'Engine Bay',

        description:
          'Capture a clear image of the engine bay.',

        file:
          null,

        preview:
          null,

        required:
          true

      }

    ];


  ngOnInit():
    void {

    this.route.queryParams.subscribe(

      params => {

        const type =
          params['type'];


        if (

          type === 'accident'

        ) {

          this.inspectionType =
            'accident';


          this.inspectionTitle =
            'Accident Claim Inspection';


          this.inspectionDescription =
            'Document the damage to your vehicle to support your insurance claim.';

        }

        else {

          this.inspectionType =
            'pre-cover';


          this.inspectionTitle =
            'Pre-Cover Vehicle Inspection';


          this.inspectionDescription =
            'Complete this inspection before your vehicle receives full insurance cover.';

        }

      }

    );

  }


  get currentPhoto():
    InspectionPhoto {

    return this.photos[

      this.currentPhotoIndex

    ];

  }


  get completedPhotoCount():
    number {

    return this.photos.filter(

      photo =>
        photo.file !== null

    ).length;

  }


  updatePhotoCompletionStatus():
    void {

    this.allRequiredPhotosComplete =

      this.photos

        .filter(

          photo =>
            photo.required

        )

        .every(

          photo =>
            photo.file !== null

        );

  }


  onPhotoSelected(

    event: Event,

    photo: InspectionPhoto

  ):
    void {

    const input =
      event.target as HTMLInputElement;


    if (

      !input.files ||

      input.files.length === 0

    ) {

      return;

    }


    const file =
      input.files[0];


    photo.file =
      file;


    this.updatePhotoCompletionStatus();


    const reader =
      new FileReader();


    reader.onload =
      () => {

        photo.preview =
          reader.result as string;

      };


    reader.readAsDataURL(

      file

    );

  }


  nextPhoto():
    void {

    if (

      this.currentPhotoIndex <

      this.photos.length - 1

    ) {

      this.currentPhotoIndex++;

    }

  }


  previousPhoto():
    void {

    if (

      this.currentPhotoIndex > 0

    ) {

      this.currentPhotoIndex--;

    }

  }


  goToPhoto(

    index: number

  ):
    void {

    this.currentPhotoIndex =
      index;

  }


  onDamagePhotosSelected(

    event: Event

  ):
    void {

    const input =
      event.target as HTMLInputElement;


    if (

      !input.files

    ) {

      return;

    }


    this.damagePhotos =
      Array.from(

        input.files

      );


    this.damagePhotoPreviews =
      [];


    this.damagePhotos.forEach(

      file => {

        const reader =
          new FileReader();


        reader.onload =
          () => {

            this.damagePhotoPreviews.push(

              reader.result as string

            );

          };


        reader.readAsDataURL(

          file

        );

      }

    );

  }


  submitInspection():
    void {


    if (

      !this.customerForm.valid

    ) {

      alert(

        'Please complete the customer information.'

      );


      return;

    }


    if (

      !this.policyForm.valid

    ) {

      alert(

        'Please complete the policy information.'

      );


      return;

    }


    if (

      !this.vehicleForm.valid

    ) {

      alert(

        'Please complete the vehicle information.'

      );


      return;

    }


    if (

      !this.allRequiredPhotosComplete

    ) {

      alert(

        'Please complete all required vehicle photos before submitting.'

      );


      return;

    }


    this.isSubmitting =
      true;


    const vehicleFiles =

      this.photos

        .filter(

          photo =>
            photo.file !== null

        )

        .map(

          photo =>
            photo.file as File

        );


    const allFiles = [

      ...vehicleFiles,

      ...this.damagePhotos

    ];


    this.inspectionService

      .uploadPhotos(

        allFiles

      )

      .subscribe({

        next:

          (uploadResponse) => {


            const uploadedFiles =
              uploadResponse.files;


            const uploadedVehiclePhotos =

              this.photos

                .filter(

                  photo =>
                    photo.file !== null

                )

                .map(

                  (photo, index) => ({

                    id:
                      photo.id,

                    title:
                      photo.title,

                    fileName:
                      photo.file?.name,

                    fileType:
                      photo.file?.type,

                    fileSize:
                      photo.file?.size,

                    path:
                      uploadedFiles[index]?.path

                  })

                );


            const damageStartIndex =
              vehicleFiles.length;


            const uploadedDamagePhotos =

              this.damagePhotos

                .map(

                  (file, index) => ({

                    fileName:
                      file.name,

                    fileType:
                      file.type,

                    fileSize:
                      file.size,

                    path:

                      uploadedFiles[

                        damageStartIndex + index

                      ]?.path

                  })

                );


            const inspectionData = {

              inspectionType:
                this.inspectionType,

              customer:
                this.customerForm.value,

              policy:
                this.policyForm.value,

              vehicle:
                this.vehicleForm.value,

              vehiclePhotos:
                uploadedVehiclePhotos,

              damagePhotos:
                uploadedDamagePhotos

            };


            this.inspectionService

              .createInspection(

                inspectionData

              )

              .subscribe({

                next:

                  () => {

                    this.isSubmitting =
                      false;


                    this.inspectionSubmitted =
                      true;


                    alert(

                      'Inspection submitted successfully!'

                    );

                  },


                error:

                  (error: any) => {

                    console.error(

                      'Inspection submission failed:',

                      error

                    );


                    this.isSubmitting =
                      false;


                    alert(

                      'There was a problem submitting the inspection. Please try again.'

                    );

                  }

              });

          },


        error:

          (error: any) => {

            console.error(

              'Photo upload failed:',

              error

            );


            this.isSubmitting =
              false;


            alert(

              'There was a problem uploading the photos. Please try again.'

            );

          }

      });

  }

}