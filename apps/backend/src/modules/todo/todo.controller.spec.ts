import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { TodoController } from './todo.controller';
import { TodoService } from './todo.service';
import { AuthService } from '../auth/auth.service';
import { SseService } from '../../infrastructure/sse';

describe('TodoController', () => {
  let controller: TodoController;
  let todoService: any;
  let authService: any;
  let sseService: any;

  const mockUser = { id: 'user-1', email: 'andi@test.com' };

  beforeEach(async () => {
    todoService = {
      create: jest.fn(),
      findAllForCouple: jest.fn(),
      findOneForCouple: jest.fn(),
      toggleStatus: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    authService = {
      validateAndConsumeSseTicket: jest.fn(),
    };

    sseService = {
      subscribe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodoController],
      providers: [
        { provide: TodoService, useValue: todoService },
        { provide: AuthService, useValue: authService },
        { provide: SseService, useValue: sseService },
      ],
    }).compile();

    controller = module.get<TodoController>(TodoController);
  });

  describe('sseEvents', () => {
    it('should validate ticket and return subscribed observable', () => {
      authService.validateAndConsumeSseTicket.mockReturnValue({
        userId: 'user-1',
        coupleId: 'couple-1',
      });
      const observable = of({ data: 'hello' });
      sseService.subscribe.mockReturnValue(observable);

      const result = controller.sseEvents('ticket-1');

      expect(authService.validateAndConsumeSseTicket).toHaveBeenCalledWith('ticket-1');
      expect(sseService.subscribe).toHaveBeenCalledWith('couple-1');
      expect(result).toBe(observable);
    });
  });

  describe('create', () => {
    it('should delegate and wrap response', async () => {
      const dto = { title: 'Belanja' };
      const data = { id: 't-1', title: 'Belanja' };
      todoService.create.mockResolvedValue(data);

      const res = await controller.create(mockUser, dto as any);

      expect(todoService.create).toHaveBeenCalledWith('user-1', dto);
      expect(res).toEqual({ message: 'Tugas bersama berhasil dibuat', data });
    });
  });

  describe('findAll', () => {
    it('should delegate to service', async () => {
      const data = { items: [] };
      todoService.findAllForCouple.mockResolvedValue(data);

      const res = await controller.findAll(mockUser);

      expect(todoService.findAllForCouple).toHaveBeenCalledWith('user-1');
      expect(res).toEqual(data);
    });
  });

  describe('findOne', () => {
    it('should delegate and return { data }', async () => {
      const data = { id: 't-1' };
      todoService.findOneForCouple.mockResolvedValue(data);

      const res = await controller.findOne(mockUser, 't-1');

      expect(todoService.findOneForCouple).toHaveBeenCalledWith('user-1', 't-1');
      expect(res).toEqual({ data });
    });
  });

  describe('toggleStatus', () => {
    it('should delegate and wrap response', async () => {
      const data = { id: 't-1', status: 'COMPLETED' };
      todoService.toggleStatus.mockResolvedValue(data);

      const res = await controller.toggleStatus(mockUser, 't-1');

      expect(todoService.toggleStatus).toHaveBeenCalledWith('user-1', 't-1');
      expect(res).toEqual({ message: 'Status tugas berhasil diperbarui', data });
    });
  });

  describe('update', () => {
    it('should delegate and wrap response', async () => {
      const dto = { title: 'Belanja mingguan' };
      const data = { id: 't-1', title: 'Belanja mingguan' };
      todoService.update.mockResolvedValue(data);

      const res = await controller.update(mockUser, 't-1', dto as any);

      expect(todoService.update).toHaveBeenCalledWith('user-1', 't-1', dto);
      expect(res).toEqual({ message: 'Tugas berhasil diperbarui', data });
    });
  });

  describe('remove', () => {
    it('should delegate to service', async () => {
      const data = { message: 'Tugas berhasil dihapus' };
      todoService.delete.mockResolvedValue(data);

      const res = await controller.remove(mockUser, 't-1');

      expect(todoService.delete).toHaveBeenCalledWith('user-1', 't-1');
      expect(res).toEqual(data);
    });
  });
});