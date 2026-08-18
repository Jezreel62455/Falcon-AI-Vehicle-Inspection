import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /*
   * Allow the Angular application to communicate
   * with the NestJS API from the local network.
   */
  app.enableCors({
    origin: true,
    credentials: true,
  });

  /*
   * IMPORTANT:
   *
   * 0.0.0.0 means NestJS listens on all network
   * interfaces, including:
   *
   * http://10.92.72.45:3000
   */
  await app.listen(3000, '0.0.0.0');

  console.log(
    'Falcon API running on http://localhost:3000'
  );

  console.log(
    'Falcon API available on local network at http://10.92.72.45:3000'
  );
}

bootstrap();