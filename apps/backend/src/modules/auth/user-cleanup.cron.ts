import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database';
import { SupabaseService } from '../../infrastructure/supabase';

@Injectable()
export class UserCleanupCronService {
  private readonly logger = new Logger(UserCleanupCronService.name);

  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
  ) {}

  /**
   * Cron Job — Runs every day at midnight (00:00)
   * Hard deletes accounts whose 30-day grace period has expired.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredSoftDeletes() {
    this.logger.log('Starting daily cleanup for expired soft-deleted user accounts...');

    // 30 hari yang lalu
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Cari user yang deletedAt <= 30 hari yang lalu
    const expiredUsers = await this.prisma.user.findMany({
      where: {
        deletedAt: {
          lte: thirtyDaysAgo,
        },
      },
      select: { id: true, email: true, deletedAt: true },
    });

    if (expiredUsers.length === 0) {
      this.logger.log('No expired soft-deleted user accounts found.');
      return;
    }

    this.logger.log(
      `Found ${expiredUsers.length} accounts with expired 30-day grace period. Executing hard delete...`,
    );

    for (const user of expiredUsers) {
      try {
        await this.hardDeleteUser(user.id);
        this.logger.log(
          `Hard delete complete for user ${user.email} (ID: ${user.id}, soft deleted at: ${user.deletedAt})`,
        );
      } catch (err: any) {
        this.logger.error(
          `Failed hard deleting user ${user.email} (ID: ${user.id}): ${err.message}`,
          err.stack,
        );
      }
    }
  }

  /**
   * Helper method to hard delete a user from PostgreSQL and Supabase Auth
   */
  private async hardDeleteUser(userId: string) {
    // 1. Transaction clean up in PostgreSQL DB
    await this.prisma.$transaction(async (tx) => {
      await tx.couple.deleteMany({
        where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      });
      await tx.coupleInvite.deleteMany({
        where: { senderId: userId },
      });
      await tx.streakLog.deleteMany({ where: { userId } });
      await tx.score360.deleteMany({ where: { userId } });
      await tx.weeklyCheckin.deleteMany({ where: { userId } });
      await tx.individualGoalProgress.deleteMany({ where: { userId } });
      await tx.todoItem.deleteMany({ where: { creatorId: userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    // 2. Hard delete from Supabase Auth Server
    try {
      const supabaseAdmin = this.supabaseService.getAdminClient();
      await supabaseAdmin.auth.admin.deleteUser(userId);
    } catch (err: any) {
      this.logger.warn(`Supabase Auth delete user error: ${err.message}`);
    }
  }
}
