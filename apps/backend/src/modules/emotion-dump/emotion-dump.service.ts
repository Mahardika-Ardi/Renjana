import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database';
import { EmotionDumpStatus } from '@prisma/client';
import { getISOWeek } from '@renjana/utils';
import { CreateEmotionDumpDto, UpdateEmotionDumpDto } from './dto';

@Injectable()
export class EmotionDumpService {
  constructor(private prisma: PrismaService) {}

  /**
   * State machine validator for EmotionDump lifecycle
   * PRIVATE -> REFINED (by AI)
   * REFINED -> SHARED | PRIVATE (by User)
   * SHARED -> no further state changes allowed
   */
  public validateTransition(
    current: EmotionDumpStatus,
    next: EmotionDumpStatus,
    actor: 'user' | 'ai',
  ): void {
    const allowed: Record<
      EmotionDumpStatus,
      Record<'user' | 'ai', EmotionDumpStatus[]>
    > = {
      PRIVATE: { user: [], ai: ['REFINED'] },
      REFINED: { user: ['SHARED', 'PRIVATE'], ai: [] },
      SHARED: { user: [], ai: [] },
    };

    if (!allowed[current]?.[actor]?.includes(next)) {
      throw new BadRequestException(
        `Transisi status dari ${current} ke ${next} oleh ${actor} tidak diperbolehkan.`,
      );
    }
  }

  /**
   * Buat EmotionDump mentah baru untuk minggu berjalan
   */
  async create(userId: string, dto: CreateEmotionDumpDto) {
    const now = new Date();
    const { week: weekNumber, year: weekYear } = getISOWeek(now);

    return this.prisma.emotionDump.create({
      data: {
        userId,
        rawContent: dto.rawContent,
        status: EmotionDumpStatus.PRIVATE,
        weekNumber,
        weekYear,
      },
    });
  }

  /**
   * Ambil daftar EmotionDump milik user sendiri
   */
  async findAllForUser(
    userId: string,
    weekNumber?: number,
    weekYear?: number,
    status?: EmotionDumpStatus,
  ) {
    const where: any = { userId };
    if (weekNumber) where.weekNumber = Number(weekNumber);
    if (weekYear) where.weekYear = Number(weekYear);
    if (status) where.status = status;

    const items = await this.prisma.emotionDump.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return { items };
  }

  /**
   * Detail 1 EmotionDump milik user sendiri
   */
  async findOneForUser(userId: string, id: string) {
    const dump = await this.prisma.emotionDump.findUnique({
      where: { id },
    });

    if (!dump) throw new NotFoundException('Emotion dump tidak ditemukan');
    if (dump.userId !== userId) {
      throw new ForbiddenException('Kamu tidak memiliki akses ke emotion dump ini');
    }

    return dump;
  }

  /**
   * Update status EmotionDump oleh User (misal: REFINED -> SHARED atau REFINED -> PRIVATE)
   */
  async updateForUser(userId: string, id: string, dto: UpdateEmotionDumpDto) {
    const dump = await this.findOneForUser(userId, id);

    if (dto.status) {
      this.validateTransition(dump.status, dto.status, 'user');
    }

    const updateData: any = {};
    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === EmotionDumpStatus.SHARED) {
        updateData.sharedAt = new Date();
      }
    }

    return this.prisma.emotionDump.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Ambil daftar EmotionDump pasangan yang sudah status SHARED — dengan paginasi
   */
  async findForPartner(
    userId: string,
    page = 1,
    limit = 20,
  ) {
    const couple = await this.prisma.couple.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        isActive: true,
      },
    });

    if (!couple) {
      return { items: [], meta: { page, limit, total: 0, totalPages: 0 }, message: 'Kamu belum terhubung dengan pasangan' };
    }

    const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.emotionDump.findMany({
        where: {
          userId: partnerId,
          status: EmotionDumpStatus.SHARED,
        },
        orderBy: { sharedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          refinedContent: true,
          sharedAt: true,
          weekNumber: true,
          weekYear: true,
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.emotionDump.count({
        where: {
          userId: partnerId,
          status: EmotionDumpStatus.SHARED,
        },
      }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
