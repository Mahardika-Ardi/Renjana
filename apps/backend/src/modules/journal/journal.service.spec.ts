import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { JournalService } from './journal.service';
import { PrismaService } from '../../database';
import { StreakService } from '../streak';

describe('JournalService', () => {
  let service: JournalService;
  let prisma: any;

  const mockUserId = 'user-123';
  const mockPartnerId = 'user-456';
  const mockCoupleId = 'couple-789';
  const mockJournalEntry = {
    id: 'journal-1',
    userId: mockUserId,
    content: 'Test journal entry',
    tags: ['gratitude'],
    entryDate: new Date('2026-08-05'),
    isShared: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      journalEntry: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      couple: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalService,
        { provide: PrismaService, useValue: prisma },
        { provide: StreakService, useValue: { logEngagement: jest.fn().mockResolvedValue({}) } },
      ],
    }).compile();

    service = module.get<JournalService>(JournalService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a journal entry', async () => {
      prisma.journalEntry.create.mockResolvedValue(mockJournalEntry);

      const result = await service.create(mockUserId, {
        content: 'Test journal entry',
        tags: ['gratitude'],
        entryDate: '2026-08-05',
        isShared: false,
      });

      expect(prisma.journalEntry.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          content: 'Test journal entry',
          tags: ['gratitude'],
          entryDate: new Date('2026-08-05'),
          isShared: false,
        },
      });
      expect(result).toEqual(mockJournalEntry);
    });
  });

  describe('findAllForUser', () => {
    it('should return paginated journal entries', async () => {
      prisma.journalEntry.findMany.mockResolvedValue([mockJournalEntry]);
      prisma.journalEntry.count.mockResolvedValue(1);

      const result = await service.findAllForUser(mockUserId, 1, 20);

      expect(result).toEqual({
        items: [mockJournalEntry],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });
    });

    it('should filter by date range', async () => {
      prisma.journalEntry.findMany.mockResolvedValue([]);
      prisma.journalEntry.count.mockResolvedValue(0);

      await service.findAllForUser(mockUserId, 1, 20, '2026-08-01', '2026-08-31');

      expect(prisma.journalEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entryDate: { gte: new Date('2026-08-01'), lte: new Date('2026-08-31') },
          }),
        }),
      );
    });
  });

  describe('findOneForUser', () => {
    it('should return journal entry if owned by user', async () => {
      prisma.journalEntry.findUnique.mockResolvedValue(mockJournalEntry);

      const result = await service.findOneForUser(mockUserId, 'journal-1');
      expect(result).toEqual(mockJournalEntry);
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.journalEntry.findUnique.mockResolvedValue(null);

      await expect(service.findOneForUser(mockUserId, 'journal-999')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if owned by another user', async () => {
      prisma.journalEntry.findUnique.mockResolvedValue({ ...mockJournalEntry, userId: mockPartnerId });

      await expect(service.findOneForUser(mockUserId, 'journal-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateForUser', () => {
    it('should update journal entry', async () => {
      prisma.journalEntry.findUnique.mockResolvedValue(mockJournalEntry);
      prisma.journalEntry.update.mockResolvedValue({ ...mockJournalEntry, isShared: true });

      const result = await service.updateForUser(mockUserId, 'journal-1', { isShared: true });

      expect(prisma.journalEntry.update).toHaveBeenCalledWith({
        where: { id: 'journal-1' },
        data: { isShared: true },
      });
      expect(result.isShared).toBe(true);
    });
  });

  describe('deleteForUser', () => {
    it('should delete journal entry', async () => {
      prisma.journalEntry.findUnique.mockResolvedValue(mockJournalEntry);
      prisma.journalEntry.delete.mockResolvedValue(mockJournalEntry);

      const result = await service.deleteForUser(mockUserId, 'journal-1');

      expect(prisma.journalEntry.delete).toHaveBeenCalledWith({ where: { id: 'journal-1' } });
      expect(result).toEqual({ message: 'Jurnal berhasil dihapus' });
    });
  });

  describe('findForPartner', () => {
    it('should return empty if no couple', async () => {
      prisma.couple.findFirst.mockResolvedValue(null);

      const result = await service.findForPartner(mockUserId);
      expect(result.items).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should return paginated shared entries from partner', async () => {
      prisma.couple.findFirst.mockResolvedValue({
        id: mockCoupleId,
        user1Id: mockUserId,
        user2Id: mockPartnerId,
        isActive: true,
      });
      prisma.journalEntry.findMany.mockResolvedValue([{ ...mockJournalEntry, userId: mockPartnerId, isShared: true, user: { id: mockPartnerId, name: 'Partner', avatarUrl: null } }]);
      prisma.journalEntry.count.mockResolvedValue(1);

      const result = await service.findForPartner(mockUserId, 1, 20);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].user.id).toBe(mockPartnerId);
      expect(result.meta.total).toBe(1);
    });
  });
});