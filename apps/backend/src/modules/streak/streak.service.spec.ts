import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { StreakService } from './streak.service';
import { PrismaService } from '../../database';

describe('StreakService', () => {
  let service: StreakService;
  let prisma: any;

  const userA = 'user-a';
  const userB = 'user-b';
  const coupleId = 'couple-1';
  const streakId = 'streak-1';

  // Simulated calendar: 2026-08-03 = Monday, 2026-08-04 = Tuesday, 2026-08-05 = Wednesday
  // (11:00 WIB = 04:00 UTC)
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
    // Default "today": Wednesday 2026-08-05, 11:00 WIB
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [StreakService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<StreakService>(StreakService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('logEngagement', () => {
    it('returns null when user has no active couple', async () => {
      prisma.couple.findFirst.mockResolvedValue(null);

      const result = await service.logEngagement(userA);

      expect(result).toBeNull();
      expect(prisma.streakLog.upsert).not.toHaveBeenCalled();
    });

    it('creates a streak record when couple has none yet', async () => {
      setupCouple(null);
      prisma.streakLog.findMany.mockResolvedValue([]);

      await service.logEngagement(userA);

      expect(prisma.streak.create).toHaveBeenCalledWith({
        data: { coupleId },
      });
      expect(prisma.streakLog.upsert).toHaveBeenCalled();
    });

    it('upserts today log with streakId + userId + engagedDate compound key', async () => {
      setupCouple();
      prisma.streakLog.findMany.mockResolvedValue([]);

      await service.logEngagement(userA);

      const upsertArg = prisma.streakLog.upsert.mock.calls[0][0];
      expect(upsertArg.where).toEqual({
        streakId_userId_engagedDate: {
          streakId,
          userId: userA,
          engagedDate: new Date(`${WED}T00:00:00.000Z`),
        },
      });
      expect(upsertArg.create.engagedDate).toEqual(new Date(`${WED}T00:00:00.000Z`));
      expect(prisma.streak.update).toHaveBeenCalledWith({
        where: { id: streakId },
        data: { lastEngagedAt: expect.any(Date) },
      });
    });
  });

  describe('streak algorithm (calculateAndUpdateStreak)', () => {
    it('agreed simulation: Mon(both)=1 -> Tue(A only)=1 buffer -> Wed(both)=2', async () => {
      setupCouple();
      prisma.streakLog.findMany.mockResolvedValue([
        log(MON, userA),
        log(MON, userB),
        log(TUE, userA),
        log(WED, userA),
        log(WED, userB),
      ]);

      await service.logEngagement(userA);

      expect(prisma.streak.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currentStreak: 2, longestStreak: 2 }),
        }),
      );
    });

    it('buffer day does NOT grow streak: check on Tue, Mon(both)+Tue(A solo) = 1', async () => {
      jest.setSystemTime(new Date('2026-08-04T04:00:00.000Z')); // Tue 11:00 WIB
      setupCouple();
      prisma.streakLog.findMany.mockResolvedValue([
        log(MON, userA),
        log(MON, userB),
        log(TUE, userA),
      ]);

      await service.logEngagement(userA);

      expect(prisma.streak.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currentStreak: 1 }),
        }),
      );
    });

    it('streak value is STABLE when re-checked later without new activity (no self-regression)', async () => {
      // Same data as the Tue check, but queried on Wed (today empty, yesterday solo)
      setupCouple();
      prisma.streakLog.findMany.mockResolvedValue([
        log(MON, userA),
        log(MON, userB),
        log(TUE, userA),
      ]);

      await service.logEngagement(userA);

      expect(prisma.streak.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currentStreak: 1 }),
        }),
      );
    });

    it('resets to 0 when neither today nor yesterday has activity', async () => {
      setupCouple();
      prisma.streakLog.findMany.mockResolvedValue([
        log('2026-07-01', userA),
        log('2026-07-01', userB),
      ]);

      await service.logEngagement(userA);

      expect(prisma.streak.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currentStreak: 0 }),
        }),
      );
    });

    it('fresh couple solo day stays 0 (strict rule, no special-case floor)', async () => {
      setupCouple();
      prisma.streakLog.findMany.mockResolvedValue([log(WED, userA)]);

      await service.logEngagement(userA);

      expect(prisma.streak.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currentStreak: 0 }),
        }),
      );
    });

    it('alternating solo days never grow the streak: Mon(A) Tue(B) Wed(A) = 0', async () => {
      setupCouple();
      prisma.streakLog.findMany.mockResolvedValue([
        log(MON, userA),
        log(TUE, userB),
        log(WED, userA),
      ]);

      await service.logEngagement(userA);

      expect(prisma.streak.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currentStreak: 0 }),
        }),
      );
    });

    it('longest streak is preserved even when current walk is shorter', async () => {
      setupCouple();
      prisma.streak.findUnique.mockResolvedValue({
        id: streakId,
        currentStreak: 0,
        longestStreak: 5,
      });
      prisma.streakLog.findMany.mockResolvedValue([
        log(MON, userA),
        log(MON, userB),
        log(WED, userA),
        log(WED, userB),
      ]);

      await service.logEngagement(userA);

      expect(prisma.streak.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currentStreak: 1, longestStreak: 5 }),
        }),
      );
    });

    it('walks through a chain of buffered solo days up to the last both-active day', async () => {
      setupCouple();
      prisma.streakLog.findMany.mockResolvedValue([
        log('2026-08-02', userA), // Sun both
        log('2026-08-02', userB),
        log(MON, userB), // solo, A buffered (A active Sun)
        log(TUE, userA), // solo, B buffered (B active Mon)
        log(WED, userA),
        log(WED, userB),
      ]);

      await service.logEngagement(userA);

      expect(prisma.streak.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currentStreak: 2 }),
        }),
      );
    });

    it('normalizes dates in Asia/Jakarta (WIB), not UTC', async () => {
      // 2026-08-05T20:00Z = 03:00 WIB on 2026-08-06 -> belongs to Aug 6
      jest.setSystemTime(new Date('2026-08-05T20:00:00.000Z'));
      setupCouple();
      prisma.streakLog.findMany.mockResolvedValue([]);

      await service.logEngagement(userA);

      const upsertArg = prisma.streakLog.upsert.mock.calls[0][0];
      expect(upsertArg.create.engagedDate.toISOString().split('T')[0]).toBe(
        '2026-08-06',
      );
    });
  });

  describe('getStreak', () => {
    it('throws ForbiddenException when user has no couple', async () => {
      prisma.couple.findFirst.mockResolvedValue(null);

      await expect(service.getStreak(userA)).rejects.toThrow(ForbiddenException);
    });

    it('lazily creates a streak record when none exists', async () => {
      setupCouple(null);
      prisma.streakLog.findMany.mockResolvedValue([]);

      await service.getStreak(userA);

      expect(prisma.streak.create).toHaveBeenCalledWith({
        data: { coupleId },
      });
    });

    it('returns current/longest streak, couple info and recent logs', async () => {
      setupCouple();
      prisma.streakLog.findMany.mockResolvedValue([
        log(WED, userA),
        log(WED, userB),
      ]);
      prisma.streak.findUnique.mockResolvedValue({
        id: streakId,
        currentStreak: 0,
        longestStreak: 0,
      });

      const result = await service.getStreak(userA);

      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.couple.id).toBe(coupleId);
      expect(result.couple.user1.id).toBe(userA);
      expect(result.couple.user2.id).toBe(userB);
      expect(result.recentLogs).toContainEqual({
        userId: userA,
        engagedDate: WED,
      });
    });
  });
});
