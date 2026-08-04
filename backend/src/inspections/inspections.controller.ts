import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  NotFoundException,
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


const uploadPath = join(
  process.cwd(),
  'uploads',
);


if (!existsSync(uploadPath)) {
  mkdirSync(uploadPath);
}


@Controller('inspections')
export class InspectionsController {


  constructor(
    private readonly inspectionsService:
      InspectionsService,
  ) {}



  @Post()
  async createInspection(
    @Body()
    inspectionData: any,
  ) {

    return this.inspectionsService
      .createInspection(
        inspectionData,
      );

  }




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

  ) {


    return {

      message:
        'Photos uploaded successfully',



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





  @Get()

  async getInspections() {


    return this.inspectionsService
      .getInspections();


  }





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