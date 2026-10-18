import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  /**
   * Upload user avatar to Cloudinary with automatic face cropping and webp optimization
   * @param userId - ID of the user uploading the avatar
   * @param file - File object containing buffer, mimetype, and originalname
   * @returns Public secure URL of the uploaded image
   */
  async uploadAvatar(
    userId: string,
    file: { buffer: Buffer; mimetype: string; originalname?: string },
  ): Promise<string> {
    if (!file || !file.buffer) {
      throw new BadRequestException('File avatar tidak ditemukan');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.',
      );
    }

    // Max 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.buffer.length > maxSize) {
      throw new BadRequestException('Ukuran file maksimal 5MB');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'renjana/avatars',
          public_id: `user_${userId}`,
          overwrite: true,
          invalidate: true,
          resource_type: 'image',
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            this.logger.error(
              `Gagal upload avatar ke Cloudinary: ${error?.message || 'Unknown error'}`,
            );
            return reject(
              new InternalServerErrorException(
                `Gagal upload file avatar: ${error?.message || 'Terjadi kesalahan sistem'}`,
              ),
            );
          }

          this.logger.log(
            `Avatar berhasil diunggah ke Cloudinary untuk user ${userId}: ${result.secure_url}`,
          );
          resolve(result.secure_url);
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Delete user avatar from Cloudinary
   * @param userId - ID of the user whose avatar is to be deleted
   */
  async deleteAvatar(userId: string): Promise<boolean> {
    if (!userId) return false;
    try {
      const publicId = `renjana/avatars/user_${userId}`;
      const result = await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
      });
      this.logger.log(
        `Penghapusan avatar Cloudinary untuk user ${userId}: ${result.result}`,
      );
      return result.result === 'ok';
    } catch (err: any) {
      this.logger.warn(
        `Gagal menghapus avatar dari Cloudinary untuk user ${userId}: ${err.message}`,
      );
      return false;
    }
  }
}
