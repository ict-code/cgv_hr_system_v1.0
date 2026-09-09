import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

// NOTE: @nestjs/swagger is deliberately not wired up yet — as of this scaffold,
// @nestjs/swagger@11.4.7 does `require('@nestjs/common/interfaces')` as a
// subpath import, which @nestjs/common@12.0.1's package.json `exports` map
// does not expose (NestJS 12 is very recent; swagger hasn't caught up).
// Re-add once a compatible @nestjs/swagger version is available.

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
