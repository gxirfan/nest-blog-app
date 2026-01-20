/**
 * gxirfan's Blog Backend
 * Copyright (C) 2026 gxirfan
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import session from 'express-session';
import passport from 'passport';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/logger.config';
import { ConfigService } from '@nestjs/config';
import MongoStore from 'connect-mongo';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/public/',
  });

  app.use(json({ limit: '50mb' }));

  app.use(urlencoded({ limit: '50mb', extended: true }));

  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('PORT');
  const mongoUrl = configService.getOrThrow<string>('MONGODB_URI');
  const sessionSecret = configService.getOrThrow<string>('SESSION_SECRET');

  const localFrontendUrl =
    configService.getOrThrow<string>('LOCAL_FRONTEND_URL');
  const productionFrontendUrl = configService.getOrThrow<string>(
    'PRODUCTION_FRONTEND_URL',
  );
  const frontendUrl =
    process.env.NODE_ENV === 'production'
      ? productionFrontendUrl
      : localFrontendUrl;

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.enableShutdownHooks();

  const store = MongoStore.create({
    mongoUrl,
    collectionName: 'sessions',
    ttl: 3600000 * 12, // 12 hours
  });

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      store,
      cookie: {
        maxAge: 3600000 * 12,
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // app.useGlobalInterceptors(new ResponseWrapperInterceptor());

  await app.listen(port);
}
bootstrap().catch((err) => {
  console.error('Error during application bootstrap:', err);
  process.exit(1);
});
