import {
  Module,
} from '@nestjs/common';

import {
  ServeStaticModule,
} from '@nestjs/serve-static';

import {
  join,
} from 'path';

import {
  InspectionsModule,
} from './inspections/inspections.module';

// NOTE:
// Prisma lives in backend/prisma, not backend/src/prisma
import {
  PrismaModule,
} from '../prisma/prisma.module';


@Module({

  imports: [

    ServeStaticModule.forRoot({

      rootPath: join(
        process.cwd(),
        'uploads',
      ),

      serveRoot: '/uploads/',

    }),

    PrismaModule,

    InspectionsModule,

  ],

})

export class AppModule {}