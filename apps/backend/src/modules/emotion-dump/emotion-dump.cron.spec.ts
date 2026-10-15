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

  describe('handleWeeklyEmotionRefinement & processPendingRefinements', () => {
    it('should return early if no private dumps to refine', async () => {
      prisma.emotionDump.findMany.mockResolvedValue([]);

      const result = await service.handleWeeklyEmotionRefinement();

      expect(prisma.emotionDump.findMany).toHaveBeenCalledWith({
        where: { status: EmotionDumpStatus.PRIVATE },
        select: { id: true, rawContent: true, userId: true },
        orderBy: { createdAt: 'asc' },
      });
      expect(aiService.refineEmotionDumps).not.toHaveBeenCalled();
      expect(result).toEqual({ processed: 0, items: [] });
    });

    it('should process private dumps 1-by-1 and update to REFINED', async () => {
      prisma.emotionDump.findMany.mockResolvedValue([mockDump1, mockDump2]);
      aiService.refineEmotionDumps
        .mockResolvedValueOnce([{ id: 'dump-1', refinedContent: 'Refined 1' }])
        .mockResolvedValueOnce([{ id: 'dump-2', refinedContent: 'Refined 2' }]);
      prisma.emotionDump.update.mockImplementation(({ where, data }) => ({
        id: where.id,
        refinedContent: data.refinedContent,
      }));

      const result = await service.handleWeeklyEmotionRefinement();

      expect(aiService.refineEmotionDumps).toHaveBeenCalledTimes(2);
      expect(prisma.emotionDump.update).toHaveBeenCalledTimes(2);
      expect(prisma.emotionDump.update).toHaveBeenCalledWith({
        where: { id: 'dump-1' },
        data: expect.objectContaining({
          refinedContent: 'Refined 1',
          status: EmotionDumpStatus.REFINED,
          aiProcessedAt: expect.any(Date),
        }),
      });
      expect(result.processed).toBe(2);
    });

    it('should filter by userId when provided', async () => {
      prisma.emotionDump.findMany.mockResolvedValue([mockDump1]);
      aiService.refineEmotionDumps.mockResolvedValue([
        { id: 'dump-1', refinedContent: 'Refined 1' },
      ]);
      prisma.emotionDump.update.mockResolvedValue({ id: 'dump-1', refinedContent: 'Refined 1' });

      const result = await service.processPendingRefinements(mockUserId);

      expect(prisma.emotionDump.findMany).toHaveBeenCalledWith({
        where: { status: EmotionDumpStatus.PRIVATE, userId: mockUserId },
        select: { id: true, rawContent: true, userId: true },
        orderBy: { createdAt: 'asc' },
      });
      expect(result.processed).toBe(1);
    });

    it('should handle AI service errors gracefully and continue', async () => {
      prisma.emotionDump.findMany.mockResolvedValue([mockDump1]);
      aiService.refineEmotionDumps.mockRejectedValue(new Error('AI failed'));

      const result = await service.processPendingRefinements();

      expect(result.processed).toBe(0);
      expect(prisma.emotionDump.update).not.toHaveBeenCalled();
    });
  });
});