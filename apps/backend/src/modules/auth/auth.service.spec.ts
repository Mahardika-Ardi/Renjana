import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  AuthService,
} from './auth.service';
import { PrismaService } from '../../database';
import { SupabaseService } from '../../infrastructure/supabase';
import { MailService } from '../../infrastructure/mail';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { generateInviteToken } from '@renjana/utils';

jest.mock('bcryptjs');
jest.mock('uuid');
jest.mock('@renjana/utils', () => ({
  generateInviteToken: jest.fn().mockReturnValue('ABCD1234'),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let config: any;
  let supabaseService: any;
  let mailService: any;

  const userId = 'user-1';
  const email = 'andi@test.com';
  const name = 'Andi';

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      couple: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      coupleInvite: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      streak: { create: jest.fn() },
      refreshToken: {
        create: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      notification: { create: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn(),
    };

    prisma.$transaction.mockImplementation((cb: any) => cb(prisma));

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
      signAsync: jest.fn().mockImplementation(async () => 'token-' + Math.random()),
      verify: jest.fn(),
    };

    config = {
      get: jest.fn((key: string) => {
        const map: Record<string, string> = {
          'jwt.secret': 'test-secret',
          'jwt.expiresIn': '15m',
          'jwt.refreshSecret': 'refresh-secret',
          'app.frontendUrl': 'http://localhost:3000',
        };
        return map[key] ?? null;
      }),
    };

    supabaseService = {
      getAdminClient: jest.fn().mockReturnValue({
        auth: {
          admin: {
            createUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
            signOut: jest.fn().mockResolvedValue({}),
            updateUserById: jest.fn().mockResolvedValue({}),
          },
        },
        storage: {
          from: jest.fn(),
        },
      }),
      getClient: jest.fn().mockReturnValue({
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      }),
    };

    mailService = {
      sendMail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: config },
        { provide: SupabaseService, useValue: supabaseService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockUser = {
    id: userId,
    email,
    name,
    avatarUrl: null,
    isEmailVerified: false,
    passwordHash: 'hashed-password',
    deletedAt: null,
  };

  describe('issueSseTicket', () => {
    beforeEach(() => jest.useFakeTimers());

    it('throws ForbiddenException when user has no active couple', async () => {
      prisma.couple.findFirst.mockResolvedValue(null);
      await expect(service.issueSseTicket(userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('creates a 15s single-use ticket for an active couple', async () => {
      prisma.couple.findFirst.mockResolvedValue({ id: 'couple-1' });
      (uuidv4 as jest.Mock).mockReturnValue('ticket-abc');

      const result = await service.issueSseTicket(userId);

      expect(result.ticket).toBe('ticket-abc');
      expect(result.expiresIn).toBe(15);
    });
  });

  describe('validateAndConsumeSseTicket', () => {
    it('throws when ticket is missing', () => {
      expect(() => service.validateAndConsumeSseTicket('')).toThrow(
        UnauthorizedException,
      );
    });

    it('throws and cleans up when ticket is unknown/expired', () => {
      (service as any).sseTickets.set('expired', {
        userId,
        coupleId: 'couple-1',
        exp: Date.now() - 1000,
      });

      expect(() =>
        service.validateAndConsumeSseTicket('expired'),
      ).toThrow(UnauthorizedException);
      expect((service as any).sseTickets.has('expired')).toBe(false);
    });

    it('consumes a valid ticket exactly once', () => {
      (service as any).sseTickets.set('valid', {
        userId,
        coupleId: 'couple-1',
        exp: Date.now() + 10_000,
      });

      const result = service.validateAndConsumeSseTicket('valid');
      expect(result).toEqual({ userId, coupleId: 'couple-1' });
      expect((service as any).sseTickets.has('valid')).toBe(false);

      expect(() => service.validateAndConsumeSseTicket('valid')).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    const dto = { name, email: '  ANDI@TEST.com ', password: 'Password123' };
    const formattedUser = {
      id: userId,
      email: 'andi@test.com',
      name,
      avatarUrl: null,
      isEmailVerified: false,
      coupleId: null,
      partnerId: null,
    };

    it('normalizes email and rejects duplicates', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(dto as any)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'andi@test.com' },
      });
    });

    it('registers a new user, creates refresh token and returns tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      jwtService.signAsync.mockImplementation(async (payload: any, opts: any) =>
        opts.expiresIn.includes('d') ? 'refresh-token' : 'access-token',
      );
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.register(dto as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 12);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            id: undefined,
            email: 'andi@test.com',
            name,
            passwordHash: 'hashed-password',
          },
        }),
      );
      expect(result.tokens).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 15 * 60,
      });
      expect(result.user).toEqual(formattedUser);
    });

    it('processes an invite code during registration', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.coupleInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        senderId: 'partner',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86_400_000),
      });
      prisma.couple.create.mockResolvedValue({});
      prisma.couple.findFirst.mockResolvedValue({ id: 'couple-1' });
      prisma.streak.create.mockResolvedValue({});
      prisma.coupleInvite.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});
      jwtService.signAsync.mockImplementation(async (_p: any, o: any) =>
        o.expiresIn.includes('d') ? 'refresh-token' : 'access-token',
      );

      await service.register({ ...dto, inviteCode: 'ABCD1234' } as any);

      expect(prisma.couple.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { user1Id: 'partner', user2Id: userId },
        }),
      );
      expect(prisma.coupleInvite.update).toHaveBeenCalled();
    });

    it('rejects invalid/expired invite code', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.coupleInvite.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({});

      await expect(
        service.register({ ...dto, inviteCode: 'BADCODE1' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('still registers when supabase createUser fails (graceful)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({});
      supabaseService
        .getAdminClient()
        .auth.admin.createUser.mockRejectedValue(new Error('supabase down'));

      await expect(service.register(dto as any)).resolves.toBeDefined();
    });
  });

  describe('login', () => {
    const loginDto = { email, password: 'password123' };

    it('throws 401 for unknown user with no supabase auth', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      supabaseService.getClient().auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: new Error('no user'),
      });

      await expect(service.login(loginDto as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws 401 for wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      supabaseService.getClient().auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'invalid credentials' },
      });

      await expect(service.login(loginDto as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws 401 when account is beyond the 30-day grace period', async () => {
      const deleted = {
        ...mockUser,
        deletedAt: new Date(Date.now() - 40 * 24 * 3600 * 1000),
      };
      prisma.user.findUnique.mockResolvedValue(deleted);

      await expect(service.login(loginDto as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('restores a soft-deleted account within grace period', async () => {
      const deleted = {
        ...mockUser,
        deletedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      };
      prisma.user.findUnique.mockResolvedValue(deleted);
      prisma.user.update.mockResolvedValue({ ...deleted, deletedAt: null });
      prisma.refreshToken.create.mockResolvedValue({});
      supabaseService.getClient().auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      const result = await service.login(loginDto as any);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: expect.objectContaining({ deletedAt: null }),
        }),
      );
      expect(result.data.isAccountRestored).toBe(true);
    });

    it('creates a local user when supabase auth succeeds but no local record', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.user.update.mockResolvedValue(mockUser);
      supabaseService.getClient().auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'supabase-1' } },
        error: null,
      });

      const result = await service.login(loginDto as any);

      expect(prisma.user.create).toHaveBeenCalled();
      expect(result.data.isAccountRestored).toBe(false);
    });

    it('updates lastLoginAt and returns tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({});
      jwtService.signAsync.mockImplementation(async (_p: any, o: any) =>
        o?.expiresIn.includes('d') ? 'refresh-token' : 'access-token',
      );

      const result = await service.login(loginDto as any);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ lastLoginAt: expect.any(Date) }) }),
      );
      expect(result.data.tokens.accessToken).toBe('access-token');
    });
  });

  describe('refresh', () => {
    it('revokes the old refresh token and issues new tokens', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      jwtService.signAsync.mockImplementation(async (_p: any, o: any) =>
        o?.expiresIn.includes('d') ? 'new-refresh' : 'new-access',
      );
      prisma.refreshToken.create.mockResolvedValue({});

      const tokens = await service.refresh(userId, email, 'old-refresh');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { token: 'old-refresh', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(tokens.accessToken).toBe('new-access');
      expect(tokens.refreshToken).toBe('new-refresh');
    });
  });

  describe('logout', () => {
    it('revokes only the provided refresh token', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.logout(userId, 'specific-token');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { token: 'specific-token', userId, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('revokes all user refresh tokens when no token passed (logout-all)', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      await service.logout(userId);

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('does not throw when supabase signOut fails', async () => {
      supabaseService.getAdminClient().auth.admin.signOut.mockRejectedValue(
        new Error('down'),
      );

      await expect(service.logout(userId, 'tok')).resolves.toEqual({
        message: 'Berhasil logout',
      });
    });
  });

  describe('deleteAccount', () => {
    it('throws NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.deleteAccount(userId, { password: 'password123' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when user has no password hash', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: null });
      await expect(
        service.deleteAccount(userId, { password: 'password123' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(
        service.deleteAccount(userId, { password: 'wrong' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('soft-deletes account, disconnects couple and notifies partner', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.couple.findFirst.mockResolvedValue({
        id: 'couple-1',
        user1Id: userId,
        user2Id: 'partner-id',
      });
      prisma.couple.update.mockResolvedValue({});
      prisma.notification.create.mockResolvedValue({});
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.deleteAccount(userId, {
        password: 'password123',
      } as any);

      expect(prisma.couple.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'couple-1' },
          data: expect.objectContaining({ isActive: false }),
        }),
      );
      expect(prisma.notification.create).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
      expect(result.scheduledHardDeleteDate).toBeInstanceOf(Date);
      expect(result.message).toContain('30 hari');
    });

    it('does not touch couple when user is single', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.couple.findFirst.mockResolvedValue(null);
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

      await service.deleteAccount(userId, { password: 'x' } as any);

      expect(prisma.couple.update).not.toHaveBeenCalled();
    });
  });

  describe('email verification', () => {
    it('sendVerificationEmail signs a token and sends mail', async () => {
      await service.sendVerificationEmail(userId, email, name);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: userId, purpose: 'email-verify' }),
        expect.objectContaining({ expiresIn: '24h' }),
      );
      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: email, subject: expect.stringContaining('Verifikasi') }),
      );
    });

    it('verifyEmail throws BadRequestException for invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.verifyEmail('bad-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('verifyEmail throws when purpose is wrong', async () => {
      jwtService.verify.mockReturnValue({ sub: userId, purpose: 'other' });

      await expect(service.verifyEmail('token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('verifyEmail returns early when already verified', async () => {
      jwtService.verify.mockReturnValue({ sub: userId, purpose: 'email-verify' });
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isEmailVerified: true });

      const result = await service.verifyEmail('token');
      expect(result.message).toContain('sudah terverifikasi');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('verifyEmail marks user as verified', async () => {
      jwtService.verify.mockReturnValue({ sub: userId, purpose: 'email-verify' });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, isEmailVerified: true });

      const result = await service.verifyEmail('token');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isEmailVerified: true }),
        }),
      );
      expect(result.message).toContain('berhasil diverifikasi');
    });
  });

  describe('forgotPassword', () => {
    it('returns generic message without leaking account existence', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await service.forgotPassword(email);
      expect(result.message).toContain('Jika email terdaftar');
    });

    it('sends reset email for existing user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.forgotPassword(email);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: userId, purpose: 'password-reset' }),
        expect.objectContaining({ expiresIn: '1h' }),
      );
      expect(mailService.sendMail).toHaveBeenCalled();
      expect(result.message).toContain('Jika email terdaftar');
    });
  });

  describe('resetPassword', () => {
    it('throws BadRequestException for invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('bad');
      });
      await expect(service.resetPassword('bad', 'Password123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('updates password and revokes refresh tokens', async () => {
      jwtService.verify.mockReturnValue({ sub: userId, purpose: 'password-reset' });
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.resetPassword('tok', 'NewPassword123');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: expect.objectContaining({ passwordHash: 'hashed-password' }),
        }),
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
      expect(result.message).toContain('berhasil diubah');
    });
  });

  describe('getMe', () => {
    it('throws NotFoundException when user missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getMe(userId)).rejects.toThrow(NotFoundException);
    });

    it('returns user with couple info as user1', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        coupleAsUser1: {
          id: 'couple-1',
          user2Id: 'partner-1',
          user2: { id: 'partner-1', name: 'Partner', avatarUrl: null },
          streak: { currentStreak: 3 },
        },
        coupleAsUser2: null,
      });

      const result = await service.getMe(userId);

      expect(result.id).toBe(userId);
      expect(result.couple).toEqual({
        id: 'couple-1',
        partnerId: 'partner-1',
        partnerName: 'Partner',
        partnerAvatarUrl: null,
        currentStreak: 3,
      });
    });

    it('returns user with null couple when uncoupled', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        coupleAsUser1: null,
        coupleAsUser2: null,
      });

      const result = await service.getMe(userId);
      expect(result.couple).toBeNull();
    });
  });

  describe('generateInviteCode', () => {
    it('throws ConflictException when already coupled', async () => {
      prisma.couple.findFirst.mockResolvedValue({ id: 'couple-1' });
      await expect(service.generateInviteCode(userId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates a 7-day invite for an uncoupled user', async () => {
      prisma.couple.findFirst.mockResolvedValue(null);
      prisma.coupleInvite.deleteMany.mockResolvedValue({ count: 0 });
      prisma.coupleInvite.create.mockResolvedValue({
        token: 'ABCD1234',
        expiresAt: new Date(Date.now() + 7 * 86_400_000),
      });

      const result = await service.generateInviteCode(userId);

      expect(prisma.coupleInvite.deleteMany).toHaveBeenCalled();
      expect(result.inviteCode).toBe('ABCD1234');
    });
  });
});