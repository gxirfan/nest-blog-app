/**
 * gxirfan's Blog Backend
 * Copyright (C) 2026 gxirfan
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import session from 'express-session';
import passport from 'passport';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/logger.config';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { VersioningType, Logger, ValidationPipe } from '@nestjs/common';

const pgSession = require('connect-pg-simple')(session);

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const configService = app.get(ConfigService);
  const nodeEnv = configService.getOrThrow<string>('NODE_ENV');
  const isProduction = nodeEnv === 'production';

  if (isProduction) {
    app.set('trust proxy', true);
  }

  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/public/',
  });

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const frontendUrl = isProduction
    ? configService.getOrThrow<string>('PRODUCTION_FRONTEND_URL').split(',')
    : configService.getOrThrow<string>('LOCAL_FRONTEND_URL');

  app.enableCors({
    origin: frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.enableShutdownHooks();

  const sessionStore = new pgSession({
    conString: configService.getOrThrow<string>('DATABASE_URL'),
    tableName: 'session',
    createTableIfMissing: true,
  });

  app.use(
    session({
      store: sessionStore,
      secret: configService.getOrThrow<string>('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 3600000 * 12, // 12 Hours
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        domain: isProduction
          ? configService.getOrThrow<string>('PRODUCTION_URL')
          : undefined,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  const port = configService.getOrThrow<number>('PORT');
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
}

bootstrap().catch((err) => {
  console.error('Error during application bootstrap:', err);
  process.exit(1);
});
