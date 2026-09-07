import {
  Module,
} from '@nestjs/common';

import {
  InspectionsController,
} from './inspections.controller';

import {
  InspectionsService,
} from './inspections.service';

import {
  BedrockService,
} from './bedrock.service';

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

    BedrockService,

  ],

})

export class InspectionsModule {}