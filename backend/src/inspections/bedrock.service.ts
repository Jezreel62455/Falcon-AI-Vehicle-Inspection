import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';


@Injectable()
export class BedrockService {

  private readonly logger =
    new Logger(BedrockService.name);


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

      });


    this.logger.log(
      `Calling Amazon Bedrock model: ${this.modelId}`,
    );


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

    const prompt = `

You are Falcon AI, a professional vehicle inspection
assistant supporting insurance inspection processing.

Analyse the vehicle inspection information below.

IMPORTANT RULES:

- Only use information that is actually present.
- Do not invent vehicle damage, mileage, VIN information,
  or other facts.
- If information is missing, clearly say that it is unavailable.
- Be objective and professional.
- Do not make a final insurance coverage or liability decision.
- Your assessment is an AI-assisted inspection assessment only.

INSPECTION DATA:

${JSON.stringify(
  inspectionData,
  null,
  2,
)}


Provide a concise professional assessment using exactly
these sections:

OVERALL CONDITION:
Describe the apparent overall condition based only on
the supplied information.

DAMAGE ASSESSMENT:
Describe any visible or reported damage contained in the
inspection information.

POTENTIAL CONCERNS:
List any concerns, inconsistencies, missing information,
or items that may require human review.

RECOMMENDED FOLLOW-UP:
Explain what should be checked, verified, or reviewed next.

INSURANCE PROCESSING:
State whether the supplied inspection information appears
sufficient for further insurance processing.

Use clear professional language suitable for an insurance
inspection record.
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

      });


    this.logger.log(
      `Analysing inspection using Bedrock model: ${this.modelId}`,
    );


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
      'Bedrock inspection analysis completed',
    );


    return text;

  }

}