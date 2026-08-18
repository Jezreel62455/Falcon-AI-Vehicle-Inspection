import {
  Injectable,
  inject
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  of,
  throwError
} from 'rxjs';

import {
  catchError
} from 'rxjs/operators';


/* =========================================================
   INSPECTION TYPES
   ========================================================= */

export type InspectionType =
  | 'pre-cover'
  | 'accident';


export type InspectionInputType =
  | 'pre-cover'
  | 'accident'
  | 'pre_cover'
  | 'accident-claim';


/* =========================================================
   INSPECTION STATUS
   ========================================================= */

export type InspectionStatus =
  | 'pending'
  | 'draft'
  | 'in-progress'
  | 'review'
  | 'submitted'
  | 'completed';


/* =========================================================
   CUSTOMER
   ========================================================= */

export interface Customer {

  firstName: string;

  surname?: string;

  lastName?: string;

  email?: string;

  phone?: string;
}


/* =========================================================
   VEHICLE
   ========================================================= */

export interface Vehicle {

  make?: string;

  model?: string;

  year?: string | number;

  registration?: string;

  colour?: string;

  mileage?: string | number;

  vin?: string;
}


/* =========================================================
   POLICY
   ========================================================= */

export interface Policy {

  policyNumber?: string;

  insuranceCompany?: string;

  claimNumber?: string;
}


/* =========================================================
   AI
   ========================================================= */

export interface InspectionAI {

  status?: string;

  score?: number | null;

  vin?: string;

  damageDetected?: boolean;

  provider?: string;

  damageSummary?: string;
}


/* =========================================================
   VEHICLE PHOTO
   ========================================================= */

export interface InspectionPhoto {

  id: string;

  label?: string;

  name?: string;

  title?: string;

  imageUrl?: string;

  url?: string;

  path?: string;

  fileName?: string;

  fileType?: string;

  fileSize?: number;

  uploaded?: boolean;

  required?: boolean;
}


/* =========================================================
   ACCIDENT PHOTO
   ========================================================= */

export interface AccidentPhoto {

  id: string;

  label?: string;

  name?: string;

  title?: string;

  imageUrl?: string;

  url?: string;

  path?: string;

  fileName?: string;

  fileType?: string;

  fileSize?: number;

  uploaded?: boolean;

  required?: boolean;
}


/* =========================================================
   MAIN INSPECTION
   ========================================================= */

export interface Inspection {

  id?: string;

  reference: string;


  /* ---------------------------------------------------------
     INSPECTION TYPE
     --------------------------------------------------------- */

  inspectionType: InspectionType;

  /**
   * Legacy compatibility.
   *
   * Older pages were using inspection.type.
   * Keep this optional so those pages compile.
   */
  type?: InspectionType;


  /* ---------------------------------------------------------
     STATUS
     --------------------------------------------------------- */

  status: InspectionStatus;


  /* ---------------------------------------------------------
     DATES
     --------------------------------------------------------- */

  createdAt: string;

  updatedAt?: string;

  submittedAt?: string;


  /* ---------------------------------------------------------
     CUSTOMER
     --------------------------------------------------------- */

  customer: Customer;

  customerFirstName?: string;

  customerSurname?: string;

  customerLastName?: string;

  customerEmail?: string;

  customerPhone?: string;

  customerName?: string;


  /* ---------------------------------------------------------
     VEHICLE
     --------------------------------------------------------- */

  vehicle: Vehicle;

  make?: string;

  model?: string;

  year?: string | number;

  registration?: string;

  colour?: string;

  mileage?: string | number;

  vin?: string;


  /* ---------------------------------------------------------
     PHOTOS
     --------------------------------------------------------- */

  photos: InspectionPhoto[];

  accidentPhotos: AccidentPhoto[];

  damagePhotos?: AccidentPhoto[];


  /* ---------------------------------------------------------
     POLICY
     --------------------------------------------------------- */

  policy?: Policy;

  policyNumber?: string;

  claimNumber?: string;

  insuranceCompany?: string;


  /* ---------------------------------------------------------
     AI
     --------------------------------------------------------- */

  ai?: InspectionAI;


  /* ---------------------------------------------------------
     LINKS
     --------------------------------------------------------- */

  inspectionUrl?: string;

  secureLink?: string;
}


/* =========================================================
   CREATE REQUEST PAYLOAD
   ========================================================= */

export interface CreateInspectionRequestPayload {

  inspectionType: InspectionInputType;


  /* ---------------------------------------------------------
     STATUS
     --------------------------------------------------------- */

  status?: InspectionStatus | string | null;


  /* ---------------------------------------------------------
     REFERENCE
     --------------------------------------------------------- */

  reference?: string | null;


  /* ---------------------------------------------------------
     NESTED CUSTOMER / VEHICLE / POLICY
     --------------------------------------------------------- */

  customer?: Customer | null;

  vehicle?: Vehicle | null;

  policy?: Policy | null;


  /* ---------------------------------------------------------
     POLICY
     --------------------------------------------------------- */

  policyNumber?: string | null;

  claimNumber?: string | null;

  insuranceCompany?: string | null;


  /* ---------------------------------------------------------
     CUSTOMER
     --------------------------------------------------------- */

  customerFirstName?: string | null;

  customerSurname?: string | null;

  customerLastName?: string | null;

  customerEmail?: string | null;

  customerPhone?: string | null;


  /* ---------------------------------------------------------
     VEHICLE - NESTED STYLE
     --------------------------------------------------------- */

  vehicleMake?: string | null;

  vehicleModel?: string | null;

  vehicleYear?: string | number | null;

  vehicleRegistration?: string | null;

  vehicleColour?: string | null;

  vehicleMileage?: string | number | null;

  vehicleVin?: string | null;


  /* ---------------------------------------------------------
     VEHICLE - LEGACY FLAT STYLE
     --------------------------------------------------------- */

  make?: string | null;

  model?: string | null;

  year?: string | number | null;

  registration?: string | null;

  colour?: string | null;

  mileage?: string | number | null;

  vin?: string | null;


  /* ---------------------------------------------------------
     PHOTOS
     --------------------------------------------------------- */

  photos?: unknown[];

  accidentPhotos?: unknown[];

  damagePhotos?: unknown[];
}


/* =========================================================
   BACKWARDS COMPATIBILITY
   ========================================================= */

export type CreateInspectionRequest =
  CreateInspectionRequestPayload;


/* =========================================================
   CREATE RESPONSE
   ========================================================= */

export interface CreateInspectionResponse {

  id?: string;

  reference: string;

  inspectionType: InspectionType;

  status?: InspectionStatus | string;

  createdAt?: string;

  inspectionUrl?: string;

  secureLink?: string;

  url?: string;

  inspection?: Inspection;
}


/* =========================================================
   UPLOAD RESPONSE
   ========================================================= */

export interface UploadPhotoResponse {

  files?: Array<{

    id?: string;

    path?: string;

    url?: string;

    imageUrl?: string;

    fileName?: string;

    fileType?: string;

    fileSize?: number;

  }>;

  [key: string]: unknown;
}


/* =========================================================
   SERVICE
   ========================================================= */

@Injectable({
  providedIn: 'root'
})
export class InspectionService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    'http://localhost:3000/inspections';


  /* =======================================================
     NORMALISE INSPECTION TYPE
     ======================================================= */

  normalizeInspectionType(
    type:
      | InspectionInputType
      | string
      | null
      | undefined
  ): InspectionType {

    switch (type) {

      case 'accident':
      case 'accident-claim':

        return 'accident';


      case 'pre-cover':
      case 'pre_cover':

        return 'pre-cover';


      default:

        return 'pre-cover';
    }
  }


  /* =======================================================
     NORMALISE STATUS
     ======================================================= */

  normalizeInspectionStatus(
    status:
      | InspectionStatus
      | string
      | null
      | undefined
  ): InspectionStatus {

    switch (
      String(status ?? '')
        .toLowerCase()
        .trim()
    ) {

      case 'completed':
        return 'completed';

      case 'submitted':
        return 'submitted';

      case 'review':
      case 'under-review':
      case 'under review':
        return 'review';

      case 'in-progress':
      case 'inprogress':
      case 'in progress':
        return 'in-progress';

      case 'draft':
        return 'draft';

      case 'pending':
        return 'pending';

      default:
        return 'pending';
    }
  }


  /* =======================================================
     NORMALISE INSPECTION
     ======================================================= */

  normalizeInspection(
    inspection: Inspection
  ): Inspection {

    const customer =
      inspection.customer ?? {
        firstName: ''
      };


    const vehicle =
      inspection.vehicle ?? {};


    const inspectionType =
      this.normalizeInspectionType(
        inspection.inspectionType ??
        inspection.type
      );


    const status =
      this.normalizeInspectionStatus(
        inspection.status
      );


    const photos =
      inspection.photos ?? [];


    const accidentPhotos =
      inspection.accidentPhotos ??
      inspection.damagePhotos ??
      [];


    /* -------------------------------------------------------
       CUSTOMER
       ------------------------------------------------------- */

    const firstName =
      inspection.customerFirstName ??
      customer.firstName ??
      '';


    const surname =
      inspection.customerSurname ??
      customer.surname ??
      customer.lastName ??
      '';


    const email =
      inspection.customerEmail ??
      customer.email ??
      '';


    const phone =
      inspection.customerPhone ??
      customer.phone ??
      '';


    /* -------------------------------------------------------
       VEHICLE
       ------------------------------------------------------- */

    const make =
      inspection.make ??
      vehicle.make ??
      '';


    const model =
      inspection.model ??
      vehicle.model ??
      '';


    const year =
      inspection.year ??
      vehicle.year ??
      '';


    const registration =
      inspection.registration ??
      vehicle.registration ??
      '';


    const colour =
      inspection.colour ??
      vehicle.colour ??
      '';


    const mileage =
      inspection.mileage ??
      vehicle.mileage ??
      '';


    const vin =
      inspection.vin ??
      vehicle.vin ??
      '';


    /* -------------------------------------------------------
       RETURN NORMALISED INSPECTION
       ------------------------------------------------------- */

    return {

      ...inspection,

      inspectionType,

      type: inspectionType,

      status,

      updatedAt:
        inspection.updatedAt ??
        inspection.createdAt,


      /* CUSTOMER */

      customer: {

        ...customer,

        firstName,

        surname:
          surname || undefined,

        lastName:
          surname || undefined,

        email:
          email || undefined,

        phone:
          phone || undefined
      },


      customerFirstName:
        firstName || undefined,

      customerSurname:
        surname || undefined,

      customerLastName:
        surname || undefined,

      customerEmail:
        email || undefined,

      customerPhone:
        phone || undefined,


      /* VEHICLE */

      vehicle: {

        ...vehicle,

        make,

        model,

        year,

        registration,

        colour,

        mileage,

        vin
      },


      make,

      model,

      year,

      registration,

      colour,

      mileage,

      vin,


      /* POLICY */

      policy: {

        ...(inspection.policy ?? {}),

        policyNumber:
          inspection.policy?.policyNumber ??
          inspection.policyNumber,

        claimNumber:
          inspection.policy?.claimNumber ??
          inspection.claimNumber,

        insuranceCompany:
          inspection.policy?.insuranceCompany ??
          inspection.insuranceCompany
      },


      policyNumber:
        inspection.policyNumber ??
        inspection.policy?.policyNumber,

      claimNumber:
        inspection.claimNumber ??
        inspection.policy?.claimNumber,

      insuranceCompany:
        inspection.insuranceCompany ??
        inspection.policy?.insuranceCompany,


      /* PHOTOS */

      photos,

      accidentPhotos,

      damagePhotos:
        accidentPhotos,


      /* AI */

      ai:
        inspection.ai ?? undefined
    };
  }


  /* =======================================================
     GET ALL
     ======================================================= */

  getInspections():
    Observable<Inspection[]> {

    return this.http
      .get<Inspection[]>(
        this.apiUrl
      )
      .pipe(

        catchError(error => {

          console.error(
            'Failed to load inspections:',
            error
          );

          return of([]);
        })

      );
  }


  /* =======================================================
     GET SINGLE
     ======================================================= */

  getInspection(
    idOrReference: string
  ): Observable<Inspection> {

    return this.http
      .get<Inspection>(
        `${this.apiUrl}/${encodeURIComponent(idOrReference)}`
      )
      .pipe(

        catchError(error => {

          console.error(
            'Failed to load inspection:',
            error
          );

          return throwError(
            () => error
          );
        })

      );
  }


  /* =======================================================
     GET BY ID
     ======================================================= */

  getInspectionById(
    id: string
  ): Observable<Inspection> {

    return this.getInspection(id);
  }


  /* =======================================================
     GET BY REFERENCE
     ======================================================= */

  getInspectionByReference(
    reference: string
  ): Observable<Inspection> {

    return this.http
      .get<Inspection>(
        `${this.apiUrl}/reference/${encodeURIComponent(reference)}`
      )
      .pipe(

        catchError(error => {

          console.error(
            'Failed to load inspection by reference:',
            error
          );

          return throwError(
            () => error
          );
        })

      );
  }


  /* =======================================================
     CREATE
     ======================================================= */

  createInspection(
    payload: CreateInspectionRequestPayload
  ): Observable<CreateInspectionResponse> {

    const inspectionType =
      this.normalizeInspectionType(
        payload.inspectionType
      );


    const requestPayload = {

      ...payload,

      inspectionType,

      /*
       * The backend can receive the status if supplied.
       * If omitted, backend controls the initial status.
       */
      ...(payload.status !== undefined
        ? {
            status:
              this.normalizeInspectionStatus(
                payload.status
              )
          }
        : {})

    };


    return this.http
      .post<CreateInspectionResponse>(
        this.apiUrl,
        requestPayload
      )
      .pipe(

        catchError(error => {

          console.error(
            'Failed to create inspection:',
            error
          );

          return throwError(
            () => error
          );
        })

      );
  }


  /* =======================================================
     CREATE REQUEST
     ======================================================= */

  createRequest(
    payload: CreateInspectionRequestPayload
  ): Observable<CreateInspectionResponse> {

    return this.createInspection(
      payload
    );
  }


  /* =======================================================
     UPDATE
     ======================================================= */

  updateInspection(
    id: string,

    data:
      | Partial<Inspection>
      | Record<string, unknown>
  ): Observable<Inspection> {

    return this.http
      .patch<Inspection>(
        `${this.apiUrl}/${encodeURIComponent(id)}`,
        data
      )
      .pipe(

        catchError(error => {

          console.error(
            'Failed to update inspection:',
            error
          );

          return throwError(
            () => error
          );
        })

      );
  }


  /* =======================================================
     DELETE
     ======================================================= */

  deleteInspection(
    id: string
  ): Observable<void> {

    return this.http
      .delete<void>(
        `${this.apiUrl}/${encodeURIComponent(id)}`
      )
      .pipe(

        catchError(error => {

          console.error(
            'Failed to delete inspection:',
            error
          );

          return throwError(
            () => error
          );
        })

      );
  }


  /* =======================================================
     UPLOAD PHOTOS
     
     Supports BOTH:
     
       uploadPhotos(files, inspectionId)

     AND:

       uploadPhotos(inspectionId, files)
     ======================================================= */

  uploadPhotos(
    files: File[],
    inspectionId: string
  ): Observable<UploadPhotoResponse>;

  uploadPhotos(
    inspectionId: string,
    files: File[]
  ): Observable<UploadPhotoResponse>;

  uploadPhotos(
    first: File[] | string,
    second: File[] | string
  ): Observable<UploadPhotoResponse> {

    let files: File[];

    let inspectionId: string;


    if (Array.isArray(first)) {

      files = first;

      inspectionId =
        second as string;

    } else {

      inspectionId =
        first;

      files =
        second as File[];

    }


    return this.performPhotoUpload(
      files,
      inspectionId
    );
  }


  /* =======================================================
     LEGACY UPLOAD METHOD
     ======================================================= */

  uploadPhotosLegacy(
    inspectionId: string,
    files: File[]
  ): Observable<UploadPhotoResponse> {

    return this.performPhotoUpload(
      files,
      inspectionId
    );
  }


  /* =======================================================
     INTERNAL PHOTO UPLOAD
     ======================================================= */

  private performPhotoUpload(
    files: File[],
    inspectionId: string
  ): Observable<UploadPhotoResponse> {

    const formData =
      new FormData();


    for (const file of files) {

      formData.append(
        'files',
        file,
        file.name
      );

    }


    formData.append(
      'inspectionId',
      inspectionId
    );


    return this.http
      .post<UploadPhotoResponse>(
        `${this.apiUrl}/upload`,
        formData
      )
      .pipe(

        catchError(error => {

          console.error(
            'Failed to upload photos:',
            error
          );

          return throwError(
            () => error
          );
        })

      );
  }


  /* =======================================================
     SINGLE PHOTO
     ======================================================= */

  uploadPhoto(
    file: File,
    inspectionId: string
  ): Observable<UploadPhotoResponse> {

    return this.performPhotoUpload(
      [file],
      inspectionId
    );
  }


  /* =======================================================
     PHOTO URL
     ======================================================= */

  getPhotoUrl(
    path?: string | null
  ): string {

    if (!path) {

      return '';
    }


    if (
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      path.startsWith('data:')
    ) {

      return path;
    }


    if (path.startsWith('/')) {

      return `http://localhost:3000${path}`;
    }


    return `http://localhost:3000/${path}`;
  }


  /* =======================================================
     SUBMIT
     ======================================================= */

  submitInspection(
    id: string
  ): Observable<Inspection> {

    return this.http
      .post<Inspection>(
        `${this.apiUrl}/${encodeURIComponent(id)}/submit`,
        {}
      )
      .pipe(

        catchError(error => {

          console.error(
            'Failed to submit inspection:',
            error
          );

          return throwError(
            () => error
          );
        })

      );
  }


  /* =======================================================
     COMPLETE
     ======================================================= */

  completeInspection(
    id: string
  ): Observable<Inspection> {

    return this.http
      .post<Inspection>(
        `${this.apiUrl}/${encodeURIComponent(id)}/complete`,
        {}
      )
      .pipe(

        catchError(error => {

          console.error(
            'Failed to complete inspection:',
            error
          );

          return throwError(
            () => error
          );
        })

      );
  }


  /* =======================================================
     NORMALISE LIST
     ======================================================= */

  normalizeInspections(
    inspections: Inspection[]
  ): Inspection[] {

    return inspections.map(
      inspection =>
        this.normalizeInspection(
          inspection
        )
    );
  }

}