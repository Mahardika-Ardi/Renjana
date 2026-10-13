import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database';
import { MoodValue } from '@prisma/client';
import { StreakService } from '../streak';
import { CreateMoodDto, UpdateMoodDto } from './dto';

@Injectable()
export class MoodService {
  constructor(
    private prisma: PrismaService,
    private streakService: StreakService,
  ) {}

  /**
   * Buat log mood baru untuk user aktif (Hanya 1 kali submit per hari)
   */
  async create(userId: string, dto: CreateMoodDto) {
    const src = dto.logDate ? new Date(dto.logDate) : new Date();
    const logDate = new Date(src.toISOString().slice(0, 10));

    // Validasi: 1 mood per hari. Jika sudah submit, tolak dengan 409 Conflict
    const existing = await this.prisma.moodLog.findUnique({
      where: { userId_logDate: { userId, logDate } },
    });

    if (existing) {
      throw new ConflictException(
        'Kamu sudah mengisi emoji mood tracker hari ini. Entri mood terkunci dan tidak dapat diubah.',
      );
    }

    const moodLog = await this.prisma.moodLog.create({
      data: {
        userId,
        mood: dto.mood,
        intensity: dto.intensity ?? 3,
        notes: dto.notes,
        tags: dto.tags ?? [],
        logDate,
      },
    });

    return moodLog;
  }

  /**
   * Ambil daftar log mood milik user aktif (dengan paginasi & filter tanggal)
   */
  async findAllForUser(
    userId: string,
    page = 1,
    limit = 20,
    startDate?: string,
    endDate?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { userId };

    if (startDate || endDate) {
      where.logDate = {};
      if (startDate) where.logDate.gte = new Date(startDate);
      if (endDate) where.logDate.lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.moodLog.findMany({
        where,
        orderBy: { logDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.moodLog.count({ where }),
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

  /**
   * Detail 1 log mood milik user aktif
   */
  async findOneForUser(userId: string, id: string) {
    const moodLog = await this.prisma.moodLog.findUnique({
      where: { id },
    });

    if (!moodLog) throw new NotFoundException('Log mood tidak ditemukan');
    if (moodLog.userId !== userId) {
      throw new ForbiddenException('Kamu tidak memiliki akses ke log mood ini');
    }

    return moodLog;
  }

  /**
   * Update log mood milik user aktif (termasuk toggle intensity & notes)
   */
  async updateForUser(userId: string, id: string, dto: UpdateMoodDto) {
    throw new ForbiddenException(
      'Emoji mood tracker yang sudah disubmit terkunci permanen dan tidak dapat diedit.',
    );
  }

  /**
   * Hapus log mood milik user aktif
   */
  async deleteForUser(userId: string, id: string) {
    await this.findOneForUser(userId, id); // Verify ownership

    await this.prisma.moodLog.delete({
      where: { id },
    });

    return { message: 'Log mood berhasil dihapus' };
  }

  /**
   * Ambil daftar log mood pasangan yang dishare (jika ada) — dengan paginasi
   * Mood log tidak punya isShared, jadi partner bisa melihat log pasangan
   * sebagai data transparansi sesuai prinsip #1.
   */
  async findForPartner(
    userId: string,
    page = 1,
    limit = 20,
  ) {
    // Cari koneksi couple aktif user
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
      this.prisma.moodLog.findMany({
        where: {
          userId: partnerId,
        },
        orderBy: { logDate: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          mood: true,
          intensity: true,
          notes: true,
          tags: true,
          logDate: true,
          createdAt: true,
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.moodLog.count({
        where: {
          userId: partnerId,
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