import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';

interface PreparedImage {
  bytes: Buffer;
  format: 'jpeg' | 'png' | 'gif' | 'webp';
  index: number;
  label: string;
}

interface StructuredAiAssessment {
  damagePercentage: number;
  confidence: number;
  damageDetected: boolean;
  damageCategories: string[];
  overallCondition: string;
  damageSummary: string;
  potentialConcerns: string[];
  recommendedFollowUp: string[];
  insuranceProcessing: string;
  vinExtracted: string | null;
  odometerReading: number | null;
}

@Injectable()
export class BedrockService {
  private readonly logger = new Logger(
    BedrockService.name,
  );

  private readonly client =
    new BedrockRuntimeClient({
      region:
        process.env.AWS_REGION ??
        'eu-west-1',
    });

  private readonly modelId =
    process.env.BEDROCK_MODEL_ID ??
    'eu.amazon.nova-2-lite-v1:0';

  // =========================================================
  // TEST BEDROCK
  // =========================================================

  async testBedrock(): Promise<string> {
    const prompt =
      'Respond with exactly: FALCON NOVA TEST SUCCESS';

    const command =
      new ConverseCommand({
        modelId: this.modelId,

        messages: [
          {
            role: 'user',

            content: [
              {
                text: prompt,
              },
            ],
          },
        ],

        inferenceConfig: {
          maxTokens: 50,
          temperature: 0,
        },
      });

    this.logger.log(
      `Calling Amazon Bedrock model: ${this.modelId}`,
    );

    const response =
      await this.client.send(command);

    const text =
      response.output?.message?.content
        ?.map(
          item =>
            'text' in item
              ? item.text ?? ''
              : '',
        )
        .join('')
        .trim() ?? '';

    this.logger.log(
      `Bedrock response: ${text}`,
    );

    return text;
  }

  // =========================================================
  // ANALYSE VEHICLE INSPECTION
  // =========================================================

  async analyseInspection(
    inspectionData: any,
  ): Promise<string> {
    this.logger.log(
      '======================================',
    );

    this.logger.log(
      'BEDROCK VEHICLE INSPECTION ANALYSIS',
    );

    this.logger.log(
      `Model: ${this.modelId}`,
    );

    // =======================================================
    // ONLY USE CANONICAL 7 PHOTO COLLECTION
    // =======================================================

    const sourcePhotos =
      Array.isArray(
        inspectionData?.photos,
      )
        ? inspectionData.photos.slice(0, 7)
        : [];

    this.logger.log(
      `Canonical photos received: ${sourcePhotos.length}`,
    );

    if (
      sourcePhotos.length === 0
    ) {
      this.logger.warn(
        'No inspection photos were supplied to Bedrock.',
      );

      return this.analyseWithoutImages(
        inspectionData,
      );
    }

    // =======================================================
    // PREPARE IMAGES
    // =======================================================

    const images =
      this.prepareImages(
        sourcePhotos,
      );

    this.logger.log(
      `Valid visual images prepared: ${images.length}`,
    );

    if (
      images.length === 0
    ) {
      this.logger.warn(
        'No valid image data could be extracted from the inspection photos.',
      );

      return this.analyseWithoutImages(
        inspectionData,
      );
    }

    // =======================================================
    // BEDROCK IMAGE LIMIT
    //
    // Batch 1 = first 5 images
    // Batch 2 = remaining 2 images
    // =======================================================

    const firstBatch =
      images.slice(0, 5);

    const secondBatch =
      images.slice(5, 7);

    this.logger.log(
      `Bedrock visual batch 1: ${firstBatch.length} photos`,
    );

    const firstResult =
      await this.analyseImageBatch(
        firstBatch,
        inspectionData,
        1,
      );

    let secondResult = '';

    if (
      secondBatch.length > 0
    ) {
      this.logger.log(
        `Bedrock visual batch 2: ${secondBatch.length} photos`,
      );

      secondResult =
        await this.analyseImageBatch(
          secondBatch,
          inspectionData,
          2,
        );
    }

    // =======================================================
    // COMBINE VISUAL RESULTS
    // =======================================================

    const combinedVisualAssessment =
      [
        'VISUAL ANALYSIS BATCH 1:',
        firstResult,

        secondResult
          ? '\nVISUAL ANALYSIS BATCH 2:'
          : '',

        secondResult,
      ]
        .filter(
          value =>
            Boolean(
              String(value).trim(),
            ),
        )
        .join('\n');

    // =======================================================
    // FINAL STRUCTURED AI ASSESSMENT
    // =======================================================

    const finalResult =
      await this.createFinalAssessment(
        inspectionData,
        combinedVisualAssessment,
      );

    this.logger.log(
      'Bedrock inspection analysis completed',
    );

    this.logger.log(
      '======================================',
    );

    return finalResult;
  }

  // =========================================================
  // PREPARE IMAGES
  // =========================================================

  private prepareImages(
    photos: any[],
  ): PreparedImage[] {
    const prepared: PreparedImage[] = [];

    photos.forEach(
      (
        photo,
        index,
      ) => {
        try {
          const imageSource =
            this.extractImageSource(
              photo,
            );

          if (!imageSource) {
            this.logger.warn(
              `Photo ${index + 1} has no usable image data.`,
            );

            return;
          }

          const decoded =
            this.decodeImage(
              imageSource,
            );

          if (!decoded) {
            this.logger.warn(
              `Photo ${index + 1} could not be decoded.`,
            );

            return;
          }

          prepared.push({
            bytes: decoded.bytes,

            format: decoded.format,

            index: index + 1,

            label:
              this.getPhotoLabel(
                photo,
                index,
              ),
          });
        } catch (error) {
          this.logger.warn(
            `Unable to prepare photo ${index + 1}: ${
              error instanceof Error
                ? error.message
                : String(error)
            }`,
          );
        }
      },
    );

    return prepared;
  }

  // =========================================================
  // EXTRACT IMAGE SOURCE
  // =========================================================

  private extractImageSource(
    photo: any,
  ): string | null {
    if (
      typeof photo ===
      'string'
    ) {
      return photo.trim() || null;
    }

    if (
      !photo ||
      typeof photo !==
      'object'
    ) {
      return null;
    }

    const possibleValues = [
      photo.imageUrl,
      photo.image,
      photo.dataUrl,
      photo.data,
      photo.base64,
      photo.url,
      photo.src,
    ];

    for (
      const value of
      possibleValues
    ) {
      if (
        typeof value ===
          'string' &&
        value.trim()
      ) {
        return value.trim();
      }
    }

    return null;
  }

  // =========================================================
  // DECODE IMAGE
  // =========================================================

  private decodeImage(
    source: string,
  ): {
    bytes: Buffer;
    format:
      | 'jpeg'
      | 'png'
      | 'gif'
      | 'webp';
  } | null {
    // =======================================================
    // DATA URL
    // =======================================================

    if (
      source.startsWith(
        'data:image/',
      )
    ) {
      const match =
        source.match(
          /^data:image\/(jpeg|jpg|png|gif|webp);base64,(.+)$/is,
        );

      if (!match) {
        return null;
      }

      const rawFormat =
        match[1].toLowerCase();

      const format =
        rawFormat === 'jpg'
          ? 'jpeg'
          : rawFormat as
              | 'jpeg'
              | 'png'
              | 'gif'
              | 'webp';

      const bytes =
        Buffer.from(
          match[2],
          'base64',
        );

      if (!bytes.length) {
        return null;
      }

      return {
        bytes,
        format,
      };
    }

    // =======================================================
    // RAW BASE64
    // =======================================================

    if (
      this.looksLikeBase64(
        source,
      )
    ) {
      const bytes =
        Buffer.from(
          source,
          'base64',
        );

      if (!bytes.length) {
        return null;
      }

      const format =
        this.detectImageFormat(
          bytes,
        );

      if (!format) {
        return null;
      }

      return {
        bytes,
        format,
      };
    }

    return null;
  }

  // =========================================================
  // DETECT IMAGE FORMAT
  // =========================================================

  private detectImageFormat(
    bytes: Buffer,
  ):
    | 'jpeg'
    | 'png'
    | 'gif'
    | 'webp'
    | null {
    // JPEG
    if (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    ) {
      return 'jpeg';
    }

    // PNG
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return 'png';
    }

    // GIF
    if (
      bytes.length >= 6
    ) {
      const header =
        bytes
          .subarray(0, 6)
          .toString('ascii');

      if (
        header === 'GIF87a' ||
        header === 'GIF89a'
      ) {
        return 'gif';
      }
    }

    // WEBP
    if (
      bytes.length >= 12 &&
      bytes
        .subarray(0, 4)
        .toString('ascii') ===
        'RIFF' &&
      bytes
        .subarray(8, 12)
        .toString('ascii') ===
        'WEBP'
    ) {
      return 'webp';
    }

    return null;
  }

  // =========================================================
  // BASE64 CHECK
  // =========================================================

  private looksLikeBase64(
    value: string,
  ): boolean {
    if (
      !value ||
      value.length < 100
    ) {
      return false;
    }

    const clean =
      value.replace(
        /\s+/g,
        '',
      );

    if (
      clean.length % 4 !== 0
    ) {
      return false;
    }

    return /^[A-Za-z0-9+/]+={0,2}$/.test(
      clean,
    );
  }

  // =========================================================
  // PHOTO LABEL
  // =========================================================

  private getPhotoLabel(
    photo: any,
    index: number,
  ): string {
    const id =
      typeof photo?.id ===
      'string'
        ? photo.id
        : '';

    const labels:
      Record<string, string> = {
      front:
        'Front of Vehicle',

      rear:
        'Rear of Vehicle',

      left:
        'Left Side',

      right:
        'Right Side',

      'damage-close':
        'Damage Close-up',

      'damage-wide':
        'Damage Wider View',

      'accident-scene':
        'Accident Scene',
    };

    if (
      labels[id]
    ) {
      return labels[id];
    }

    if (
      typeof photo?.title ===
        'string' &&
      photo.title.trim()
    ) {
      return photo.title.trim();
    }

    return `Inspection Photo ${index + 1}`;
  }

  // =========================================================
  // ANALYSE IMAGE BATCH
  // =========================================================

  private async analyseImageBatch(
    images: PreparedImage[],
    inspectionData: any,
    batchNumber: number,
  ): Promise<string> {
    const content: any[] = [];

    // =======================================================
    // ADD REAL IMAGE CONTENT
    // =======================================================

    for (
      const image of
      images
    ) {
      content.push({
        image: {
          format:
            image.format,

          source: {
            bytes:
              image.bytes,
          },
        },
      });

      content.push({
        text:
          `Photo ${image.index}: ${image.label}`,
      });
    }

    // =======================================================
    // VEHICLE INFORMATION
    // =======================================================

    const vehicle =
      inspectionData?.vehicle ??
      {};

    // =======================================================
    // VISUAL ANALYSIS PROMPT
    // =======================================================

    const prompt = `
You are Falcon AI performing a professional vehicle insurance
visual inspection.

Inspect ONLY the vehicle photographs supplied with this
request.

This is visual inspection assistance only.

Do not invent damage, vehicle information, VIN, mileage,
or facts that cannot be supported by the photographs.

For every supplied photograph:

- Identify the visible vehicle area.
- Identify visible damage if present.
- Distinguish actual visible damage from reflections,
  shadows, dirt, normal panel gaps and image artefacts.
- Describe the severity of visible damage where possible.
- State uncertainty when the image does not provide
  sufficient evidence.

Pay particular attention to:

- dents
- scratches
- cracks
- broken lights
- damaged bumpers
- damaged panels
- glass damage
- paint damage
- missing parts
- deformation
- accident-related damage

Vehicle information:

Make:
${this.safeText(vehicle.make)}

Model:
${this.safeText(vehicle.model)}

Year:
${this.safeText(vehicle.year)}

Registration:
${this.safeText(vehicle.registration)}

Mileage:
${this.safeText(vehicle.mileage)}

This is visual analysis batch ${batchNumber}.

Return a concise factual visual assessment that can be used
by another AI step to produce the final insurance inspection
assessment.

Do not calculate an overall damage percentage in this step.
Focus on the actual visual evidence from these photographs.
`;

    content.push({
      text: prompt,
    });

    const command =
      new ConverseCommand({
        modelId:
          this.modelId,

        messages: [
          {
            role: 'user',
            content,
          },
        ],

        inferenceConfig: {
          maxTokens: 1000,
          temperature: 0,
        },
      });

    const response =
      await this.client.send(
        command,
      );

    const text =
      response.output?.message?.content
        ?.map(
          item =>
            'text' in item
              ? item.text ?? ''
              : '',
        )
        .join('')
        .trim() ?? '';

    this.logger.log(
      `Bedrock visual batch ${batchNumber} response length: ${text.length}`,
    );

    return text;
  }

  // =========================================================
  // FINAL STRUCTURED AI ASSESSMENT
  // =========================================================

  private async createFinalAssessment(
    inspectionData: any,
    visualAssessment: string,
  ): Promise<string> {
    const vehicle =
      inspectionData?.vehicle ??
      {};

    const customer =
      inspectionData?.customer ??
      {};

    const prompt = `
You are Falcon AI, a professional vehicle inspection
assessment system supporting motor insurance processing.

You have been given visual inspection findings from ALL
available vehicle photographs.

Your job is to produce the FINAL AI VEHICLE DAMAGE ASSESSMENT.

IMPORTANT:

The damage percentage MUST be generated from the visual
evidence.

Do NOT use a hardcoded default score.

Do NOT randomly select a score.

Do NOT assume that an ordinary vehicle has a particular
damage percentage.

Assess the visible damage severity across the supplied
inspection findings.

DAMAGE PERCENTAGE SCALE:

0 = no visible damage identified.

1-10 = extremely minor visible damage.

11-25 = minor visible damage.

26-50 = moderate visible damage.

51-75 = significant visible damage.

76-100 = severe or extensive visible damage.

The percentage represents the AI assessment of the severity
and extent of VISIBLE damage in the inspection photographs.

If there is genuinely no visible damage, use 0.

If damage is visible, select a percentage that reflects
the evidence.

Do not score damage that cannot be seen.

Do not treat shadows, reflections, dirt, image artefacts,
normal panel gaps or uncertainty as confirmed damage.

CONFIDENCE:

Return a confidence score from 0 to 100 representing how
confident you are that the visual evidence supports the
damage assessment.

High confidence requires clear photographs and consistent
visual evidence.

Low confidence should be used when photographs are unclear,
obstructed, incomplete or contradictory.

VIN:

Only provide a VIN if it is actually visible and can be read
from the supplied evidence.

Otherwise return null.

ODOMETER:

Only provide an odometer reading if it is actually visible
and readable from the supplied evidence.

Otherwise return null.

IMPORTANT OUTPUT RULE:

Return ONLY valid JSON.

Do not use Markdown.

Do not use code fences.

Do not write explanations before or after the JSON.

The JSON must have exactly this structure:

{
  "damagePercentage": 0,
  "confidence": 0,
  "damageDetected": false,
  "damageCategories": [],
  "overallCondition": "",
  "damageSummary": "",
  "potentialConcerns": [],
  "recommendedFollowUp": [],
  "insuranceProcessing": "",
  "vinExtracted": null,
  "odometerReading": null
}

FIELD REQUIREMENTS:

damagePercentage:
Number from 0 to 100.

confidence:
Number from 0 to 100.

damageDetected:
true only when actual visible damage is identified.

damageCategories:
Array of concise damage categories actually supported
by the visual evidence.

Examples:
"dented panel"
"paint scratch"
"cracked bumper"
"broken light"
"glass damage"
"panel deformation"

Do not include categories that are not visible.

overallCondition:
Short professional description such as:
"Excellent"
"Good"
"Fair"
"Poor"
"Severely damaged"

damageSummary:
Concise professional summary of the visible condition
and damage.

potentialConcerns:
Array of issues requiring human review or verification.

recommendedFollowUp:
Array of recommended next actions.

insuranceProcessing:
Concise statement about whether the visual inspection
appears sufficient for further insurance processing.
Do not make a coverage or liability decision.

vinExtracted:
String or null.

odometerReading:
Number or null.

VEHICLE:

Make:
${this.safeText(vehicle.make)}

Model:
${this.safeText(vehicle.model)}

Year:
${this.safeText(vehicle.year)}

Registration:
${this.safeText(vehicle.registration)}

Mileage:
${this.safeText(vehicle.mileage)}

CUSTOMER:

First name:
${this.safeText(customer.firstName)}

Surname:
${this.safeText(
      customer.lastName ??
      customer.surname,
    )}

ALL VISUAL INSPECTION FINDINGS:

${visualAssessment}

Return ONLY valid JSON.

The damagePercentage and confidence MUST be numerical
values between 0 and 100.
`;

    const command =
      new ConverseCommand({
        modelId:
          this.modelId,

        messages: [
          {
            role: 'user',

            content: [
              {
                text: prompt,
              },
            ],
          },
        ],

        inferenceConfig: {
          maxTokens: 1400,
          temperature: 0,
        },
      });

    const response =
      await this.client.send(
        command,
      );

    const rawText =
      response.output?.message?.content
        ?.map(
          item =>
            'text' in item
              ? item.text ?? ''
              : '',
        )
        .join('')
        .trim() ?? '';

    this.logger.log(
      `AI final response length: ${rawText.length}`,
    );

    this.logger.log(
      `AI final response preview: ${rawText.substring(0, 1000)}`,
    );

    // =======================================================
    // EXTRACT JSON
    // =======================================================

    const normalised =
      this.extractJsonObject(
        rawText,
      );

    if (!normalised) {
      this.logger.error(
        'Bedrock did not return valid JSON for the final assessment.',
      );

      throw new Error(
        'Bedrock returned an invalid structured AI assessment.',
      );
    }

    // =======================================================
    // VALIDATE AI ASSESSMENT
    // =======================================================

    const validated =
      this.validateAssessment(
        normalised,
      );

    if (!validated) {
      this.logger.error(
        'Bedrock JSON was returned but the AI damage assessment was invalid.',
      );

      throw new Error(
        'Bedrock returned an invalid damage assessment.',
      );
    }

    this.logger.log(
      `AI DAMAGE SCORE: ${validated.damagePercentage}%`,
    );

    this.logger.log(
      `AI CONFIDENCE: ${validated.confidence}%`,
    );

    this.logger.log(
      `AI DAMAGE DETECTED: ${validated.damageDetected}`,
    );

    this.logger.log(
      `AI DAMAGE CATEGORIES: ${
        validated.damageCategories.join(', ') ||
        'None'
      }`,
    );

    return JSON.stringify(
      validated,
    );
  }

  // =========================================================
  // EXTRACT JSON OBJECT
  // =========================================================

  private extractJsonObject(
    text: string,
  ): any | null {
    if (
      !text ||
      !text.trim()
    ) {
      return null;
    }

    let cleaned =
      text.trim();

    // Remove Markdown fences if Nova adds them.
    cleaned =
      cleaned
        .replace(
          /^```json\s*/i,
          '',
        )
        .replace(
          /^```\s*/i,
          '',
        )
        .replace(
          /\s*```$/i,
          '',
        )
        .trim();

    // First attempt: complete response.
    try {
      return JSON.parse(
        cleaned,
      );
    } catch {
      // Continue.
    }

    // Second attempt: locate JSON object.
    const firstBrace =
      cleaned.indexOf('{');

    const lastBrace =
      cleaned.lastIndexOf('}');

    if (
      firstBrace < 0 ||
      lastBrace <= firstBrace
    ) {
      return null;
    }

    const jsonText =
      cleaned.substring(
        firstBrace,
        lastBrace + 1,
      );

    try {
      return JSON.parse(
        jsonText,
      );
    } catch {
      return null;
    }
  }

  // =========================================================
  // VALIDATE STRUCTURED AI ASSESSMENT
  // =========================================================

  private validateAssessment(
    value: any,
  ): StructuredAiAssessment | null {
    if (
      !value ||
      typeof value !== 'object'
    ) {
      return null;
    }

    const damagePercentage =
      Number(
        value.damagePercentage,
      );

    const confidence =
      Number(
        value.confidence,
      );

    // AI damage score is mandatory.
    if (
      !Number.isFinite(
        damagePercentage,
      ) ||
      damagePercentage < 0 ||
      damagePercentage > 100
    ) {
      return null;
    }

    if (
      !Number.isFinite(
        confidence,
      ) ||
      confidence < 0 ||
      confidence > 100
    ) {
      return null;
    }

    if (
      typeof value.damageDetected !==
      'boolean'
    ) {
      return null;
    }

    const damageCategories =
      Array.isArray(
        value.damageCategories,
      )
        ? value.damageCategories
            .filter(
              item =>
                typeof item ===
                'string',
            )
            .map(
              item =>
                item.trim(),
            )
            .filter(
              item =>
                Boolean(item),
            )
        : [];

    const potentialConcerns =
      Array.isArray(
        value.potentialConcerns,
      )
        ? value.potentialConcerns
            .filter(
              item =>
                typeof item ===
                'string',
            )
            .map(
              item =>
                item.trim(),
            )
            .filter(
              item =>
                Boolean(item),
            )
        : [];

    const recommendedFollowUp =
      Array.isArray(
        value.recommendedFollowUp,
      )
        ? value.recommendedFollowUp
            .filter(
              item =>
                typeof item ===
                'string',
            )
            .map(
              item =>
                item.trim(),
            )
            .filter(
              item =>
                Boolean(item),
            )
        : [];

    const overallCondition =
      typeof value.overallCondition ===
      'string'
        ? value.overallCondition.trim()
        : '';

    const damageSummary =
      typeof value.damageSummary ===
      'string'
        ? value.damageSummary.trim()
        : '';

    const insuranceProcessing =
      typeof value.insuranceProcessing ===
      'string'
        ? value.insuranceProcessing.trim()
        : '';

    if (
      !overallCondition ||
      !damageSummary ||
      !insuranceProcessing
    ) {
      return null;
    }

    const vinExtracted =
      typeof value.vinExtracted ===
        'string' &&
      value.vinExtracted.trim()
        ? value.vinExtracted.trim()
        : null;

    let odometerReading:
      number | null = null;

    if (
      value.odometerReading !== null &&
      value.odometerReading !== undefined &&
      value.odometerReading !== ''
    ) {
      const numericOdometer =
        Number(
          value.odometerReading,
        );

      if (
        Number.isFinite(
          numericOdometer,
        ) &&
        numericOdometer >= 0
      ) {
        odometerReading =
          numericOdometer;
      }
    }

    return {
      damagePercentage:
        Math.round(
          damagePercentage,
        ),

      confidence:
        Math.round(
          confidence,
        ),

      damageDetected:
        value.damageDetected,

      damageCategories,

      overallCondition,

      damageSummary,

      potentialConcerns,

      recommendedFollowUp,

      insuranceProcessing,

      vinExtracted,

      odometerReading,
    };
  }

  // =========================================================
  // FALLBACK WITHOUT IMAGES
  // =========================================================

  private async analyseWithoutImages(
    inspectionData: any,
  ): Promise<string> {
    const vehicle =
      inspectionData?.vehicle ??
      {};

    const result:
      StructuredAiAssessment = {
      damagePercentage: 0,

      confidence: 0,

      damageDetected: false,

      damageCategories: [],

      overallCondition:
        'Unable to assess',

      damageSummary:
        'Visible vehicle damage cannot be assessed because no usable inspection photographs were available.',

      potentialConcerns: [
        'No usable inspection photographs were available for visual assessment.',
      ],

      recommendedFollowUp: [
        'Obtain the required inspection photographs before completing the visual assessment.',
      ],

      insuranceProcessing:
        'Insufficient visual evidence for AI-assisted insurance inspection processing.',

      vinExtracted: null,

      odometerReading: null,
    };

    this.logger.warn(
      'No visual evidence available. AI damage score cannot be legitimately determined.',
    );

    this.logger.log(
      `Vehicle without images: ${this.safeText(
        vehicle.make,
      )} ${this.safeText(
        vehicle.model,
      )}`,
    );

    return JSON.stringify(
      result,
    );
  }

  // =========================================================
  // SAFE TEXT
  // =========================================================

  private safeText(
    value: any,
  ): string {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return 'Unavailable';
    }

    return String(value);
  }
}
