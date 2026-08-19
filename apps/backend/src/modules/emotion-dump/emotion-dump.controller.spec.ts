import { Test, TestingModule } from '@nestjs/testing';
import { EmotionDumpController } from './emotion-dump.controller';
import { EmotionDumpService } from './emotion-dump.service';
import { EmotionDumpStatus } from '@prisma/client';

describe('EmotionDumpController', () => {
  let controller: EmotionDumpController;
  let emotionDumpService: any;

  const mockUser = { id: 'user-1', email: 'andi@test.com' };

  beforeEach(async () => {
    emotionDumpService = {
      create: jest.fn(),
      findAllForUser: jest.fn(),
      findForPartner: jest.fn(),
      findOneForUser: jest.fn(),
      updateForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmotionDumpController],
      providers: [{ provide: EmotionDumpService, useValue: emotionDumpService }],
    }).compile();

    controller = module.get<EmotionDumpController>(EmotionDumpController);
  });

  describe('create', () => {
    it('should delegate and wrap response', async () => {
      const dto = { rawContent: 'Frustasi hari ini' };
      const data = { id: 'd-1', rawContent: 'Frustasi hari ini' };
      emotionDumpService.create.mockResolvedValue(data);

      const res = await controller.create(mockUser, dto as any);

      expect(emotionDumpService.create).toHaveBeenCalledWith('user-1', dto);
      expect(res).toEqual({
        message: 'Emotion Dump berhasil dibuat (Status: PRIVATE)',
        data,
      });
    });
  });

  describe('findAll', () => {
    it('should pass filters through as-is', async () => {
      emotionDumpService.findAllForUser.mockResolvedValue({ items: [] });

      await controller.findAll(
        mockUser,
        31,
        2026,
        EmotionDumpStatus.PRIVATE,
      );

      expect(emotionDumpService.findAllForUser).toHaveBeenCalledWith(
        'user-1',
        31,
        2026,
        EmotionDumpStatus.PRIVATE,
      );
    });

    it('should pass undefined filters when omitted', async () => {
      await controller.findAll(mockUser, undefined, undefined, undefined);

      expect(emotionDumpService.findAllForUser).toHaveBeenCalledWith(
        'user-1',
        undefined,
        undefined,
        undefined,
      );
    });
  });

  describe('findForPartner', () => {
    it('should delegate with parsed page/limit defaults', async () => {
      emotionDumpService.findForPartner.mockResolvedValue({ items: [] });

      await controller.findForPartner(mockUser, undefined, undefined);

      expect(emotionDumpService.findForPartner).toHaveBeenCalledWith('user-1', 1, 20);
    });

    it('should parse string page/limit', async () => {
      await controller.findForPartner(mockUser, '3' as any, '15' as any);

      expect(emotionDumpService.findForPartner).toHaveBeenCalledWith('user-1', 3, 15);
    });
  });

  describe('findOne', () => {
    it('should delegate and return { data }', async () => {
      const data = { id: 'd-1' };
      emotionDumpService.findOneForUser.mockResolvedValue(data);

      const res = await controller.findOne(mockUser, 'd-1');

      expect(emotionDumpService.findOneForUser).toHaveBeenCalledWith('user-1', 'd-1');
      expect(res).toEqual({ data });
    });
  });

  describe('update', () => {
    it('should delegate and wrap response', async () => {
      const dto = { status: EmotionDumpStatus.SHARED };
      const data = { id: 'd-1', status: EmotionDumpStatus.SHARED };
      emotionDumpService.updateForUser.mockResolvedValue(data);

      const res = await controller.update(mockUser, 'd-1', dto as any);

      expect(emotionDumpService.updateForUser).toHaveBeenCalledWith('user-1', 'd-1', dto);
      expect(res).toEqual({
        message: 'Status Emotion Dump berhasil diperbarui',
        data,
      });
    });
  });
});