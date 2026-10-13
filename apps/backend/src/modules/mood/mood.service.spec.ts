import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MoodService } from './mood.service';
import { PrismaService } from '../../database';
import { StreakService } from '../streak';
import { MoodValue } from '@prisma/client';

describe('MoodService', () => {
  let service: MoodService;
  let prisma: any;
  let streakService: any;

  const mockPrisma = {
    moodLog: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    couple: {
      findFirst: jest.fn(),
    },
  };

  const mockStreakService = {
    logEngagement: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoodService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StreakService, useValue: mockStreakService },
      ],
    }).compile();

    service = module.get<MoodService>(MoodService);
    prisma = module.get<PrismaService>(PrismaService);
    streakService = module.get<StreakService>(StreakService);
  });

  describe('create', () => {
    it('should create a mood log when no log exists for the day', async () => {
      prisma.moodLog.findUnique.mockResolvedValue(null);
      const createdLog = {
        id: 'mood-1',
        userId: 'user-1',
        mood: MoodValue.GOOD,
        intensity: 4,
        notes: 'Feeling happy',
        tags: ['gratitude'],
        logDate: new Date('2026-10-13'),
      };
      prisma.moodLog.create.mockResolvedValue(createdLog);

      const result = await service.create('user-1', {
        mood: MoodValue.GOOD,
        intensity: 4,
        notes: 'Feeling happy',
        tags: ['gratitude'],
        logDate: '2026-10-13',
      });

      expect(prisma.moodLog.findUnique).toHaveBeenCalled();
      expect(prisma.moodLog.create).toHaveBeenCalled();
      expect(result).toEqual(createdLog);
    });

    it('should throw ConflictException when log already exists for the day', async () => {
      prisma.moodLog.findUnique.mockResolvedValue({
        id: 'existing-mood-1',
        userId: 'user-1',
        mood: MoodValue.NEUTRAL,
      });

      await expect(
        service.create('user-1', {
          mood: MoodValue.GOOD,
          logDate: '2026-10-13',
        }),
      ).rejects.toThrow(ConflictException);

      expect(prisma.moodLog.create).not.toHaveBeenCalled();
    });
  });

  describe('updateForUser', () => {
    it('should throw ForbiddenException as mood is permanently locked', async () => {
      await expect(
        service.updateForUser('user-1', 'mood-1', {
          mood: MoodValue.VERY_GOOD,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOneForUser', () => {
    it('should return the mood log if owned by user', async () => {
      const mockLog = { id: 'mood-1', userId: 'user-1' };
      prisma.moodLog.findUnique.mockResolvedValue(mockLog);

      const result = await service.findOneForUser('user-1', 'mood-1');
      expect(result).toEqual(mockLog);
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.moodLog.findUnique.mockResolvedValue(null);

      await expect(service.findOneForUser('user-1', 'mood-99')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if log belongs to another user', async () => {
      prisma.moodLog.findUnique.mockResolvedValue({ id: 'mood-1', userId: 'user-2' });

      await expect(service.findOneForUser('user-1', 'mood-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('deleteForUser', () => {
    it('should delete if owned by user', async () => {
      prisma.moodLog.findUnique.mockResolvedValue({ id: 'mood-1', userId: 'user-1' });
      prisma.moodLog.delete.mockResolvedValue({ id: 'mood-1' });

      const result = await service.deleteForUser('user-1', 'mood-1');
      expect(result).toEqual({ message: 'Log mood berhasil dihapus' });
    });
  });
});
