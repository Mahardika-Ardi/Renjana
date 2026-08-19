import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../../database';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: any;

  beforeEach(() => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'jwt.secret') return 'test-secret';
        return undefined;
      }),
    };

    prisma = {
      user: { findUnique: jest.fn() },
    };

    strategy = new JwtStrategy(config as any, prisma as any);
  });

  describe('constructor', () => {
    it('should fall back to default secret when config missing', () => {
      const configNoSecret = {
        get: jest.fn().mockReturnValue(undefined),
      };
      const s = new JwtStrategy(configNoSecret as any, prisma as any);
      expect(s).toBeInstanceOf(JwtStrategy);
    });
  });

  describe('validate', () => {
    const payload = { sub: 'user-1', email: 'andi@test.com' };

    it('should load user from DB by payload.sub with deletedAt null', async () => {
      const user = {
        id: 'user-1',
        email: 'andi@test.com',
        name: 'Andi',
        avatarUrl: null,
        isEmailVerified: true,
      };
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await strategy.validate(payload as any);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1', deletedAt: null },
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
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(payload as any)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload as any)).rejects.toThrow(
        'Sesi tidak valid. Silakan login kembali.',
      );
    });
  });
});