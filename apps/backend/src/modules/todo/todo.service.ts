import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database';
import { SseService } from '../../infrastructure/sse';
import { StreakService } from '../streak';
import { TodoStatus } from '@prisma/client';
import { CreateTodoDto, UpdateTodoDto } from './dto';

@Injectable()
export class TodoService {
  constructor(
    private prisma: PrismaService,
    private sseService: SseService,
    private streakService: StreakService,
  ) {}

  /**
   * Helper to get user's active couple ID
   */
  private async resolveCoupleId(userId: string): Promise<string> {
    const couple = await this.prisma.couple.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        isActive: true,
      },
    });

    if (!couple) {
      throw new ForbiddenException(
        'Kamu belum terhubung dengan pasangan untuk mengakses To-do bersama',
      );
    }

    return couple.id;
  }

  /**
   * Buat tugas bersama baru (REST + SSE real-time broadcast)
   */
  async create(userId: string, dto: CreateTodoDto) {
    const coupleId = await this.resolveCoupleId(userId);

    const item = await this.prisma.todoItem.create({
      data: {
        coupleId,
        creatorId: userId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: {
        creator: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    // Real-time broadcast to couple's SSE channel
    this.sseService.emit(coupleId, 'todo.created', item);

    // Fire-and-forget engagement log
    this.streakService.logEngagement(userId).catch(() => {});

    return item;
  }

  /**
   * Ambil seluruh tugas bersama milik pasangan
   */
  async findAllForCouple(userId: string) {
    const coupleId = await this.resolveCoupleId(userId);

    const items = await this.prisma.todoItem.findMany({
      where: { coupleId },
      orderBy: [{ status: 'desc' }, { createdAt: 'desc' }],
      include: {
        creator: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return { items };
  }

  /**
   * Ambil detail 1 tugas bersama
   */
  async findOneForCouple(userId: string, id: string) {
    const coupleId = await this.resolveCoupleId(userId);

    const item = await this.prisma.todoItem.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    if (!item) throw new NotFoundException('Tugas tidak ditemukan');
    if (item.coupleId !== coupleId) {
      throw new ForbiddenException('Kamu tidak memiliki akses ke tugas ini');
    }

    return item;
  }

  /**
   * Toggle status tugas (PENDING <-> COMPLETED)
   */
  async toggleStatus(userId: string, id: string) {
    const item = await this.findOneForCouple(userId, id);

    const nextStatus =
      item.status === TodoStatus.PENDING
        ? TodoStatus.COMPLETED
        : TodoStatus.PENDING;
    const completedAt = nextStatus === TodoStatus.COMPLETED ? new Date() : null;

    const updated = await this.prisma.todoItem.update({
      where: { id },
      data: {
        status: nextStatus,
        completedAt,
      },
      include: {
        creator: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    // Real-time broadcast to couple's SSE channel
    this.sseService.emit(item.coupleId, 'todo.updated', updated);

    // Fire-and-forget engagement log
    this.streakService.logEngagement(userId).catch(() => {});

    return updated;
  }

  /**
   * Update detail tugas bersama
   */
  async update(userId: string, id: string, dto: UpdateTodoDto) {
    const item = await this.findOneForCouple(userId, id);

    const updateData: any = { ...dto };
    if (dto.dueDate) {
      updateData.dueDate = new Date(dto.dueDate);
    }

    const updated = await this.prisma.todoItem.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    // Real-time broadcast
    this.sseService.emit(item.coupleId, 'todo.updated', updated);

    return updated;
  }

  /**
   * Hapus tugas bersama
   */
  async delete(userId: string, id: string) {
    const item = await this.findOneForCouple(userId, id);

    await this.prisma.todoItem.delete({
      where: { id },
    });

    // Real-time broadcast
    this.sseService.emit(item.coupleId, 'todo.deleted', { id });

    return { message: 'Tugas berhasil dihapus' };
  }
}
