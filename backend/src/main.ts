import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  if (frontendUrl) {
    console.log(
      `Falcon frontend configured as ${frontendUrl}`,
    );
  }
}

bootstrap();