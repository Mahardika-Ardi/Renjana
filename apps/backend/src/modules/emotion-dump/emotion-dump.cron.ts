import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database';
import { AiService } from '../../shared/ai';
import { EmotionDumpStatus } from '@prisma/client';
import { getISOWeek } from '@renjana/utils';

@Injectable()
export class EmotionDumpCronService {
  private readonly logger = new Logger(EmotionDumpCronService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  /**
   * Daily Cron at 23:59 WIB — Process AI Refinement for users whose weeklyCheckinDay matches today.
   * Processes emotion dumps from the PREVIOUS week (the week that just ended).
   */
  @Cron('0 59 23 * * *', { timeZone: 'Asia/Jakarta' })
  async handleWeeklyEmotionRefinement() {
    const now = new Date();
    const todayDayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate LAST week (the week that just ended)
    const lastWeekDate = new Date(now);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const { week: lastWeekNumber, year: lastWeekYear } = getISOWeek(lastWeekDate);

    this.logger.log(
      `Starting weekly AI emotion refinement for users with weeklyCheckinDay = ${todayDayIndex} (processing week ${lastWeekNumber}/${lastWeekYear})...`,
    );

    // 1. Cari user yang jadwal weekly check-in hari ini
    const targetUsers = await this.prisma.user.findMany({
      where: {
        weeklyCheckinDay: todayDayIndex,
        deletedAt: null,
      },
      select: { id: true, email: true },
    });

    if (targetUsers.length === 0) {
      this.logger.log('No users scheduled for check-in today.');
      return;
    }

    const userIds = targetUsers.map((u) => u.id);

    // 2. Cari semua EmotionDump berstatus PRIVATE untuk MINGGU LALU dari target users
    const privateDumps = await this.prisma.emotionDump.findMany({
      where: {
        userId: { in: userIds },
        status: EmotionDumpStatus.PRIVATE,
        weekNumber: lastWeekNumber,
        weekYear: lastWeekYear,
      },
      select: {
        id: true,
        rawContent: true,
        userId: true,
      },
    });

    if (privateDumps.length === 0) {
      this.logger.log('No private emotion dumps to refine today.');
      return;
    }

    this.logger.log(
      `Found ${privateDumps.length} private emotion dumps to refine for ${targetUsers.length} users.`,
    );

    // 3. Batch refinement per user or overall via AiService
    const itemsToRefine = privateDumps.map((d) => ({
      id: d.id,
      content: d.rawContent,
    }));

    const refinedResults = await this.aiService.refineEmotionDumps(itemsToRefine);

    // 4. Update status dan refinedContent di DB
    for (const result of refinedResults) {
      await this.prisma.emotionDump.update({
        where: { id: result.id },
        data: {
          refinedContent: result.refinedContent,
          status: EmotionDumpStatus.REFINED,
          aiProcessedAt: new Date(),
        },
      });
    }

    this.logger.log(
      `Successfully processed AI refinement for ${refinedResults.length} emotion dumps!`,
    );
  }
}
