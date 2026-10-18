import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../../shared/ai/ai.service';

describe('ConsultationService', () => {
  let service: ConsultationService;
  let prisma: any;
  let aiService: any;

  const mockUserWithPartner = {
    id: 'user-1',
    name: 'Dimas',
    coupleAsUser1: {
      isActive: true,
      relationshipStatus: 'DATING',
      user2: {
        id: 'user-2',
        name: 'Clara',
        moodLogs: [
          { mood: 'BAD', notes: 'Capek lembur di kantor' },
        ],
      },
    },
    coupleAsUser2: null,
  };

  const mockSession = {
    id: 'session-123',
    userId: 'user-1',
    title: 'Pasangan Bad Mood',
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [
      {
        id: 'msg-1',
        sessionId: 'session-123',
        sender: 'USER',
        content: 'Pasanganku lagi bad mood',
        createdAt: new Date(),
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      consultationSession: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      consultationMessage: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    aiService = {
      generateCounselingAdvice: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultationService,
        { provide: PrismaService, useValue: prisma },
        { provide: AiService, useValue: aiService },
      ],
    }).compile();

    service = module.get<ConsultationService>(ConsultationService);
  });

  describe('resolvePartnerContext', () => {
    it('should return partner info and recent mood when user is in active couple', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUserWithPartner);

      const context = await service.resolvePartnerContext('user-1');

      expect(context.userName).toBe('Dimas');
      expect(context.partnerName).toBe('Clara');
      expect(context.relationshipStatus).toBe('DATING');
      expect(context.partnerRecentMood).toBe('BAD');
      expect(context.partnerRecentMoodNotes).toBe('Capek lembur di kantor');
    });

    it('should fallback gracefully when user has no partner', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'single-user',
        name: 'Budi',
        coupleAsUser1: null,
        coupleAsUser2: null,
      });

      const context = await service.resolvePartnerContext('single-user');

      expect(context.userName).toBe('Budi');
      expect(context.partnerName).toBeNull();
      expect(context.partnerRecentMood).toBeNull();
    });
  });

  describe('createSession', () => {
    it('should create session, invoke AI counselor, and return session with messages', async () => {
      prisma.consultationSession.create.mockResolvedValue(mockSession);
      prisma.user.findUnique.mockResolvedValue(mockUserWithPartner);
      aiService.generateCounselingAdvice.mockResolvedValue(
        'Validasi: wajar jika kamu cemas. Clara mungkin sedang lelah kerja...',
      );
      prisma.consultationMessage.create.mockResolvedValue({
        id: 'msg-2',
        sessionId: 'session-123',
        sender: 'ASSISTANT',
        content: 'Validasi: wajar jika kamu cemas. Clara mungkin sedang lelah kerja...',
        createdAt: new Date(),
      });

      const result = await service.createSession('user-1', {
        firstMessage: 'Pasanganku lagi bad mood',
      });

      expect(prisma.consultationSession.create).toHaveBeenCalled();
      expect(aiService.generateCounselingAdvice).toHaveBeenCalled();
      expect(result.id).toBe('session-123');
      expect(result.messages.length).toBe(2);
      expect(result.messages[1].sender).toBe('ASSISTANT');
    });
  });

  describe('getUserSessions', () => {
    it('should return paginated sessions with metadata', async () => {
      prisma.consultationSession.count.mockResolvedValue(1);
      prisma.consultationSession.findMany.mockResolvedValue([
        {
          id: 'session-123',
          title: 'Pasangan Bad Mood',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { messages: 2 },
          messages: [{ id: 'msg-2', content: 'Saran...', sender: 'ASSISTANT' }],
        },
      ]);

      const result = await service.getUserSessions('user-1', 1, 10);

      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
      expect(result.data[0].totalMessages).toBe(2);
    });
  });

  describe('getSessionDetail', () => {
    it('should return session detail for the owner', async () => {
      prisma.consultationSession.findUnique.mockResolvedValue(mockSession);

      const result = await service.getSessionDetail('user-1', 'session-123');
      expect(result.id).toBe('session-123');
    });

    it('should throw NotFoundException if session does not exist', async () => {
      prisma.consultationSession.findUnique.mockResolvedValue(null);

      await expect(
        service.getSessionDetail('user-1', 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the session owner', async () => {
      prisma.consultationSession.findUnique.mockResolvedValue(mockSession);

      await expect(
        service.getSessionDetail('other-user', 'session-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('sendMessage', () => {
    it('should append message, call AI with history, and update session', async () => {
      prisma.consultationSession.findUnique.mockResolvedValue(mockSession);
      prisma.consultationMessage.create
        .mockResolvedValueOnce({
          id: 'msg-3',
          sessionId: 'session-123',
          sender: 'USER',
          content: 'Terima kasih, nanti aku coba buatkan teh hangat.',
        })
        .mockResolvedValueOnce({
          id: 'msg-4',
          sessionId: 'session-123',
          sender: 'ASSISTANT',
          content: 'Itu langkah awal yang sangat manis!',
        });
      prisma.consultationMessage.findMany.mockResolvedValue([
        { sender: 'USER', content: 'Pasanganku lagi bad mood' },
        { sender: 'USER', content: 'Terima kasih, nanti aku coba buatkan teh hangat.' },
      ]);
      prisma.user.findUnique.mockResolvedValue(mockUserWithPartner);
      aiService.generateCounselingAdvice.mockResolvedValue(
        'Itu langkah awal yang sangat manis!',
      );
      prisma.consultationSession.update.mockResolvedValue({});

      const result = await service.sendMessage('user-1', 'session-123', {
        content: 'Terima kasih, nanti aku coba buatkan teh hangat.',
      });

      expect(result.userMessage.content).toContain('teh hangat');
      expect(result.assistantMessage.content).toContain('langkah awal');
      expect(prisma.consultationSession.update).toHaveBeenCalled();
    });
  });

  describe('deleteSession', () => {
    it('should delete session for owner', async () => {
      prisma.consultationSession.findUnique.mockResolvedValue(mockSession);
      prisma.consultationSession.delete.mockResolvedValue(mockSession);

      const result = await service.deleteSession('user-1', 'session-123');
      expect(result.message).toBe('Sesi konsultasi berhasil dihapus');
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      prisma.consultationSession.findUnique.mockResolvedValue(mockSession);

      await expect(
        service.deleteSession('other-user', 'session-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
