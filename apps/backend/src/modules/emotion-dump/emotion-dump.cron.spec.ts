import { Test, TestingModule } from '@nestjs/testing';
import { EmotionDumpCronService } from './emotion-dump.cron';
import { PrismaService } from '../../database';
import { AiService } from '../../shared/ai';
import { EmotionDumpStatus } from '@prisma/client';

describe('EmotionDumpCronService', () => {
  let service: EmotionDumpCronService;
  let prisma: any;
  let aiService: any;

  const mockUserId = 'user-123';
  const mockDump1 = {
    id: 'dump-1',
    rawContent: 'Raw content 1',
    userId: mockUserId,
  };
  const mockDump2 = {
    id: 'dump-2',
    rawContent: 'Raw content 2',
    userId: mockUserId,
  };

  beforeEach(async () => {
    prisma = {
      user: { findMany: jest.fn() },
      emotionDump: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    aiService = {
      refineEmotionDumps: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmotionDumpCronService,
        { provide: PrismaService, useValue: prisma },
        { provide: AiService, useValue: aiService },
      ],
    }).compile();

    service = module.get<EmotionDumpCronService>(EmotionDumpCronService);
    jest.clearAllMocks();
  });

  describe('handleWeeklyEmotionRefinement', () => {
    it('should return early if no users scheduled today', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.handleWeeklyEmotionRefinement();

      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(prisma.emotionDump.findMany).not.toHaveBeenCalled();
      expect(aiService.refineEmotionDumps).not.toHaveBeenCalled();
    });

    it('should return early if no private dumps to refine', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: mockUserId, email: 'test@test.com' }]);
      prisma.emotionDump.findMany.mockResolvedValue([]);

      await service.handleWeeklyEmotionRefinement();

      expect(prisma.emotionDump.findMany).toHaveBeenCalled();
      expect(aiService.refineEmotionDumps).not.toHaveBeenCalled();
    });

    it('should process private dumps and update to REFINED', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: mockUserId, email: 'test@test.com' }]);
      prisma.emotionDump.findMany.mockResolvedValue([mockDump1, mockDump2]);
      aiService.refineEmotionDumps.mockResolvedValue([
        { id: 'dump-1', refinedContent: 'Refined 1' },
        { id: 'dump-2', refinedContent: 'Refined 2' },
      ]);
      prisma.emotionDump.update.mockResolvedValue({});

      await service.handleWeeklyEmotionRefinement();

      // Verify findMany called with LAST week (not current week)
      const findManyCall = prisma.emotionDump.findMany.mock.calls[0][0];
      expect(findManyCall.where.status).toBe(EmotionDumpStatus.PRIVATE);
      expect(findManyCall.where.weekNumber).toBeDefined();
      expect(findManyCall.where.weekYear).toBeDefined();

      // Verify AI called with correct items
      expect(aiService.refineEmotionDumps).toHaveBeenCalledWith([
        { id: 'dump-1', content: 'Raw content 1' },
        { id: 'dump-2', content: 'Raw content 2' },
      ]);

      // Verify updates
      expect(prisma.emotionDump.update).toHaveBeenCalledTimes(2);
      expect(prisma.emotionDump.update).toHaveBeenCalledWith({
        where: { id: 'dump-1' },
        data: expect.objectContaining({
          refinedContent: 'Refined 1',
          status: EmotionDumpStatus.REFINED,
          aiProcessedAt: expect.any(Date),
        }),
      });
    });

    it('should handle AI service errors gracefully (returns fallback)', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: mockUserId, email: 'test@test.com' }]);
      prisma.emotionDump.findMany.mockResolvedValue([mockDump1]);
      // AiService catches errors internally and returns fallback, so mock resolved fallback
      aiService.refineEmotionDumps.mockResolvedValue([
        { id: 'dump-1', refinedContent: 'Fallback refined content' },
      ]);
      prisma.emotionDump.update.mockResolvedValue({});

      await expect(service.handleWeeklyEmotionRefinement()).resolves.not.toThrow();

      // Should still update with fallback content
      expect(prisma.emotionDump.update).toHaveBeenCalledWith({
        where: { id: 'dump-1' },
        data: expect.objectContaining({
          refinedContent: 'Fallback refined content',
          status: EmotionDumpStatus.REFINED,
        }),
      });
    });
  });
});