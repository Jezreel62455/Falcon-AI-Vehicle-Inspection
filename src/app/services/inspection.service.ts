import {
  Injectable,
  inject
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  map
} from 'rxjs';

export interface InspectionCustomer {

  firstName: string;

  surname: string;

}

export interface InspectionVehicle {

  registration: string;

  make: string;

  model: string;

  year: string | number;

  colour: string;

  mileage: string | number;

}

export interface InspectionPolicy {

  policyNumber: string;

  insuranceCompany: string;

}

export interface InspectionPhoto {

  id?: string | number;

  title: string;

  path: string;

  fileName?: string;

  originalName?: string;

}

export interface Inspection {

  id: string | number;

  status: string;

  inspectionType: string;

  createdAt: string | Date;

  customer: InspectionCustomer;

  vehicle: InspectionVehicle;

  policy: InspectionPolicy;

  photos: InspectionPhoto[];

  [key: string]: unknown;

}

interface UploadFileResponse {

  originalName: string;

  fileName: string;

  path: string;

}

interface UploadResponse {

  message: string;

  files: UploadFileResponse[];

}

@Injectable({

  providedIn: 'root'

})
export class InspectionService {

  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:3000/inspections';

  createInspection(
    inspectionData: unknown
  ): Observable<Inspection> {

    return this.http

      .post<unknown>(
        this.apiUrl,
        inspectionData
      )

      .pipe(

        map(
          response =>
            this.normalizeInspection(
              response
            )
        )

      );

  }

  uploadPhotos(
    files: File[]
  ): Observable<UploadResponse> {

    const formData =
      new FormData();

    for (
      const file of files
    ) {

      formData.append(
        'files',
        file
      );

    }

    return this.http.post<UploadResponse>(
      `${this.apiUrl}/upload`,
      formData
    );

  }

  getInspections(): Observable<Inspection[]> {

    return this.http

      .get<unknown>(
        this.apiUrl
      )

      .pipe(

        map(
          response => {

            const inspections =
              Array.isArray(response)
                ? response
                : [];

            return inspections.map(
              inspection =>
                this.normalizeInspection(
                  inspection
                )
            );

          }
        )

      );

  }

  getInspectionById(
    id: string
  ): Observable<Inspection> {

    return this.http

      .get<unknown>(
        `${this.apiUrl}/${encodeURIComponent(id)}`
      )

      .pipe(

        map(
          response =>
            this.normalizeInspection(
              response
            )
        )

      );

  }

  getPhotoUrl(
    photoPath: string
  ): string {

    if (!photoPath) {

      return '';

    }

    if (

      photoPath.startsWith(
        'http://'
      )

      ||

      photoPath.startsWith(
        'https://'
      )

    ) {

      return photoPath;

    }

    const normalizedPath =
      photoPath.startsWith('/')
        ? photoPath
        : `/${photoPath}`;

    return `http://localhost:3000${normalizedPath}`;

  }

  private normalizeInspection(
    raw: unknown
  ): Inspection {

    const inspection =
      this.asRecord(
        raw
      );

    const rawCustomer =
      this.asRecord(
        inspection['customer']
      );

    const rawVehicle =
      this.asRecord(
        inspection['vehicle']
      );

    const rawPolicy =
      this.asRecord(
        inspection['policy']
      );

    const rawPhotos =
      Array.isArray(
        inspection['photos']
      )

        ? inspection['photos']

        : [];

    const customer:
      InspectionCustomer = {

      firstName:

        this.toStringValue(

          rawCustomer['firstName']

          ??

          inspection[
            'customerFirstName'
          ]

        ),

      surname:

        this.toStringValue(

          rawCustomer['surname']

          ??

          inspection[
            'customerSurname'
          ]

        )

    };

    const vehicle:
      InspectionVehicle = {

      registration:

        this.toStringValue(

          rawVehicle[
            'registration'
          ]

          ??

          inspection[
            'registration'
          ]

        ),

      make:

        this.toStringValue(

          rawVehicle[
            'make'
          ]

          ??

          inspection[
            'make'
          ]

        ),

      model:

        this.toStringValue(

          rawVehicle[
            'model'
          ]

          ??

          inspection[
            'model'
          ]

        ),

      year:

        this.toStringOrNumberValue(

          rawVehicle[
            'year'
          ]

          ??

          inspection[
            'year'
          ]

        ),

      colour:

        this.toStringValue(

          rawVehicle[
            'colour'
          ]

          ??

          inspection[
            'colour'
          ]

        ),

      mileage:

        this.toStringOrNumberValue(

          rawVehicle[
            'mileage'
          ]

          ??

          inspection[
            'mileage'
          ]

        )

    };

    const policy:
      InspectionPolicy = {

      policyNumber:

        this.toStringValue(

          rawPolicy[
            'policyNumber'
          ]

          ??

          inspection[
            'policyNumber'
          ]

          ??

          inspection[
            'policy'
          ]

        ),

      insuranceCompany:

        this.toStringValue(

          rawPolicy[
            'insuranceCompany'
          ]

          ??

          inspection[
            'insuranceCompany'
          ]

        )

    };

    const photos:
      InspectionPhoto[] =

      rawPhotos.map(

        photo => {

          const rawPhoto =
            this.asRecord(
              photo
            );

          return {

            id:

              rawPhoto[
                'id'
              ] as
                | string
                | number
                | undefined,

            title:

              this.toStringValue(

                rawPhoto[
                  'title'
                ]

                ??

                rawPhoto[
                  'originalName'
                ]

                ??

                rawPhoto[
                  'fileName'
                ]

                ??

                'Inspection Photo'

              ),

            path:

              this.toStringValue(

                rawPhoto[
                  'path'
                ]

                ??

                rawPhoto[
                  'url'
                ]

              ),

            fileName:

              this.toStringValue(

                rawPhoto[
                  'fileName'
                ]

              ),

            originalName:

              this.toStringValue(

                rawPhoto[
                  'originalName'
                ]

              )

          };

        }

      );

    return {

      ...inspection,

      id:

        inspection[
          'id'
        ] as
          | string
          | number,

      status:

        this.toStringValue(

          inspection[
            'status'
          ],

          'SUBMITTED'

        ),

      inspectionType:

        this.toStringValue(

          inspection[
            'inspectionType'
          ]

          ??

          inspection[
            'type'
          ],

          'Pre-Cover Inspection'

        ),

      createdAt:

        inspection[
          'createdAt'
        ] as
          | string
          | Date,

      customer,

      vehicle,

      policy,

      photos

    };

  }

  private asRecord(
    value: unknown
  ): Record<string, unknown> {

    if (

      value !== null

      &&

      typeof value === 'object'

    ) {

      return value as
        Record<string, unknown>;

    }

    return {};

  }

  private toStringValue(
    value: unknown,
    fallback = ''
  ): string {

    if (

      value === null

      ||

      value === undefined

    ) {

      return fallback;

    }

    return String(
      value
    );

  }

  private toStringOrNumberValue(
    value: unknown,
    fallback: string | number = ''
  ): string | number {

    if (

      typeof value === 'string'

      ||

      typeof value === 'number'

    ) {

      return value;

    }

    return fallback;

  }

}