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


import { InspectionsService } from './inspections.service';


@Controller('inspections')
export class InspectionsController {


  constructor(

    private readonly inspectionsService:

      InspectionsService,

  ) {}


  @Post()

  createInspection(

    @Body() inspectionData: any,

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

              join(

                process.cwd(),

                'uploads',

              ),


            filename: (

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

    files: Express.Multer.File[],

  ) {


    return {


      message:

        'Photos uploaded successfully',


      files:

        files.map(

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

  getInspections() {


    return this.inspectionsService

      .getInspections();

  }


  @Get(':id')

  getInspectionById(

    @Param('id') id: string,

  ) {


    const inspection =

      this.inspectionsService

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