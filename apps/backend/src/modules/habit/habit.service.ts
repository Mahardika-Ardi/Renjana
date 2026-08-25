import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database';
import { StreakService } from '../streak';
import { CreateHabitTemplateDto, UpdateHabitTemplateDto, CreateHabitLogDto, UpdateHabitLogDto } from './dto';
import { HabitTemplate, HabitLog } from '@prisma/client';

@Injectable()
export class HabitService {
  constructor(
    private prisma: PrismaService,
    private streakService: StreakService,
  ) {}

  /**
   * Buat habit template baru untuk user aktif
   */
  async createTemplate(userId: string, dto: CreateHabitTemplateDto) {
    const habitTemplate = await this.prisma.habitTemplate.create({
      data: {
        userId,
        name: dto.name,
        emoji: dto.emoji,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    return habitTemplate;
  }

  /**
   * Ambil daftar habit template milik user aktif
   */
  async findAllTemplates(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.habitTemplate.findMany({
        where: { userId, isActive: true },
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.habitTemplate.count({
        where: { userId, isActive: true },
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

  /**
   * Ambil 1 habit template
   */
  async findOneTemplate(userId: string, id: string) {
    const template = await this.prisma.habitTemplate.findUnique({
      where: { id },
    });

    if (!template) throw new NotFoundException('Habit template tidak ditemukan');
    if (template.userId !== userId) {
      throw new ForbiddenException('Kamu tidak memiliki akses ke habit template ini');
    }

    return template;
  }

  /**
   * Update habit template
   */
  async updateTemplate(userId: string, id: string, dto: UpdateHabitTemplateDto) {
    await this.findOneTemplate(userId, id); // Verify ownership

    return this.prisma.habitTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        emoji: dto.emoji,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
    });
  }

  /**
   * Hapus (non-active) habit template
   */
  async deleteTemplate(userId: string, id: string) {
    await this.findOneTemplate(userId, id); // Verify ownership

    return this.prisma.habitTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Buat log habit baru (manual entry)
   */
  async createLog(userId: string, dto: CreateHabitLogDto) {
    // Cek apakah template ada & milik user ini
    const template = await this.prisma.habitTemplate.findFirst({
      where: { id: dto.habitTemplateId, userId },
    });

    if (!template) throw new NotFoundException('Habit template tidak ditemukan');

    const logDate = new Date(new Date(dto.logDate).toISOString().slice(0, 10));

    // ponytail: 1 log per template per hari — POST ulang = update status
    const habitLog = await this.prisma.habitLog.upsert({
      where: {
        userId_habitTemplateId_logDate: {
          userId,
          habitTemplateId: dto.habitTemplateId,
          logDate,
        },
      },
      create: {
        userId,
        habitTemplateId: dto.habitTemplateId,
        isCompleted: dto.isCompleted ?? false,
        logDate,
      },
      update: { isCompleted: dto.isCompleted ?? true },
    });

    // Fire-and-forget log engagement for streak calculation
    this.streakService.logEngagement(userId).catch(() => {});

    return habitLog;
  }

  /**
   * Ambil daftar log habit milik user aktif (dengan filter template & tanggal)
   */
  async findAllLogs(
    userId: string,
    page = 1,
    limit = 20,
    habitTemplateId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { userId };

    if (habitTemplateId) {
      where.habitTemplateId = habitTemplateId;
    }

    if (startDate || endDate) {
      where.logDate = {};
      if (startDate) where.logDate.gte = new Date(startDate);
      if (endDate) where.logDate.lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.habitLog.findMany({
        where,
        orderBy: { logDate: 'desc' },
        skip,
        take: limit,
        include: {
          habitTemplate: {
            select: { id: true, name: true, emoji: true, isActive: true, sortOrder: true },
          },
        },
      }),
      this.prisma.habitLog.count({ where }),
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
   * Ambil 1 log habit
   */
  async findOneLog(userId: string, id: string) {
    const habitLog = await this.prisma.habitLog.findUnique({
      where: { id },
    });

    if (!habitLog) throw new NotFoundException('Log habit tidak ditemukan');
    if (habitLog.userId !== userId) {
      throw new ForbiddenException('Kamu tidak memiliki akses ke log habit ini');
    }

    return habitLog;
  }

  /**
   * Update log habit (toggle completed)
   */
  async updateLog(userId: string, id: string, dto: UpdateHabitLogDto) {
    await this.findOneLog(userId, id); // Verify ownership

    return this.prisma.habitLog.update({
      where: { id },
      data: {
        isCompleted: dto.isCompleted,
      },
    });
  }

  /**
   * Hapus log habit
   */
  async deleteLog(userId: string, id: string) {
    await this.findOneLog(userId, id); // Verify ownership

    await this.prisma.habitLog.delete({
      where: { id },
    });

    return { message: 'Log habit berhasil dihapus' };
  }

  /**
   * Ambil daftar habit template yang sedang aktif untuk user
   */
  async findActiveTemplates(userId: string) {
    return this.prisma.habitTemplate.findMany({
      where: { userId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }
}