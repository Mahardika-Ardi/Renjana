import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  DeleteAccountDto,
} from './dto';
import { JwtRefreshGuard } from '../../shared/guards';
import { Public, CurrentUser } from '../../shared/decorators';

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
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return result;
  }

  // ── Login ───────────────────────────────────────────────────
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login dengan email & password' })
  @ApiResponse({ status: 200, description: 'Berhasil login' })
  @ApiResponse({ status: 401, description: 'Email atau password salah' })
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return result;
  }

  // ── Refresh Token ───────────────────────────────────────────
  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token menggunakan refresh token' })
  @ApiResponse({ status: 200, description: 'Token berhasil di-refresh' })
  @ApiResponse({ status: 401, description: 'Refresh token tidak valid' })
  async refresh(@CurrentUser() user: user, @Body() dto: RefreshTokenDto) {
    const tokens = await this.authService.refresh(
      user.id,
      user.email,
      dto.refreshToken,
    );
    return {
      message: 'Token berhasil di-refresh',
      data: tokens,
    };
  }

  // ── Logout ──────────────────────────────────────────────────
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout (revoke refresh token)' })
  @ApiResponse({ status: 200, description: 'Berhasil logout' })
  async logout(@CurrentUser() user: user, @Body() dto: RefreshTokenDto) {
    return this.authService.logout(user.id, dto.refreshToken);
  }

  // ── Logout All Devices ──────────────────────────────────────
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout dari semua device' })
  async logoutAll(@CurrentUser() user: user) {
    return this.authService.logout(user.id);
  }

  // ── Delete Account ──────────────────────────────────────────
  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
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
  ) {
    return this.authService.deleteAccount(user.id, dto);
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
  @ApiBearerAuth('access-token')
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
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // ── Get Current User (me) ───────────────────────────────────
  @Get('me')
  @ApiBearerAuth('access-token')
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
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Generate kode invite untuk pasangan' })
  async generateInvite(@CurrentUser() user: user) {
    const result = await this.authService.generateInviteCode(user.id);
    return {
      message: 'Kode invite berhasil dibuat. Berlaku 7 hari.',
      data: result,
    };
  }
}
