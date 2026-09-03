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
   TYPES
   ========================================================= */

export type InspectionInputType =
  | 'pre-cover'
  | 'pre_cover'
  | 'accident'
  | 'accident-claim'
  | string;


export type InspectionType =
  | 'pre-cover'
  | 'accident';


export type InspectionStatus =
  | 'draft'
  | 'pending'
  | 'in-progress'
  | 'review'
  | 'submitted'
  | 'completed';


export interface Customer {
  firstName?: string;
  surname?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}


export interface Vehicle {
  make?: string;
  model?: string;
  year?: string | number;
  registration?: string;
  colour?: string;
  mileage?: string | number;
  vin?: string;
}


export interface Policy {
  policyNumber?: string;
  claimNumber?: string;
  insuranceCompany?: string;
}


export interface Inspection {
  id?: string;
  reference?: string;

  status?: InspectionStatus | string;
  inspectionType?: InspectionType | string;
  type?: InspectionType | string;

  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string | null;

  inspectionUrl?: string;
  secureLink?: string;
  url?: string;

  customer?: Customer;

  customerFirstName?: string;
  customerSurname?: string;
  customerLastName?: string;
  customerEmail?: string;
  customerPhone?: string;

  policy?: Policy;

  policyNumber?: string;
  claimNumber?: string;
  insuranceCompany?: string;

  vehicle?: Vehicle;

  make?: string;
  model?: string;
  year?: string | number;
  registration?: string;
  colour?: string;
  mileage?: string | number;
  vin?: string;

  photos?: unknown[];
  accidentPhotos?: unknown[];
  damagePhotos?: unknown[];

  ai?: {
    status?: string;
    score?: number | null;
    damageDetected?: boolean;
    damageSummary?: string | null;
    vin?: string | null;
    odometer?: string | number | null;
    provider?: string | null;
    processedAt?: string | null;
  };
}


/* =========================================================
   CREATE REQUEST
   ========================================================= */

export interface CreateInspectionRequestPayload {
  inspectionType: InspectionInputType;

  status?: InspectionStatus | string | null;
  reference?: string | null;

  customer?: Customer | null;
  vehicle?: Vehicle | null;
  policy?: Policy | null;

  policyNumber?: string | null;
  claimNumber?: string | null;
  insuranceCompany?: string | null;

  customerFirstName?: string | null;
  customerSurname?: string | null;
  customerLastName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;

  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: string | number | null;
  vehicleRegistration?: string | null;
  vehicleColour?: string | null;
  vehicleMileage?: string | number | null;
  vehicleVin?: string | null;

  make?: string | null;
  model?: string | null;
  year?: string | number | null;
  registration?: string | null;
  colour?: string | null;
  mileage?: string | number | null;
  vin?: string | null;

  photos?: unknown[];
  accidentPhotos?: unknown[];
  damagePhotos?: unknown[];
}


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


  /* =======================================================
     API CONFIGURATION
     ======================================================= */

  private readonly apiUrl =
    this.resolveApiUrl();


  /* =======================================================
     RESOLVE API URL
     ======================================================= */

  private resolveApiUrl(): string {

    const runtimeApiUrl =
      (
        globalThis as typeof globalThis & {
          __FALCON_API_URL__?: string;
        }
      ).__FALCON_API_URL__;


    /*
     * Production/runtime API configuration.
     */
    if (
      runtimeApiUrl &&
      runtimeApiUrl.trim()
    ) {

      return this.normalizeApiUrl(
        runtimeApiUrl
      );
    }


    /*
     * Local browser development.
     */
    if (
      typeof window !== 'undefined'
    ) {

      const hostname =
        window.location.hostname;


      /*
       * Local computer.
       */
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1'
      ) {

        return 'http://localhost:3000/inspections';
      }


      /*
       * LAN testing.
       */
      if (
        this.isPrivateNetworkAddress(
          hostname
        )
      ) {

        return `http://${hostname}:3000/inspections`;
      }
    }


    /*
     * No production API configured yet.
     */
    console.warn(
      'Falcon API URL is not configured. ' +
      'Set globalThis.__FALCON_API_URL__ to the deployed API URL.'
    );


    return '/inspections';
  }


  /* =======================================================
     NORMALIZE API URL
     ======================================================= */

  private normalizeApiUrl(
    apiUrl: string
  ): string {

    let normalized =
      apiUrl.trim();


    normalized =
      normalized.replace(
        /\/+$/,
        ''
      );


    if (
      !normalized.endsWith('/inspections')
    ) {

      normalized =
        `${normalized}/inspections`;
    }


    return normalized;
  }


  /* =======================================================
     PRIVATE NETWORK CHECK
     ======================================================= */

  private isPrivateNetworkAddress(
    hostname: string
  ): boolean {

    /*
     * 10.0.0.0/8
     */
    if (
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/
        .test(hostname)
    ) {

      return true;
    }


    /*
     * 192.168.0.0/16
     */
    if (
      /^192\.168\.\d{1,3}\.\d{1,3}$/
        .test(hostname)
    ) {

      return true;
    }


    /*
     * 172.16.0.0 - 172.31.255.255
     */
    const parts =
      hostname.split('.');


    if (
      parts.length === 4 &&
      parts[0] === '172'
    ) {

      const second =
        Number(parts[1]);


      if (
        second >= 16 &&
        second <= 31
      ) {

        return true;
      }
    }


    return false;
  }


  /* =======================================================
     PUBLIC API URL
     ======================================================= */

  getApiBaseUrl(): string {

    return this.apiUrl;
  }


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


    return {
      ...inspection,

      inspectionType,

      type:
        inspectionType,

      status,

      updatedAt:
        inspection.updatedAt ??
        inspection.createdAt,


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


      photos,

      accidentPhotos,

      damagePhotos:
        accidentPhotos,


      ai:
        inspection.ai ??
        undefined
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


    /*
     * The backend owns the official reference.
     *
     * Do not generate a reference in Angular.
     */
    const requestPayload = {

      ...payload,

      inspectionType,

      reference:
        undefined,

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

      files =
        first;

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
     LEGACY UPLOAD
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


    try {

      const apiOrigin =
        new URL(
          this.apiUrl
        ).origin;


      if (
        path.startsWith('/')
      ) {

        return `${apiOrigin}${path}`;
      }


      return `${apiOrigin}/${path}`;

    } catch {

      if (
        path.startsWith('/')
      ) {

        return path;
      }


      return `/${path}`;
    }
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