import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  NotFoundException,
} from '@nestjs/common';

import { InspectionsService } from './inspections.service';


@Controller('inspections')
export class InspectionsController {


  constructor(
    private readonly inspectionsService: InspectionsService,
  ) {}


  @Post()
  createInspection(
    @Body() inspectionData: any,
  ) {

    return this.inspectionsService
      .createInspection(inspectionData);

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
        .getInspectionById(id);


    if (!inspection) {

      throw new NotFoundException(
        'Inspection not found',
      );

    }


    return inspection;

  }

}