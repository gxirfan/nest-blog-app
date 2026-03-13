import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ForumModule } from './forum/forum.module';
import { AuthModule } from './auth/auth.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { ResponseWrapperInterceptor } from './common/interceptors/response-wrapper.interceptor';
import { ContactModule } from './contact/contact.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ErrorsLoggingInterceptor } from './common/interceptors/error.logging.interceptor';
import { AllExceptionsFilter } from './common/interceptors/all-exceptions.filter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { VoteModule } from './forum/vote/vote.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationModule } from './notification/notification.module';
import { FlowModule } from './flow/flow.module';
import { AdminModule } from './admin/admin.module';
import { SearchModule } from './search/search.module';
import { redisStore } from 'cache-manager-redis-yet';
import { PrismaModule } from './prisma/prisma.module';
import { AiModule } from './ai/ai.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST') || 'localhost',
        port: Number(configService.get<string>('REDIS_PORT')) || 6379,
        ttl: Number(configService.get<string>('REDIS_TTL')),
      }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/',
    }),
    EventEmitterModule.forRoot({
      global: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    PrismaModule,
    AdminModule,
    UserModule,
    NotificationModule,
    ForumModule,
    AuthModule,
    ContactModule,
    VoteModule,
    FlowModule,
    SearchModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorsLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
