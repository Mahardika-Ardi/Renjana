import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../../database';
import { JwtRefreshPayload } from '@renjana/types';
import { REFRESH_TOKEN_COOKIE } from '../auth-cookies';

/**
 * JwtRefreshStrategy — validates refresh token from httpOnly cookie
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const opts: StrategyOptionsWithRequest = {
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.[REFRESH_TOKEN_COOKIE] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey:
        config.get<string>('jwt.refreshSecret') || 'fallback-refresh-secret',
      passReqToCallback: true,
    };
    super(opts);
  }

  async validate(req: Request, payload: JwtRefreshPayload) {
    const refreshToken: string = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token tidak ditemukan');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException(
        'Refresh token tidak valid atau sudah kadaluarsa',
      );
    }

    if (storedToken.userId !== payload.sub) {
      throw new UnauthorizedException('Refresh token tidak valid');
    }

    return { ...storedToken.user, refreshToken };
  }
}
