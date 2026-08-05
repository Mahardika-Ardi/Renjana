import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database';
import { CreateJournalDto, UpdateJournalDto } from './dto';

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService) {}

  /**
   * Buat entry jurnal baru untuk user aktif
   */
  async create(userId: string, dto: CreateJournalDto) {
    const entryDate = dto.entryDate ? new Date(dto.entryDate) : new Date();

    return this.prisma.journalEntry.create({
      data: {
        userId,
        content: dto.content,
        tags: dto.tags ?? [],
        entryDate,
        isShared: dto.isShared ?? false,
      },
    });
  }

  /**
   * Ambil daftar jurnal milik user aktif (dengan paginasi & filter tanggal)
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
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(startDate);
      if (endDate) where.entryDate.lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        orderBy: { entryDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.journalEntry.count({ where }),
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
   * Detail 1 jurnal milik user aktif
   */
  async findOneForUser(userId: string, id: string) {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id },
    });

    if (!entry) throw new NotFoundException('Jurnal tidak ditemukan');
    if (entry.userId !== userId) {
      throw new ForbiddenException('Kamu tidak memiliki akses ke jurnal ini');
    }

    return entry;
  }

  /**
   * Update jurnal milik user aktif (termasuk toggle isShared)
   */
  async updateForUser(userId: string, id: string, dto: UpdateJournalDto) {
    await this.findOneForUser(userId, id); // Verify ownership

    const data: any = { ...dto };
    if (dto.entryDate) {
      data.entryDate = new Date(dto.entryDate);
    }

    return this.prisma.journalEntry.update({
      where: { id },
      data,
    });
  }

  /**
   * Hapus jurnal milik user aktif
   */
  async deleteForUser(userId: string, id: string) {
    await this.findOneForUser(userId, id); // Verify ownership

    await this.prisma.journalEntry.delete({
      where: { id },
    });

    return { message: 'Jurnal berhasil dihapus' };
  }

  /**
   * Ambil daftar jurnal milik pasangan yang dishare (isShared: true) — dengan paginasi
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
      this.prisma.journalEntry.findMany({
        where: {
          userId: partnerId,
          isShared: true,
        },
        orderBy: { entryDate: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          content: true,
          tags: true,
          entryDate: true,
          createdAt: true,
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.journalEntry.count({
        where: {
          userId: partnerId,
          isShared: true,
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
