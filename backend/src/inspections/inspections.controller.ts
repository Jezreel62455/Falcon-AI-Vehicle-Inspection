import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import {
  FilesInterceptor,
} from '@nestjs/platform-express';

import {
  diskStorage,
} from 'multer';

import {
  extname,
  join,
} from 'path';

import {
  existsSync,
  mkdirSync,
} from 'fs';

import {
  InspectionsService,
} from './inspections.service';

import {
  BedrockService,
} from './bedrock.service';


const uploadPath =
  join(
    process.cwd(),
    'uploads',
  );


if (
  !existsSync(uploadPath)
) {

  mkdirSync(
    uploadPath,
    {
      recursive: true,
    },
  );

}


@Controller('inspections')
export class InspectionsController {

  constructor(
    private readonly inspectionsService:
      InspectionsService,

    private readonly bedrockService:
      BedrockService,
  ) {}


  // =========================================================
  // BEDROCK TEST
  // =========================================================

  @Get('bedrock-test')
  async testBedrock() {

    console.log(
      '======================================'
    );

    console.log(
      'GET /inspections/bedrock-test'
    );

    console.log(
      'Testing Amazon Bedrock...'
    );

    console.log(
      '======================================'
    );


    try {

      const result =
        await this.bedrockService
          .testBedrock();


      console.log(
        '======================================'
      );

      console.log(
        'BEDROCK TEST SUCCESS'
      );

      console.log(
        result
      );

      console.log(
        '======================================'
      );


      return {

        success:
          true,

        message:
          'Amazon Bedrock connection successful',

        response:
          result,

      };

    } catch (error) {

      console.error(
        '======================================'
      );

      console.error(
        'BEDROCK TEST FAILED'
      );

      console.error(
        error
      );

      console.error(
        '======================================'
      );


      throw new HttpException(
        {
          success:
            false,

          message:
            'Amazon Bedrock test failed.',

          error:
            error instanceof Error
              ? error.message
              : String(error),
        },

        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    }

  }


  // =========================================================
  // CREATE INSPECTION REQUEST
  // =========================================================

  @Post()
  async createInspection(
    @Body() inspectionData: any,
  ) {

    console.log(
      '======================================'
    );

    console.log(
      'POST /inspections RECEIVED'
    );

    console.log(
      inspectionData
    );

    console.log(
      '======================================'
    );


    try {

      const result =
        await this.inspectionsService
          .createInspection(
            inspectionData,
          );


      console.log(
        '======================================'
      );

      console.log(
        'POST /inspections SUCCESS'
      );

      console.log(
        'REFERENCE:',
        result?.reference,
      );

      console.log(
        'SECURE LINK:',
        result?.secureLink,
      );

      console.log(
        '======================================'
      );


      return result;

    } catch (error) {

      console.error(
        '======================================'
      );

      console.error(
        'POST /inspections FAILED'
      );

      console.error(
        error
      );

      console.error(
        '======================================'
      );


      throw new HttpException(
        {
          message:
            'Failed to create inspection request.',

          error:
            error instanceof Error
              ? error.message
              : String(error),
        },

        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    }

  }


  // =========================================================
  // UPLOAD PHOTOS
  // =========================================================

  @Post('upload')

  @UseInterceptors(
    FilesInterceptor(
      'files',
      20,
      {
        storage:
          diskStorage({

            destination:
              uploadPath,

            filename:
              (
                req,
                file,
                callback,
              ) => {

                const uniqueName =
                  `${Date.now()}-${Math.round(
                    Math.random() * 1e9,
                  )}${extname(
                    file.originalname,
                  )}`;


                callback(
                  null,
                  uniqueName,
                );

              },

          }),
      },
    ),
  )

  uploadPhotos(

    @UploadedFiles()
    files:
      Express.Multer.File[],

    @Body()
    body: any,

  ) {

    return {

      message:
        'Photos uploaded successfully',

      inspectionId:
        body?.inspectionId ??
        null,

      files:
        (files ?? [])
          .map(
            file => ({

              originalName:
                file.originalname,

              fileName:
                file.filename,

              path:
                `/uploads/${file.filename}`,

            }),
          ),

    };

  }


  // =========================================================
  // GET ALL INSPECTIONS
  // =========================================================

  @Get()
  async getInspections() {

    return this.inspectionsService
      .getInspections();

  }


  // =========================================================
  // GET INSPECTION BY REFERENCE
  // =========================================================

  @Get('reference/:reference')
  async getInspectionByReference(

    @Param('reference')
    reference: string,

  ) {

    const inspection =
      await this.inspectionsService
        .getInspectionByReference(
          reference,
        );


    if (!inspection) {

      throw new NotFoundException(
        'Inspection request not found',
      );

    }


    return inspection;

  }


  // =========================================================
  // CUSTOMER SUBMIT
  // =========================================================

  @Patch('reference/:reference/submit')
  async submitInspection(

    @Param('reference')
    reference: string,

    @Body()
    inspectionData: any,

  ) {

    console.log(
      '======================================'
    );

    console.log(
      'CUSTOMER INSPECTION SUBMISSION'
    );

    console.log(
      'REFERENCE:',
      reference
    );

    console.log(
      '======================================'
    );


    try {

      if (
        inspectionData &&
        typeof inspectionData === 'object' &&
        Object.keys(inspectionData).length > 0
      ) {

        const existing =
          await this.inspectionsService
            .getInspectionByReference(
              reference,
            );


        if (!existing) {

          throw new NotFoundException(
            'Inspection not found',
          );

        }


        await this.inspectionsService
          .updateInspection(
            existing.id,
            inspectionData,
          );

      }


      const inspection =
        await this.inspectionsService
          .submitInspection(
            reference,
          );


      console.log(
        '======================================'
      );

      console.log(
        'CUSTOMER INSPECTION SUBMITTED'
      );

      console.log(
        'REFERENCE:',
        inspection?.reference
      );

      console.log(
        'STATUS:',
        inspection?.status
      );

      console.log(
        'SUBMITTED AT:',
        inspection?.submittedAt
      );

      console.log(
        '======================================'
      );


      return inspection;

    } catch (error) {

      console.error(
        '======================================'
      );

      console.error(
        'CUSTOMER INSPECTION SUBMISSION FAILED'
      );

      console.error(
        error
      );

      console.error(
        '======================================'
      );


      if (
        error instanceof NotFoundException
      ) {

        throw error;

      }


      throw new HttpException(
        {
          message:
            'Failed to submit inspection.',

          error:
            error instanceof Error
              ? error.message
              : String(error),
        },

        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    }

  }


  // =========================================================
  // RE-RUN AI ANALYSIS
  // =========================================================
  //
  // Re-analyses an existing inspection using the photos
  // already stored on that inspection.
  //
  // POST
  // /inspections/:id/analyse
  //
  // This does NOT create a new inspection.
  // =========================================================

  @Post(':id/analyse')
  async analyseInspection(

    @Param('id')
    id: string,

  ) {

    console.log(
      '======================================'
    );

    console.log(
      'RE-RUNNING AI ANALYSIS'
    );

    console.log(
      'INSPECTION ID:',
      id
    );

    console.log(
      '======================================'
    );


    try {

      const inspection =
        await this.inspectionsService
          .analyseInspection(
            id,
          );


      console.log(
        '======================================'
      );

      console.log(
        'AI RE-ANALYSIS COMPLETED'
      );

      console.log(
        'INSPECTION ID:',
        id
      );

      console.log(
        '======================================'
      );


      return inspection;

    } catch (error) {

      console.error(
        '======================================'
      );

      console.error(
        'AI RE-ANALYSIS FAILED'
      );

      console.error(
        'INSPECTION ID:',
        id
      );

      console.error(
        error
      );

      console.error(
        '======================================'
      );


      if (
        error instanceof NotFoundException
      ) {

        throw error;

      }


      throw new HttpException(
        {
          message:
            'Failed to analyse inspection.',

          error:
            error instanceof Error
              ? error.message
              : String(error),
        },

        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    }

  }


  // =========================================================
  // UPDATE INSPECTION BY ID
  // =========================================================

  @Patch(':id')
  async updateInspection(

    @Param('id')
    id: string,

    @Body()
    inspectionData: any,

  ) {

    try {

      const inspection =
        await this.inspectionsService
          .updateInspection(
            id,
            inspectionData,
          );


      if (!inspection) {

        throw new NotFoundException(
          'Inspection not found',
        );

      }


      return inspection;

    } catch (error) {

      console.error(
        'UPDATE INSPECTION ERROR:',
        error,
      );


      if (
        error instanceof NotFoundException
      ) {

        throw error;

      }


      throw new HttpException(
        {
          message:
            'Failed to update inspection.',

          error:
            error instanceof Error
              ? error.message
              : String(error),
        },

        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    }

  }


  // =========================================================
  // DELETE INSPECTION
  // =========================================================

  @Delete(':id')
  async deleteInspection(

    @Param('id')
    id: string,

  ) {

    try {

      const result =
        await this.inspectionsService
          .deleteInspection(
            id,
          );


      if (!result) {

        throw new NotFoundException(
          'Inspection not found',
        );

      }


      return result;

    } catch (error) {

      console.error(
        'DELETE INSPECTION ERROR:',
        error,
      );


      if (
        error instanceof NotFoundException
      ) {

        throw error;

      }


      throw new HttpException(
        {
          message:
            'Failed to delete inspection.',

          error:
            error instanceof Error
              ? error.message
              : String(error),
        },

        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    }

  }


  // =========================================================
  // GET INSPECTION BY ID
  // =========================================================

  @Get(':id')
  async getInspectionById(

    @Param('id')
    id: string,

  ) {

    const inspection =
      await this.inspectionsService
        .getInspectionById(
          id,
        );


    if (!inspection) {

      throw new NotFoundException(
        'Inspection not found',
      );

    }


    return inspection;

  }

}
