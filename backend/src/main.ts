import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { json, urlencoded } from 'express';

async function bootstrap() {
  /*
   * =========================================================
   * CREATE APPLICATION
   * =========================================================
   *
   * Disable Nest's default body parser so we can configure
   * a larger JSON payload limit for Falcon vehicle photos.
   */
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  /*
   * =========================================================
   * REQUEST BODY LIMITS
   * =========================================================
   *
   * Falcon inspections contain multiple vehicle photographs.
   *
   * The frontend currently sends compressed photographs as
   * base64 image data inside JSON requests.
   *
   * Express defaults to approximately 100 KB, which is far
   * too small for vehicle inspections.
   *
   * 25 MB allows a complete inspection payload containing
   * multiple photographs.
   */
  app.use(
    json({
      limit: '25mb',
    }),
  );

  app.use(
    urlencoded({
      limit: '25mb',
      extended: true,
    }),
  );

  /*
   * =========================================================
   * CORS
   * =========================================================
   *
   * Locally, allow the Angular development server.
   *
   * In AWS, FRONTEND_URL will contain the public HTTPS
   * address of the Angular application.
   */
  const frontendUrl =
    process.env.FRONTEND_URL?.trim();

  app.enableCors({
    origin: frontendUrl
      ? [frontendUrl]
      : true,
    credentials: true,
  });

  /*
   * =========================================================
   * PORT
   * =========================================================
   *
   * AWS App Runner provides the PORT environment variable.
   *
   * Locally, Falcon continues to use port 3000.
   */
  const port =
    Number(process.env.PORT) || 3000;

  /*
   * =========================================================
   * START SERVER
   * =========================================================
   *
   * 0.0.0.0 allows the application to listen on all
   * available network interfaces.
   */
  await app.listen(port, '0.0.0.0');

  console.log(
    `Falcon API running on port ${port}`,
  );

  console.log(
    'Falcon inspection payload limit: 25 MB',
  );

  if (frontendUrl) {
    console.log(
      `Falcon frontend configured as ${frontendUrl}`,
    );
  }
}

bootstrap();