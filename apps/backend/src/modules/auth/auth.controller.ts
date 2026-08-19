import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  DeleteAccountDto,
} from './dto';
import { JwtRefreshGuard } from '../../shared/guards';
import { Public, CurrentUser } from '../../shared/decorators';
import {
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
  clearAuthCookies,
  cookieOptions,
} from './auth-cookies';

type user = {
  id: string;
  name: string;
  email: string;
  refreshToken: string;
  isEmailVerified: boolean;
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Register ────────────────────────────────────────────────
  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Daftar akun baru' })
  @ApiResponse({ status: 201, description: 'Berhasil daftar' })
  @ApiResponse({ status: 409, description: 'Email sudah terdaftar' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    setAuthCookies(res, result.tokens, cookieOptions());
    return {
      message: 'Berhasil daftar! Cek email kamu untuk verifikasi.',
      data: { user: result.user },
    };
  }

  // ── Login ───────────────────────────────────────────────────
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login dengan email & password' })
  @ApiResponse({ status: 200, description: 'Berhasil login' })
  @ApiResponse({ status: 401, description: 'Email atau password salah' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    setAuthCookies(res, result.data.tokens, cookieOptions());
    return {
      message: result.message,
      data: {
        user: result.data.user,
        isAccountRestored: result.data.isAccountRestored,
      },
    };
  }

  // ── Refresh Token ───────────────────────────────────────────
  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token menggunakan refresh token cookie' })
  @ApiResponse({ status: 200, description: 'Token berhasil di-refresh' })
  @ApiResponse({ status: 401, description: 'Refresh token tidak valid' })
  async refresh(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.refresh(
      user.id,
      user.email,
      dto.refreshToken,
    );
    setAuthCookies(res, tokens, cookieOptions());
    return { message: 'Token berhasil di-refresh', data: null };
  }

  // ── Logout ──────────────────────────────────────────────────
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('renjana_access')
  @ApiOperation({ summary: 'Logout (revoke refresh token)' })
  @ApiResponse({ status: 200, description: 'Berhasil logout' })
  async logout(
    @CurrentUser() user: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as
      | string
      | undefined;
    const result = await this.authService.logout(user.id, refreshToken);
    clearAuthCookies(res, cookieOptions());
    return result;
  }

  // ── Logout All Devices ──────────────────────────────────────
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('renjana_access')
  @ApiOperation({ summary: 'Logout dari semua device' })
  async logoutAll(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logout(user.id);
    clearAuthCookies(res, cookieOptions());
    return result;
  }

  // ── Delete Account ──────────────────────────────────────────
  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('renjana_access')
  @ApiOperation({
    summary: 'Hapus / Nonaktifkan akun sendiri dengan verifikasi password',
  })
  @ApiResponse({
    status: 200,
    description: 'Akun berhasil dihapus / dinonaktifkan',
  })
  @ApiResponse({ status: 401, description: 'Password yang dimasukkan salah' })
  async deleteAccount(
    @CurrentUser() user: user,
    @Body() dto: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.deleteAccount(user.id, dto);
    clearAuthCookies(res, cookieOptions());
    return result;
  }

  // ── Verify Email ────────────────────────────────────────────
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifikasi email dari link yang dikirim' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  // ── Resend Verification Email ───────────────────────────────
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 300_000 } })
  @ApiCookieAuth('renjana_access')
  @ApiOperation({ summary: 'Kirim ulang email verifikasi' })
  async resendVerification(@CurrentUser() user: user) {
    if (user.isEmailVerified) {
      return { message: 'Email sudah terverifikasi' };
    }
    await this.authService.sendVerificationEmail(
      user.id,
      user.email,
      user.name,
    );
    return { message: 'Email verifikasi berhasil dikirim ulang' };
  }

  // ── Forgot Password ─────────────────────────────────────────
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 300_000 } })
  @ApiOperation({ summary: 'Minta link reset password' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  // ── Reset Password ──────────────────────────────────────────
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password dengan token dari email' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.resetPassword(dto.token, dto.newPassword);
    clearAuthCookies(res, cookieOptions());
    return result;
  }

  // ── Get Current User (me) ───────────────────────────────────
  @Get('me')
  @ApiCookieAuth('renjana_access')
  @ApiOperation({ summary: 'Get current user profile & couple info' })
  @ApiResponse({ status: 200, description: 'Data user berhasil diambil' })
  async getMe(@CurrentUser() user: user) {
    return {
      message: 'Data user berhasil diambil',
      data: await this.authService.getMe(user.id),
    };
  }

  // ── Generate Invite Code ────────────────────────────────────
  @Post('invite')
  @ApiCookieAuth('renjana_access')
  @ApiOperation({ summary: 'Generate kode invite untuk pasangan' })
  async generateInvite(@CurrentUser() user: user) {
    const result = await this.authService.generateInviteCode(user.id);
    return {
      message: 'Kode invite berhasil dibuat. Berlaku 7 hari.',
      data: result,
    };
  }

  // ── SSE Realtime Ticket ──────────────────────────────────────
  @Post('sse-ticket')
  @ApiCookieAuth('renjana_access')
  @ApiOperation({ summary: 'Dapatkan 15s single-use ticket untuk koneksi SSE' })
  @ApiResponse({ status: 201, description: 'Ticket SSE berhasil dibuat' })
  async getSseTicket(@CurrentUser() user: any) {
    const data = await this.authService.issueSseTicket(user.id);
    return { message: 'Ticket SSE berhasil dibuat (TTL: 15 detik)', data };
  }
}
