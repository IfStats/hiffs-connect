import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
  rawBody: true,
});

  const port = Number(process.env.PORT ?? 4000);

  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';

  app.enableCors({
    origin: webOrigin,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);

  console.log(`Hiffs Connect API running on port ${port}`);
}

bootstrap();
