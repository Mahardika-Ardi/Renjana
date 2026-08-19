import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EmotionDumpService } from './emotion-dump.service';
import { PrismaService } from '../../database';
import { StreakService } from '../streak';
import { EmotionDumpStatus } from '@prisma/client';

describe('EmotionDumpService', () => {
  let service: EmotionDumpService;
  let prisma: any;

  const mockUserId = 'user-123';
  const mockPartnerId = 'user-456';
  const mockCoupleId = 'couple-789';
  const mockEmotionDump = {
    id: 'dump-1',
    userId: mockUserId,
    rawContent: 'Raw emotion content',
    refinedContent: null,
    status: EmotionDumpStatus.PRIVATE,
    weekNumber: 31,
    weekYear: 2026,
    aiProcessedAt: null,
    sharedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      emotionDump: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      couple: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmotionDumpService,
        { provide: PrismaService, useValue: prisma },
        { provide: StreakService, useValue: { logEngagement: jest.fn().mockResolvedValue({}) } },
      ],
    }).compile();

    service = module.get<EmotionDumpService>(EmotionDumpService);
    jest.clearAllMocks();
  });

  describe('validateTransition', () => {
    it('should allow PRIVATE -> REFINED by AI', () => {
      expect(() => service.validateTransition(EmotionDumpStatus.PRIVATE, EmotionDumpStatus.REFINED, 'ai')).not.toThrow();
    });

    it('should allow REFINED -> SHARED by user', () => {
      expect(() => service.validateTransition(EmotionDumpStatus.REFINED, EmotionDumpStatus.SHARED, 'user')).not.toThrow();
    });

    it('should allow REFINED -> PRIVATE by user', () => {
      expect(() => service.validateTransition(EmotionDumpStatus.REFINED, EmotionDumpStatus.PRIVATE, 'user')).not.toThrow();
    });

    it('should deny PRIVATE -> REFINED by user', () => {
      expect(() => service.validateTransition(EmotionDumpStatus.PRIVATE, EmotionDumpStatus.REFINED, 'user')).toThrow(BadRequestException);
    });

    it('should deny SHARED -> anything by user', () => {
      expect(() => service.validateTransition(EmotionDumpStatus.SHARED, EmotionDumpStatus.PRIVATE, 'user')).toThrow(BadRequestException);
      expect(() => service.validateTransition(EmotionDumpStatus.SHARED, EmotionDumpStatus.REFINED, 'user')).toThrow(BadRequestException);
    });

    it('should deny REFINED -> anything by AI', () => {
      expect(() => service.validateTransition(EmotionDumpStatus.REFINED, EmotionDumpStatus.SHARED, 'ai')).toThrow(BadRequestException);
    });

    it('should deny PRIVATE -> SHARED directly', () => {
      expect(() => service.validateTransition(EmotionDumpStatus.PRIVATE, EmotionDumpStatus.SHARED, 'user')).toThrow(BadRequestException);
      expect(() => service.validateTransition(EmotionDumpStatus.PRIVATE, EmotionDumpStatus.SHARED, 'ai')).toThrow(BadRequestException);
    });
  });

  describe('create', () => {
    it('should create emotion dump with PRIVATE status and current ISO week', async () => {
      prisma.emotionDump.create.mockResolvedValue(mockEmotionDump);

      const result = await service.create(mockUserId, { rawContent: 'Test emotion' });

      expect(prisma.emotionDump.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          rawContent: 'Test emotion',
          status: EmotionDumpStatus.PRIVATE,
          weekNumber: expect.any(Number),
          weekYear: expect.any(Number),
        }),
      });
      expect(result.status).toBe(EmotionDumpStatus.PRIVATE);
    });
  });

  describe('findAllForUser', () => {
    it('should return filtered emotion dumps', async () => {
      prisma.emotionDump.findMany.mockResolvedValue([mockEmotionDump]);

      const result = await service.findAllForUser(mockUserId, 31, 2026, EmotionDumpStatus.PRIVATE);

      expect(prisma.emotionDump.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, weekNumber: 31, weekYear: 2026, status: EmotionDumpStatus.PRIVATE },
        orderBy: { createdAt: 'desc' },
      });
      expect(result.items).toEqual([mockEmotionDump]);
    });
  });

  describe('findOneForUser', () => {
    it('should return emotion dump if owned by user', async () => {
      prisma.emotionDump.findUnique.mockResolvedValue(mockEmotionDump);

      const result = await service.findOneForUser(mockUserId, 'dump-1');
      expect(result).toEqual(mockEmotionDump);
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.emotionDump.findUnique.mockResolvedValue(null);

      await expect(service.findOneForUser(mockUserId, 'dump-999')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if owned by another user', async () => {
      prisma.emotionDump.findUnique.mockResolvedValue({ ...mockEmotionDump, userId: mockPartnerId });

      await expect(service.findOneForUser(mockUserId, 'dump-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateForUser', () => {
    it('should update status REFINED -> SHARED and set sharedAt', async () => {
      const refinedDump = { ...mockEmotionDump, status: EmotionDumpStatus.REFINED };
      prisma.emotionDump.findUnique.mockResolvedValue(refinedDump);
      prisma.emotionDump.update.mockResolvedValue({ ...refinedDump, status: EmotionDumpStatus.SHARED, sharedAt: new Date() });

      const result = await service.updateForUser(mockUserId, 'dump-1', { status: EmotionDumpStatus.SHARED });

      expect(prisma.emotionDump.update).toHaveBeenCalledWith({
        where: { id: 'dump-1' },
        data: expect.objectContaining({
          status: EmotionDumpStatus.SHARED,
          sharedAt: expect.any(Date),
        }),
      });
    });

    it('should update status REFINED -> PRIVATE', async () => {
      const refinedDump = { ...mockEmotionDump, status: EmotionDumpStatus.REFINED };
      prisma.emotionDump.findUnique.mockResolvedValue(refinedDump);
      prisma.emotionDump.update.mockResolvedValue({ ...refinedDump, status: EmotionDumpStatus.PRIVATE });

      const result = await service.updateForUser(mockUserId, 'dump-1', { status: EmotionDumpStatus.PRIVATE });

      expect(prisma.emotionDump.update).toHaveBeenCalledWith({
        where: { id: 'dump-1' },
        data: { status: EmotionDumpStatus.PRIVATE },
      });
    });

    it('should throw BadRequestException for invalid transition PRIVATE -> SHARED', async () => {
      prisma.emotionDump.findUnique.mockResolvedValue(mockEmotionDump);

      await expect(service.updateForUser(mockUserId, 'dump-1', { status: EmotionDumpStatus.SHARED })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid transition SHARED -> PRIVATE', async () => {
      const sharedDump = { ...mockEmotionDump, status: EmotionDumpStatus.SHARED };
      prisma.emotionDump.findUnique.mockResolvedValue(sharedDump);

      await expect(service.updateForUser(mockUserId, 'dump-1', { status: EmotionDumpStatus.PRIVATE })).rejects.toThrow(BadRequestException);
    });
  });

  describe('findForPartner', () => {
    it('should return empty if no couple', async () => {
      prisma.couple.findFirst.mockResolvedValue(null);

      const result = await service.findForPartner(mockUserId);
      expect(result.items).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should return paginated SHARED entries from partner', async () => {
      const sharedDump = { ...mockEmotionDump, userId: mockPartnerId, status: EmotionDumpStatus.SHARED, refinedContent: 'Refined content', sharedAt: new Date() };
      prisma.couple.findFirst.mockResolvedValue({
        id: mockCoupleId,
        user1Id: mockUserId,
        user2Id: mockPartnerId,
        isActive: true,
      });
      prisma.emotionDump.findMany.mockResolvedValue([sharedDump]);
      prisma.emotionDump.count.mockResolvedValue(1);

      const result = await service.findForPartner(mockUserId, 1, 20);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].refinedContent).toBe('Refined content');
      expect(result.meta.total).toBe(1);
    });
  });
});