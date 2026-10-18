import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: any;

  const mockUser = { id: 'user-123', email: 'test@renjana.test' };

  beforeEach(async () => {
    service = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      uploadAvatar: jest.fn(),
      deleteAvatar: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should get profile', async () => {
    const mockProfile = { id: 'user-123', name: 'User Test' };
    service.getProfile.mockResolvedValue(mockProfile);

    const result = await controller.getProfile(mockUser);
    expect(service.getProfile).toHaveBeenCalledWith('user-123');
    expect(result.data).toEqual(mockProfile);
  });

  it('should update profile', async () => {
    const dto = { name: 'New Name' };
    const mockUpdated = { id: 'user-123', name: 'New Name' };
    service.updateProfile.mockResolvedValue(mockUpdated);

    const result = await controller.updateProfile(mockUser, dto);
    expect(service.updateProfile).toHaveBeenCalledWith('user-123', dto);
    expect(result.data).toEqual(mockUpdated);
  });

  it('should upload avatar', async () => {
    const file = { buffer: Buffer.from('img'), mimetype: 'image/png' } as any;
    const mockResult = { id: 'user-123', avatarUrl: 'https://cloudinary.com/url.webp' };
    service.uploadAvatar.mockResolvedValue(mockResult);

    const result = await controller.uploadAvatar(mockUser, file);
    expect(service.uploadAvatar).toHaveBeenCalledWith('user-123', file);
    expect(result.data).toEqual(mockResult);
  });

  it('should delete avatar', async () => {
    const mockResult = { id: 'user-123', avatarUrl: null };
    service.deleteAvatar.mockResolvedValue(mockResult);

    const result = await controller.deleteAvatar(mockUser);
    expect(service.deleteAvatar).toHaveBeenCalledWith('user-123');
    expect(result.data).toEqual(mockResult);
  });
});
