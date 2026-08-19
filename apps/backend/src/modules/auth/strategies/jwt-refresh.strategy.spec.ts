import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { PrismaService } from '../../../database';
import { REFRESH_TOKEN_COOKIE } from '../auth-cookies';

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy;
  let prisma: any;

  beforeEach(() => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'jwt.refreshSecret') return 'refresh-secret';
        return undefined;
      }),
    };

    prisma = {
      refreshToken: { findUnique: jest.fn() },
    };

    strategy = new JwtRefreshStrategy(config as any, prisma as any);
  });

  describe('constructor', () => {
    it('should fall back to default refresh secret when config missing', () => {
      const configNoSecret = {
        get: jest.fn().mockReturnValue(undefined),
      };
      const s = new JwtRefreshStrategy(configNoSecret as any, prisma as any);
      expect(s).toBeInstanceOf(JwtRefreshStrategy);
    });
  });

  describe('validate', () => {
    const baseReq = { cookies: { [REFRESH_TOKEN_COOKIE]: 'token-abc' } };
    const payload = { sub: 'user-1' };

    it('should throw when refresh cookie is missing', async () => {
      await expect(
        strategy.validate({ cookies: {} } as any, payload as any),
      ).rejects.toThrow('Refresh token tidak ditemukan');
      expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
    });

    it('should throw when stored token not found', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(baseReq as any, payload as any)).rejects.toThrow(
        'Refresh token tidak valid atau sudah kadaluarsa',
      );
    });

    it('should throw when token has been revoked', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        token: 'token-abc',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 10000),
        userId: 'user-1',
        user: { id: 'user-1' },
      });

      await expect(strategy.validate(baseReq as any, payload as any)).rejects.toThrow(
        'Refresh token tidak valid atau sudah kadaluarsa',
      );
    });

    it('should throw when token has expired', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        token: 'token-abc',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 10000),
        userId: 'user-1',
        user: { id: 'user-1' },
      });

      await expect(strategy.validate(baseReq as any, payload as any)).rejects.toThrow(
        'Refresh token tidak valid atau sudah kadaluarsa',
      );
    });

    it('should throw when token userId does not match payload.sub', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        token: 'token-abc',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 10000),
        userId: 'user-other',
        user: { id: 'user-other' },
      });

      await expect(strategy.validate(baseReq as any, payload as any)).rejects.toThrow(
        'Refresh token tidak valid',
      );
    });

    it('should return user with refreshToken on success', async () => {
      const user = { id: 'user-1', email: 'andi@test.com' };
      prisma.refreshToken.findUnique.mockResolvedValue({
        token: 'token-abc',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 10000),
        userId: 'user-1',
        user,
      });

      const result = await strategy.validate(baseReq as any, payload as any);

      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'token-abc' },
        include: { user: true },
      });
      expect(result).toEqual({ ...user, refreshToken: 'token-abc' });
    });
  });
});