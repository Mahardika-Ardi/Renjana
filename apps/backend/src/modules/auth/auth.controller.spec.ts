import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './auth-cookies';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;
  let res: any;

  const mockUser = {
    id: 'user-1',
    email: 'andi@test.com',
    name: 'Andi',
    isEmailVerified: true,
    refreshToken: 'refresh-token-1',
  };

  const mockTokens = {
    accessToken: 'access-token-1',
    refreshToken: 'refresh-token-1',
    expiresIn: 900,
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      deleteAccount: jest.fn(),
      verifyEmail: jest.fn(),
      sendVerificationEmail: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      getMe: jest.fn(),
      generateInviteCode: jest.fn(),
      issueSseTicket: jest.fn(),
    };

    res = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should set auth cookies and return user only (no tokens)', async () => {
      const dto = { email: 'andi@test.com', password: 'secret', name: 'Andi' };
      authService.register.mockResolvedValue({
        user: { id: 'user-1', email: 'andi@test.com' },
        tokens: mockTokens,
      });

      const result = await controller.register(dto, res);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(res.cookie).toHaveBeenCalledWith(
        ACCESS_TOKEN_COOKIE,
        'access-token-1',
        expect.objectContaining({ httpOnly: true, path: '/' }),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        REFRESH_TOKEN_COOKIE,
        'refresh-token-1',
        expect.objectContaining({
          httpOnly: true,
          path: '/api/v1/auth',
        }),
      );
      expect(result).toEqual({
        message: 'Berhasil daftar! Cek email kamu untuk verifikasi.',
        data: { user: { id: 'user-1', email: 'andi@test.com' } },
      });
      expect(JSON.stringify(result)).not.toContain('token');
    });
  });

  describe('login', () => {
    it('should set auth cookies and return user without tokens', async () => {
      const dto = { email: 'andi@test.com', password: 'secret' };
      authService.login.mockResolvedValue({
        message: 'Berhasil login',
        data: { user: mockUser, tokens: mockTokens, isAccountRestored: false },
      });

      const result = await controller.login(dto, res);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        message: 'Berhasil login',
        data: { user: mockUser, isAccountRestored: false },
      });
    });

    it('should pass through isAccountRestored flag', async () => {
      authService.login.mockResolvedValue({
        message: 'Akun dipulihkan',
        data: { user: mockUser, tokens: mockTokens, isAccountRestored: true },
      });

      const result = await controller.login({} as any, res);

      expect(result).toEqual({
        message: 'Akun dipulihkan',
        data: { user: mockUser, isAccountRestored: true },
      });
    });
  });

  describe('refresh', () => {
    it('should refresh via cookie-held token and set new cookies', async () => {
      authService.refresh.mockResolvedValue(mockTokens);

      const result = await controller.refresh(mockUser, res);

      expect(authService.refresh).toHaveBeenCalledWith(
        'user-1',
        'andi@test.com',
        'refresh-token-1',
      );
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(res.cookie).toHaveBeenCalledWith(
        ACCESS_TOKEN_COOKIE,
        'access-token-1',
        expect.any(Object),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        REFRESH_TOKEN_COOKIE,
        'refresh-token-1',
        expect.any(Object),
      );
      expect(result).toEqual({
        message: 'Token berhasil di-refresh',
        data: null,
      });
    });
  });

  describe('logout', () => {
    it('should revoke cookie refresh token and clear cookies', async () => {
      authService.logout.mockResolvedValue({ message: 'Berhasil logout' });

      const req = { cookies: { [REFRESH_TOKEN_COOKIE]: 'refresh-token-1' } };
      const result = await controller.logout(mockUser, req as any, res);

      expect(authService.logout).toHaveBeenCalledWith(
        'user-1',
        'refresh-token-1',
      );
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(res.clearCookie).toHaveBeenCalledWith(
        ACCESS_TOKEN_COOKIE,
        expect.any(Object),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        REFRESH_TOKEN_COOKIE,
        expect.any(Object),
      );
      expect(result).toEqual({ message: 'Berhasil logout' });
    });

    it('should clear cookies when no refresh cookie present', async () => {
      authService.logout.mockResolvedValue({ message: 'Berhasil logout' });

      await controller.logout(mockUser, { cookies: {} } as any, res);

      expect(authService.logout).toHaveBeenCalledWith('user-1', undefined);
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('logoutAll', () => {
    it('should revoke all sessions and clear cookies', async () => {
      authService.logout.mockResolvedValue({
        message: 'Berhasil logout dari semua device',
      });

      const result = await controller.logoutAll(mockUser, res);

      expect(authService.logout).toHaveBeenCalledWith('user-1');
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ message: 'Berhasil logout dari semua device' });
    });
  });

  describe('deleteAccount', () => {
    it('should call authService.deleteAccount and clear cookies', async () => {
      const dto = { password: 'secret' };
      const resultData = { message: 'Akun dinonaktifkan' };
      authService.deleteAccount.mockResolvedValue(resultData);

      const result = await controller.deleteAccount(mockUser, dto, res);

      expect(authService.deleteAccount).toHaveBeenCalledWith('user-1', dto);
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(result).toEqual(resultData);
    });
  });

  describe('verifyEmail', () => {
    it('should call authService.verifyEmail with token', async () => {
      const dto = { token: 'verify-token' };
      const result = { message: 'Email terverifikasi' };
      authService.verifyEmail.mockResolvedValue(result);

      const res2 = await controller.verifyEmail(dto);

      expect(authService.verifyEmail).toHaveBeenCalledWith('verify-token');
      expect(res2).toEqual(result);
    });
  });

  describe('resendVerification', () => {
    it('should return already-verified message when user is verified', async () => {
      const result = await controller.resendVerification({
        ...mockUser,
        isEmailVerified: true,
      });

      expect(authService.sendVerificationEmail).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Email sudah terverifikasi' });
    });

    it('should resend verification email when not verified', async () => {
      const unverified = { ...mockUser, isEmailVerified: false };
      authService.sendVerificationEmail.mockResolvedValue(true);

      const result = await controller.resendVerification(unverified);

      expect(authService.sendVerificationEmail).toHaveBeenCalledWith(
        'user-1',
        'andi@test.com',
        'Andi',
      );
      expect(result).toEqual({
        message: 'Email verifikasi berhasil dikirim ulang',
      });
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.forgotPassword with the email', async () => {
      const result = { message: 'Link reset dikirim jika email terdaftar' };
      authService.forgotPassword.mockResolvedValue(result);

      const res2 = await controller.forgotPassword({
        email: 'andi@test.com',
      });

      expect(authService.forgotPassword).toHaveBeenCalledWith('andi@test.com');
      expect(res2).toEqual(result);
    });
  });

  describe('resetPassword', () => {
    it('should call authService.resetPassword and clear cookies', async () => {
      const dto = { token: 'reset-token', newPassword: 'newpass123' };
      const result = { message: 'Password berhasil direset' };
      authService.resetPassword.mockResolvedValue(result);

      const res2 = await controller.resetPassword(dto, res);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        'reset-token',
        'newpass123',
      );
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(res2).toEqual(result);
    });
  });

  describe('getMe', () => {
    it('should return user profile envelope', async () => {
      const profile = { id: 'user-1', couple: null };
      authService.getMe.mockResolvedValue(profile);

      const result = await controller.getMe(mockUser);

      expect(authService.getMe).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        message: 'Data user berhasil diambil',
        data: profile,
      });
    });
  });

  describe('generateInvite', () => {
    it('should call authService.generateInviteUrl and return envelope', async () => {
      const invite = {
        inviteUrl: 'http://localhost:3000/register?inviteToken=token123',
        token: 'token123',
        expiresAt: new Date(),
      };
      authService.generateInviteUrl = jest.fn().mockResolvedValue(invite);

      const result = await controller.generateInvite(mockUser);

      expect(authService.generateInviteUrl).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        message: 'Tautan undangan berhasil dibuat. Berlaku 24 jam.',
        data: invite,
      });
    });
  });

  describe('validateInvite', () => {
    it('should call authService.validateInviteToken and return envelope', async () => {
      const validResult = {
        valid: true,
        sender: { id: 'user-1', name: 'Andi', email: 'andi@test.com' },
        expiresAt: new Date(),
      };
      authService.validateInviteToken = jest.fn().mockResolvedValue(validResult);

      const req = { query: { token: 'token123' } };
      const result = await controller.validateInvite(req as any);

      expect(authService.validateInviteToken).toHaveBeenCalledWith('token123');
      expect(result).toEqual({
        message: 'Tautan undangan valid',
        data: validResult,
      });
    });
  });

  describe('getSseTicket', () => {
    it('should call authService.issueSseTicket and return envelope', async () => {
      const ticket = { token: 'sse-ticket', expiresAt: new Date() };
      authService.issueSseTicket.mockResolvedValue(ticket);

      const result = await controller.getSseTicket(mockUser);

      expect(authService.issueSseTicket).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        message: 'Ticket SSE berhasil dibuat (TTL: 15 detik)',
        data: ticket,
      });
    });
  });
});
