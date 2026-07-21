import { Injectable } from '@nestjs/common';

import { randomUUID } from 'crypto';


@Injectable()
export class InspectionsService {


  private inspections: any[] = [];


  createInspection(
    inspectionData: any,
  ) {


    const inspection = {


      id: randomUUID(),


      status: 'SUBMITTED',


      createdAt: new Date(),


      ...inspectionData,


    };


    this.inspections.push(
      inspection,
    );


    return {


      message:
        'Inspection created successfully',


      inspection,


    };

  }


  getInspections() {

    return this.inspections;

  }


  getInspectionById(
    id: string,
  ) {


    return this.inspections.find(
      inspection =>
        inspection.id === id,
    );

  }


}