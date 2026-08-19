import { Test, TestingModule } from '@nestjs/testing';
import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';

describe('JournalController', () => {
  let controller: JournalController;
  let journalService: any;

  const mockUser = { id: 'user-1', email: 'andi@test.com' };

  beforeEach(async () => {
    journalService = {
      create: jest.fn(),
      findAllForUser: jest.fn(),
      findForPartner: jest.fn(),
      findOneForUser: jest.fn(),
      updateForUser: jest.fn(),
      deleteForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JournalController],
      providers: [{ provide: JournalService, useValue: journalService }],
    }).compile();

    controller = module.get<JournalController>(JournalController);
  });

  describe('create', () => {
    it('should delegate to service and wrap response', async () => {
      const dto = { content: 'Hari ini aku belajar' };
      const data = { id: 'j-1', content: 'Hari ini aku belajar' };
      journalService.create.mockResolvedValue(data);

      const res = await controller.create(mockUser, dto as any);

      expect(journalService.create).toHaveBeenCalledWith('user-1', dto);
      expect(res).toEqual({ message: 'Jurnal berhasil dibuat', data });
    });
  });

  describe('findAll', () => {
    it('should pass user id and parsed pagination with defaults', async () => {
      journalService.findAllForUser.mockResolvedValue({ items: [], total: 0 });

      const res = await controller.findAll(mockUser, undefined, undefined, '2026-08-01', '2026-08-31');

      expect(journalService.findAllForUser).toHaveBeenCalledWith(
        'user-1',
        1,
        20,
        '2026-08-01',
        '2026-08-31',
      );
      expect(res).toEqual({ items: [], total: 0 });
    });

    it('should parse page/limit strings to numbers', async () => {
      await controller.findAll(mockUser, '2' as any, '10' as any, undefined, undefined);

      expect(journalService.findAllForUser).toHaveBeenCalledWith(
        'user-1',
        2,
        10,
        undefined,
        undefined,
      );
    });
  });

  describe('findForPartner', () => {
    it('should delegate with defaults', async () => {
      journalService.findForPartner.mockResolvedValue({ items: [] });

      await controller.findForPartner(mockUser, undefined, undefined);

      expect(journalService.findForPartner).toHaveBeenCalledWith('user-1', 1, 20);
    });
  });

  describe('findOne', () => {
    it('should delegate and return { data }', async () => {
      const data = { id: 'j-1' };
      journalService.findOneForUser.mockResolvedValue(data);

      const res = await controller.findOne(mockUser, 'j-1');

      expect(journalService.findOneForUser).toHaveBeenCalledWith('user-1', 'j-1');
      expect(res).toEqual({ data });
    });
  });

  describe('update', () => {
    it('should delegate and wrap response', async () => {
      const dto = { isShared: true };
      const data = { id: 'j-1', isShared: true };
      journalService.updateForUser.mockResolvedValue(data);

      const res = await controller.update(mockUser, 'j-1', dto as any);

      expect(journalService.updateForUser).toHaveBeenCalledWith('user-1', 'j-1', dto);
      expect(res).toEqual({ message: 'Jurnal berhasil diperbarui', data });
    });
  });

  describe('remove', () => {
    it('should delegate to service', async () => {
      const data = { message: 'Jurnal berhasil dihapus' };
      journalService.deleteForUser.mockResolvedValue(data);

      const res = await controller.remove(mockUser, 'j-1');

      expect(journalService.deleteForUser).toHaveBeenCalledWith('user-1', 'j-1');
      expect(res).toEqual(data);
    });
  });
});