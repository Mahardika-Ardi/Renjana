import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database';

@Injectable()
export class StreakService {
  private readonly logger = new Logger(StreakService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Log daily engagement for a user (called when user performs daily actions like Journal, Emotion Dump, To-do)
   */
  async logEngagement(userId: string) {
    const couple = await this.prisma.couple.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        isActive: true,
      },
      include: { streak: true },
    });

    if (!couple) return null; // User not in an active couple connection

    let streak = couple.streak;
    if (!streak) {
      streak = await this.prisma.streak.create({
        data: { coupleId: couple.id },
      });
    }

    const todayStr = this.getNormalizedDateString(new Date());
    const todayDate = new Date(todayStr);

    // Upsert today's streak log for this user
    await this.prisma.streakLog.upsert({
      where: {
        streakId_userId_engagedDate: {
          streakId: streak.id,
          userId,
          engagedDate: todayDate,
        },
      },
      create: {
        streakId: streak.id,
        userId,
        engagedDate: todayDate,
      },
      update: {},
    });

    // Update lastEngagedAt
    await this.prisma.streak.update({
      where: { id: streak.id },
      data: { lastEngagedAt: new Date() },
    });

    // Recalculate & cache streak
    return this.calculateAndUpdateStreak(streak.id, couple.user1Id, couple.user2Id);
  }

  /**
   * Get current streak info for the user's couple
   */
  async getStreak(userId: string) {
    const couple = await this.prisma.couple.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        isActive: true,
      },
      include: {
        streak: true,
        user1: { select: { id: true, name: true, avatarUrl: true } },
        user2: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (!couple) {
      throw new ForbiddenException('Kamu belum terhubung dengan pasangan');
    }

    let streak = couple.streak;
    if (!streak) {
      streak = await this.prisma.streak.create({
        data: { coupleId: couple.id },
      });
    }

    // Lazy calculate streak on fetch
    const calculated = await this.calculateAndUpdateStreak(
      streak.id,
      couple.user1Id,
      couple.user2Id,
    );

    // Fetch recent 14 days logs for UI calendar/display
    const recentLogs = await this.prisma.streakLog.findMany({
      where: { streakId: streak.id },
      orderBy: { engagedDate: 'desc' },
      take: 28,
    });

    return {
      currentStreak: calculated.currentStreak,
      longestStreak: calculated.longestStreak,
      lastEngagedAt: calculated.lastEngagedAt,
      couple: {
        id: couple.id,
        user1: couple.user1,
        user2: couple.user2,
      },
      recentLogs: recentLogs.map((log) => ({
        userId: log.userId,
        engagedDate: log.engagedDate.toISOString().split('T')[0],
      })),
    };
  }

  /**
   * Streak Algorithm: Walks backwards from today with 1-day buffer logic
   */
  private async calculateAndUpdateStreak(
    streakId: string,
    user1Id: string,
    user2Id: string,
  ) {
    // Fetch last 90 days of logs for this streak
    const logs = await this.prisma.streakLog.findMany({
      where: { streakId },
      orderBy: { engagedDate: 'desc' },
      take: 180,
    });

    // Map logs by YYYY-MM-DD -> Set of active user IDs
    const byDate = new Map<string, Set<string>>();
    for (const log of logs) {
      const dateStr = log.engagedDate.toISOString().split('T')[0];
      if (!byDate.has(dateStr)) {
        byDate.set(dateStr, new Set());
      }
      byDate.get(dateStr)!.add(log.userId);
    }

    const todayDate = new Date();
    const todayStr = this.getNormalizedDateString(todayDate);
    const yesterdayStr = this.getNormalizedDateString(
      this.addDays(todayDate, -1),
    );

    const todayUsers = byDate.get(todayStr) || new Set();
    const yesterdayUsers = byDate.get(yesterdayStr) || new Set();

    // If no activity today AND no activity yesterday -> Streak is 0
    if (todayUsers.size === 0 && yesterdayUsers.size === 0) {
      const streak = await this.prisma.streak.update({
        where: { id: streakId },
        data: { currentStreak: 0 },
      });
      return streak;
    }

    // Determine starting point: start from today if active, else yesterday
    let currDate = todayUsers.size > 0 ? todayDate : this.addDays(todayDate, -1);
    let streakCount = 0;
    let keepWalking = true;

    while (keepWalking) {
      const dateStr = this.getNormalizedDateString(currDate);
      const activeUsers = byDate.get(dateStr) || new Set();

      if (activeUsers.size === 2) {
        // Both active -> Increment streak and continue
        streakCount++;
        currDate = this.addDays(currDate, -1);
      } else if (activeUsers.size === 1) {
        // Only 1 partner active -> Check if absent partner acted on previous day (Buffer check)
        const activeUserId = Array.from(activeUsers)[0];
        const absentUserId = activeUserId === user1Id ? user2Id : user1Id;

        const prevDateStr = this.getNormalizedDateString(this.addDays(currDate, -1));
        const prevUsers = byDate.get(prevDateStr) || new Set();

        if (prevUsers.has(absentUserId)) {
          // BUFFER APPLIED: absent partner acted yesterday -> continue walking WITHOUT counting this day
          currDate = this.addDays(currDate, -1);
        } else {
          // Absent partner did not act yesterday -> STOP (buffer broken)
          keepWalking = false;
        }
      } else {
        // 0 active -> STOP
        keepWalking = false;
      }
    }

    // Fetch existing streak record to check longestStreak
    const currentRecord = await this.prisma.streak.findUnique({
      where: { id: streakId },
    });

    const longestStreak = Math.max(
      currentRecord?.longestStreak || 0,
      streakCount,
    );

    return this.prisma.streak.update({
      where: { id: streakId },
      data: {
        currentStreak: streakCount,
        longestStreak,
      },
    });
  }

  /**
   * Get normalized date string in Asia/Jakarta (WIB, UTC+7)
   * Uses local timezone offset to match cron's day boundary
   */
  private getNormalizedDateString(date: Date): string {
    const jakartaOffset = 7 * 60; // WIB = UTC+7 in minutes
    const localDate = new Date(date.getTime() + jakartaOffset * 60_000);
    return localDate.toISOString().split('T')[0];
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
