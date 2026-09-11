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
      inspectionData?.inspectionType ===
      'accident'
        ? 'accident'
        : 'pre-cover';

    const status =
      String(
        inspectionData?.status ??
        'pending',
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
      this.normaliseSevenPhotos(
        inspectionData?.photos,
      );

    // =======================================================
    // IMPORTANT:
    // ONE canonical seven-photo collection.
    // =======================================================

    const damagePhotos: any[] = [];

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
          aiStatus: 'PENDING',
          aiScore: null,
          damageDetected: false,
          damageSummary: null,
          vinExtracted: null,
          odometerReading: null,
          aiProvider: null,
          processedAt: null,
        
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
          inspection.reference ??
          '',
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
      inspectionUrl: secureLink,
    };
  }

  // =========================================================
  // NORMALISE TO EXACTLY 7 PHOTOS
  // =========================================================

  private normaliseSevenPhotos(
    photos: any,
  ): any[] {
    if (!Array.isArray(photos)) {
      return [];
    }

    return photos.slice(
      0,
      7,
    );
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

    await this.prisma.inspection.update({
      where: {
        id,
      },
      data: {
        aiStatus: 'PROCESSING',
        aiProvider: 'Amazon Bedrock',
      },
    });

    try {
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
          this.normaliseSevenPhotos(
            inspection.photos,
          ),

        damagePhotos: [],
      };

      this.logger.log(
        `Sending ${inspection.inspectionType} inspection to Amazon Bedrock`,
      );

      this.logger.log(
        `Canonical inspection photos: ${
          Array.isArray(
            inspection.photos,
          )
            ? Math.min(
                inspection.photos.length,
                7,
              )
            : 0
        }`,
      );

      this.logger.log(
        'Damage photos: 0',
      );

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

      const parsed =
        this.parseAiResponse(
          aiResponse,
        );

      this.logger.log(
        `Parsed AI score: ${parsed.aiScore}`,
      );

      this.logger.log(
        `Parsed AI confidence: ${
          parsed.aiAssessment?.confidence ??
          'Not available'
        }`,
      );

      this.logger.log(
        `Parsed damage detected: ${parsed.damageDetected}`,
      );

      this.logger.log(
        `Parsed damage summary length: ${
          parsed.damageSummary.length
        }`,
      );

      // =====================================================
      // SAVE COMPLETE STRUCTURED AI ASSESSMENT
      //
      // This is the important fix.
      //
      // Bedrock already returns confidence, damage categories,
      // overall condition, concerns, follow-up and insurance
      // processing. Save all of it into aiAssessment.
      // =====================================================

      const updatedInspection =
        await this.prisma.inspection.update({
          where: {
            id,
          },
          data: {
            status: 'completed',

            aiStatus: 'COMPLETED',

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

            aiAssessment:
              parsed.aiAssessment,
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
        `Reference: ${updatedInspection.reference}`,
      );

      this.logger.log(
        `Inspection type: ${updatedInspection.inspectionType}`,
      );

      this.logger.log(
        `Final inspection status: ${updatedInspection.status}`,
      );

      this.logger.log(
        `AI Score: ${parsed.aiScore}`,
      );

      this.logger.log(
        `AI Confidence: ${
          parsed.aiAssessment?.confidence ??
          'Not available'
        }`,
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
        `Inspection ID: ${id}`,
      );

      this.logger.error(
        error instanceof Error
          ? error.stack
          : String(error),
      );

      this.logger.error(
        '======================================',
      );

      await this.prisma.inspection.update({
        where: {
          id,
        },
        data: {
          aiStatus: 'FAILED',

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

    let parsedJson: any = null;

    // =======================================================
    // FIRST: PURE JSON
    // =======================================================

    try {
      parsedJson =
        JSON.parse(
          rawResponse,
        );
    } catch {
      parsedJson = null;
    }

    // =======================================================
    // JSON INSIDE MARKDOWN CODE BLOCK
    // =======================================================

    if (!parsedJson) {
      const jsonCodeBlock =
        rawResponse.match(
          /```(?:json)?\s*([\s\S]*?)\s*```/i,
        );

      if (jsonCodeBlock?.[1]) {
        try {
          parsedJson =
            JSON.parse(
              jsonCodeBlock[1].trim(),
            );
        } catch {
          parsedJson = null;
        }
      }
    }

    // =======================================================
    // JSON OBJECT EMBEDDED IN RESPONSE
    // =======================================================

    if (!parsedJson) {
      const firstBrace =
        rawResponse.indexOf('{');

      const lastBrace =
        rawResponse.lastIndexOf('}');

      if (
        firstBrace >= 0 &&
        lastBrace > firstBrace
      ) {
        const possibleJson =
          rawResponse.slice(
            firstBrace,
            lastBrace + 1,
          );

        try {
          parsedJson =
            JSON.parse(
              possibleJson,
            );
        } catch {
          parsedJson = null;
        }
      }
    }

    // =======================================================
    // JSON RESPONSE
    // =======================================================

    if (
      parsedJson &&
      typeof parsedJson === 'object' &&
      !Array.isArray(parsedJson)
    ) {
      this.logger.log(
        'AI response parsed as structured JSON',
      );

      return this.parseStructuredAiResponse(
        parsedJson,
        rawResponse,
      );
    }

    // =======================================================
    // SECTIONED TEXT RESPONSE
    // =======================================================

    return this.parseSectionedAiResponse(
      rawResponse,
    );
  }

  // =========================================================
  // PARSE STRUCTURED JSON RESPONSE
  // =========================================================

  private parseStructuredAiResponse(
    parsed: any,
    rawResponse: string,
  ) {
    let aiScore:
      number | null = null;

    // =======================================================
    // DAMAGE SCORE
    //
    // Do NOT use confidence as the damage score.
    // =======================================================

    const possibleScore =
      parsed.aiScore ??
      parsed.score ??
      parsed.damagePercentage;

    if (
      typeof possibleScore === 'number' &&
      Number.isFinite(
        possibleScore,
      )
    ) {
      aiScore =
        Math.max(
          0,
          Math.min(
            100,
            possibleScore,
          ),
        );
    } else if (
      typeof possibleScore === 'string'
    ) {
      const numeric =
        Number(
          possibleScore
            .replace('%', '')
            .trim(),
        );

      if (
        Number.isFinite(
          numeric,
        )
      ) {
        aiScore =
          Math.max(
            0,
            Math.min(
              100,
              numeric,
            ),
          );
      }
    }

    // =======================================================
    // CONFIDENCE
    // =======================================================

    let confidence:
      number | null = null;

    const possibleConfidence =
      parsed.confidence ??
      parsed.aiConfidence ??
      parsed.confidencePercentage ??
      parsed.confidencePercent;

    if (
      typeof possibleConfidence === 'number' &&
      Number.isFinite(
        possibleConfidence,
      )
    ) {
      confidence =
        Math.max(
          0,
          Math.min(
            100,
            possibleConfidence,
          ),
        );
    } else if (
      typeof possibleConfidence === 'string'
    ) {
      const numericConfidence =
        Number(
          possibleConfidence
            .replace('%', '')
            .trim(),
        );

      if (
        Number.isFinite(
          numericConfidence,
        )
      ) {
        confidence =
          Math.max(
            0,
            Math.min(
              100,
              numericConfidence,
            ),
          );
      }
    }

    // =======================================================
    // DAMAGE DETECTED
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
        this.isPositiveDamageStatement(
          parsed.damageDetected,
        );
    }

    // =======================================================
    // DAMAGE CATEGORIES
    // =======================================================

    const damageCategories =
      this.normaliseStringArray(
        parsed.damageCategories,
      );

    // =======================================================
    // OVERALL CONDITION
    // =======================================================

    const overallCondition =
      typeof parsed.overallCondition ===
      'string'
        ? parsed.overallCondition.trim()
        : '';

    // =======================================================
    // POTENTIAL CONCERNS
    // =======================================================

    const potentialConcerns =
      this.normaliseStringArray(
        parsed.potentialConcerns,
      );

    // =======================================================
    // RECOMMENDED FOLLOW-UP
    // =======================================================

    const recommendedFollowUp =
      this.normaliseStringArray(
        parsed.recommendedFollowUp,
      );

    // =======================================================
    // DAMAGE SUMMARY
    // =======================================================

    const directDamageSummary =
      parsed.damageSummary ??
      parsed.damageAssessment ??
      '';

    const damageSummaryParts = [
      overallCondition
        ? `OVERALL CONDITION:\n${overallCondition}`
        : '',

      directDamageSummary
        ? `DAMAGE ASSESSMENT:\n${String(
            directDamageSummary,
          ).trim()}`
        : '',

      potentialConcerns.length > 0
        ? `POTENTIAL CONCERNS:\n${potentialConcerns.join('\n')}`
        : '',

      recommendedFollowUp.length > 0
        ? `RECOMMENDED FOLLOW-UP:\n${recommendedFollowUp.join('\n')}`
        : '',

      parsed.insuranceProcessing
        ? `INSURANCE PROCESSING:\n${String(
            parsed.insuranceProcessing,
          ).trim()}`
        : '',
    ].filter(
      section =>
        Boolean(
          section.trim(),
        ),
    );

    let damageSummary =
      damageSummaryParts.join(
        '\n\n',
      );

    if (!damageSummary) {
      damageSummary =
        rawResponse;
    }

    // =======================================================
    // FALLBACK DAMAGE DETECTION
    // =======================================================

    if (
      parsed.damageDetected ===
      undefined
    ) {
      damageDetected =
        this.isPositiveDamageStatement(
          [
            parsed.damageSummary,
            parsed.damageAssessment,
            damageCategories.join(' '),
          ]
            .filter(Boolean)
            .join(' '),
        );
    }

    // =======================================================
    // VIN
    // =======================================================

    const vinExtracted =
      parsed.vinExtracted ??
      parsed.vin ??
      this.extractVin(
        rawResponse,
      );

    // =======================================================
    // ODOMETER
    // =======================================================

    const odometerReading =
      parsed.odometerReading ??
      parsed.odometer ??
      this.extractOdometer(
        rawResponse,
      );

    // =======================================================
    // COMPLETE STRUCTURED ASSESSMENT
    // =======================================================

    const aiAssessment = {
      damagePercentage:
        aiScore,

      confidence,

      damageDetected,

      damageCategories,

      overallCondition,

      damageSummary:
        typeof parsed.damageSummary === 'string'
          ? parsed.damageSummary.trim()
          : typeof parsed.damageAssessment === 'string'
            ? parsed.damageAssessment.trim()
            : '',

      potentialConcerns,

      recommendedFollowUp,

      insuranceProcessing:
        typeof parsed.insuranceProcessing === 'string'
          ? parsed.insuranceProcessing.trim()
          : '',

      vinExtracted:
        vinExtracted
          ? String(
              vinExtracted,
            )
          : null,

      odometerReading:
        this.toNumericOdometer(
          odometerReading,
        ),
    };

    this.logger.log(
      `Structured AI confidence extracted: ${
        aiAssessment.confidence
      }`,
    );

    return {
      aiScore,

      confidence,

      damageDetected,

      damageSummary,

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

      aiAssessment,

      rawResponse,
    };
  }

  // =========================================================
  // NORMALISE STRING ARRAY
  // =========================================================

  private normaliseStringArray(
    value: any,
  ): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter(
        item =>
          typeof item === 'string',
      )
      .map(
        item =>
          item.trim(),
      )
      .filter(
        item =>
          Boolean(item),
      );
  }

  // =========================================================
  // NORMALISE ODOMETER
  // =========================================================

  private toNumericOdometer(
    value: any,
  ): number | null {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return null;
    }

    const numeric =
      Number(
        String(value)
          .replace(/,/g, '')
          .trim(),
      );

    if (
      !Number.isFinite(
        numeric,
      ) ||
      numeric < 0
    ) {
      return null;
    }

    return numeric;
  }

  // =========================================================
  // PARSE NOVA SECTIONED TEXT RESPONSE
  // =========================================================

  private parseSectionedAiResponse(
    rawResponse: string,
  ) {
    const overallCondition =
      this.extractAiSectionByAliases(
        rawResponse,
        [
          'OVERALL CONDITION',
          'OVERALL ASSESSMENT',
          'GENERAL CONDITION',
          'CONDITION',
        ],
        [
          'DAMAGE ASSESSMENT',
          'DAMAGE FINDINGS',
          'DAMAGE',
          'POTENTIAL CONCERNS',
          'CONCERNS',
          'RECOMMENDED FOLLOW-UP',
          'RECOMMENDATIONS',
          'NEXT STEPS',
          'INSURANCE PROCESSING',
          'INSURANCE',
          'CLAIM ASSESSMENT',
        ],
      );

    const damageAssessment =
      this.extractAiSectionByAliases(
        rawResponse,
        [
          'DAMAGE ASSESSMENT',
          'DAMAGE FINDINGS',
          'DAMAGE',
        ],
        [
          'POTENTIAL CONCERNS',
          'CONCERNS',
          'RECOMMENDED FOLLOW-UP',
          'RECOMMENDATIONS',
          'NEXT STEPS',
          'INSURANCE PROCESSING',
          'INSURANCE',
          'CLAIM ASSESSMENT',
        ],
      );

    const potentialConcerns =
      this.extractAiSectionByAliases(
        rawResponse,
        [
          'POTENTIAL CONCERNS',
          'CONCERNS',
          'POTENTIAL ISSUES',
          'ISSUES',
        ],
        [
          'RECOMMENDED FOLLOW-UP',
          'RECOMMENDATIONS',
          'NEXT STEPS',
          'INSURANCE PROCESSING',
          'INSURANCE',
          'CLAIM ASSESSMENT',
        ],
      );

    const recommendedFollowUp =
      this.extractAiSectionByAliases(
        rawResponse,
        [
          'RECOMMENDED FOLLOW-UP',
          'RECOMMENDED FOLLOW UP',
          'RECOMMENDATIONS',
          'RECOMMENDED ACTION',
          'NEXT STEPS',
        ],
        [
          'INSURANCE PROCESSING',
          'INSURANCE',
          'CLAIM ASSESSMENT',
        ],
      );

    const insuranceProcessing =
      this.extractAiSectionByAliases(
        rawResponse,
        [
          'INSURANCE PROCESSING',
          'INSURANCE ASSESSMENT',
          'INSURANCE',
          'CLAIM ASSESSMENT',
          'CLAIM PROCESSING',
        ],
        [],
      );

    this.logger.log(
      `AI section OVERALL CONDITION found: ${Boolean(
        overallCondition,
      )}`,
    );

    this.logger.log(
      `AI section DAMAGE ASSESSMENT found: ${Boolean(
        damageAssessment,
      )}`,
    );

    this.logger.log(
      `AI section POTENTIAL CONCERNS found: ${Boolean(
        potentialConcerns,
      )}`,
    );

    this.logger.log(
      `AI section RECOMMENDED FOLLOW-UP found: ${Boolean(
        recommendedFollowUp,
      )}`,
    );

    this.logger.log(
      `AI section INSURANCE PROCESSING found: ${Boolean(
        insuranceProcessing,
      )}`,
    );

    const damageDetected =
      this.isPositiveDamageStatement(
        damageAssessment,
      );

    const aiScore =
      this.extractNumericScore(
        rawResponse,
      );

    const sections = [
      overallCondition
        ? `OVERALL CONDITION:\n${overallCondition}`
        : '',

      damageAssessment
        ? `DAMAGE ASSESSMENT:\n${damageAssessment}`
        : '',

      potentialConcerns
        ? `POTENTIAL CONCERNS:\n${potentialConcerns}`
        : '',

      recommendedFollowUp
        ? `RECOMMENDED FOLLOW-UP:\n${recommendedFollowUp}`
        : '',

      insuranceProcessing
        ? `INSURANCE PROCESSING:\n${insuranceProcessing}`
        : '',
    ].filter(
      section =>
        Boolean(
          section.trim(),
        ),
    );

    const damageSummary =
      sections.length > 0
        ? sections.join(
            '\n\n',
          )
        : rawResponse;

    const vinExtracted =
      this.extractVin(
        rawResponse,
      );

    const odometerReading =
      this.extractOdometer(
        rawResponse,
      );

    // =======================================================
    // SECTIONED RESPONSES DO NOT HAVE A RELIABLE CONFIDENCE
    // FIELD. Keep it null rather than incorrectly using the
    // damage score as confidence.
    // =======================================================

    const aiAssessment = {
      damagePercentage:
        aiScore,

      confidence:
        null,

      damageDetected,

      damageCategories:
        [],

      overallCondition:
        overallCondition || '',

      damageSummary:
        damageAssessment ||
        damageSummary,

      potentialConcerns:
        potentialConcerns
          ? [potentialConcerns]
          : [],

      recommendedFollowUp:
        recommendedFollowUp
          ? [recommendedFollowUp]
          : [],

      insuranceProcessing:
        insuranceProcessing || '',

      vinExtracted:
        vinExtracted,

      odometerReading:
        this.toNumericOdometer(
          odometerReading,
        ),
    };

    return {
      aiScore,

      confidence:
        null,

      damageDetected,

      damageSummary,

      vinExtracted,

      odometerReading,

      aiAssessment,

      rawResponse,
    };
  }

  // =========================================================
  // ROBUST SECTION EXTRACTION
  // =========================================================

  private extractAiSectionByAliases(
    response: string,
    aliases: string[],
    allNextHeadings: string[],
  ): string {
    if (!response) {
      return '';
    }

    const normalised =
      response
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();

    const lines =
      normalised.split('\n');

    const normaliseHeading =
      (value: string): string => {
        return value
          .replace(
            /^[\s>*`~_-]+/,
            '',
          )
          .replace(
            /[\s>*`~_-]+$/,
            '',
          )
          .replace(
            /^#{1,6}\s*/,
            '',
          )
          .replace(
            /^\d+\s*[.)\-:]\s*/,
            '',
          )
          .replace(
            /^\*+|\*+$/g,
            '',
          )
          .replace(
            /^_+|_+$/g,
            '',
          )
          .replace(
            /:$/,
            '',
          )
          .trim()
          .replace(
            /\s+/g,
            ' ',
          )
          .toUpperCase();
      };

    const aliasSet =
      aliases.map(
        alias =>
          normaliseHeading(
            alias,
          ),
      );

    const nextSet =
      allNextHeadings.map(
        heading =>
          normaliseHeading(
            heading,
          ),
      );

    let startLine = -1;

    for (
      let index = 0;
      index < lines.length;
      index++
    ) {
      const rawLine =
        lines[index];

      const cleaned =
        rawLine
          .trim()
          .replace(
            /^[\s>*`~]+/,
            '',
          )
          .replace(
            /[\s>*`~]+$/,
            '',
          );

      const normalisedLine =
        normaliseHeading(
          cleaned,
        );

      if (
        aliasSet.includes(
          normalisedLine,
        )
      ) {
        startLine =
          index;

        break;
      }

      const withoutNumber =
        normalisedLine.replace(
          /^\d+\s+/,
          '',
        );

      if (
        aliasSet.includes(
          withoutNumber,
        )
      ) {
        startLine =
          index;

        break;
      }
    }

    if (startLine < 0) {
      return '';
    }

    const contentLines: string[] = [];

    for (
      let index =
        startLine + 1;
      index < lines.length;
      index++
    ) {
      const rawLine =
        lines[index];

      const cleaned =
        rawLine
          .trim()
          .replace(
            /^[\s>*`~]+/,
            '',
          )
          .replace(
            /[\s>*`~]+$/,
            '',
          );

      const normalisedLine =
        normaliseHeading(
          cleaned,
        );

      const isNextHeading =
        nextSet.includes(
          normalisedLine,
        );

      if (isNextHeading) {
        break;
      }

      if (
        this.looksLikeAiHeading(
          cleaned,
        ) &&
        !aliasSet.includes(
          normalisedLine,
        )
      ) {
        break;
      }

      contentLines.push(
        rawLine,
      );
    }

    return contentLines
      .join('\n')
      .trim()
      .replace(
        /^[\s*:-]+/,
        '',
      )
      .trim();
  }

  // =========================================================
  // DETECT LIKELY AI HEADING
  // =========================================================

  private looksLikeAiHeading(
    line: string,
  ): boolean {
    const value =
      line
        .trim()
        .replace(
          /^[#>*`~\s]+/,
          '',
        )
        .replace(
          /[#>*`~\s]+$/,
          '',
        )
        .replace(
          /^\d+\s*[.)\-:]\s*/,
          '',
        )
        .replace(
          /:$/,
          '',
        )
        .trim();

    if (!value) {
      return false;
    }

    if (
      value.length > 80
    ) {
      return false;
    }

    const words =
      value.split(/\s+/);

    if (
      words.length > 8
    ) {
      return false;
    }

    if (
      /^#{1,6}\s/.test(
        line.trim(),
      ) ||
      /^\*+\S/.test(
        line.trim(),
      ) ||
      /^\d+\s*[.)\-:]\s*/.test(
        line.trim(),
      )
    ) {
      return true;
    }

    return (
      value ===
        value.toUpperCase() &&
      /[A-Z]/.test(
        value,
      )
    );
  }

  // =========================================================
  // DETERMINE DAMAGE FROM AI TEXT
  // =========================================================

  private isPositiveDamageStatement(
    text: string,
  ): boolean {
    const value =
      String(
        text ?? '',
      )
        .toLowerCase()
        .replace(
          /\s+/g,
          ' ',
        )
        .trim();

    if (!value) {
      return false;
    }

    // =======================================================
    // CLEAR NEGATIVE STATEMENTS
    // =======================================================

    const noDamagePatterns = [
      /\bno visible damage\b/,
      /\bno apparent damage\b/,
      /\bno obvious damage\b/,
      /\bno significant damage\b/,
      /\bno definite damage\b/,
      /\bno damage is visible\b/,
      /\bno damage was visible\b/,
      /\bno damage detected\b/,
      /\bno damage identified\b/,
      /\bthere is no damage\b/,
      /\bthere are no signs of damage\b/,
      /\bno signs of damage\b/,
      /\bappears undamaged\b/,
      /\bappears to be undamaged\b/,
      /\bvehicle appears undamaged\b/,
      /\bno visible signs of damage\b/,
    ];

    for (
      const pattern of
      noDamagePatterns
    ) {
      if (
        pattern.test(
          value,
        )
      ) {
        return false;
      }
    }

    // =======================================================
    // POSITIVE DAMAGE STATEMENTS
    // =======================================================

    const damagePatterns = [
      /\bdamage\s+(?:is|was|has been)\s+(?:visible|detected|identified|present)\b/,
      /\bvisible damage\b/,
      /\bapparent damage\b/,
      /\bconfirmed damage\b/,
      /\bdamage detected\b/,
      /\bdamage identified\b/,
      /\bdamage present\b/,
      /\bdamaged\b/,
      /\bdented\b/,
      /\bdent\b/,
      /\bscratch(?:es|ed)?\b/,
      /\bcrack(?:ed|s)?\b/,
      /\bbroken\b/,
      /\bdeformation\b/,
      /\bdeformed\b/,
      /\bpaint damage\b/,
      /\bpanel damage\b/,
      /\bbumper damage\b/,
      /\blight damage\b/,
      /\bglass damage\b/,
      /\bimpact damage\b/,
      /\bcollision damage\b/,
    ];

    return damagePatterns.some(
      pattern =>
        pattern.test(
          value,
        ),
    );
  }

  // =========================================================
  // EXTRACT NUMERIC SCORE
  // =========================================================

  private extractNumericScore(
    response: string,
  ): number | null {
    if (!response) {
      return null;
    }

    const scorePatterns = [
      /\bai\s*score\s*[:\-]?\s*(\d{1,3})\s*%?/i,
      /\bdamage\s*percentage\s*[:\-]?\s*(\d{1,3})\s*%?/i,
      /\bscore\s*[:\-]?\s*(\d{1,3})\s*%?/i,
      /\bcondition\s*score\s*[:\-]?\s*(\d{1,3})\s*%?/i,
    ];

    for (
      const pattern of
      scorePatterns
    ) {
      const match =
        response.match(
          pattern,
        );

      if (
        match &&
        match[1]
      ) {
        const value =
          Number(
            match[1],
          );

        if (
          Number.isFinite(
            value,
          )
        ) {
          return Math.max(
            0,
            Math.min(
              100,
              value,
            ),
          );
        }
      }
    }

    return null;
  }

  // =========================================================
  // EXTRACT VIN
  // =========================================================

  private extractVin(
    response: string,
  ): string | null {
    if (!response) {
      return null;
    }

    const vinLabelMatch =
      response.match(
        /\b(?:VIN|vehicle identification number)\s*[:\-]?\s*([A-HJ-NPR-Z0-9]{17})\b/i,
      );

    if (
      vinLabelMatch &&
      vinLabelMatch[1]
    ) {
      return vinLabelMatch[1]
        .toUpperCase();
    }

    const standaloneVinMatch =
      response.match(
        /\b[A-HJ-NPR-Z0-9]{17}\b/i,
      );

    if (
      standaloneVinMatch &&
      standaloneVinMatch[0]
    ) {
      return standaloneVinMatch[0]
        .toUpperCase();
    }

    return null;
  }

  // =========================================================
  // EXTRACT ODOMETER
  // =========================================================

  private extractOdometer(
    response: string,
  ): string | null {
    if (!response) {
      return null;
    }

    const odometerMatch =
      response.match(
        /\b(?:odometer|mileage)\s*[:\-]?\s*([0-9][0-9,\s.]*)\s*(?:km|kilometers?|kilometres?)?\b/i,
      );

    if (
      !odometerMatch ||
      !odometerMatch[1]
    ) {
      return null;
    }

    return odometerMatch[1]
      .trim();
  }

  // =========================================================
  // ESCAPE REGEX
  // =========================================================

  private escapeRegex(
    value: string,
  ): string {
    return value.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    );
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

    const updateData: any = {};

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
      const submittedPhotos =
        this.normaliseSevenPhotos(
          inspectionData.photos,
        );

      updateData.photos =
        submittedPhotos;

      updateData.damagePhotos =
        [];
    } else if (
      inspectionData?.accidentPhotos !==
      undefined
    ) {
      updateData.photos =
        this.normaliseSevenPhotos(
          inspectionData.accidentPhotos,
        );

      updateData.damagePhotos =
        [];
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
    // STRUCTURED AI ASSESSMENT
    // =======================================================

    if (
      inspectionData?.aiAssessment !==
      undefined
    ) {
      updateData.aiAssessment =
        inspectionData.aiAssessment;
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

    this.logger.log(
      `Canonical photos saved: ${
        Array.isArray(
          inspection.photos,
        )
          ? inspection.photos.length
          : 0
      }`,
    );

    this.logger.log(
      `Damage photos saved: ${
        Array.isArray(
          inspection.damagePhotos,
        )
          ? inspection.damagePhotos.length
          : 0
      }`,
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

    this.logger.log(
      `Inspection type: ${
        inspection.inspectionType ??
        'pre-cover'
      }`,
    );

    this.logger.log(
      `Vehicle photos: ${
        Array.isArray(
          inspection.photos,
        )
          ? Math.min(
              inspection.photos.length,
              7,
            )
          : 0
      }`,
    );

    this.logger.log(
      'Damage photos: 0',
    );

    this.logger.log(
      `Starting background AI analysis: ${inspection.id}`,
    );

    void this.analyseInspection(
      inspection.id,
    ).catch(
      (error) => {
        this.logger.error(
          `Background AI analysis failed for inspection: ${inspection.id}`,
        );

        this.logger.error(
          error instanceof Error
            ? error.stack
            : String(error),
        );
      },
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
          inspection.reference ??
          '',
        ),
      )}`;

    // =======================================================
    // CANONICAL PHOTO RESPONSE
    // =======================================================

    let canonicalPhotos: any[] = [];

    if (
      Array.isArray(
        inspection.photos,
      ) &&
      inspection.photos.length > 0
    ) {
      canonicalPhotos =
        this.normaliseSevenPhotos(
          inspection.photos,
        );
    } else if (
      Array.isArray(
        inspection.damagePhotos,
      )
    ) {
      canonicalPhotos =
        this.normaliseSevenPhotos(
          inspection.damagePhotos,
        );
    }

    // Do not expose canonical photos as accidentPhotos.
    const canonicalDamagePhotos:
      any[] = [];

    // =======================================================
    // STORED STRUCTURED AI ASSESSMENT
    // =======================================================

    const storedAssessment =
      inspection.aiAssessment &&
      typeof inspection.aiAssessment === 'object'
        ? inspection.aiAssessment
        : null;

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
        canonicalPhotos,

      accidentPhotos:
        canonicalDamagePhotos,

      damagePhotos:
        canonicalDamagePhotos,

      // =====================================================
      // AI
      // =====================================================

      ai: {
        status:
          inspection.aiStatus ??
          'PENDING',

        score:
          inspection.aiScore ??
          storedAssessment?.damagePercentage ??
          null,

        damagePercentage:
          storedAssessment?.damagePercentage ??
          inspection.aiScore ??
          null,

        confidence:
          storedAssessment?.confidence ??
          null,

        damageDetected:
          storedAssessment?.damageDetected ??
          inspection.damageDetected ??
          false,

        damageCategories:
          storedAssessment?.damageCategories ??
          [],

        overallCondition:
          storedAssessment?.overallCondition ??
          null,

        damageSummary:
          storedAssessment?.damageSummary ??
          inspection.damageSummary ??
          null,

        potentialConcerns:
          storedAssessment?.potentialConcerns ??
          [],

        recommendedFollowUp:
          storedAssessment?.recommendedFollowUp ??
          [],

        insuranceProcessing:
          storedAssessment?.insuranceProcessing ??
          null,

        vin:
          storedAssessment?.vinExtracted ??
          inspection.vinExtracted ??
          null,

        odometer:
          storedAssessment?.odometerReading ??
          inspection.odometerReading ??
          null,

        provider:
          inspection.aiProvider ??
          null,

        processedAt:
          inspection.processedAt ??
          null,

        // Keep the complete assessment available too.
        assessment:
          storedAssessment,
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