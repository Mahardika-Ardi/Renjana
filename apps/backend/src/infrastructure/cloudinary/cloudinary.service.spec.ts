import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudinaryService],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
    jest.clearAllMocks();
  });

  describe('uploadAvatar', () => {
    it('should throw BadRequestException if file is missing or buffer is empty', async () => {
      await expect(
        service.uploadAvatar('user-1', null as any),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.uploadAvatar('user-1', { buffer: null } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if file format is unsupported', async () => {
      await expect(
        service.uploadAvatar('user-1', {
          buffer: Buffer.from('test'),
          mimetype: 'application/pdf',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if file size exceeds 5MB', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
      await expect(
        service.uploadAvatar('user-1', {
          buffer: largeBuffer,
          mimetype: 'image/jpeg',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully upload avatar and return secure_url', async () => {
      const mockResult = {
        secure_url: 'https://res.cloudinary.com/dyfx8cxx9/image/upload/v123/renjana/avatars/user_user-1.webp',
      };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          // Return a writable mock stream
          const { Writable } = require('stream');
          const stream = new Writable({
            write(chunk, encoding, next) {
              next();
            },
          });
          stream.on('finish', () => {
            callback(null, mockResult);
          });
          return stream;
        },
      );

      const file = {
        buffer: Buffer.from('fake-image-bytes'),
        mimetype: 'image/png',
        originalname: 'test.png',
      };

      const result = await service.uploadAvatar('user-1', file);
      expect(result).toBe(mockResult.secure_url);
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'renjana/avatars',
          public_id: 'user_user-1',
          overwrite: true,
          invalidate: true,
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        }),
        expect.any(Function),
      );
    });

    it('should throw InternalServerErrorException if cloudinary upload fails', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          const { Writable } = require('stream');
          const stream = new Writable({
            write(chunk, encoding, next) {
              next();
            },
          });
          stream.on('finish', () => {
            callback(new Error('Cloudinary API error'), null);
          });
          return stream;
        },
      );

      const file = {
        buffer: Buffer.from('fake-image-bytes'),
        mimetype: 'image/jpeg',
      };

      await expect(service.uploadAvatar('user-1', file)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('deleteAvatar', () => {
    it('should return false if userId is empty', async () => {
      const result = await service.deleteAvatar('');
      expect(result).toBe(false);
    });

    it('should call cloudinary.uploader.destroy with public_id and return true on success', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'ok',
      });

      const result = await service.deleteAvatar('user-1');
      expect(result).toBe(true);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        'renjana/avatars/user_user-1',
        { invalidate: true },
      );
    });

    it('should return false if cloudinary destroy fails or errors', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(
        new Error('Network error'),
      );

      const result = await service.deleteAvatar('user-1');
      expect(result).toBe(false);
    });
  });
});
