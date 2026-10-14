import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database';
import { SseService } from '../../infrastructure/sse';
import { NudgeStatus } from '@prisma/client';

export type TodayNudgeState =
  | 'IDLE'
  | 'WAITING_PARTNER'
  | 'WAITING_YOU'
  | 'COMPLETED';

@Injectable()
export class StreakService {
  private readonly logger = new Logger(StreakService.name);

  constructor(
    private prisma: PrismaService,
    private sseService: SseService,
  ) {}

  /**
   * Helper internal untuk mengambil couple aktif user beserta streak & partner
   */
  private async getActiveCouple(userId: string) {
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

    const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;

    let streak = couple.streak;
    if (!streak) {
      streak = await this.prisma.streak.create({
        data: { coupleId: couple.id },
      });
    }

    return { couple, partnerId, streak };
  }

  /**
   * Kirim senggolan / trigger ke pasangan untuk hari ini
   */
  async sendNudge(userId: string) {
    const { couple, partnerId } = await this.getActiveCouple(userId);

    const todayStr = this.getNormalizedDateString(new Date());
    const todayDate = new Date(todayStr);

    const existingNudge = await this.prisma.streakNudge.findUnique({
      where: {
        coupleId_nudgeDate: {
          coupleId: couple.id,
          nudgeDate: todayDate,
        },
      },
    });

    if (existingNudge) {
      if (existingNudge.status === NudgeStatus.REPLIED) {
        return {
          message: 'Kalian sudah saling senggol dan streak bertambah hari ini!',
          status: 'COMPLETED' as TodayNudgeState,
          nudgeId: existingNudge.id,
        };
      }

      if (existingNudge.senderId === userId) {
        return {
          message: 'Kamu sudah menyenggol pasanganmu hari ini, menunggu balasan.',
          status: 'WAITING_PARTNER' as TodayNudgeState,
          nudgeId: existingNudge.id,
        };
      }

      // Jika pasangan sudah senggol duluan dan statusnya PENDING, aksi ini langsung membalas
      return this.replyNudge(userId);
    }

    const newNudge = await this.prisma.streakNudge.create({
      data: {
        coupleId: couple.id,
        senderId: userId,
        receiverId: partnerId,
        nudgeDate: todayDate,
        status: NudgeStatus.PENDING,
      },
    });

    // Pancarkan event realtime ke pasangan
    this.sseService.emit(couple.id, 'streak.nudged', {
      nudgeId: newNudge.id,
      senderId: userId,
      receiverId: partnerId,
      nudgeDate: todayStr,
    });

    return {
      message: 'Senggolan berhasil dikirim ke pasangan!',
      status: 'WAITING_PARTNER' as TodayNudgeState,
      nudgeId: newNudge.id,
    };
  }

  /**
   * Balas senggolan pasangan agar streak resmi terhitung +1
   */
  async replyNudge(userId: string) {
    const { couple, streak } = await this.getActiveCouple(userId);

    const todayStr = this.getNormalizedDateString(new Date());
    const todayDate = new Date(todayStr);

    const nudge = await this.prisma.streakNudge.findUnique({
      where: {
        coupleId_nudgeDate: {
          coupleId: couple.id,
          nudgeDate: todayDate,
        },
      },
    });

    if (!nudge || nudge.status !== NudgeStatus.PENDING) {
      if (nudge?.status === NudgeStatus.REPLIED) {
        return {
          message: 'Senggolan sudah dibalas sebelumnya!',
          status: 'COMPLETED' as TodayNudgeState,
          currentStreak: streak.currentStreak,
        };
      }
      throw new BadRequestException(
        'Tidak ada senggolan yang menunggu balasan untuk hari ini.',
      );
    }

    if (nudge.receiverId !== userId) {
      throw new ForbiddenException(
        'Hanya pasangan yang disenggol yang dapat membalas senggolan ini.',
      );
    }

    // Update status senggol menjadi REPLIED
    await this.prisma.streakNudge.update({
      where: { id: nudge.id },
      data: {
        status: NudgeStatus.REPLIED,
        repliedAt: new Date(),
      },
    });

    // Catat log keaktifan untuk kedua pasangan pada hari ini
    await Promise.all([
      this.prisma.streakLog.upsert({
        where: {
          streakId_userId_engagedDate: {
            streakId: streak.id,
            userId: nudge.senderId,
            engagedDate: todayDate,
          },
        },
        create: {
          streakId: streak.id,
          userId: nudge.senderId,
          engagedDate: todayDate,
        },
        update: {},
      }),
      this.prisma.streakLog.upsert({
        where: {
          streakId_userId_engagedDate: {
            streakId: streak.id,
            userId: nudge.receiverId,
            engagedDate: todayDate,
          },
        },
        create: {
          streakId: streak.id,
          userId: nudge.receiverId,
          engagedDate: todayDate,
        },
        update: {},
      }),
    ]);

    await this.prisma.streak.update({
      where: { id: streak.id },
      data: { lastEngagedAt: new Date() },
    });

    // Hitung ulang streak dengan kedua user aktif hari ini
    const calculated = await this.calculateAndUpdateStreak(
      streak.id,
      couple.user1Id,
      couple.user2Id,
    );

    // Pancarkan event realtime ke pasangan bahwa streak bertambah
    this.sseService.emit(couple.id, 'streak.completed', {
      currentStreak: calculated.currentStreak,
      longestStreak: calculated.longestStreak,
      nudgeId: nudge.id,
    });

    return {
      message: 'Senggolan dibalas! Streak resmi bertambah +1.',
      status: 'COMPLETED' as TodayNudgeState,
      currentStreak: calculated.currentStreak,
      longestStreak: calculated.longestStreak,
    };
  }

  /**
   * Ambil data streak beserta status senggol hari ini
   */
  async getStreak(userId: string) {
    const { couple, streak } = await this.getActiveCouple(userId);

    const todayStr = this.getNormalizedDateString(new Date());
    const todayDate = new Date(todayStr);

    const todayNudgeRecord = await this.prisma.streakNudge.findUnique({
      where: {
        coupleId_nudgeDate: {
          coupleId: couple.id,
          nudgeDate: todayDate,
        },
      },
    });

    let todayNudgeStatus: TodayNudgeState = 'IDLE';
    if (todayNudgeRecord) {
      if (todayNudgeRecord.status === NudgeStatus.REPLIED) {
        todayNudgeStatus = 'COMPLETED';
      } else if (todayNudgeRecord.senderId === userId) {
        todayNudgeStatus = 'WAITING_PARTNER';
      } else {
        todayNudgeStatus = 'WAITING_YOU';
      }
    }

    const calculated = await this.calculateAndUpdateStreak(
      streak.id,
      couple.user1Id,
      couple.user2Id,
    );

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
      todayNudge: {
        status: todayNudgeStatus,
        nudgeId: todayNudgeRecord?.id,
        senderId: todayNudgeRecord?.senderId,
        receiverId: todayNudgeRecord?.receiverId,
        repliedAt: todayNudgeRecord?.repliedAt?.toISOString() ?? null,
      },
      recentLogs: recentLogs.map((log) => ({
        userId: log.userId,
        engagedDate: log.engagedDate.toISOString().split('T')[0],
      })),
    };
  }

  /**
   * Log daily engagement cadangan (non-streak altering)
   */
  async logEngagement(userId: string) {
    const couple = await this.prisma.couple.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        isActive: true,
      },
      include: { streak: true },
    });

    if (!couple) return null;

    let streak = couple.streak;
    if (!streak) {
      streak = await this.prisma.streak.create({
        data: { coupleId: couple.id },
      });
    }

    return streak;
  }

  /**
   * Algoritma Streak: Membaca hari ke belakang dengan logika 1-day buffer
   */
  private async calculateAndUpdateStreak(
    streakId: string,
    user1Id: string,
    user2Id: string,
  ) {
    const logs = await this.prisma.streakLog.findMany({
      where: { streakId },
      orderBy: { engagedDate: 'desc' },
      take: 180,
    });

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

    if (todayUsers.size === 0 && yesterdayUsers.size === 0) {
      const streak = await this.prisma.streak.update({
        where: { id: streakId },
        data: { currentStreak: 0 },
      });
      return streak;
    }

    let currDate = todayUsers.size > 0 ? todayDate : this.addDays(todayDate, -1);
    let streakCount = 0;
    let keepWalking = true;

    while (keepWalking) {
      const dateStr = this.getNormalizedDateString(currDate);
      const activeUsers = byDate.get(dateStr) || new Set();

      if (activeUsers.size === 2) {
        streakCount++;
        currDate = this.addDays(currDate, -1);
      } else if (activeUsers.size === 1) {
        const activeUserId = Array.from(activeUsers)[0];
        const absentUserId = activeUserId === user1Id ? user2Id : user1Id;

        const prevDateStr = this.getNormalizedDateString(
          this.addDays(currDate, -1),
        );
        const prevUsers = byDate.get(prevDateStr) || new Set();

        if (prevUsers.has(absentUserId)) {
          currDate = this.addDays(currDate, -1);
        } else {
          keepWalking = false;
        }
      } else {
        keepWalking = false;
      }
    }

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

  private getNormalizedDateString(date: Date): string {
    const jakartaOffset = 7 * 60; // WIB = UTC+7
    const localDate = new Date(date.getTime() + jakartaOffset * 60_000);
    return localDate.toISOString().split('T')[0];
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
