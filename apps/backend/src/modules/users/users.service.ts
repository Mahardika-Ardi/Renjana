import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CloudinaryService } from '../../infrastructure/cloudinary/cloudinary.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Mengambil profil lengkap user saat ini
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        bio: true,
        gender: true,
        birthDate: true,
        timezone: true,
        isEmailVerified: true,
        createdAt: true,
        coupleAsUser1: {
          select: {
            id: true,
            user2: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        coupleAsUser2: {
          select: {
            id: true,
            user1: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    const couple = user.coupleAsUser1 || user.coupleAsUser2 || null;
    const partner = user.coupleAsUser1
      ? user.coupleAsUser1.user2
      : user.coupleAsUser2
        ? user.coupleAsUser2.user1
        : null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      gender: user.gender,
      birthDate: user.birthDate,
      timezone: user.timezone,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      couple: couple
        ? {
            id: couple.id,
            partnerId: partner?.id ?? null,
            partnerName: partner?.name ?? null,
            partnerAvatarUrl: partner?.avatarUrl ?? null,
          }
        : null,
    };
  }

  /**
   * Memperbarui informasi profil pengguna
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    const dataToUpdate: any = {};
    if (dto.name !== undefined) dataToUpdate.name = dto.name.trim();
    if (dto.bio !== undefined) dataToUpdate.bio = dto.bio?.trim() ?? null;
    if (dto.gender !== undefined) dataToUpdate.gender = dto.gender;
    if (dto.birthDate !== undefined) {
      dataToUpdate.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
    }
    if (dto.timezone !== undefined) dataToUpdate.timezone = dto.timezone.trim();

    return this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        bio: true,
        gender: true,
        birthDate: true,
        timezone: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Mengunggah avatar profil pengguna ke Cloudinary dan memperbarui URL di database
   */
  async uploadAvatar(
    userId: string,
    file: { buffer: Buffer; mimetype: string; originalname?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    // Unggah ke Cloudinary dengan optimasi otomatis WebP & crop fokus wajah
    const secureUrl = await this.cloudinaryService.uploadAvatar(userId, file);

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: secureUrl },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        bio: true,
        gender: true,
        birthDate: true,
        timezone: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Menghapus avatar profil pengguna dari Cloudinary dan mengosongkan URL di database
   */
  async deleteAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    await this.cloudinaryService.deleteAvatar(userId);

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        bio: true,
        gender: true,
        birthDate: true,
        timezone: true,
        updatedAt: true,
      },
    });
  }
}
