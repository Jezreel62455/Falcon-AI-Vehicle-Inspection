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
  UseInterceptors
} from '@nestjs/common';

import {
  FilesInterceptor
} from '@nestjs/platform-express';

import {
  diskStorage
} from 'multer';

import {
  extname,
  join
} from 'path';

import {
  existsSync,
  mkdirSync
} from 'fs';

import {
  InspectionsService
} from './inspections.service';


const uploadPath =
  join(
    process.cwd(),
    'uploads'
  );


if (
  !existsSync(uploadPath)
) {

  mkdirSync(
    uploadPath,
    {
      recursive: true
    }
  );

}


@Controller('inspections')
export class InspectionsController {

  constructor(
    private readonly inspectionsService:
      InspectionsService
  ) {}


  // =========================================================
  // CREATE
  // =========================================================

  @Post()
  async createInspection(
    @Body() inspectionData: any
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

      /*
       * The service is responsible for generating the
       * official secure inspection reference.
       */

      const result =
        await this.inspectionsService
          .createInspection(
            inspectionData
          );


      console.log(
        '======================================'
      );

      console.log(
        'POST /inspections SUCCESS'
      );

      console.log(
        'REFERENCE:',
        result?.reference
      );

      console.log(
        'SECURE LINK:',
        result?.secureLink
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
              : String(error)
        },

        HttpStatus.INTERNAL_SERVER_ERROR
      );

    }

  }


  // =========================================================
  // UPLOAD
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
                callback
              ) => {

                const uniqueName =
                  `${Date.now()}-${Math.round(
                    Math.random() * 1e9
                  )}${extname(
                    file.originalname
                  )}`;


                callback(
                  null,
                  uniqueName
                );

              }

          })

      }

    )

  )

  uploadPhotos(

    @UploadedFiles()
    files:
      Express.Multer.File[],

    @Body()
    body: any

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
                `/uploads/${file.filename}`

            })
          )

    };

  }


  // =========================================================
  // GET ALL
  // =========================================================

  @Get()
  async getInspections() {

    return this.inspectionsService
      .getInspections();

  }


  // =========================================================
  // GET BY REFERENCE
  // =========================================================

  @Get('reference/:reference')
  async getInspectionByReference(

    @Param('reference')
    reference: string

  ) {

    const inspection =
      await this.inspectionsService
        .getInspectionByReference(
          reference
        );


    if (!inspection) {

      throw new NotFoundException(
        'Inspection request not found'
      );

    }


    return inspection;

  }


  // =========================================================
  // UPDATE
  // =========================================================

  @Patch(':id')
  async updateInspection(

    @Param('id')
    id: string,

    @Body()
    inspectionData: any

  ) {

    try {

      const inspection =
        await this.inspectionsService
          .updateInspection(
            id,
            inspectionData
          );


      if (!inspection) {

        throw new NotFoundException(
          'Inspection not found'
        );

      }


      return inspection;

    } catch (error) {

      console.error(
        'UPDATE INSPECTION ERROR:',
        error
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
              : String(error)
        },

        HttpStatus.INTERNAL_SERVER_ERROR
      );

    }

  }


  // =========================================================
  // DELETE
  // =========================================================

  @Delete(':id')
  async deleteInspection(

    @Param('id')
    id: string

  ) {

    try {

      const result =
        await this.inspectionsService
          .deleteInspection(
            id
          );


      if (!result) {

        throw new NotFoundException(
          'Inspection not found'
        );

      }


      return result;

    } catch (error) {

      console.error(
        'DELETE INSPECTION ERROR:',
        error
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
              : String(error)
        },

        HttpStatus.INTERNAL_SERVER_ERROR
      );

    }

  }


  // =========================================================
  // GET BY ID
  // =========================================================

  @Get(':id')
  async getInspectionById(

    @Param('id')
    id: string

  ) {

    const inspection =
      await this.inspectionsService
        .getInspectionById(
          id
        );


    if (!inspection) {

      throw new NotFoundException(
        'Inspection not found'
      );

    }


    return inspection;

  }

}