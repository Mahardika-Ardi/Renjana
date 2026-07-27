import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy, JwtRefreshStrategy } from './strategies';
import { UserCleanupCronService } from './user-cleanup.cron';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret') || 'fallback-secret',
        signOptions: {
          expiresIn: (config.get<string>('jwt.expiresIn') || '15m') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    UserCleanupCronService,
  ],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
