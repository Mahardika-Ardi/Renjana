import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database';
import { AiService } from '../../shared/ai';
import {
  CoupleContext,
  ChatHistoryMessage,
} from '../../shared/ai/prompts/relationship-counselor.prompt';
import { CreateConsultationDto, SendMessageDto } from './dto';

@Injectable()
export class ConsultationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Mengambil konteks hubungan dan mood terkini pasangan secara aman untuk AI
   */
  public async resolvePartnerContext(userId: string): Promise<CoupleContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        coupleAsUser1: {
          select: {
            isActive: true,
            relationshipStatus: true,
            user2: {
              select: {
                name: true,
                moodLogs: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  select: { mood: true, notes: true },
                },
              },
            },
          },
        },
        coupleAsUser2: {
          select: {
            isActive: true,
            relationshipStatus: true,
            user1: {
              select: {
                name: true,
                moodLogs: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  select: { mood: true, notes: true },
                },
              },
            },
          },
        },
      },
    });

    const couple =
      (user?.coupleAsUser1?.isActive ? user.coupleAsUser1 : null) ??
      (user?.coupleAsUser2?.isActive ? user.coupleAsUser2 : null);

    const partner = user?.coupleAsUser1?.isActive
      ? user.coupleAsUser1.user2
      : user?.coupleAsUser2?.isActive
        ? user.coupleAsUser2.user1
        : null;

    const relationshipStatus = couple?.relationshipStatus ?? null;
    const recentMood = partner?.moodLogs?.[0];

    return {
      userName: user?.name || 'Teman',
      partnerName: partner?.name ?? null,
      relationshipStatus: relationshipStatus ? String(relationshipStatus) : null,
      partnerRecentMood: recentMood ? String(recentMood.mood) : null,
      partnerRecentMoodNotes: recentMood?.notes ?? null,
    };
  }

  /**
   * Membuat sesi konsultasi baru dan langsung mendapatkan respons awal dari AI
   */
  async createSession(userId: string, dto: CreateConsultationDto) {
    const trimmedMessage = dto.firstMessage.trim();
    const title =
      dto.title?.trim() ||
      (trimmedMessage.length > 40
        ? `${trimmedMessage.slice(0, 40)}...`
        : trimmedMessage);

    const session = await this.prisma.consultationSession.create({
      data: {
        userId,
        title,
        messages: {
          create: {
            sender: 'USER',
            content: trimmedMessage,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    const partnerContext = await this.resolvePartnerContext(userId);
    const aiReply = await this.aiService.generateCounselingAdvice(
      [{ sender: 'USER', content: trimmedMessage }],
      partnerContext,
    );

    const assistantMsg = await this.prisma.consultationMessage.create({
      data: {
        sessionId: session.id,
        sender: 'ASSISTANT',
        content: aiReply,
      },
    });

    return {
      id: session.id,
      title: session.title,
      userId: session.userId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messages: [...session.messages, assistantMsg],
    };
  }

  /**
   * Mengambil riwayat sesi konsultasi milik user aktif
   */
  async getUserSessions(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [total, sessions] = await Promise.all([
      this.prisma.consultationSession.count({ where: { userId } }),
      this.prisma.consultationSession.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
    ]);

    const data = sessions.map((s) => ({
      id: s.id,
      title: s.title,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      totalMessages: s._count.messages,
      lastMessage: s.messages[0] || null,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mengambil detail percakapan dalam suatu sesi konsultasi
   */
  async getSessionDetail(userId: string, sessionId: string) {
    const session = await this.prisma.consultationSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Sesi konsultasi tidak ditemukan');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException(
        'Anda tidak memiliki akses ke sesi konsultasi ini',
      );
    }

    return session;
  }

  /**
   * Mengirimkan pesan baru dalam sesi konsultasi yang sedang berlangsung
   */
  async sendMessage(userId: string, sessionId: string, dto: SendMessageDto) {
    const session = await this.prisma.consultationSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Sesi konsultasi tidak ditemukan');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException(
        'Anda tidak memiliki akses ke sesi konsultasi ini',
      );
    }

    const trimmedContent = dto.content.trim();

    // 1. Simpan pesan user
    const userMsg = await this.prisma.consultationMessage.create({
      data: {
        sessionId,
        sender: 'USER',
        content: trimmedContent,
      },
    });

    // 2. Ambil riwayat percakapan terkini untuk konteks percakapan multi-turn
    const recentMessages = await this.prisma.consultationMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 12,
    });

    const history: ChatHistoryMessage[] = recentMessages.map((m) => ({
      sender: m.sender as 'USER' | 'ASSISTANT',
      content: m.content,
    }));

    // 3. Panggil AI konselor hubungan
    const partnerContext = await this.resolvePartnerContext(userId);
    const aiReply = await this.aiService.generateCounselingAdvice(
      history,
      partnerContext,
    );

    // 4. Simpan respon konselor AI
    const assistantMsg = await this.prisma.consultationMessage.create({
      data: {
        sessionId,
        sender: 'ASSISTANT',
        content: aiReply,
      },
    });

    // 5. Perbarui timestamp sesi
    await this.prisma.consultationSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return {
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    };
  }

  /**
   * Menghapus sesi konsultasi
   */
  async deleteSession(userId: string, sessionId: string) {
    const session = await this.prisma.consultationSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Sesi konsultasi tidak ditemukan');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException(
        'Anda tidak memiliki akses ke sesi konsultasi ini',
      );
    }

    await this.prisma.consultationSession.delete({
      where: { id: sessionId },
    });

    return {
      message: 'Sesi konsultasi berhasil dihapus',
    };
  }
}
