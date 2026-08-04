import {
  Module,
} from '@nestjs/common';

import {
  InspectionsController,
} from './inspections.controller';

import {
  InspectionsService,
} from './inspections.service';

// Prisma lives outside src
import {
  PrismaModule,
} from '../../prisma/prisma.module';


@Module({

  imports: [

    PrismaModule,

  ],

  controllers: [

    InspectionsController,

  ],

  providers: [

    InspectionsService,

  ],

})

export class InspectionsModule {}