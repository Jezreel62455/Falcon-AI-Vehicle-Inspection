import { Module } from '@nestjs/common';

import { AppController } from './app.controller';

import { AppService } from './app.service';

import { InspectionsModule } from './inspections/inspections.module';


@Module({

  imports: [

    InspectionsModule

  ],

  controllers: [

    AppController

  ],

  providers: [

    AppService

  ]

})


export class AppModule {}