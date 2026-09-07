import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';

import {
  randomBytes,
} from 'crypto';

import {
  PrismaService,
} from '../../prisma/prisma.service';

import {
  BedrockService,
} from './bedrock.service';


@Injectable()
export class InspectionsService {

  private readonly logger =
    new Logger(InspectionsService.name);


  constructor(
    private readonly prisma: PrismaService,
    private readonly bedrockService: BedrockService,
  ) {}


  // =========================================================
  // CREATE INSPECTION REQUEST
  // =========================================================

  async createInspection(
    inspectionData: any,
  ) {

    this.logger.log(
      '======================================',
    );

    this.logger.log(
      'CREATE INSPECTION REQUEST',
    );

    this.logger.log(
      'Incoming inspection data received',
    );


    const inspectionType =
      inspectionData?.inspectionType === 'accident'
        ? 'accident'
        : 'pre-cover';


    const status =
      String(
        inspectionData?.status ?? 'pending',
      );


    const reference =
      await this.generateUniqueReference();


    // =======================================================
    // CUSTOMER
    // =======================================================

    const customerFirstName =
      String(
        inspectionData?.customerFirstName ??
        inspectionData?.customer?.firstName ??
        '',
      ).trim();


    const customerSurname =
      String(
        inspectionData?.customerSurname ??
        inspectionData?.customer?.surname ??
        inspectionData?.customer?.lastName ??
        '',
      ).trim();


    const customerEmail =
      String(
        inspectionData?.customerEmail ??
        inspectionData?.customer?.email ??
        '',
      ).trim();


    const customerPhone =
      String(
        inspectionData?.customerPhone ??
        inspectionData?.customer?.phone ??
        '',
      ).trim();


    // =======================================================
    // POLICY
    // =======================================================

    let policyNumber = '';
    let insuranceCompany = '';


    if (
      inspectionData?.policyNumber &&
      typeof inspectionData.policyNumber === 'object'
    ) {

      policyNumber =
        String(
          inspectionData.policyNumber.policy ??
          inspectionData.policyNumber.policyNumber ??
          '',
        ).trim();


      insuranceCompany =
        String(
          inspectionData.policyNumber.company ??
          inspectionData.policyNumber.insuranceCompany ??
          inspectionData?.insuranceCompany ??
          '',
        ).trim();

    } else {

      policyNumber =
        String(
          inspectionData?.policyNumber ??
          inspectionData?.policy?.policyNumber ??
          '',
        ).trim();


      insuranceCompany =
        String(
          inspectionData?.insuranceCompany ??
          inspectionData?.policy?.insuranceCompany ??
          '',
        ).trim();
    }


    // =======================================================
    // VEHICLE
    // =======================================================

    const registration =
      String(
        inspectionData?.registration ??
        inspectionData?.vehicle?.registration ??
        '',
      ).trim();


    const make =
      String(
        inspectionData?.make ??
        inspectionData?.vehicle?.make ??
        '',
      ).trim();


    const model =
      String(
        inspectionData?.model ??
        inspectionData?.vehicle?.model ??
        '',
      ).trim();


    const year =
      inspectionData?.year ??
      inspectionData?.vehicle?.year ??
      '';


    const colour =
      String(
        inspectionData?.colour ??
        inspectionData?.vehicle?.colour ??
        '',
      ).trim();


    const mileage =
      inspectionData?.mileage ??
      inspectionData?.vehicle?.mileage ??
      '';


    // =======================================================
    // PHOTOS
    // =======================================================

    const photos =
      Array.isArray(
        inspectionData?.photos,
      )
        ? inspectionData.photos
        : [];


    const damagePhotos =
      Array.isArray(
        inspectionData?.damagePhotos,
      )
        ? inspectionData.damagePhotos
        : Array.isArray(
            inspectionData?.accidentPhotos,
          )
          ? inspectionData.accidentPhotos
          : [];


    // =======================================================
    // CREATE DATABASE RECORD
    // =======================================================

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
            null,
        },
      });


    // =======================================================
    // SECURE CUSTOMER LINK
    // =======================================================

    const frontendUrl =
      (
        process.env.FRONTEND_URL ??
        'http://localhost:4200'
      ).replace(
        /\/+$/,
        '',
      );


    const secureLink =
      `${frontendUrl}` +
      `/customer/start/` +
      `${inspectionType}/` +
      `${encodeURIComponent(
        String(
          inspection.reference ?? '',
        ),
      )}`;


    this.logger.log(
      `Inspection created successfully: ${inspection.id}`,
    );

    this.logger.log(
      `Reference: ${inspection.reference}`,
    );


    return {

      ...this.formatInspection(
        inspection,
      ),

      secureLink,

      inspectionUrl:
        secureLink,
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
            reference,
          },

        });


      if (!existing) {
        return reference;
      }
    }


    throw new Error(
      'Unable to generate a unique inspection reference. Please try again.',
    );
  }


  // =========================================================
  // GET ALL INSPECTIONS
  // =========================================================

  async getInspections() {

    const inspections =
      await this.prisma.inspection.findMany({

        orderBy: {
          createdAt: 'desc',
        },

      });


    return inspections.map(
      inspection =>
        this.formatInspection(
          inspection,
        ),
    );
  }


  // =========================================================
  // GET INSPECTION BY ID
  // =========================================================

  async getInspectionById(
    id: string,
  ) {

    const inspection =
      await this.prisma.inspection.findUnique({

        where: {
          id,
        },

      });


    if (!inspection) {
      return null;
    }


    return this.formatInspection(
      inspection,
    );
  }


  // =========================================================
  // GET INSPECTION BY REFERENCE
  // =========================================================

  async getInspectionByReference(
    reference: string,
  ) {

    const cleanReference =
      String(
        reference ?? '',
      ).trim();


    if (!cleanReference) {
      return null;
    }


    const inspection =
      await this.prisma.inspection.findUnique({

        where: {
          reference: cleanReference,
        },

      });


    if (!inspection) {
      return null;
    }


    return this.formatInspection(
      inspection,
    );
  }


  // =========================================================
  // ANALYSE INSPECTION WITH AMAZON BEDROCK
  // =========================================================

  async analyseInspection(
    id: string,
  ) {

    this.logger.log(
      '======================================',
    );

    this.logger.log(
      'STARTING AI INSPECTION ANALYSIS',
    );

    this.logger.log(
      `Inspection ID: ${id}`,
    );


    // =======================================================
    // FIND INSPECTION
    // =======================================================

    const inspection =
      await this.prisma.inspection.findUnique({

        where: {
          id,
        },

      });


    if (!inspection) {

      throw new NotFoundException(
        'Inspection not found',
      );
    }


    // =======================================================
    // MARK AS PROCESSING
    // =======================================================

    await this.prisma.inspection.update({

      where: {
        id,
      },

      data: {

        aiStatus:
          'PROCESSING',

        aiProvider:
          'Amazon Bedrock',
      },

    });


    try {

      // =====================================================
      // PREPARE DATA FOR BEDROCK
      // =====================================================

      const inspectionData = {

        inspectionId:
          inspection.id,

        reference:
          inspection.reference,

        inspectionType:
          inspection.inspectionType,

        status:
          inspection.status,


        customer: {

          firstName:
            inspection.customerFirstName,

          surname:
            inspection.customerSurname,

          email:
            inspection.customerEmail,

          phone:
            inspection.customerPhone,
        },


        policy: {

          policyNumber:
            inspection.policyNumber,

          insuranceCompany:
            inspection.insuranceCompany,
        },


        vehicle: {

          registration:
            inspection.registration,

          make:
            inspection.make,

          model:
            inspection.model,

          year:
            inspection.year,

          colour:
            inspection.colour,

          mileage:
            inspection.mileage,
        },


        photos:
          Array.isArray(
            inspection.photos,
          )
            ? inspection.photos
            : [],


        damagePhotos:
          Array.isArray(
            inspection.damagePhotos,
          )
            ? inspection.damagePhotos
            : [],
      };


      // =====================================================
      // CALL AMAZON BEDROCK
      // =====================================================

      const aiResponse =
        await this.bedrockService
          .analyseInspection(
            inspectionData,
          );


      this.logger.log(
        'Bedrock returned successfully',
      );


      this.logger.log(
        `AI response length: ${aiResponse.length}`,
      );


      // =====================================================
      // PARSE AI RESPONSE
      // =====================================================

      const parsed =
        this.parseAiResponse(
          aiResponse,
        );


      // =====================================================
      // SAVE AI RESULT
      // =====================================================

      const updatedInspection =
        await this.prisma.inspection.update({

          where: {
            id,
          },

          data: {

            aiStatus:
              'COMPLETED',

            aiScore:
              parsed.aiScore,

            damageDetected:
              parsed.damageDetected,

            damageSummary:
              parsed.damageSummary,

            vinExtracted:
              parsed.vinExtracted,

            odometerReading:
              parsed.odometerReading,

            aiProvider:
              'Amazon Bedrock',

            processedAt:
              new Date(),
          },

        });


      this.logger.log(
        '======================================',
      );

      this.logger.log(
        'AI INSPECTION ANALYSIS COMPLETED',
      );

      this.logger.log(
        `Inspection ID: ${id}`,
      );

      this.logger.log(
        `AI Score: ${parsed.aiScore}`,
      );

      this.logger.log(
        `Damage detected: ${parsed.damageDetected}`,
      );

      this.logger.log(
        '======================================',
      );


      return {

        ...this.formatInspection(
          updatedInspection,
        ),

        aiAnalysis:
          parsed.rawResponse,
      };

    } catch (error) {

      this.logger.error(
        '======================================',
      );

      this.logger.error(
        'AI INSPECTION ANALYSIS FAILED',
      );

      this.logger.error(
        error,
      );

      this.logger.error(
        '======================================',
      );


      await this.prisma.inspection.update({

        where: {
          id,
        },

        data: {

          aiStatus:
            'FAILED',

          aiProvider:
            'Amazon Bedrock',

          processedAt:
            new Date(),
        },

      });


      throw error;
    }
  }


  // =========================================================
  // PARSE AI RESPONSE
  // =========================================================

  private parseAiResponse(
    response: string,
  ) {

    const rawResponse =
      String(
        response ?? '',
      ).trim();


    let parsed: any = null;


    // =======================================================
    // TRY DIRECT JSON
    // =======================================================

    try {

      parsed =
        JSON.parse(
          rawResponse,
        );

    } catch {

      parsed = null;
    }


    // =======================================================
    // TRY JSON INSIDE MARKDOWN CODE BLOCK
    // =======================================================

    if (!parsed) {

      const jsonMatch =
        rawResponse.match(
          /\{[\s\S]*\}/,
        );


      if (jsonMatch) {

        try {

          parsed =
            JSON.parse(
              jsonMatch[0],
            );

        } catch {

          parsed = null;
        }
      }
    }


    // =======================================================
    // FALLBACK
    // =======================================================

    if (!parsed) {

      return {

        aiScore:
          null,

        damageDetected:
          false,

        damageSummary:
          rawResponse,

        vinExtracted:
          null,

        odometerReading:
          null,

        rawResponse,
      };
    }


    // =======================================================
    // NORMALISE SCORE
    // =======================================================

    let aiScore:
      number | null =
        null;


    if (
      typeof parsed.aiScore === 'number'
    ) {

      aiScore =
        Math.max(
          0,
          Math.min(
            100,
            parsed.aiScore,
          ),
        );

    } else if (
      typeof parsed.score === 'number'
    ) {

      aiScore =
        Math.max(
          0,
          Math.min(
            100,
            parsed.score,
          ),
        );
    }


    // =======================================================
    // NORMALISE DAMAGE
    // =======================================================

    let damageDetected =
      false;


    if (
      typeof parsed.damageDetected ===
      'boolean'
    ) {

      damageDetected =
        parsed.damageDetected;

    } else if (
      typeof parsed.damageDetected ===
      'string'
    ) {

      damageDetected =
        parsed.damageDetected
          .toLowerCase()
          .trim() === 'true';
    }


    // =======================================================
    // DAMAGE SUMMARY
    // =======================================================

    const damageSummary =
      String(
        parsed.damageSummary ??
        parsed.summary ??
        parsed.overallCondition ??
        '',
      ).trim();


    // =======================================================
    // VIN
    // =======================================================

    const vinExtracted =
      parsed.vinExtracted ??
      parsed.vin ??
      null;


    // =======================================================
    // ODOMETER
    // =======================================================

    const odometerReading =
      parsed.odometerReading ??
      parsed.odometer ??
      null;


    return {

      aiScore,

      damageDetected,

      damageSummary:
        damageSummary ||
        rawResponse,

      vinExtracted:
        vinExtracted
          ? String(
              vinExtracted,
            )
          : null,

      odometerReading:
        odometerReading
          ? String(
              odometerReading,
            )
          : null,

      rawResponse,
    };
  }


  // =========================================================
  // UPDATE INSPECTION
  // =========================================================

  async updateInspection(
    id: string,
    inspectionData: any,
  ) {

    this.logger.log(
      `Updating inspection: ${id}`,
    );


    const existing =
      await this.prisma.inspection.findUnique({

        where: {
          id,
        },

      });


    if (!existing) {

      throw new NotFoundException(
        'Inspection not found',
      );
    }


    const updateData: any =
      {};


    // =======================================================
    // BASIC
    // =======================================================

    if (
      inspectionData?.reference !==
      undefined
    ) {

      updateData.reference =
        String(
          inspectionData.reference,
        ).trim();
    }


    if (
      inspectionData?.status !==
      undefined
    ) {

      updateData.status =
        String(
          inspectionData.status,
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


    // =======================================================
    // CUSTOMER OBJECT
    // =======================================================

    if (
      inspectionData?.customer
    ) {

      if (
        inspectionData.customer.firstName !==
        undefined
      ) {

        updateData.customerFirstName =
          String(
            inspectionData.customer.firstName,
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
            '',
          ).trim();
      }


      if (
        inspectionData.customer.email !==
        undefined
      ) {

        updateData.customerEmail =
          String(
            inspectionData.customer.email,
          ).trim();
      }


      if (
        inspectionData.customer.phone !==
        undefined
      ) {

        updateData.customerPhone =
          String(
            inspectionData.customer.phone,
          ).trim();
      }
    }


    // =======================================================
    // DIRECT CUSTOMER FIELDS
    // =======================================================

    if (
      inspectionData?.customerFirstName !==
      undefined
    ) {

      updateData.customerFirstName =
        String(
          inspectionData.customerFirstName,
        ).trim();
    }


    if (
      inspectionData?.customerSurname !==
      undefined
    ) {

      updateData.customerSurname =
        String(
          inspectionData.customerSurname,
        ).trim();
    }


    if (
      inspectionData?.customerEmail !==
      undefined
    ) {

      updateData.customerEmail =
        String(
          inspectionData.customerEmail,
        ).trim();
    }


    if (
      inspectionData?.customerPhone !==
      undefined
    ) {

      updateData.customerPhone =
        String(
          inspectionData.customerPhone,
        ).trim();
    }


    // =======================================================
    // POLICY OBJECT
    // =======================================================

    if (
      inspectionData?.policy
    ) {

      if (
        inspectionData.policy.policyNumber !==
        undefined
      ) {

        updateData.policyNumber =
          String(
            inspectionData.policy.policyNumber,
          ).trim();
      }


      if (
        inspectionData.policy.insuranceCompany !==
        undefined
      ) {

        updateData.insuranceCompany =
          String(
            inspectionData.policy.insuranceCompany,
          ).trim();
      }
    }


    // =======================================================
    // DIRECT POLICY FIELDS
    // =======================================================

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
              '',
            ).trim()

          : String(
              inspectionData.policyNumber,
            ).trim();
    }


    if (
      inspectionData?.insuranceCompany !==
      undefined
    ) {

      updateData.insuranceCompany =
        String(
          inspectionData.insuranceCompany,
        ).trim();
    }


    // =======================================================
    // VEHICLE OBJECT
    // =======================================================

    if (
      inspectionData?.vehicle
    ) {

      if (
        inspectionData.vehicle.registration !==
        undefined
      ) {

        updateData.registration =
          String(
            inspectionData.vehicle.registration,
          ).trim();
      }


      if (
        inspectionData.vehicle.make !==
        undefined
      ) {

        updateData.make =
          String(
            inspectionData.vehicle.make,
          ).trim();
      }


      if (
        inspectionData.vehicle.model !==
        undefined
      ) {

        updateData.model =
          String(
            inspectionData.vehicle.model,
          ).trim();
      }


      if (
        inspectionData.vehicle.year !==
        undefined
      ) {

        updateData.year =
          inspectionData.vehicle.year
            ? String(
                inspectionData.vehicle.year,
              )
            : '';
      }


      if (
        inspectionData.vehicle.colour !==
        undefined
      ) {

        updateData.colour =
          String(
            inspectionData.vehicle.colour,
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
                inspectionData.vehicle.mileage,
              )

            : '';
      }
    }


    // =======================================================
    // DIRECT VEHICLE FIELDS
    // =======================================================

    if (
      inspectionData?.registration !==
      undefined
    ) {

      updateData.registration =
        String(
          inspectionData.registration,
        ).trim();
    }


    if (
      inspectionData?.make !==
      undefined
    ) {

      updateData.make =
        String(
          inspectionData.make,
        ).trim();
    }


    if (
      inspectionData?.model !==
      undefined
    ) {

      updateData.model =
        String(
          inspectionData.model,
        ).trim();
    }


    if (
      inspectionData?.year !==
      undefined
    ) {

      updateData.year =
        inspectionData.year
          ? String(
              inspectionData.year,
            )
          : '';
    }


    if (
      inspectionData?.colour !==
      undefined
    ) {

      updateData.colour =
        String(
          inspectionData.colour,
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
              inspectionData.mileage,
            )

          : '';
    }


    // =======================================================
    // PHOTOS
    // =======================================================

    if (
      inspectionData?.photos !==
      undefined
    ) {

      updateData.photos =
        Array.isArray(
          inspectionData.photos,
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
          inspectionData.accidentPhotos,
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
          inspectionData.damagePhotos,
        )
          ? inspectionData.damagePhotos
          : [];
    }


    // =======================================================
    // AI FIELDS
    // =======================================================

    if (
      inspectionData?.aiStatus !==
      undefined
    ) {

      updateData.aiStatus =
        String(
          inspectionData.aiStatus,
        );
    }


    if (
      inspectionData?.aiScore !==
      undefined
    ) {

      updateData.aiScore =
        inspectionData.aiScore ===
        null

          ? null

          : Number(
              inspectionData.aiScore,
            );
    }


    if (
      inspectionData?.damageDetected !==
      undefined
    ) {

      updateData.damageDetected =
        Boolean(
          inspectionData.damageDetected,
        );
    }


    if (
      inspectionData?.damageSummary !==
      undefined
    ) {

      updateData.damageSummary =
        inspectionData.damageSummary
          ? String(
              inspectionData.damageSummary,
            )
          : null;
    }


    if (
      inspectionData?.vinExtracted !==
      undefined
    ) {

      updateData.vinExtracted =
        inspectionData.vinExtracted
          ? String(
              inspectionData.vinExtracted,
            )
          : null;
    }


    if (
      inspectionData?.odometerReading !==
      undefined
    ) {

      updateData.odometerReading =
        inspectionData.odometerReading
          ? String(
              inspectionData.odometerReading,
            )
          : null;
    }


    if (
      inspectionData?.aiProvider !==
      undefined
    ) {

      updateData.aiProvider =
        inspectionData.aiProvider
          ? String(
              inspectionData.aiProvider,
            )
          : null;
    }


    if (
      inspectionData?.processedAt !==
      undefined
    ) {

      updateData.processedAt =
        inspectionData.processedAt
          ? new Date(
              inspectionData.processedAt,
            )
          : null;
    }


    // =======================================================
    // DATABASE UPDATE
    // =======================================================

    const inspection =
      await this.prisma.inspection.update({

        where: {
          id,
        },

        data:
          updateData,

      });


    this.logger.log(
      `Inspection updated: ${inspection.id}`,
    );


    return this.formatInspection(
      inspection,
    );
  }


  // =========================================================
  // SUBMIT INSPECTION
  // =========================================================

  async submitInspection(
    reference: string,
  ) {

    const cleanReference =
      String(
        reference ?? '',
      ).trim();


    if (!cleanReference) {

      throw new NotFoundException(
        'Inspection reference is required',
      );
    }


    const existing =
      await this.prisma.inspection.findUnique({

        where: {
          reference:
            cleanReference,
        },

      });


    if (!existing) {

      throw new NotFoundException(
        'Inspection not found',
      );
    }


    this.logger.log(
      `Submitting inspection: ${existing.id}`,
    );


    this.logger.log(
      `Reference: ${existing.reference}`,
    );


    const inspection =
      await this.prisma.inspection.update({

        where: {

          id:
            existing.id,

        },

        data: {

          status:
            'submitted',

          submittedAt:
            new Date(),
        },

      });


    this.logger.log(
      `Inspection submitted successfully: ${inspection.id}`,
    );


    return this.formatInspection(
      inspection,
    );
  }


  // =========================================================
  // DELETE INSPECTION
  // =========================================================

  async deleteInspection(
    id: string,
  ) {

    const existing =
      await this.prisma.inspection.findUnique({

        where: {
          id,
        },

      });


    if (!existing) {

      throw new NotFoundException(
        'Inspection not found',
      );
    }


    await this.prisma.inspection.delete({

      where: {
        id,
      },

    });


    return {

      message:
        'Inspection deleted successfully',

      id,
    };
  }


  // =========================================================
  // FORMAT INSPECTION
  // =========================================================

  private formatInspection(
    inspection: any,
  ) {

    const frontendUrl =
      (
        process.env.FRONTEND_URL ??
        'http://localhost:4200'
      ).replace(
        /\/+$/,
        '',
      );


    const inspectionType =
      inspection.inspectionType ===
      'accident'
        ? 'accident'
        : 'pre-cover';


    const secureLink =
      `${frontendUrl}` +
      `/customer/start/` +
      `${inspectionType}/` +
      `${encodeURIComponent(
        String(
          inspection.reference ?? '',
        ),
      )}`;


    return {

      id:
        inspection.id,


      reference:
        inspection.reference ??
        '',


      status:
        inspection.status,


      inspectionType,


      type:
        inspectionType,


      createdAt:
        inspection.createdAt,


      updatedAt:
        inspection.updatedAt,


      // =====================================================
      // FIX: RETURN THE REAL SUBMISSION TIME
      // =====================================================

      submittedAt:
        inspection.submittedAt ??
        null,


      // =====================================================
      // CUSTOMER
      // =====================================================

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
          '',
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


      // =====================================================
      // POLICY
      // =====================================================

      policy: {

        policyNumber:
          inspection.policyNumber ??
          '',

        insuranceCompany:
          inspection.insuranceCompany ??
          '',
      },


      policyNumber:
        inspection.policyNumber ??
        '',


      insuranceCompany:
        inspection.insuranceCompany ??
        '',


      // =====================================================
      // VEHICLE
      // =====================================================

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
          '',
      },


      vin:
        inspection.vinExtracted ??
        '',


      // =====================================================
      // PHOTOS
      // =====================================================

      photos:
        Array.isArray(
          inspection.photos,
        )
          ? inspection.photos
          : [],


      accidentPhotos:
        Array.isArray(
          inspection.damagePhotos,
        )
          ? inspection.damagePhotos
          : [],


      damagePhotos:
        Array.isArray(
          inspection.damagePhotos,
        )
          ? inspection.damagePhotos
          : [],


      // =====================================================
      // AI
      // =====================================================

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
          null,
      },


      // =====================================================
      // CUSTOMER ACCESS LINK
      // =====================================================

      secureLink,


      inspectionUrl:
        secureLink,
    };
  }
}