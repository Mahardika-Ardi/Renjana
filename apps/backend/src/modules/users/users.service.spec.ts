import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../database/prisma.service';
import { CloudinaryService } from '../../infrastructure/cloudinary/cloudinary.service';
import { Gender } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
  let cloudinaryService: any;

  const mockUser = {
    id: 'user-123',
    email: 'arka@renjana.test',
    name: 'Arka Dewanto',
    avatarUrl: 'https://res.cloudinary.com/dyfx8cxx9/image/upload/v1/user.jpg',
    bio: 'Menikmati hidup',
    gender: Gender.MALE,
    birthDate: new Date('1998-05-20'),
    timezone: 'Asia/Jakarta',
    isEmailVerified: true,
    createdAt: new Date(),
    coupleAsUser1: {
      id: 'couple-123',
      user2: {
        id: 'partner-456',
        name: 'Senja Kusuma',
        avatarUrl: 'https://res.cloudinary.com/dyfx8cxx9/image/upload/v1/partner.jpg',
      },
    },
    coupleAsUser2: null,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    cloudinaryService = {
      uploadAvatar: jest.fn(),
      deleteAvatar: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: CloudinaryService, useValue: cloudinaryService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('getProfile', () => {
    it('should return mapped user profile with partner info', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const profile = await service.getProfile('user-123');
      expect(profile.id).toBe('user-123');
      expect(profile.email).toBe('arka@renjana.test');
      expect(profile.couple?.partnerName).toBe('Senja Kusuma');
      expect(profile.couple?.partnerAvatarUrl).toBe(mockUser.coupleAsUser1.user2.avatarUrl);
    });

    it('should throw NotFoundException if user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user fields and return updated data', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        name: 'Arka Updated',
        bio: 'Bio Baru',
      });

      const result = await service.updateProfile('user-123', {
        name: 'Arka Updated',
        bio: 'Bio Baru',
      });

      expect(result.name).toBe('Arka Updated');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
          data: expect.objectContaining({
            name: 'Arka Updated',
            bio: 'Bio Baru',
          }),
        }),
      );
    });

    it('should throw NotFoundException if user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile('user-123', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadAvatar', () => {
    it('should call cloudinaryService.uploadAvatar and update user.avatarUrl', async () => {
      const newAvatarUrl = 'https://res.cloudinary.com/dyfx8cxx9/image/upload/v2/new.webp';
      prisma.user.findUnique.mockResolvedValue(mockUser);
      cloudinaryService.uploadAvatar.mockResolvedValue(newAvatarUrl);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        avatarUrl: newAvatarUrl,
      });

      const file = {
        buffer: Buffer.from('img'),
        mimetype: 'image/png',
        originalname: 'avatar.png',
      };

      const result = await service.uploadAvatar('user-123', file as any);

      expect(cloudinaryService.uploadAvatar).toHaveBeenCalledWith('user-123', file);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { avatarUrl: newAvatarUrl },
        select: expect.any(Object),
      });
      expect(result.avatarUrl).toBe(newAvatarUrl);
    });

    it('should throw NotFoundException if user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadAvatar('user-123', {} as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAvatar', () => {
    it('should call cloudinaryService.deleteAvatar and reset user.avatarUrl to null', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      cloudinaryService.deleteAvatar.mockResolvedValue(true);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        avatarUrl: null,
      });

      const result = await service.deleteAvatar('user-123');

      expect(cloudinaryService.deleteAvatar).toHaveBeenCalledWith('user-123');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { avatarUrl: null },
        select: expect.any(Object),
      });
      expect(result.avatarUrl).toBeNull();
    });
  });
});
