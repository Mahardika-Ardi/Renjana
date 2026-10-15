import { Test, TestingModule } from '@nestjs/testing';
import { StreakController } from './streak.controller';
import { StreakService } from './streak.service';

describe('StreakController', () => {
  let controller: StreakController;
  let streakService: any;

  const mockUser = { id: 'user-1', email: 'andi@test.com' };

  beforeEach(async () => {
    streakService = {
      getStreak: jest.fn(),
      triggerStreak: jest.fn(),
      sendNudge: jest.fn(),
      replyNudge: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StreakController],
      providers: [{ provide: StreakService, useValue: streakService }],
    }).compile();

    controller = module.get<StreakController>(StreakController);
  });

  describe('getStreak', () => {
    it('should delegate to service and wrap in envelope', async () => {
      const data = { currentStreak: 5, history: [] };
      streakService.getStreak.mockResolvedValue(data);

      const res = await controller.getStreak(mockUser);

      expect(streakService.getStreak).toHaveBeenCalledWith('user-1');
      expect(res).toEqual({ message: 'Data streak berhasil diambil', data });
    });
  });

  describe('triggerStreak', () => {
    it('should delegate to streakService.triggerStreak', async () => {
      const data = { message: 'Senggolan terkirim', status: 'WAITING_PARTNER' };
      streakService.triggerStreak.mockResolvedValue(data);

      const res = await controller.triggerStreak(mockUser);

      expect(streakService.triggerStreak).toHaveBeenCalledWith('user-1');
      expect(res).toEqual({ message: 'Senggolan terkirim', data });
    });
  });

  describe('sendNudge', () => {
    it('should delegate to streakService.sendNudge', async () => {
      const data = { message: 'Senggolan terkirim', status: 'WAITING_PARTNER' };
      streakService.sendNudge.mockResolvedValue(data);

      const res = await controller.sendNudge(mockUser);

      expect(streakService.sendNudge).toHaveBeenCalledWith('user-1');
      expect(res).toEqual({ message: 'Senggolan terkirim', data });
    });
  });

  describe('replyNudge', () => {
    it('should delegate to streakService.replyNudge', async () => {
      const data = { message: 'Senggolan dibalas', status: 'COMPLETED', currentStreak: 6 };
      streakService.replyNudge.mockResolvedValue(data);

      const res = await controller.replyNudge(mockUser);

      expect(streakService.replyNudge).toHaveBeenCalledWith('user-1');
      expect(res).toEqual({ message: 'Senggolan dibalas', data });
    });
  });
});