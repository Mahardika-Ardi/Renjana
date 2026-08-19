import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TodoService } from './todo.service';
import { PrismaService } from '../../database';
import { SseService } from '../../infrastructure/sse';
import { StreakService } from '../streak';
import { TodoStatus, TodoCategory } from '@prisma/client';

describe('TodoService', () => {
  let service: TodoService;
  let prisma: any;
  let sseService: any;
  let streakService: any;

  const userId = 'user-123';
  const partnerId = 'user-456';
  const coupleId = 'couple-789';
  const todoItem = {
    id: 'todo-1',
    coupleId,
    creatorId: userId,
    title: 'Beli bahan makanan',
    description: null,
    category: TodoCategory.OTHER,
    status: TodoStatus.PENDING,
    dueDate: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    creator: { id: userId, name: 'User', avatarUrl: null },
  };

  beforeEach(async () => {
    prisma = {
      couple: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: coupleId, user1Id: userId, user2Id: partnerId }),
      },
      todoItem: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    sseService = { emit: jest.fn() };
    streakService = { logEngagement: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoService,
        { provide: PrismaService, useValue: prisma },
        { provide: SseService, useValue: sseService },
        { provide: StreakService, useValue: streakService },
      ],
    }).compile();

    service = module.get<TodoService>(TodoService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates todo scoped to the couple and broadcasts + logs engagement', async () => {
      prisma.todoItem.create.mockResolvedValue(todoItem);

      const result = await service.create(userId, { title: 'Beli bahan makanan' });

      expect(prisma.todoItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          coupleId,
          creatorId: userId,
          title: 'Beli bahan makanan',
        }),
        include: expect.anything(),
      });
      expect(sseService.emit).toHaveBeenCalledWith(coupleId, 'todo.created', todoItem);
      expect(streakService.logEngagement).toHaveBeenCalledWith(userId);
      expect(result).toEqual(todoItem);
    });

    it('throws ForbiddenException when user has no active couple', async () => {
      prisma.couple.findFirst.mockResolvedValue(null);

      await expect(service.create(userId, { title: 'X' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.todoItem.create).not.toHaveBeenCalled();
    });
  });

  describe('findAllForCouple', () => {
    it('orders PENDING before COMPLETED (status desc) and newest first', async () => {
      prisma.todoItem.findMany.mockResolvedValue([todoItem]);

      const result = await service.findAllForCouple(userId);

      expect(prisma.todoItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { coupleId },
          orderBy: [{ status: 'desc' }, { createdAt: 'desc' }],
        }),
      );
      expect(result.items).toEqual([todoItem]);
    });
  });

  describe('findOneForCouple', () => {
    it('throws NotFoundException when todo does not exist', async () => {
      prisma.todoItem.findUnique.mockResolvedValue(null);

      await expect(service.findOneForCouple(userId, 'todo-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when todo belongs to another couple', async () => {
      prisma.todoItem.findUnique.mockResolvedValue({
        ...todoItem,
        coupleId: 'other-couple',
      });

      await expect(service.findOneForCouple(userId, 'todo-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns the todo when it belongs to the user couple', async () => {
      prisma.todoItem.findUnique.mockResolvedValue(todoItem);

      const result = await service.findOneForCouple(userId, 'todo-1');

      expect(result).toEqual(todoItem);
    });
  });

  describe('toggleStatus', () => {
    it('toggles PENDING -> COMPLETED, sets completedAt, broadcasts + logs engagement', async () => {
      prisma.todoItem.findUnique.mockResolvedValue(todoItem);
      const completed = {
        ...todoItem,
        status: TodoStatus.COMPLETED,
        completedAt: new Date(),
      };
      prisma.todoItem.update.mockResolvedValue(completed);

      const result = await service.toggleStatus(userId, 'todo-1');

      expect(prisma.todoItem.update).toHaveBeenCalledWith({
        where: { id: 'todo-1' },
        data: expect.objectContaining({
          status: TodoStatus.COMPLETED,
          completedAt: expect.any(Date),
        }),
        include: expect.anything(),
      });
      expect(sseService.emit).toHaveBeenCalledWith(coupleId, 'todo.updated', completed);
      expect(streakService.logEngagement).toHaveBeenCalledWith(userId);
      expect(result).toEqual(completed);
    });

    it('toggles COMPLETED -> PENDING and clears completedAt', async () => {
      prisma.todoItem.findUnique.mockResolvedValue({
        ...todoItem,
        status: TodoStatus.COMPLETED,
        completedAt: new Date(),
      });
      const updated = { ...todoItem, status: TodoStatus.PENDING, completedAt: null };
      prisma.todoItem.update.mockResolvedValue(updated);

      await service.toggleStatus(userId, 'todo-1');

      expect(prisma.todoItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: TodoStatus.PENDING,
            completedAt: null,
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('updates fields and converts dueDate string to Date', async () => {
      prisma.todoItem.findUnique.mockResolvedValue(todoItem);
      const updated = { ...todoItem, title: 'Ganti ke supermarket' };
      prisma.todoItem.update.mockResolvedValue(updated);

      await service.update(userId, 'todo-1', {
        title: 'Ganti ke supermarket',
        dueDate: '2026-08-10',
      });

      const updateArg = prisma.todoItem.update.mock.calls[0][0];
      expect(updateArg.data.title).toBe('Ganti ke supermarket');
      expect(updateArg.data.dueDate).toEqual(new Date('2026-08-10'));
      expect(sseService.emit).toHaveBeenCalledWith(coupleId, 'todo.updated', updated);
    });
  });

  describe('delete', () => {
    it('deletes the todo and broadcasts todo.deleted with id only', async () => {
      prisma.todoItem.findUnique.mockResolvedValue(todoItem);
      prisma.todoItem.delete.mockResolvedValue(todoItem);

      const result = await service.delete(userId, 'todo-1');

      expect(prisma.todoItem.delete).toHaveBeenCalledWith({ where: { id: 'todo-1' } });
      expect(sseService.emit).toHaveBeenCalledWith(coupleId, 'todo.deleted', {
        id: 'todo-1',
      });
      expect(streakService.logEngagement).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Tugas berhasil dihapus' });
    });
  });
});
