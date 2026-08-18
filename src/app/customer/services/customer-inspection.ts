import {
  Injectable
} from '@angular/core';


export type InspectionType =
  | 'pre-cover'
  | 'accident';


export type InspectionStatus =
  | 'draft'
  | 'in-progress'
  | 'review'
  | 'submitted'
  | 'completed';


export interface CustomerDetails {

  firstName: string;

  lastName: string;

  phone: string;

  email: string;
}


export interface VehicleDetails {

  registration: string;

  vin: string;

  make: string;

  model: string;

  year: string;

  colour: string;

  mileage: number | null;
}


export interface InspectionPhoto {

  id: string;

  title: string;

  description: string;

  imageUrl: string | null;

  uploaded: boolean;

  uploadedAt?: Date;
}


export interface Inspection {

  reference: string;

  inspectionType: InspectionType;

  status: InspectionStatus;

  createdAt: Date;

  submittedAt?: Date;

  customer: CustomerDetails;

  vehicle: VehicleDetails;

  photos: InspectionPhoto[];

  accidentPhotos: InspectionPhoto[];
}


@Injectable({
  providedIn: 'root'
})
export class CustomerInspectionService {


  /*
   * =========================================================
   * CURRENT CUSTOMER INSPECTION
   * =========================================================
   */

  private inspection:
    Inspection =
    this.createInspection(
      'pre-cover'
    );


  /*
   * =========================================================
   * CREATE CLEAN INSPECTION
   * =========================================================
   */

  private createInspection(
    type: InspectionType,
    reference?: string
  ): Inspection {

    return {

      /*
       * If a reference was supplied by the admin request,
       * ALWAYS use it.
       *
       * Only generate a reference when this is a completely
       * independent customer inspection.
       */

      reference:
        reference ??
        this.generateReference(),

      inspectionType:
        type,

      status:
        'draft',

      createdAt:
        new Date(),

      customer: {

        firstName:
          '',

        lastName:
          '',

        phone:
          '',

        email:
          ''
      },

      vehicle: {

        registration:
          '',

        vin:
          '',

        make:
          '',

        model:
          '',

        year:
          '',

        colour:
          '',

        mileage:
          null
      },

      photos:
        this.createVehicleChecklist(),

      accidentPhotos:
        this.createAccidentChecklist()
    };
  }


  /*
   * =========================================================
   * VEHICLE CHECKLIST
   * =========================================================
   */

  private createVehicleChecklist():
    InspectionPhoto[] {

    const photos:
      Array<
        [string, string, string]
      > = [

      [
        'front',
        'Front',
        'Capture complete front view'
      ],

      [
        'rear',
        'Rear',
        'Capture complete rear view'
      ],

      [
        'left',
        'Left Side',
        'Capture left side'
      ],

      [
        'right',
        'Right Side',
        'Capture right side'
      ],

      [
        'front-left',
        'Front Left Corner',
        'Capture front left corner'
      ],

      [
        'front-right',
        'Front Right Corner',
        'Capture front right corner'
      ],

      [
        'rear-left',
        'Rear Left Corner',
        'Capture rear left corner'
      ],

      [
        'rear-right',
        'Rear Right Corner',
        'Capture rear right corner'
      ],

      [
        'vin',
        'VIN Plate',
        'Capture VIN plate'
      ],

      [
        'odometer',
        'Odometer',
        'Capture mileage'
      ],

      [
        'engine',
        'Engine Bay',
        'Capture engine compartment'
      ],

      [
        'interior',
        'Interior',
        'Capture interior'
      ]
    ];


    return photos.map(
      (
        [
          id,
          title,
          description
        ]
      ) => ({

        id,

        title,

        description,

        imageUrl:
          null,

        uploaded:
          false
      })
    );
  }


  /*
   * =========================================================
   * ACCIDENT CHECKLIST
   * =========================================================
   */

  private createAccidentChecklist():
    InspectionPhoto[] {

    return [

      {

        id:
          'damage',

        title:
          'Damage Area',

        description:
          'Capture damaged areas clearly',

        imageUrl:
          null,

        uploaded:
          false
      },

      {

        id:
          'accident-location',

        title:
          'Accident Location',

        description:
          'Capture where the accident occurred',

        imageUrl:
          null,

        uploaded:
          false
      },

      {

        id:
          'warning-lights',

        title:
          'Dashboard Warning Lights',

        description:
          'Capture dashboard warning lights',

        imageUrl:
          null,

        uploaded:
          false
      }
    ];
  }


  /*
   * =========================================================
   * GENERATE NEW REFERENCE
   * =========================================================
   */

  private generateReference(): string {

    const year =
      new Date().getFullYear();


    const number =
      Math.floor(
        100000 +
        Math.random() *
        900000
      );


    return `FAL-${year}-${number}`;
  }


  /*
   * =========================================================
   * GET INSPECTION
   * =========================================================
   */

  getInspection():
    Inspection {

    return this.inspection;
  }


  /*
   * =========================================================
   * GET REFERENCE
   * =========================================================
   */

  getReference():
    string {

    return this.inspection.reference;
  }


  /*
   * =========================================================
   * START NEW INSPECTION
   * =========================================================
   *
   * THIS IS THE IMPORTANT RESET.
   *
   * Every call destroys the old customer inspection.
   *
   * Therefore:
   *
   * previous vehicle = removed
   * previous photos = removed
   * previous accident photos = removed
   * previous customer data = removed
   * previous submitted state = removed
   *
   * If a reference is supplied, it is preserved.
   */

  startNewInspection(
    type: InspectionType,
    reference?: string
  ): void {

    console.log(
      'STARTING FRESH CUSTOMER INSPECTION',
      {
        type,
        reference
      }
    );


    this.inspection =
      this.createInspection(
        type,
        reference
      );


    console.log(
      'FRESH CUSTOMER INSPECTION:',
      this.inspection
    );
  }


  /*
   * =========================================================
   * RESET
   * =========================================================
   */

  resetInspection(
    type:
      InspectionType =
      'pre-cover',

    reference?:
      string
  ): void {

    this.startNewInspection(
      type,
      reference
    );
  }


  /*
   * =========================================================
   * CUSTOMER
   * =========================================================
   */

  updateCustomer(
    customer: CustomerDetails
  ): void {

    this.inspection.customer = {

      firstName:
        customer.firstName ??
        '',

      lastName:
        customer.lastName ??
        '',

      phone:
        customer.phone ??
        '',

      email:
        customer.email ??
        ''
    };


    this.inspection.status =
      'in-progress';
  }


  /*
   * =========================================================
   * VEHICLE
   * =========================================================
   */

  updateVehicle(
    vehicle: VehicleDetails
  ): void {

    this.inspection.vehicle = {

      registration:
        vehicle.registration ??
        '',

      vin:
        vehicle.vin ??
        '',

      make:
        vehicle.make ??
        '',

      model:
        vehicle.model ??
        '',

      year:
        vehicle.year ??
        '',

      colour:
        vehicle.colour ??
        '',

      mileage:
        vehicle.mileage ??
        null
    };


    this.inspection.status =
      'in-progress';
  }


  /*
   * =========================================================
   * VEHICLE PHOTO
   * =========================================================
   */

  updatePhoto(
    id: string,
    imageUrl: string
  ): void {

    const photo =
      this.inspection.photos.find(
        p =>
          p.id === id
      );


    if (!photo) {

      return;
    }


    photo.imageUrl =
      imageUrl;

    photo.uploaded =
      true;

    photo.uploadedAt =
      new Date();


    this.inspection.status =
      'in-progress';
  }


  /*
   * =========================================================
   * ACCIDENT PHOTO
   * =========================================================
   */

  updateAccidentPhoto(
    id: string,
    imageUrl: string
  ): void {

    const photo =
      this.inspection
        .accidentPhotos
        .find(
          p =>
            p.id === id
        );


    if (!photo) {

      return;
    }


    photo.imageUrl =
      imageUrl;

    photo.uploaded =
      true;

    photo.uploadedAt =
      new Date();


    this.inspection.status =
      'in-progress';
  }


  /*
   * =========================================================
   * PHOTO COUNTS
   * =========================================================
   */

  getCompletedPhotos():
    number {

    return this.inspection
      .photos
      .filter(
        p =>
          p.uploaded
      )
      .length;
  }


  getTotalPhotos():
    number {

    return this.inspection
      .photos
      .length;
  }


  getCompletedAccidentPhotos():
    number {

    return this.inspection
      .accidentPhotos
      .filter(
        p =>
          p.uploaded
      )
      .length;
  }


  getTotalAccidentPhotos():
    number {

    return this.inspection
      .accidentPhotos
      .length;
  }


  /*
   * =========================================================
   * PROGRESS
   * =========================================================
   */

  getProgress():
    number {

    const vehicleCompleted =
      this.getCompletedPhotos();


    const vehicleTotal =
      this.getTotalPhotos();


    if (
      this.inspection
        .inspectionType ===
      'accident'
    ) {

      const accidentCompleted =
        this.getCompletedAccidentPhotos();


      const accidentTotal =
        this.getTotalAccidentPhotos();


      const completed =
        vehicleCompleted +
        accidentCompleted;


      const total =
        vehicleTotal +
        accidentTotal;


      if (
        total === 0
      ) {

        return 0;
      }


      return Math.round(
        (
          completed /
          total
        ) * 100
      );
    }


    if (
      vehicleTotal === 0
    ) {

      return 0;
    }


    return Math.round(
      (
        vehicleCompleted /
        vehicleTotal
      ) * 100
    );
  }


  /*
   * =========================================================
   * SET TYPE
   * =========================================================
   *
   * Changing type means starting a completely
   * new inspection.
   */

  setInspectionType(
    type: InspectionType
  ): void {

    this.startNewInspection(
      type
    );
  }


  /*
   * =========================================================
   * STATUS
   * =========================================================
   */

  setStatus(
    status: InspectionStatus
  ): void {

    this.inspection.status =
      status;


    if (
      status === 'submitted'
    ) {

      this.inspection.submittedAt =
        new Date();
    }
  }
}