import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { StreakService } from './streak.service';
import { PrismaService } from '../../database';
import { SseService } from '../../infrastructure/sse';
import { NudgeStatus } from '@prisma/client';

describe('StreakService', () => {
  let service: StreakService;
  let prisma: any;
  let sseService: any;

  const userA = 'user-a';
  const userB = 'user-b';
  const coupleId = 'couple-1';
  const streakId = 'streak-1';

  const MON = '2026-08-03';
  const TUE = '2026-08-04';
  const WED = '2026-08-05';

  const log = (date: string, userId: string) => ({
    id: `${date}-${userId}`,
    streakId,
    userId,
    engagedDate: new Date(`${date}T00:00:00.000Z`),
  });

  const setupCouple = (streak: any = { id: streakId }) => {
    prisma.couple.findFirst.mockResolvedValue({
      id: coupleId,
      user1Id: userA,
      user2Id: userB,
      streak,
      user1: { id: userA, name: 'User A', avatarUrl: null },
      user2: { id: userB, name: 'User B', avatarUrl: null },
    });
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-05T04:00:00.000Z'));

    prisma = {
      couple: { findFirst: jest.fn() },
      streak: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      streakLog: {
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      streakNudge: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    sseService = {
      emit: jest.fn(),
    };

    prisma.streak.create.mockResolvedValue({ id: streakId });
    prisma.streak.update.mockImplementation(({ data }: any) => ({
      id: streakId,
      ...data,
    }));
    prisma.streak.findUnique.mockResolvedValue({
      id: streakId,
      currentStreak: 0,
      longestStreak: 0,
    });
    prisma.streakLog.upsert.mockResolvedValue({});
    prisma.streakNudge.findUnique.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreakService,
        { provide: PrismaService, useValue: prisma },
        { provide: SseService, useValue: sseService },
      ],
    }).compile();

    service = module.get<StreakService>(StreakService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('sendNudge', () => {
    it('creates a new pending nudge and emits sse event', async () => {
      setupCouple();
      prisma.streakNudge.findUnique.mockResolvedValue(null);
      prisma.streakNudge.create.mockResolvedValue({
        id: 'nudge-1',
        coupleId,
        senderId: userA,
        receiverId: userB,
        status: NudgeStatus.PENDING,
      });

      const res = await service.sendNudge(userA);

      expect(res.status).toBe('WAITING_PARTNER');
      expect(prisma.streakNudge.create).toHaveBeenCalled();
      expect(sseService.emit).toHaveBeenCalledWith(
        coupleId,
        'streak.nudged',
        expect.objectContaining({ senderId: userA, receiverId: userB }),
      );
    });

    it('returns WAITING_PARTNER if user already nudged today', async () => {
      setupCouple();
      prisma.streakNudge.findUnique.mockResolvedValue({
        id: 'nudge-1',
        coupleId,
        senderId: userA,
        receiverId: userB,
        status: NudgeStatus.PENDING,
      });

      const res = await service.sendNudge(userA);

      expect(res.status).toBe('WAITING_PARTNER');
      expect(prisma.streakNudge.create).not.toHaveBeenCalled();
    });

    it('returns COMPLETED if already replied today', async () => {
      setupCouple();
      prisma.streakNudge.findUnique.mockResolvedValue({
        id: 'nudge-1',
        coupleId,
        senderId: userA,
        receiverId: userB,
        status: NudgeStatus.REPLIED,
      });

      const res = await service.sendNudge(userA);

      expect(res.status).toBe('COMPLETED');
    });
  });

  describe('replyNudge', () => {
    it('successfully replies to a pending nudge and increases streak', async () => {
      setupCouple();
      prisma.streakNudge.findUnique.mockResolvedValue({
        id: 'nudge-1',
        coupleId,
        senderId: userA,
        receiverId: userB,
        status: NudgeStatus.PENDING,
      });
      prisma.streakNudge.update.mockResolvedValue({
        id: 'nudge-1',
        status: NudgeStatus.REPLIED,
      });
      prisma.streakLog.findMany.mockResolvedValue([
        log(WED, userA),
        log(WED, userB),
      ]);

      const res = await service.replyNudge(userB);

      expect(res.status).toBe('COMPLETED');
      expect(prisma.streakNudge.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'nudge-1' },
          data: expect.objectContaining({ status: NudgeStatus.REPLIED }),
        }),
      );
      expect(prisma.streakLog.upsert).toHaveBeenCalledTimes(2);
      expect(sseService.emit).toHaveBeenCalledWith(
        coupleId,
        'streak.completed',
        expect.any(Object),
      );
    });

    it('throws BadRequestException if no pending nudge exists', async () => {
      setupCouple();
      prisma.streakNudge.findUnique.mockResolvedValue(null);

      await expect(service.replyNudge(userB)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ForbiddenException if sender attempts to reply to their own nudge', async () => {
      setupCouple();
      prisma.streakNudge.findUnique.mockResolvedValue({
        id: 'nudge-1',
        coupleId,
        senderId: userA,
        receiverId: userB,
        status: NudgeStatus.PENDING,
      });

      await expect(service.replyNudge(userA)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getStreak', () => {
    it('throws ForbiddenException when user has no active couple', async () => {
      prisma.couple.findFirst.mockResolvedValue(null);

      await expect(service.getStreak(userA)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns current/longest streak, couple info, todayNudge and recent logs', async () => {
      setupCouple();
      prisma.streakLog.findMany.mockResolvedValue([
        log(WED, userA),
        log(WED, userB),
      ]);
      prisma.streak.findUnique.mockResolvedValue({
        id: streakId,
        currentStreak: 1,
        longestStreak: 1,
      });
      prisma.streakNudge.findUnique.mockResolvedValue({
        id: 'nudge-1',
        senderId: userA,
        receiverId: userB,
        status: NudgeStatus.PENDING,
      });

      const result = await service.getStreak(userA);

      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.couple.id).toBe(coupleId);
      expect(result.todayNudge.status).toBe('WAITING_PARTNER');
    });
  });
});
