import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database';
import { AiService } from '../../shared/ai';
import { EmotionDumpStatus } from '@prisma/client';

@Injectable()
export class EmotionDumpCronService {
  private readonly logger = new Logger(EmotionDumpCronService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  /**
   * Weekly Cron every Sunday at 12:00 WIB (Asia/Jakarta)
   * Processes all pending (PRIVATE) emotion dumps from the week.
   */
  @Cron('0 0 12 * * 0', { timeZone: 'Asia/Jakarta' })
  async handleWeeklyEmotionRefinement() {
    this.logger.log(
      'Starting scheduled weekly AI emotion refinement (Sunday 12:00 WIB)...',
    );
    return this.processPendingRefinements();
  }

  /**
   * Process pending emotion dumps sequentially (1-by-1 safe loop)
   * to ensure zero server memory spike and respect AI rate limits.
   */
  async processPendingRefinements(userId?: string) {
    const where: any = {
      status: EmotionDumpStatus.PRIVATE,
    };
    if (userId) {
      where.userId = userId;
    }

    const pendingDumps = await this.prisma.emotionDump.findMany({
      where,
      select: {
        id: true,
        rawContent: true,
        userId: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (pendingDumps.length === 0) {
      this.logger.log(
        userId
          ? `No pending emotion dumps to refine for user ${userId}.`
          : 'No pending emotion dumps to refine today.',
      );
      return { processed: 0, items: [] };
    }

    this.logger.log(
      `Processing AI refinement for ${pendingDumps.length} pending emotion dumps...`,
    );

    const processedResults: { id: string; refinedContent: string }[] = [];

    // Process 1-by-1 sequentially to prevent server drops or memory spikes
    for (const dump of pendingDumps) {
      try {
        const refinedItems = await this.aiService.refineEmotionDumps([
          { id: dump.id, content: dump.rawContent },
        ]);

        const refinedContent =
          refinedItems[0]?.refinedContent ||
          'Aku merasa perlu mengekspresikan apa yang kurasakan demi kebaikan hubungan kita.';

        const updated = await this.prisma.emotionDump.update({
          where: { id: dump.id },
          data: {
            refinedContent,
            status: EmotionDumpStatus.REFINED,
            aiProcessedAt: new Date(),
          },
        });

        processedResults.push({
          id: updated.id,
          refinedContent: updated.refinedContent || '',
        });
      } catch (err: any) {
        this.logger.error(
          `Failed refining emotion dump ${dump.id}: ${err.message}`,
        );
      }
    }

    this.logger.log(
      `Successfully processed AI refinement for ${processedResults.length}/${pendingDumps.length} emotion dumps!`,
    );

    return {
      processed: processedResults.length,
      items: processedResults,
    };
  }
}
