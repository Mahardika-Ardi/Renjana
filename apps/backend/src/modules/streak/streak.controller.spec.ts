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
});