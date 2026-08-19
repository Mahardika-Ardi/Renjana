import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database';
import { JwtPayload } from '@renjana/types';
import { ACCESS_TOKEN_COOKIE } from '../auth-cookies';

/**
 * JwtStrategy — validates access token from httpOnly cookie & loads full user dari DB
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = config.get<string>('jwt.secret') || 'fallback-secret-key';
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => req?.cookies?.[ACCESS_TOKEN_COOKIE] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        isEmailVerified: true,
        coupleAsUser1: { select: { id: true, user2Id: true } },
        coupleAsUser2: { select: { id: true, user1Id: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Sesi tidak valid. Silakan login kembali.');
    }

    return user;
  }
}
