import {
  Injectable,
  NotFoundException
} from '@nestjs/common';

import {
  randomBytes
} from 'crypto';

import {
  PrismaService
} from '../../prisma/prisma.service';


@Injectable()
export class InspectionsService {

  constructor(
    private readonly prisma: PrismaService
  ) {}


  // =========================================================
  // CREATE INSPECTION REQUEST
  // =========================================================

  async createInspection(
    inspectionData: any
  ) {

    console.log('');
    console.log(
      '======================================'
    );
    console.log(
      'CREATE INSPECTION REQUEST'
    );
    console.log(
      '======================================'
    );
    console.log(
      'Incoming data:',
      inspectionData
    );


    /*
     * -------------------------------------------------------
     * INSPECTION TYPE
     * -------------------------------------------------------
     */

    const inspectionType =
      inspectionData?.inspectionType === 'accident'
        ? 'accident'
        : 'pre-cover';


    /*
     * -------------------------------------------------------
     * STATUS
     * -------------------------------------------------------
     */

    const status =
      String(
        inspectionData?.status ?? 'pending'
      );


    /*
     * -------------------------------------------------------
     * SECURE REFERENCE
     * -------------------------------------------------------
     */

    const reference =
      await this.generateUniqueReference();


    /*
     * -------------------------------------------------------
     * CUSTOMER
     * -------------------------------------------------------
     */

    const customerFirstName =
      String(
        inspectionData?.customerFirstName ??
        inspectionData?.customer?.firstName ??
        ''
      ).trim();


    const customerSurname =
      String(
        inspectionData?.customerSurname ??
        inspectionData?.customer?.surname ??
        inspectionData?.customer?.lastName ??
        ''
      ).trim();


    const customerEmail =
      String(
        inspectionData?.customerEmail ??
        inspectionData?.customer?.email ??
        ''
      ).trim();


    const customerPhone =
      String(
        inspectionData?.customerPhone ??
        inspectionData?.customer?.phone ??
        ''
      ).trim();


    /*
     * -------------------------------------------------------
     * POLICY
     * -------------------------------------------------------
     */

    let policyNumber =
      '';

    let insuranceCompany =
      '';


    if (
      inspectionData?.policyNumber &&
      typeof inspectionData.policyNumber === 'object'
    ) {

      policyNumber =
        String(
          inspectionData.policyNumber.policy ??
          inspectionData.policyNumber.policyNumber ??
          ''
        ).trim();


      insuranceCompany =
        String(
          inspectionData.policyNumber.company ??
          inspectionData.policyNumber.insuranceCompany ??
          inspectionData?.insuranceCompany ??
          ''
        ).trim();

    } else {

      policyNumber =
        String(
          inspectionData?.policyNumber ??
          inspectionData?.policy?.policyNumber ??
          ''
        ).trim();


      insuranceCompany =
        String(
          inspectionData?.insuranceCompany ??
          inspectionData?.policy?.insuranceCompany ??
          ''
        ).trim();

    }


    /*
     * -------------------------------------------------------
     * VEHICLE
     * -------------------------------------------------------
     */

    const registration =
      String(
        inspectionData?.registration ??
        inspectionData?.vehicle?.registration ??
        ''
      ).trim();


    const make =
      String(
        inspectionData?.make ??
        inspectionData?.vehicle?.make ??
        ''
      ).trim();


    const model =
      String(
        inspectionData?.model ??
        inspectionData?.vehicle?.model ??
        ''
      ).trim();


    const year =
      inspectionData?.year ??
      inspectionData?.vehicle?.year ??
      '';


    const colour =
      String(
        inspectionData?.colour ??
        inspectionData?.vehicle?.colour ??
        ''
      ).trim();


    const mileage =
      inspectionData?.mileage ??
      inspectionData?.vehicle?.mileage ??
      '';


    /*
     * -------------------------------------------------------
     * PHOTOS
     * -------------------------------------------------------
     */

    const photos =
      Array.isArray(
        inspectionData?.photos
      )
        ? inspectionData.photos
        : [];


    const damagePhotos =
      Array.isArray(
        inspectionData?.damagePhotos
      )
        ? inspectionData.damagePhotos
        : Array.isArray(
            inspectionData?.accidentPhotos
          )
          ? inspectionData.accidentPhotos
          : [];


    console.log('');
    console.log(
      'NORMALIZED DATA'
    );

    console.log({

      reference,

      inspectionType,

      status,

      customerFirstName,

      customerSurname,

      customerEmail,

      customerPhone,

      policyNumber,

      insuranceCompany,

      registration,

      make,

      model,

      year,

      colour,

      mileage,

      photosCount:
        photos.length,

      damagePhotosCount:
        damagePhotos.length

    });


    /*
     * -------------------------------------------------------
     * CREATE DATABASE RECORD
     * -------------------------------------------------------
     */

    const inspection =
      await this.prisma.inspection.create({

        data: {

          reference,

          status,

          inspectionType,


          customerFirstName,

          customerSurname,

          customerEmail,

          customerPhone,


          policyNumber,

          insuranceCompany,


          registration,

          make,

          model,

          year:
            year
              ? String(year)
              : '',

          colour,

          mileage:
            mileage
              ? String(mileage)
              : '',


          photos,

          damagePhotos,


          aiStatus:
            'PENDING',

          aiScore:
            null,

          damageDetected:
            false,

          damageSummary:
            null,

          vinExtracted:
            null,

          odometerReading:
            null,

          aiProvider:
            null,

          processedAt:
            null

        }

      });


    /*
     * -------------------------------------------------------
     * SECURE CUSTOMER LINK
     * -------------------------------------------------------
     */

    const frontendUrl =
      (
        process.env.FRONTEND_URL ??
        'http://localhost:4200'
      ).replace(
        /\/+$/,
        ''
      );


    const secureLink =
      `${frontendUrl}` +
      `/customer/start/` +
      `${inspection.inspectionType}/` +
      `${encodeURIComponent(
        String(
          inspection.reference ?? ''
        )
      )}`;


    console.log('');
    console.log(
      '======================================'
    );

    console.log(
      'INSPECTION REQUEST CREATED'
    );

    console.log(
      '======================================'
    );

    console.log({

      id:
        inspection.id,

      reference:
        inspection.reference,

      inspectionType:
        inspection.inspectionType,

      status:
        inspection.status,

      secureLink

    });


    return {

      ...this.formatInspection(
        inspection
      ),

      secureLink,

      inspectionUrl:
        secureLink

    };

  }


  // =========================================================
  // GENERATE UNIQUE SECURE REFERENCE
  // =========================================================

  private async generateUniqueReference(): Promise<string> {

    for (
      let attempt = 0;
      attempt < 10;
      attempt++
    ) {

      const randomPart =
        randomBytes(12)
          .toString('hex')
          .toUpperCase();


      const reference =
        `FAL-${randomPart}`;


      const existing =
        await this.prisma.inspection.findUnique({

          where: {
            reference
          }

        });


      if (!existing) {

        return reference;

      }

    }


    throw new Error(
      'Unable to generate a unique inspection reference. Please try again.'
    );

  }


  // =========================================================
  // GET ALL INSPECTIONS
  // =========================================================

  async getInspections() {

    const inspections =
      await this.prisma.inspection.findMany({

        orderBy: {
          createdAt: 'desc'
        }

      });


    return inspections.map(
      inspection =>
        this.formatInspection(
          inspection
        )
    );

  }


  // =========================================================
  // GET INSPECTION BY ID
  // =========================================================

  async getInspectionById(
    id: string
  ) {

    const inspection =
      await this.prisma.inspection.findUnique({

        where: {
          id
        }

      });


    if (!inspection) {

      return null;

    }


    return this.formatInspection(
      inspection
    );

  }


  // =========================================================
  // GET INSPECTION BY REFERENCE
  // =========================================================

  async getInspectionByReference(
    reference: string
  ) {

    const cleanReference =
      String(
        reference ?? ''
      ).trim();


    if (!cleanReference) {

      return null;

    }


    const inspection =
      await this.prisma.inspection.findUnique({

        where: {
          reference:
            cleanReference
        }

      });


    if (!inspection) {

      return null;

    }


    return this.formatInspection(
      inspection
    );

  }


  // =========================================================
  // UPDATE INSPECTION
  // =========================================================

  async updateInspection(
    id: string,
    inspectionData: any
  ) {

    console.log('');
    console.log(
      '======================================'
    );
    console.log(
      'UPDATE INSPECTION'
    );
    console.log(
      '======================================'
    );
    console.log(
      'ID:',
      id
    );
    console.log(
      'Data:',
      inspectionData
    );


    const existing =
      await this.prisma.inspection.findUnique({

        where: {
          id
        }

      });


    if (!existing) {

      throw new NotFoundException(
        'Inspection not found'
      );

    }


    const updateData: any =
      {};


    /*
     * -------------------------------------------------------
     * BASIC
     * -------------------------------------------------------
     */

    if (
      inspectionData?.reference !==
      undefined
    ) {

      updateData.reference =
        String(
          inspectionData.reference
        ).trim();

    }


    if (
      inspectionData?.status !==
      undefined
    ) {

      updateData.status =
        String(
          inspectionData.status
        );

    }


    if (
      inspectionData?.inspectionType !==
      undefined
    ) {

      updateData.inspectionType =
        inspectionData.inspectionType ===
        'accident'
          ? 'accident'
          : 'pre-cover';

    }


    /*
     * -------------------------------------------------------
     * CUSTOMER
     * -------------------------------------------------------
     */

    if (
      inspectionData?.customer
    ) {

      if (
        inspectionData.customer.firstName !==
        undefined
      ) {

        updateData.customerFirstName =
          String(
            inspectionData.customer.firstName
          ).trim();

      }


      if (
        inspectionData.customer.lastName !==
        undefined ||
        inspectionData.customer.surname !==
        undefined
      ) {

        updateData.customerSurname =
          String(
            inspectionData.customer.lastName ??
            inspectionData.customer.surname ??
            ''
          ).trim();

      }


      if (
        inspectionData.customer.email !==
        undefined
      ) {

        updateData.customerEmail =
          String(
            inspectionData.customer.email
          ).trim();

      }


      if (
        inspectionData.customer.phone !==
        undefined
      ) {

        updateData.customerPhone =
          String(
            inspectionData.customer.phone
          ).trim();

      }

    }


    if (
      inspectionData?.customerFirstName !==
      undefined
    ) {

      updateData.customerFirstName =
        String(
          inspectionData.customerFirstName
        ).trim();

    }


    if (
      inspectionData?.customerSurname !==
      undefined
    ) {

      updateData.customerSurname =
        String(
          inspectionData.customerSurname
        ).trim();

    }


    if (
      inspectionData?.customerEmail !==
      undefined
    ) {

      updateData.customerEmail =
        String(
          inspectionData.customerEmail
        ).trim();

    }


    if (
      inspectionData?.customerPhone !==
      undefined
    ) {

      updateData.customerPhone =
        String(
          inspectionData.customerPhone
        ).trim();

    }


    /*
     * -------------------------------------------------------
     * POLICY
     * -------------------------------------------------------
     */

    if (
      inspectionData?.policy
    ) {

      if (
        inspectionData.policy.policyNumber !==
        undefined
      ) {

        updateData.policyNumber =
          String(
            inspectionData.policy.policyNumber
          ).trim();

      }


      if (
        inspectionData.policy.insuranceCompany !==
        undefined
      ) {

        updateData.insuranceCompany =
          String(
            inspectionData.policy.insuranceCompany
          ).trim();

      }

    }


    if (
      inspectionData?.policyNumber !==
      undefined
    ) {

      updateData.policyNumber =
        typeof inspectionData.policyNumber ===
        'object'

          ? String(
              inspectionData.policyNumber.policy ??
              inspectionData.policyNumber.policyNumber ??
              ''
            ).trim()

          : String(
              inspectionData.policyNumber
            ).trim();

    }


    if (
      inspectionData?.insuranceCompany !==
      undefined
    ) {

      updateData.insuranceCompany =
        String(
          inspectionData.insuranceCompany
        ).trim();

    }


    /*
     * -------------------------------------------------------
     * VEHICLE
     * -------------------------------------------------------
     */

    if (
      inspectionData?.vehicle
    ) {

      if (
        inspectionData.vehicle.registration !==
        undefined
      ) {

        updateData.registration =
          String(
            inspectionData.vehicle.registration
          ).trim();

      }


      if (
        inspectionData.vehicle.make !==
        undefined
      ) {

        updateData.make =
          String(
            inspectionData.vehicle.make
          ).trim();

      }


      if (
        inspectionData.vehicle.model !==
        undefined
      ) {

        updateData.model =
          String(
            inspectionData.vehicle.model
          ).trim();

      }


      if (
        inspectionData.vehicle.year !==
        undefined
      ) {

        updateData.year =
          inspectionData.vehicle.year
            ? String(
                inspectionData.vehicle.year
              )
            : '';

      }


      if (
        inspectionData.vehicle.colour !==
        undefined
      ) {

        updateData.colour =
          String(
            inspectionData.vehicle.colour
          ).trim();

      }


      if (
        inspectionData.vehicle.mileage !==
        undefined
      ) {

        updateData.mileage =
          inspectionData.vehicle.mileage !==
            null &&
          inspectionData.vehicle.mileage !==
            ''
            ? String(
                inspectionData.vehicle.mileage
              )
            : '';

      }

    }


    /*
     * Direct vehicle fields.
     */

    if (
      inspectionData?.registration !==
      undefined
    ) {

      updateData.registration =
        String(
          inspectionData.registration
        ).trim();

    }


    if (
      inspectionData?.make !==
      undefined
    ) {

      updateData.make =
        String(
          inspectionData.make
        ).trim();

    }


    if (
      inspectionData?.model !==
      undefined
    ) {

      updateData.model =
        String(
          inspectionData.model
        ).trim();

    }


    if (
      inspectionData?.year !==
      undefined
    ) {

      updateData.year =
        inspectionData.year
          ? String(
              inspectionData.year
            )
          : '';

    }


    if (
      inspectionData?.colour !==
      undefined
    ) {

      updateData.colour =
        String(
          inspectionData.colour
        ).trim();

    }


    if (
      inspectionData?.mileage !==
      undefined
    ) {

      updateData.mileage =
        inspectionData.mileage !==
          null &&
        inspectionData.mileage !==
          ''
          ? String(
              inspectionData.mileage
            )
          : '';

    }


    /*
     * -------------------------------------------------------
     * PHOTOS
     * -------------------------------------------------------
     */

    if (
      inspectionData?.photos !==
      undefined
    ) {

      updateData.photos =
        Array.isArray(
          inspectionData.photos
        )
          ? inspectionData.photos
          : [];

    }


    if (
      inspectionData?.accidentPhotos !==
      undefined
    ) {

      updateData.damagePhotos =
        Array.isArray(
          inspectionData.accidentPhotos
        )
          ? inspectionData.accidentPhotos
          : [];

    }


    if (
      inspectionData?.damagePhotos !==
      undefined
    ) {

      updateData.damagePhotos =
        Array.isArray(
          inspectionData.damagePhotos
        )
          ? inspectionData.damagePhotos
          : [];

    }


    /*
     * -------------------------------------------------------
     * SUBMITTED DATE
     * -------------------------------------------------------
     */

    if (
      inspectionData?.submittedAt !==
      undefined
    ) {

      updateData.submittedAt =
        inspectionData.submittedAt
          ? new Date(
              inspectionData.submittedAt
            )
          : null;

    }


    /*
     * -------------------------------------------------------
     * UPDATE DATABASE
     * -------------------------------------------------------
     */

    const inspection =
      await this.prisma.inspection.update({

        where: {
          id
        },

        data:
          updateData

      });


    console.log(
      'INSPECTION UPDATED:',
      inspection.id
    );


    return this.formatInspection(
      inspection
    );

  }


  // =========================================================
  // DELETE INSPECTION
  // =========================================================

  async deleteInspection(
    id: string
  ) {

    const existing =
      await this.prisma.inspection.findUnique({

        where: {
          id
        }

      });


    if (!existing) {

      throw new NotFoundException(
        'Inspection not found'
      );

    }


    await this.prisma.inspection.delete({

      where: {
        id
      }

    });


    return {

      message:
        'Inspection deleted successfully',

      id

    };

  }


  // =========================================================
  // FORMAT INSPECTION
  // =========================================================

  private formatInspection(
    inspection: any
  ) {

    /*
     * -------------------------------------------------------
     * FRONTEND URL
     * -------------------------------------------------------
     */

    const frontendUrl =
      (
        process.env.FRONTEND_URL ??
        'http://localhost:4200'
      ).replace(
        /\/+$/,
        ''
      );


    /*
     * -------------------------------------------------------
     * INSPECTION TYPE
     * -------------------------------------------------------
     */

    const inspectionType =
      inspection.inspectionType ===
      'accident'
        ? 'accident'
        : 'pre-cover';


    /*
     * -------------------------------------------------------
     * SECURE CUSTOMER LINK
     *
     * IMPORTANT:
     *
     * Prisma allows reference to be nullable.
     *
     * String(reference ?? '') guarantees that
     * encodeURIComponent always receives a string.
     * -------------------------------------------------------
     */

    const secureLink =
      `${frontendUrl}` +
      `/customer/start/` +
      `${inspectionType}/` +
      `${encodeURIComponent(
        String(
          inspection.reference ?? ''
        )
      )}`;


    return {

      id:
        inspection.id,


      reference:
        inspection.reference ?? '',


      status:
        inspection.status,


      inspectionType,


      type:
        inspectionType,


      createdAt:
        inspection.createdAt,


      updatedAt:
        inspection.updatedAt,


      submittedAt:
        inspection.submittedAt ??
        null,


      /*
       * -----------------------------------------------------
       * CUSTOMER
       * -----------------------------------------------------
       */

      customer: {

        firstName:
          inspection.customerFirstName ??
          '',

        lastName:
          inspection.customerSurname ??
          '',

        surname:
          inspection.customerSurname ??
          '',

        email:
          inspection.customerEmail ??
          '',

        phone:
          inspection.customerPhone ??
          ''

      },


      customerFirstName:
        inspection.customerFirstName ??
        '',


      customerSurname:
        inspection.customerSurname ??
        '',


      customerEmail:
        inspection.customerEmail ??
        '',


      customerPhone:
        inspection.customerPhone ??
        '',


      /*
       * -----------------------------------------------------
       * POLICY
       * -----------------------------------------------------
       */

      policy: {

        policyNumber:
          inspection.policyNumber ??
          '',

        insuranceCompany:
          inspection.insuranceCompany ??
          ''

      },


      policyNumber:
        inspection.policyNumber ??
        '',


      insuranceCompany:
        inspection.insuranceCompany ??
        '',


      /*
       * -----------------------------------------------------
       * VEHICLE
       * -----------------------------------------------------
       */

      vehicle: {

        registration:
          inspection.registration ??
          '',

        make:
          inspection.make ??
          '',

        model:
          inspection.model ??
          '',

        year:
          inspection.year ??
          '',

        colour:
          inspection.colour ??
          '',

        mileage:
          inspection.mileage ??
          '',

        vin:
          inspection.vinExtracted ??
          ''

      },


      vin:
        inspection.vinExtracted ??
        '',


      /*
       * -----------------------------------------------------
       * PHOTOS
       * -----------------------------------------------------
       */

      photos:
        Array.isArray(
          inspection.photos
        )
          ? inspection.photos
          : [],


      accidentPhotos:
        Array.isArray(
          inspection.damagePhotos
        )
          ? inspection.damagePhotos
          : [],


      damagePhotos:
        Array.isArray(
          inspection.damagePhotos
        )
          ? inspection.damagePhotos
          : [],


      /*
       * -----------------------------------------------------
       * AI
       * -----------------------------------------------------
       */

      ai: {

        status:
          inspection.aiStatus ??
          'PENDING',

        score:
          inspection.aiScore ??
          null,

        damageDetected:
          inspection.damageDetected ??
          false,

        damageSummary:
          inspection.damageSummary ??
          null,

        vin:
          inspection.vinExtracted ??
          null,

        odometer:
          inspection.odometerReading ??
          null,

        provider:
          inspection.aiProvider ??
          null,

        processedAt:
          inspection.processedAt ??
          null

      },


      /*
       * -----------------------------------------------------
       * CUSTOMER ACCESS LINK
       * -----------------------------------------------------
       */

      secureLink,

      inspectionUrl:
        secureLink

    };

  }

}