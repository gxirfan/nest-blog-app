import { Module } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerService } from './mailer.service';

@Module({
  imports: [
    NestMailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.getOrThrow('SMTP_HOST'),
          port: configService.getOrThrow('SMTP_PORT'),
          secure: true,
          auth: {
            user: configService.getOrThrow('SMTP_USER'),
            pass: configService.getOrThrow('SMTP_API_KEY'),
          },
          tls: {
            rejectUnauthorized: false,
          },
        },
        defaults: {
          from: configService.getOrThrow('MAIL_FROM'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
