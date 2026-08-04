import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database';
import { SupabaseModule } from './infrastructure/supabase';
import { MailModule } from './infrastructure/mail';
import { AuthModule } from './modules/auth';
import { JwtAuthGuard } from './shared/guards';
import { ResponseInterceptor } from './shared/interceptors';
import { AllExceptionsFilter } from './shared/filters';
import {
  appConfig,
  jwtConfig,
  supabaseConfig,
  openaiConfig,
  mailConfig,
  throttleConfig,
} from './config';

@Module({
  imports: [
    // --- Config ---
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        jwtConfig,
        supabaseConfig,
        openaiConfig,
        mailConfig,
        throttleConfig,
      ],
      envFilePath: ['.env.local', '.env'],
    }),

    // --- Rate Limiting ---
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 1 minute
        limit: 100,
      },
    ]),

    // --- Task Scheduling ---
    ScheduleModule.forRoot(),

    // --- Database & Infrastructure (Global) ---
    DatabaseModule,
    SupabaseModule,
    MailModule,

    // --- Feature Modules ---
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global Jwt Guard (requires @Public() for open endpoints)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global rate limit guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global Response Formatter ({ success: true, statusCode, message, data })
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
