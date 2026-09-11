import {
  Injectable,
} from '@angular/core';

import {
  BehaviorSubject,
} from 'rxjs';


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
  firstName?: string;
  lastName?: string;
  surname?: string;
  idNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
}


export interface VehicleDetails {
  registration?: string;
  make?: string;
  model?: string;
  year?: string;
  colour?: string;
  vin?: string;
  mileage?: number;
}


export interface InspectionPhoto {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  uploaded: boolean;
  uploadedAt?: string;
}


export interface Inspection {
  reference: string;

  inspectionType:
    InspectionType;

  type?:
    InspectionType;

  status:
    InspectionStatus;

  createdAt:
    string;

  submittedAt?:
    string;

  customer:
    CustomerDetails;

  vehicle:
    VehicleDetails;

  photos:
    InspectionPhoto[];

  accidentPhotos:
    InspectionPhoto[];
}


@Injectable({
  providedIn: 'root',
})
export class CustomerInspectionService {

  private readonly storageKey =
    'falcon_customer_inspection';


  private readonly inspectionSubject =
    new BehaviorSubject<Inspection | null>(
      this.loadInspection()
    );


  readonly inspection$ =
    this.inspectionSubject.asObservable();


  // =========================================================
  // CURRENT INSPECTION
  // =========================================================

  getInspection():
    Inspection {

    return this.requireInspection();
  }


  getCurrentInspection():
    Inspection {

    return this.requireInspection();
  }


  // =========================================================
  // START NEW INSPECTION
  // =========================================================

  startNewInspection(
    type: InspectionType,
    reference?: string
  ): Inspection {

    const inspection: Inspection = {

      reference:
        reference ??
        this.generateLocalReference(),

      inspectionType:
        type,

      type:
        type,

      status:
        'draft',

      createdAt:
        new Date().toISOString(),

      customer: {
        firstName: '',
        lastName: '',
        surname: '',
        idNumber: '',
        email: '',
        phone: '',
        address: '',
      },

      vehicle: {
        registration: '',
        make: '',
        model: '',
        year: '',
        colour: '',
        vin: '',
        mileage: 0,
      },

      photos:
        this.createSevenPhotoChecklist(
          type
        ),

      accidentPhotos:
        this.createSevenPhotoChecklist(
          type
        ),
    };


    this.setInspection(
      inspection
    );


    return inspection;
  }


  // =========================================================
  // CUSTOMER
  // =========================================================

  updateCustomer(
    customer:
      Partial<CustomerDetails>
  ): void {

    const inspection =
      this.requireInspection();


    inspection.customer = {
      ...inspection.customer,
      ...customer,
    };


    this.setInspection(
      inspection
    );
  }


  // =========================================================
  // VEHICLE
  // =========================================================

  updateVehicle(
    vehicle:
      Partial<VehicleDetails>
  ): void {

    const inspection =
      this.requireInspection();


    inspection.vehicle = {
      ...inspection.vehicle,
      ...vehicle,
    };


    this.setInspection(
      inspection
    );
  }


  // =========================================================
  // PHOTO
  // =========================================================

  updatePhoto(
    photoId: string,
    imageUrl: string
  ): void {

    const inspection =
      this.requireInspection();


    const index =
      inspection.photos.findIndex(
        photo =>
          photo.id === photoId
      );


    if (index === -1) {

      console.error(
        'Falcon: photo slot was not found:',
        photoId
      );

      return;
    }


    const uploadedAt =
      new Date().toISOString();


    /*
     * =======================================================
     * UPDATE LIVE PRIMARY PHOTO
     * =======================================================
     *
     * The actual image remains in the live Angular state.
     */
    inspection.photos[index] = {
      ...inspection.photos[index],

      imageUrl,

      uploaded:
        true,

      uploadedAt,
    };


    /*
     * =======================================================
     * UPDATE COMPATIBILITY COLLECTION
     * =======================================================
     */
    const accidentIndex =
      inspection.accidentPhotos.findIndex(
        photo =>
          photo.id === photoId
      );


    if (accidentIndex !== -1) {

      inspection.accidentPhotos[accidentIndex] = {
        ...inspection.accidentPhotos[accidentIndex],

        imageUrl,

        uploaded:
          true,

        uploadedAt,
      };
    }


    /*
     * =======================================================
     * UPDATE STATUS
     * =======================================================
     */
    if (
      inspection.status ===
      'draft'
    ) {

      inspection.status =
        'in-progress';
    }


    /*
     * =======================================================
     * UPDATE LIVE STATE FIRST
     * =======================================================
     */
    this.inspectionSubject.next(
      inspection
    );


    /*
     * =======================================================
     * SAVE ONLY LIGHTWEIGHT METADATA
     * =======================================================
     *
     * IMPORTANT:
     *
     * saveInspection() deliberately removes imageUrl before
     * writing to localStorage.
     *
     * This prevents large camera images from freezing the
     * browser or exceeding localStorage quota.
     */
    this.saveInspection(
      inspection
    );
  }


  // =========================================================
  // ACCIDENT PHOTO COMPATIBILITY
  // =========================================================

  updateAccidentPhoto(
    photoId: string,
    imageUrl: string
  ): void {

    const inspection =
      this.requireInspection();


    const index =
      inspection.accidentPhotos.findIndex(
        photo =>
          photo.id === photoId
      );


    if (index === -1) {

      console.error(
        'Falcon: accident photo slot was not found:',
        photoId
      );

      return;
    }


    const uploadedAt =
      new Date().toISOString();


    inspection.accidentPhotos[index] = {
      ...inspection.accidentPhotos[index],

      imageUrl,

      uploaded:
        true,

      uploadedAt,
    };


    /*
     * Keep primary collection synchronized.
     */
    const primaryIndex =
      inspection.photos.findIndex(
        photo =>
          photo.id === photoId
      );


    if (primaryIndex !== -1) {

      inspection.photos[primaryIndex] = {
        ...inspection.photos[primaryIndex],

        imageUrl,

        uploaded:
          true,

        uploadedAt,
      };
    }


    if (
      inspection.status ===
      'draft'
    ) {

      inspection.status =
        'in-progress';
    }


    this.inspectionSubject.next(
      inspection
    );


    this.saveInspection(
      inspection
    );
  }


  // =========================================================
  // COMPLETED PHOTO COUNT
  // =========================================================

  getCompletedPhotos(): number {

    const inspection =
      this.requireInspection();


    return inspection.photos.filter(
      photo =>
        photo.uploaded &&
        !!photo.imageUrl
    ).length;
  }


  // =========================================================
  // TOTAL PHOTO COUNT
  // =========================================================

  getTotalPhotos(): number {

    return 7;
  }


  // =========================================================
  // PROGRESS
  // =========================================================

  getProgress(): number {

    const total =
      this.getTotalPhotos();


    if (total === 0) {
      return 0;
    }


    return Math.round(
      (
        this.getCompletedPhotos() /
        total
      ) * 100
    );
  }


  // =========================================================
  // ALL PHOTOS COMPLETE
  // =========================================================

  areAllPhotosComplete(): boolean {

    const inspection =
      this.requireInspection();


    return (
      inspection.photos.length === 7 &&
      inspection.photos.every(
        photo =>
          photo.uploaded &&
          !!photo.imageUrl
      )
    );
  }


  // =========================================================
  // STATUS
  // =========================================================

  setStatus(
    status: InspectionStatus
  ): void {

    const inspection =
      this.requireInspection();


    inspection.status =
      status;


    if (
      status ===
      'submitted'
    ) {

      inspection.submittedAt =
        new Date().toISOString();
    }


    this.setInspection(
      inspection
    );
  }


  // =========================================================
  // EXACTLY 7 PHOTO CHECKLIST
  // =========================================================

  private createSevenPhotoChecklist(
    type:
      InspectionType = 'pre-cover'
  ):
    InspectionPhoto[] {

    if (
      type === 'accident'
    ) {

      return [

        {
          id:
            'front',

          title:
            'Front of Vehicle',

          description:
            'Capture a complete front view showing the vehicle and any visible accident damage.',

          imageUrl:
            null,

          uploaded:
            false,
        },

        {
          id:
            'rear',

          title:
            'Rear of Vehicle',

          description:
            'Capture a complete rear view showing the vehicle and any visible accident damage.',

          imageUrl:
            null,

          uploaded:
            false,
        },

        {
          id:
            'left',

          title:
            'Left Side',

          description:
            'Capture the complete left side and any visible impact damage.',

          imageUrl:
            null,

          uploaded:
            false,
        },

        {
          id:
            'right',

          title:
            'Right Side',

          description:
            'Capture the complete right side and any visible impact damage.',

          imageUrl:
            null,

          uploaded:
            false,
        },

        {
          id:
            'damage-close',

          title:
            'Damage Close-up',

          description:
            'Capture a clear close-up of the main damaged or impacted area.',

          imageUrl:
            null,

          uploaded:
            false,
        },

        {
          id:
            'damage-wide',

          title:
            'Damage Wider View',

          description:
            'Capture a wider view showing the full extent and location of the damage.',

          imageUrl:
            null,

          uploaded:
            false,
        },

        {
          id:
            'accident-scene',

          title:
            'Accident Scene',

          description:
            'Capture the relevant accident scene or surrounding area where appropriate.',

          imageUrl:
            null,

          uploaded:
            false,
        },

      ];
    }


    // =======================================================
    // PRE-COVER
    // =======================================================

    return [

      {
        id:
          'front',

        title:
          'Front of Vehicle',

        description:
          'Capture a complete, clear front view of the vehicle.',

        imageUrl:
          null,

        uploaded:
          false,
      },

      {
        id:
          'rear',

        title:
          'Rear of Vehicle',

        description:
          'Capture a complete, clear rear view of the vehicle.',

        imageUrl:
          null,

        uploaded:
          false,
      },

      {
        id:
          'left',

        title:
          'Left Side',

        description:
          'Capture the complete left side of the vehicle.',

        imageUrl:
          null,

        uploaded:
          false,
      },

      {
        id:
          'right',

        title:
          'Right Side',

        description:
          'Capture the complete right side of the vehicle.',

        imageUrl:
          null,

        uploaded:
          false,
      },

      {
        id:
          'odometer',

        title:
          'Odometer Reading',

        description:
          'Capture a clear photo showing the current odometer reading.',

        imageUrl:
          null,

        uploaded:
          false,
      },

      {
        id:
          'windscreen',

        title:
          'Windscreen',

        description:
          'Capture a clear photo of the windscreen, including any visible chips or cracks.',

        imageUrl:
          null,

        uploaded:
          false,
      },

      {
        id:
          'vehicle-interior',

        title:
          'Vehicle Interior',

        description:
          'Capture a clear photograph of the vehicle interior and dashboard area.',

        imageUrl:
          null,

        uploaded:
          false,
      },

    ];
  }


  // =========================================================
  // STATE
  // =========================================================

  private setInspection(
    inspection:
      Inspection
  ): void {

    /*
     * Update Angular state immediately.
     */
    this.inspectionSubject.next(
      inspection
    );


    /*
     * Persist only metadata.
     */
    this.saveInspection(
      inspection
    );
  }


  // =========================================================
  // LOCAL STORAGE
  // =========================================================

  private saveInspection(
    inspection:
      Inspection
  ): void {

    try {

      /*
       * =====================================================
       * VERY IMPORTANT
       * =====================================================
       *
       * Never put the actual image/base64 data into
       * localStorage.
       *
       * Camera images can easily be several megabytes.
       *
       * We only persist:
       *
       * - photo ID
       * - title
       * - description
       * - uploaded state
       * - uploadedAt
       *
       * The real image remains in the live inspection object
       * and is therefore still available to Review/Submit
       * during the current customer session.
       */
      const storageInspection:
        Inspection = {

        ...inspection,

        photos:
          inspection.photos.map(
            photo => ({

              id:
                photo.id,

              title:
                photo.title,

              description:
                photo.description,

              imageUrl:
                null,

              uploaded:
                photo.uploaded,

              uploadedAt:
                photo.uploadedAt,
            })
          ),

        accidentPhotos:
          inspection.accidentPhotos.map(
            photo => ({

              id:
                photo.id,

              title:
                photo.title,

              description:
                photo.description,

              imageUrl:
                null,

              uploaded:
                photo.uploaded,

              uploadedAt:
                photo.uploadedAt,
            })
          ),
      };


      localStorage.setItem(
        this.storageKey,
        JSON.stringify(
          storageInspection
        )
      );


    } catch (error) {

      /*
       * LocalStorage failure must never break the
       * customer inspection workflow.
       */
      console.warn(
        'Falcon: unable to persist inspection metadata to localStorage.',
        error
      );
    }
  }


  // =========================================================
  // LOAD INSPECTION
  // =========================================================

  private loadInspection():
    Inspection | null {

    try {

      const stored =
        localStorage.getItem(
          this.storageKey
        );


      if (!stored) {
        return null;
      }


      const inspection =
        JSON.parse(
          stored
        ) as Inspection;


      // ------------------------------------------------------
      // Compatibility
      // ------------------------------------------------------

      if (
        !inspection.inspectionType &&
        inspection.type
      ) {

        inspection.inspectionType =
          inspection.type;
      }


      if (
        !inspection.type &&
        inspection.inspectionType
      ) {

        inspection.type =
          inspection.inspectionType;
      }


      if (
        !inspection.customer
      ) {

        inspection.customer = {};
      }


      if (
        !inspection.vehicle
      ) {

        inspection.vehicle = {};
      }


      const type =
        inspection.inspectionType ??
        'pre-cover';


      // ------------------------------------------------------
      // NORMALIZE PHOTOS
      // ------------------------------------------------------

      const oldPhotos =
        Array.isArray(
          inspection.photos
        )
          ? inspection.photos
          : [];


      const oldAccidentPhotos =
        Array.isArray(
          inspection.accidentPhotos
        )
          ? inspection.accidentPhotos
          : [];


      const sevenPhotos =
        this.createSevenPhotoChecklist(
          type
        );


      /*
       * Restore metadata only.
       *
       * Images are intentionally not restored because they
       * are no longer stored in localStorage.
       */
      sevenPhotos.forEach(
        photo => {

          const existing =
            oldPhotos.find(
              oldPhoto =>
                oldPhoto.id === photo.id
            )
            ??
            oldAccidentPhotos.find(
              oldPhoto =>
                oldPhoto.id === photo.id
            );


          if (existing) {

            photo.imageUrl =
              null;

            photo.uploaded =
              !!existing.uploaded;

            photo.uploadedAt =
              existing.uploadedAt;
          }
        }
      );


      inspection.photos =
        sevenPhotos;


      inspection.accidentPhotos =
        sevenPhotos.map(
          photo => ({
            ...photo,
            imageUrl:
              null,
          })
        );


      // ------------------------------------------------------
      // VEHICLE COMPATIBILITY
      // ------------------------------------------------------

      if (
        inspection.vehicle.mileage !== undefined &&
        typeof inspection.vehicle.mileage !== 'number'
      ) {

        const mileage =
          Number(
            inspection.vehicle.mileage
          );


        inspection.vehicle.mileage =
          Number.isFinite(mileage)
            ? mileage
            : 0;
      }


      if (
        inspection.vehicle.year !== undefined
      ) {

        inspection.vehicle.year =
          String(
            inspection.vehicle.year
          );
      }


      /*
       * Normalize storage.
       */
      this.saveInspection(
        inspection
      );


      return inspection;

    } catch (error) {

      console.error(
        'Failed to load Falcon inspection:',
        error
      );


      return null;
    }
  }


  // =========================================================
  // CLEAR INSPECTION
  // =========================================================

  clearInspection(): void {

    this.inspectionSubject.next(
      null
    );


    try {

      localStorage.removeItem(
        this.storageKey
      );

    } catch (error) {

      console.error(
        'Failed to clear Falcon inspection:',
        error
      );
    }
  }


  // =========================================================
  // HELPERS
  // =========================================================

  private requireInspection():
    Inspection {

    const inspection =
      this.inspectionSubject.value;


    if (!inspection) {

      throw new Error(
        'No active Falcon inspection exists.'
      );
    }


    return inspection;
  }


  private generateLocalReference():
    string {

    return (
      'LOCAL-' +
      Math.random()
        .toString(36)
        .substring(2, 14)
        .toUpperCase()
    );
  }
}