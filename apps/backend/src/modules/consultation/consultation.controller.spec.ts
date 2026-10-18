import { Test, TestingModule } from '@nestjs/testing';
import { ConsultationController } from './consultation.controller';
import { ConsultationService } from './consultation.service';

describe('ConsultationController', () => {
  let controller: ConsultationController;
  let service: any;

  const mockUser = { id: 'user-123', email: 'test@renjana.test' };

  beforeEach(async () => {
    service = {
      createSession: jest.fn(),
      getUserSessions: jest.fn(),
      getSessionDetail: jest.fn(),
      sendMessage: jest.fn(),
      deleteSession: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsultationController],
      providers: [{ provide: ConsultationService, useValue: service }],
    }).compile();

    controller = module.get<ConsultationController>(ConsultationController);
  });

  it('should create a new consultation session', async () => {
    const dto = { firstMessage: 'Halo konselor' };
    const mockCreated = { id: 'sess-1', title: 'Halo konselor', messages: [] };
    service.createSession.mockResolvedValue(mockCreated);

    const result = await controller.createSession(mockUser, dto);

    expect(service.createSession).toHaveBeenCalledWith('user-123', dto);
    expect(result.data).toEqual(mockCreated);
    expect(result.message).toContain('berhasil dibuat');
  });

  it('should get user sessions list', async () => {
    const mockList = {
      data: [{ id: 'sess-1', title: 'Curhat' }],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };
    service.getUserSessions.mockResolvedValue(mockList);

    const result = await controller.getUserSessions(mockUser, '1', '20');

    expect(service.getUserSessions).toHaveBeenCalledWith('user-123', 1, 20);
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('should get session detail by id', async () => {
    const mockDetail = { id: 'sess-1', messages: [{ id: 'msg-1' }] };
    service.getSessionDetail.mockResolvedValue(mockDetail);

    const result = await controller.getSessionDetail(mockUser, 'sess-1');

    expect(service.getSessionDetail).toHaveBeenCalledWith('user-123', 'sess-1');
    expect(result.data).toEqual(mockDetail);
  });

  it('should send message to active session', async () => {
    const dto = { content: 'Lalu bagaimana?' };
    const mockReply = {
      userMessage: { id: 'msg-1', content: 'Lalu bagaimana?' },
      assistantMessage: { id: 'msg-2', content: 'Coba tanyakan...' },
    };
    service.sendMessage.mockResolvedValue(mockReply);

    const result = await controller.sendMessage(mockUser, 'sess-1', dto);

    expect(service.sendMessage).toHaveBeenCalledWith('user-123', 'sess-1', dto);
    expect(result.data).toEqual(mockReply);
  });

  it('should delete consultation session', async () => {
    const mockDelete = { message: 'Sesi konsultasi berhasil dihapus' };
    service.deleteSession.mockResolvedValue(mockDelete);

    const result = await controller.deleteSession(mockUser, 'sess-1');

    expect(service.deleteSession).toHaveBeenCalledWith('user-123', 'sess-1');
    expect(result.message).toBe('Sesi konsultasi berhasil dihapus');
  });
});
