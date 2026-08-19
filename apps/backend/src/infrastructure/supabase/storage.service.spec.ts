import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { StorageService } from './storage.service';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid', () => ({ v4: jest.fn() }));

describe('StorageService', () => {
  let service: StorageService;
  let supabaseService: any;
  let adminClient: any;

  const validFile = {
    buffer: Buffer.from('image-bytes'),
    mimetype: 'image/jpeg',
    originalname: 'profile.jpg',
  };

  beforeEach(() => {
    (uuidv4 as jest.Mock).mockReturnValue('uuid-1');

    adminClient = {
      storage: {
        from: jest.fn().mockReturnThis(),
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
        getBucket: jest.fn(),
        createBucket: jest.fn(),
      },
    };
adminClient.storage.upload.mockResolvedValue({
      data: { path: 'user-user-1/uuid-1.jpg' },
      error: null,
    });
    adminClient.storage.getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://cdn.supabase.co/avatars/user-1/uuid-1.jpg' },
    });

    supabaseService = {
      getAdminClient: jest.fn().mockReturnValue(adminClient),
    };

    service = new StorageService(supabaseService);
  });

  describe('uploadAvatar', () => {
    it('should throw BadRequest when file missing', async () => {
      await expect(
        service.uploadAvatar('user-1', undefined as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequest for unsupported mimetype', async () => {
      await expect(
        service.uploadAvatar('user-1', { ...validFile, mimetype: 'text/plain' }),
      ).rejects.toThrow(BadRequestException);
      expect(adminClient.storage.upload).not.toHaveBeenCalled();
    });

    it('should throw BadRequest when file too large', async () => {
      const oversized = {
        ...validFile,
        buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
      };
      await expect(service.uploadAvatar('user-1', oversized)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should upload and return public URL on success', async () => {
      adminClient.storage.getBucket.mockResolvedValue({ data: { id: 'avatars' }, error: null });

      const url = await service.uploadAvatar('user-1', validFile);

      expect(adminClient.storage.from).toHaveBeenCalledWith('avatars');
      expect(adminClient.storage.upload).toHaveBeenCalledWith(
        'user-user-1/uuid-1.jpg',
        validFile.buffer,
        { contentType: 'image/jpeg', upsert: true },
      );
      expect(adminClient.storage.getPublicUrl).toHaveBeenCalledWith('user-user-1/uuid-1.jpg');
      expect(url).toBe('https://cdn.supabase.co/avatars/user-1/uuid-1.jpg');
    });

    it('should throw InternalServerError when upload fails', async () => {
      adminClient.storage.upload.mockResolvedValue({
        data: null,
        error: new Error('storage full'),
      });

      await expect(service.uploadAvatar('user-1', validFile)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('deleteAvatar', () => {
    it('should return false when path/url empty', async () => {
      const result = await service.deleteAvatar('');
      expect(result).toBe(false);
    });

    it('should extract path from public URL and remove file', async () => {
      adminClient.storage.remove.mockResolvedValue({ error: null });

      const result = await service.deleteAvatar(
        'https://cdn.supabase.co/storage/v1/object/public/avatars/user-1/uuid-1.jpg',
      );

expect(adminClient.storage.remove).toHaveBeenCalledWith(['user-1/uuid-1.jpg']);
      expect(result).toBe(true);
    });

    it('should handle relative path as-is', async () => {
      adminClient.storage.remove.mockResolvedValue({ error: null });

      const result = await service.deleteAvatar('user-user-1/uuid-1.jpg');

      expect(adminClient.storage.remove).toHaveBeenCalledWith(['user-user-1/uuid-1.jpg']);
      expect(result).toBe(true);
    });

    it('should return false when removal fails', async () => {
      adminClient.storage.remove.mockResolvedValue({ error: new Error('gone') });

      const result = await service.deleteAvatar('user-user-1/uuid-1.jpg');

      expect(result).toBe(false);
    });
  });

  describe('ensureBucket', () => {
    it('should create bucket when missing', async () => {
      adminClient.storage.getBucket.mockResolvedValue({ data: null, error: new Error('not found') });
      adminClient.storage.createBucket.mockResolvedValue({});

      await service.ensureBucket('avatars');

      expect(adminClient.storage.createBucket).toHaveBeenCalledWith(
        'avatars',
        expect.objectContaining({ public: true, fileSizeLimit: 5242880 }),
      );
    });

    it('should not create bucket when it exists', async () => {
      adminClient.storage.getBucket.mockResolvedValue({ data: { id: 'avatars' }, error: null });

      await service.ensureBucket('avatars');

      expect(adminClient.storage.createBucket).not.toHaveBeenCalled();
    });

    it('should catch errors gracefully', async () => {
      adminClient.storage.getBucket.mockRejectedValue(new Error('network'));

      await expect(service.ensureBucket('avatars')).resolves.not.toThrow();
    });
  });
});
