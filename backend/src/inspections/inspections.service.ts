import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InspectionsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createInspection(inspectionData: any) {
    const policyData = inspectionData.policyNumber;

    const policyNumber =
      typeof policyData === 'object'
        ? policyData?.policy ?? null
        : policyData ?? null;

    const insuranceCompany =
      typeof policyData === 'object'
        ? policyData?.company ?? null
        : inspectionData.insuranceCompany ?? null;

    const inspection = await this.prisma.inspection.create({
      data: {
        status: 'SUBMITTED',

        inspectionType: inspectionData.inspectionType ?? null,

        customerFirstName: inspectionData.customerFirstName ?? null,
        customerSurname: inspectionData.customerSurname ?? null,

        policyNumber,
        insuranceCompany,

        registration: inspectionData.registration ?? null,
        make: inspectionData.make ?? null,
        model: inspectionData.model ?? null,

        year: inspectionData.year
          ? String(inspectionData.year)
          : null,

        colour: inspectionData.colour ?? null,

        mileage: inspectionData.mileage
          ? String(inspectionData.mileage)
          : null,

        photos: inspectionData.photos ?? null,

        damagePhotos: inspectionData.damagePhotos ?? [],

        // ============================
        // AI Defaults
        // ============================

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

    return this.formatInspection(inspection);
  }

  async getInspections() {
    const inspections = await this.prisma.inspection.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return inspections.map((inspection) =>
      this.formatInspection(inspection),
    );
  }

  async getInspectionById(id: string) {
    const inspection =
      await this.prisma.inspection.findUnique({
        where: {
          id,
        },
      });

    if (!inspection) {
      return null;
    }

    return this.formatInspection(inspection);
  }

  private formatInspection(inspection: any) {
    return {
      id: inspection.id,

      status: inspection.status,

      inspectionType: inspection.inspectionType,

      type: inspection.inspectionType,

      createdAt: inspection.createdAt,

      updatedAt: inspection.updatedAt,

      policyNumber: inspection.policyNumber,

      insuranceCompany: inspection.insuranceCompany,

      customer: {
        firstName: inspection.customerFirstName,
        surname: inspection.customerSurname,
      },

      vehicle: {
        registration: inspection.registration,
        make: inspection.make,
        model: inspection.model,
        year: inspection.year,
        colour: inspection.colour,
        mileage: inspection.mileage,
      },

      photos: inspection.photos,

      damagePhotos: inspection.damagePhotos,

      // ============================
      // AI Information
      // ============================

      ai: {
        status: inspection.aiStatus,
        score: inspection.aiScore,
        damageDetected: inspection.damageDetected,
        damageSummary: inspection.damageSummary,
        vin: inspection.vinExtracted,
        odometer: inspection.odometerReading,
        provider: inspection.aiProvider,
        processedAt: inspection.processedAt,
      },
    };
  }
}