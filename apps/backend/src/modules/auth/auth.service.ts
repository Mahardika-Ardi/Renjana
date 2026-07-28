import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database';
import { SupabaseService } from '../../infrastructure/supabase';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';
import { AuthTokens, AuthUser, JwtPayload } from '@renjana/types';
import { generateInviteToken } from '@renjana/utils';
import { RegisterDto, LoginDto, DeleteAccountDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly resend: Resend;

  private readonly REFRESH_TOKEN_EXPIRES_DAYS = 7;
  private readonly EMAIL_VERIFY_TOKEN_EXPIRES_HOURS = 24;
  private readonly BCRYPT_ROUNDS = 12;
  private readonly ACCOUNT_DELETION_GRACE_DAYS = 30;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private supabaseService: SupabaseService,
  ) {
    this.resend = new Resend(config.get<string>('resend.apiKey'));
  }

  // ================================================================
  // REGISTER
  // ================================================================

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException(
        'Email sudah terdaftar. Silakan gunakan email lain atau login.',
      );
    }

    let supabaseUserId: string | null = null;
    try {
      const supabaseAdmin = this.supabaseService.getAdminClient();
      const { data: suData, error: suError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: dto.password,
          email_confirm: false,
          user_metadata: { name: dto.name.trim() },
        });

      if (!suError && suData?.user) {
        supabaseUserId = suData.user.id;
        this.logger.log(
          `User registered in Supabase Auth with ID: ${supabaseUserId}`,
        );
      }
    } catch (err: any) {
      this.logger.warn(
        `Supabase Auth registration skipped or failed: ${err.message}`,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          id: supabaseUserId ?? undefined,
          email,
          name: dto.name.trim(),
          passwordHash,
        },
      });

      if (dto.inviteCode) {
        await this.processInviteCode(tx, newUser.id, dto.inviteCode);
      }

      return newUser;
    });

    this.sendVerificationEmail(user.id, user.email, user.name).catch((err) => {
      this.logger.error(
        `Gagal kirim email verifikasi ke ${user.email}: ${err.message}`,
      );
    });

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.formatUser(user),
      tokens,
    };
  }

  // ================================================================
  // LOGIN (With Auto-Restore for 30-Day Soft-Deleted Accounts)
  // ================================================================

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();

    // 1. Cari user (termasuk yang soft-deleted)
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    // 2. Jika user sedang dalam status soft-deleted, cek grace period 30 hari
    let isAccountRestored = false;
    if (user && user.deletedAt) {
      const gracePeriodExpiry = new Date(user.deletedAt);
      gracePeriodExpiry.setDate(
        gracePeriodExpiry.getDate() + this.ACCOUNT_DELETION_GRACE_DAYS,
      );

      if (new Date() > gracePeriodExpiry) {
        throw new UnauthorizedException(
          'Masa tenggang 30 hari pemulihan akun telah berakhir. Akun ini tidak dapat diakses lagi.',
        );
      }

      // Restore akun secara otomatis
      isAccountRestored = true;
    }

    // 3. Proxy login ke Supabase Auth
    let supabaseAuthSuccess = false;
    try {
      const supabaseClient = this.supabaseService.getClient();
      const { data: suAuth, error: suError } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password: dto.password,
        });

      if (!suError && suAuth?.user) {
        supabaseAuthSuccess = true;
        this.logger.log(`Supabase Auth successful for ${email}`);
      }
    } catch (err: any) {
      this.logger.warn(`Supabase Auth login attempt fallback: ${err.message}`);
    }

    // 4. Verifikasi password via bcrypt jika Supabase auth tidak aktif / fallback
    if (!supabaseAuthSuccess) {
      if (!user || !user.passwordHash) {
        throw new UnauthorizedException('Email atau password salah.');
      }

      const isPasswordValid = await bcrypt.compare(
        dto.password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Email atau password salah.');
      }
    } else if (!user) {
      const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);
      user = await this.prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          passwordHash,
        },
      });
    }

    // 5. Eksekusi Restore jika tadinya soft-deleted & update last login
    if (isAccountRestored) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { deletedAt: null, lastLoginAt: new Date() },
      });
      this.logger.log(
        `User ${user.id} (${email}) restored their account during 30-day grace period.`,
      );
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      message: isAccountRestored
        ? 'Selamat datang kembali! Akun Anda berhasil dipulihkan dari jadwal penghapusan. Catatan: Koneksi pasangan perlu di-invite ulang.'
        : 'Berhasil login',
      data: {
        user: this.formatUser(user),
        tokens,
        isAccountRestored,
      },
    };
  }

  // ================================================================
  // REFRESH TOKEN
  // ================================================================

  async refresh(userId: string, email: string, oldRefreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: oldRefreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(userId, email);
  }

  // ================================================================
  // LOGOUT
  // ================================================================

  async logout(userId: string, refreshToken?: string) {
    try {
      const supabaseAdmin = this.supabaseService.getAdminClient();
      await supabaseAdmin.auth.admin.signOut(userId);
    } catch {
      // ignore
    }

    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return { message: 'Berhasil logout' };
  }

  // ================================================================
  // DELETE ACCOUNT (30-Day Grace Period Soft Delete)
  // ================================================================

  async deleteAccount(userId: string, dto: DeleteAccountDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'Akun tidak memiliki password terdaftar untuk verifikasi',
      );
    }

    // 1. Verifikasi Password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Password yang dimasukkan salah. Penghapusan akun dibatalkan.',
      );
    }

    // 2. Langsung Unlink Pasangan (Disconnect Couple & Notifikasi Partner)
    const couple = await this.prisma.couple.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        isActive: true,
      },
    });

    if (couple) {
      const partnerId =
        couple.user1Id === userId ? couple.user2Id : couple.user1Id;

      await this.prisma.couple.update({
        where: { id: couple.id },
        data: {
          isActive: false,
          disconnectedAt: new Date(),
        },
      });

      if (partnerId) {
        await this.prisma.notification
          .create({
            data: {
              userId: partnerId,
              type: 'GOAL_PROGRESS',
              title: 'Koneksi Pasangan Terputus',
              body: 'Pasangan Anda telah mengajukan penghapusan akun. Hubungan couple Anda otomatis terputus dan status Anda kembali single.',
            },
          })
          .catch(() => {});
      }
    }

    // 3. Mark Soft Delete & Hitung Tanggal Expiry (30 hari dari sekarang)
    const now = new Date();
    const hardDeleteDate = new Date(now);
    hardDeleteDate.setDate(hardDeleteDate.getDate() + this.ACCOUNT_DELETION_GRACE_DAYS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: now },
    });

    // 4. Revoke seluruh refresh token (force logout di semua perangkat)
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // 5. Sign out dari Supabase Auth
    try {
      const supabaseAdmin = this.supabaseService.getAdminClient();
      await supabaseAdmin.auth.admin.signOut(userId);
    } catch {
      // ignore
    }

    this.logger.log(
      `User ${userId} requested account deletion. Soft deleted until hard cleanup on ${hardDeleteDate.toISOString()}`,
    );

    return {
      message: `Akun Anda berhasil dijadwalkan untuk dihapus secara permanen pada ${hardDeleteDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} (masa tenggang 30 hari). Pasangan Anda telah di-unlink. Jika Anda login kembali sebelum tanggal tersebut, akun Anda akan otomatis dipulihkan.`,
      scheduledHardDeleteDate: hardDeleteDate,
    };
  }

  // ================================================================
  // EMAIL VERIFICATION
  // ================================================================

  async sendVerificationEmail(userId: string, email: string, name: string) {
    const token = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');

    const verifyToken = this.jwtService.sign(
      { sub: userId, purpose: 'email-verify', token },
      {
        secret: this.config.get<string>('jwt.secret'),
        expiresIn: `${this.EMAIL_VERIFY_TOKEN_EXPIRES_HOURS}h` as any,
      },
    );

    const frontendUrl = this.config.get<string>('app.frontendUrl');
    const verifyUrl = `${frontendUrl}/verify-email?token=${verifyToken}`;

    await this.resend.emails.send({
      from: `${this.config.get('resend.fromName')} <${this.config.get('resend.fromEmail')}>`,
      to: email,
      subject: 'Verifikasi Email Kamu — Renjana',
      html: this.buildVerifyEmailHtml(name, verifyUrl),
    });

    this.logger.log(`Email verifikasi dikirim ke ${email}`);
  }

  async verifyEmail(token: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string; purpose: string }>(
        token,
        {
          secret: this.config.get<string>('jwt.secret'),
        },
      );

      if (payload.purpose !== 'email-verify') {
        throw new BadRequestException('Token tidak valid');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) throw new NotFoundException('User tidak ditemukan');
      if (user.isEmailVerified)
        return { message: 'Email sudah terverifikasi sebelumnya' };

      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { isEmailVerified: true, emailVerifiedAt: new Date() },
      });

      try {
        const supabaseAdmin = this.supabaseService.getAdminClient();
        await supabaseAdmin.auth.admin.updateUserById(payload.sub, {
          email_confirm: true,
        });
      } catch {
        // ignore
      }

      return {
        message: 'Email berhasil diverifikasi! Selamat datang di Renjana 🎉',
      };
    } catch {
      throw new BadRequestException(
        'Token verifikasi tidak valid atau sudah kadaluarsa',
      );
    }
  }

  // ================================================================
  // FORGOT / RESET PASSWORD
  // ================================================================

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim(), deletedAt: null },
    });

    if (!user) {
      return {
        message: 'Jika email terdaftar, link reset password akan dikirim.',
      };
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id, purpose: 'password-reset' },
      {
        secret: this.config.get<string>('jwt.secret'),
        expiresIn: '1h' as any,
      },
    );

    const frontendUrl = this.config.get<string>('app.frontendUrl');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    await this.resend.emails.send({
      from: `${this.config.get('resend.fromName')} <${this.config.get('resend.fromEmail')}>`,
      to: user.email,
      subject: 'Reset Password — Renjana',
      html: this.buildResetPasswordHtml(user.name, resetUrl),
    });

    this.logger.log(`Reset password email dikirim ke ${user.email}`);

    return {
      message: 'Jika email terdaftar, link reset password akan dikirim.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string; purpose: string }>(
        token,
        {
          secret: this.config.get<string>('jwt.secret'),
        },
      );

      if (payload.purpose !== 'password-reset') {
        throw new BadRequestException('Token tidak valid');
      }

      const passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);

      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { passwordHash },
      });

      try {
        const supabaseAdmin = this.supabaseService.getAdminClient();
        await supabaseAdmin.auth.admin.updateUserById(payload.sub, {
          password: newPassword,
        });
      } catch {
        // ignore
      }

      await this.prisma.refreshToken.updateMany({
        where: { userId: payload.sub, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      return { message: 'Password berhasil diubah. Silakan login kembali.' };
    } catch {
      throw new BadRequestException(
        'Token reset password tidak valid atau sudah kadaluarsa',
      );
    }
  }

  // ================================================================
  // GET CURRENT USER (me)
  // ================================================================

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        coupleAsUser1: {
          select: {
            id: true,
            user2Id: true,
            user2: { select: { id: true, name: true, avatarUrl: true } },
            streak: { select: { currentStreak: true } },
          },
        },
        coupleAsUser2: {
          select: {
            id: true,
            user1Id: true,
            user1: { select: { id: true, name: true, avatarUrl: true } },
            streak: { select: { currentStreak: true } },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User tidak ditemukan');

    const couple = user.coupleAsUser1 ?? user.coupleAsUser2 ?? null;
    const partner = couple
      ? user.coupleAsUser1
        ? user.coupleAsUser1.user2
        : user.coupleAsUser2!.user1
      : null;

    return {
      ...this.formatUser(user),
      couple: couple
        ? {
            id: couple.id,
            partnerId: partner?.id ?? null,
            partnerName: partner?.name ?? null,
            partnerAvatarUrl: partner?.avatarUrl ?? null,
            currentStreak: couple.streak?.currentStreak ?? 0,
          }
        : null,
    };
  }

  // ================================================================
  // PRIVATE HELPERS
  // ================================================================

  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.secret'),
        expiresIn: (this.config.get<string>('jwt.expiresIn') || '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: `${this.REFRESH_TOKEN_EXPIRES_DAYS}d` as any,
      }),
    ]);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRES_DAYS);

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    this.prisma.refreshToken
      .deleteMany({
        where: { userId, expiresAt: { lt: new Date() } },
      })
      .catch(() => {});

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60,
    };
  }

  private formatUser(user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    isEmailVerified: boolean;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isEmailVerified: user.isEmailVerified,
      coupleId: null,
      partnerId: null,
    };
  }

  private async processInviteCode(
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
    newUserId: string,
    inviteCode: string,
  ) {
    const invite = await tx.coupleInvite.findUnique({
      where: { token: inviteCode },
      include: { sender: true },
    });

    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      throw new BadRequestException(
        'Kode invite tidak valid atau sudah kadaluarsa',
      );
    }

    if (invite.senderId === newUserId) {
      throw new BadRequestException(
        'Tidak bisa menggunakan kode invite sendiri',
      );
    }

    await tx.couple.create({
      data: {
        user1Id: invite.senderId,
        user2Id: newUserId,
      },
    });

    const couple = await tx.couple.findFirst({
      where: { user1Id: invite.senderId, user2Id: newUserId },
    });
    if (couple) {
      await tx.streak.create({ data: { coupleId: couple.id } });
    }

    await tx.coupleInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });
  }

  // ================================================================
  // EMAIL TEMPLATES
  // ================================================================

  private buildVerifyEmailHtml(name: string, verifyUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f8f4f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#E8847A,#C26D7A);padding:40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Renjana 💌</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">LifebyDesign Couple</p>
        </td></tr>
        <tr><td style="padding:40px 36px;">
          <h2 style="color:#1a1a2e;font-size:22px;font-weight:600;margin:0 0 12px;">Halo, ${name}! 👋</h2>
          <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
            Selamat datang di Renjana. Satu langkah lagi — verifikasi email kamu supaya akun bisa aktif dan kamu bisa mulai journaling bareng pasangan.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#E8847A,#C26D7A);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:16px;font-weight:600;letter-spacing:0.3px;">
              Verifikasi Email Sekarang
            </a>
          </div>
          <p style="color:#999;font-size:13px;line-height:1.6;margin:0;">
            Link ini berlaku selama 24 jam. Jika kamu tidak mendaftar di Renjana, abaikan email ini.
          </p>
        </td></tr>
        <tr><td style="background:#f8f4f0;padding:20px 36px;text-align:center;">
          <p style="color:#bbb;font-size:12px;margin:0;">© 2025 Renjana · Dengan ❤️ untuk setiap pasangan</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private buildResetPasswordHtml(name: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f8f4f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#E8847A,#C26D7A);padding:40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;">Renjana 🔑</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">Reset Password</p>
        </td></tr>
        <tr><td style="padding:40px 36px;">
          <h2 style="color:#1a1a2e;font-size:22px;font-weight:600;margin:0 0 12px;">Halo, ${name}</h2>
          <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
            Kami menerima permintaan reset password untuk akun Renjana kamu. Klik tombol di bawah untuk membuat password baru.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#E8847A,#C26D7A);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:16px;font-weight:600;">
              Reset Password
            </a>
          </div>
          <p style="color:#999;font-size:13px;line-height:1.6;margin:0;">
            Link ini berlaku selama 1 jam. Jika kamu tidak meminta reset password, abaikan email ini — akun kamu aman.
          </p>
        </td></tr>
        <tr><td style="background:#f8f4f0;padding:20px 36px;text-align:center;">
          <p style="color:#bbb;font-size:12px;margin:0;">© 2025 Renjana · Dengan ❤️ untuk setiap pasangan</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  // ================================================================
  // INVITE CODE GENERATION
  // ================================================================

  async generateInviteCode(userId: string) {
    const existingCouple = await this.prisma.couple.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        isActive: true,
      },
    });
    if (existingCouple) {
      throw new ConflictException('Kamu sudah terhubung dengan pasangan');
    }

    await this.prisma.coupleInvite.deleteMany({
      where: { senderId: userId, usedAt: null, expiresAt: { lt: new Date() } },
    });

    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await this.prisma.coupleInvite.create({
      data: { senderId: userId, token, expiresAt },
    });

    return { inviteCode: invite.token, expiresAt: invite.expiresAt };
  }
}
