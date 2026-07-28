import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly AVATAR_BUCKET = 'avatars';

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Upload user avatar image to Supabase Storage ('avatars' bucket)
   * @param userId - ID user pemilik avatar
   * @param file - File image dari Express/Multer
   * @returns Public URL dari avatar yang terupload
   */
  async uploadAvatar(
    userId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ): Promise<string> {
    if (!file || !file.buffer) {
      throw new BadRequestException('File avatar tidak ditemukan');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.',
      );
    }

    // Limit size 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.buffer.length > maxSize) {
      throw new BadRequestException('Ukuran file maksimal 5MB');
    }

    const fileExt = file.originalname.split('.').pop() || 'jpg';
    const filePath = `user-${userId}/${uuidv4()}.${fileExt}`;

    const adminClient = this.supabaseService.getAdminClient();

    // Ensure bucket exists
    await this.ensureBucket(this.AVATAR_BUCKET);

    const { data, error } = await adminClient.storage
      .from(this.AVATAR_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Gagal upload avatar ke Supabase: ${error.message}`, error);
      throw new InternalServerErrorException(
        `Gagal upload file avatar: ${error.message}`,
      );
    }

    const { data: publicUrlData } = adminClient.storage
      .from(this.AVATAR_BUCKET)
      .getPublicUrl(data.path);

    this.logger.log(`Avatar berhasil diupload untuk user ${userId}: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  }

  /**
   * Delete file avatar dari Supabase Storage
   * @param fileUrlOrPath - Full public URL atau path relatif file
   */
  async deleteAvatar(fileUrlOrPath: string): Promise<boolean> {
    if (!fileUrlOrPath) return false;

    const path = this.extractPathFromUrl(fileUrlOrPath, this.AVATAR_BUCKET);
    if (!path) return false;

    const adminClient = this.supabaseService.getAdminClient();
    const { error } = await adminClient.storage
      .from(this.AVATAR_BUCKET)
      .remove([path]);

    if (error) {
      this.logger.error(`Gagal hapus avatar ${path}: ${error.message}`);
      return false;
    }

    return true;
  }

  /**
   * Ensure a Supabase storage bucket exists and is public
   */
  async ensureBucket(bucketName: string): Promise<void> {
    const adminClient = this.supabaseService.getAdminClient();

    try {
      const { data: bucket, error: getError } = await adminClient.storage.getBucket(bucketName);

      if (getError || !bucket) {
        this.logger.log(`Membuat bucket Supabase Storage: '${bucketName}'...`);
        await adminClient.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        });
      }
    } catch (err: any) {
      this.logger.warn(`Could not verify/create bucket ${bucketName}: ${err.message}`);
    }
  }

  /**
   * Extract relative path from a full Supabase storage URL
   */
  private extractPathFromUrl(url: string, bucket: string): string | null {
    if (!url) return null;
    const bucketMarker = `/storage/v1/object/public/${bucket}/`;
    const index = url.indexOf(bucketMarker);
    if (index !== -1) {
      return url.substring(index + bucketMarker.length);
    }
    return url; // fallback if already a relative path
  }
}
