import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { UserCleanupCronService } from './user-cleanup.cron';
import { PrismaService } from '../../database';
import { SupabaseService } from '../../infrastructure/supabase';

describe('UserCleanupCronService', () => {
  let service: UserCleanupCronService;
  let prisma: any;
  let supabaseService: any;

  const logger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    prisma = {
      user: { findMany: jest.fn(), delete: jest.fn() },
      couple: { deleteMany: jest.fn() },
      coupleInvite: { deleteMany: jest.fn() },
      streakLog: { deleteMany: jest.fn() },
      score360: { deleteMany: jest.fn() },
      weeklyCheckin: { deleteMany: jest.fn() },
      individualGoalProgress: { deleteMany: jest.fn() },
      todoItem: { deleteMany: jest.fn() },
      $transaction: jest.fn(),
    };

    prisma.$transaction.mockImplementation((cb: any) => cb(prisma));

    supabaseService = {
      getAdminClient: jest.fn(),
    };

    jest.spyOn(Logger.prototype, 'log').mockImplementation(logger.log);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(logger.warn);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(logger.error);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCleanupCronService,
        { provide: PrismaService, useValue: prisma },
        { provide: SupabaseService, useValue: supabaseService },
      ],
    }).compile();

    service = module.get<UserCleanupCronService>(UserCleanupCronService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleExpiredSoftDeletes', () => {
    it('should return early when no expired users found', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.handleExpiredSoftDeletes();

      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith(
        'No expired soft-deleted user accounts found.',
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(supabaseService.getAdminClient).not.toHaveBeenCalled();
    });

    it('should query users with deletedAt <= 30 days ago', async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      prisma.user.findMany.mockResolvedValue([]);

      await service.handleExpiredSoftDeletes();

      const findArgs = prisma.user.findMany.mock.calls[0][0];
      expect(findArgs.where.deletedAt.lte).toBeInstanceOf(Date);
      expect(findArgs.select).toEqual({
        id: true,
        email: true,
        deletedAt: true,
      });
    });

    it('should hard delete each expired user in a transaction', async () => {
      const expiredUsers = [
        { id: 'user-1', email: 'a@test.com', deletedAt: new Date('2026-01-01') },
        { id: 'user-2', email: 'b@test.com', deletedAt: new Date('2026-01-02') },
      ];
      prisma.user.findMany.mockResolvedValue(expiredUsers);

      const adminClient = {
        auth: { admin: { deleteUser: jest.fn().mockResolvedValue({}) } },
      };
      supabaseService.getAdminClient.mockReturnValue(adminClient);

      await service.handleExpiredSoftDeletes();

      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
      expect(prisma.couple.deleteMany).toHaveBeenCalledWith({
        where: { OR: [{ user1Id: 'user-1' }, { user2Id: 'user-1' }] },
      });
      expect(prisma.coupleInvite.deleteMany).toHaveBeenCalledWith({
        where: { senderId: 'user-1' },
      });
      expect(prisma.streakLog.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(prisma.score360.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(prisma.weeklyCheckin.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(prisma.individualGoalProgress.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(prisma.todoItem.deleteMany).toHaveBeenCalledWith({ where: { creatorId: 'user-1' } });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });

      expect(adminClient.auth.admin.deleteUser).toHaveBeenCalledWith('user-1');
      expect(adminClient.auth.admin.deleteUser).toHaveBeenCalledWith('user-2');
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Hard delete complete for user a@test.com'),
      );
    });

    it('should continue even if supabase delete fails', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 'user-1', email: 'a@test.com', deletedAt: new Date('2026-01-01') },
      ]);
      const admin = {
        auth: { admin: { deleteUser: jest.fn().mockRejectedValue(new Error('supabase down')) } },
      };
      supabaseService.getAdminClient.mockReturnValue(admin);

      await expect(service.handleExpiredSoftDeletes()).resolves.not.toThrow();

      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Supabase Auth delete user error'),
      );
    });

    it('should catch per-user errors and continue with other users', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 'user-1', email: 'a@test.com', deletedAt: new Date('2026-01-01') },
        { id: 'user-2', email: 'b@test.com', deletedAt: new Date('2026-01-02') },
      ]);
      prisma.$transaction.mockImplementation(() => {
        throw new Error('DB constraint violation');
      });

      await expect(service.handleExpiredSoftDeletes()).resolves.not.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed hard deleting user a@test.com'),
        expect.any(String),
      );
    });
  });
});