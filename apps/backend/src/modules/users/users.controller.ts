import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../../shared/decorators';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Ambil profil lengkap user saat ini' })
  @ApiResponse({ status: 200, description: 'Profil pengguna berhasil diambil' })
  async getProfile(@CurrentUser() user: any) {
    const data = await this.usersService.getProfile(user.id);
    return {
      message: 'Profil pengguna berhasil diambil',
      data,
    };
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Perbarui informasi profil pengguna (nama, bio, gender, birthDate, timezone)',
  })
  @ApiResponse({ status: 200, description: 'Profil berhasil diperbarui' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfileDto,
  ) {
    const data = await this.usersService.updateProfile(user.id, dto);
    return {
      message: 'Profil berhasil diperbarui',
      data,
    };
  }

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Unggah foto profil avatar ke Cloudinary (format: JPG, PNG, WEBP, GIF; max 5MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Berkas gambar avatar (JPG/PNG/WEBP/GIF)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar berhasil diunggah ke Cloudinary',
  })
  @ApiResponse({
    status: 400,
    description: 'File tidak valid atau format tidak didukung',
  })
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @CurrentUser() user: any,
    @UploadedFile()
    file: { buffer: Buffer; mimetype: string; originalname?: string },
  ) {
    const data = await this.usersService.uploadAvatar(user.id, file);
    return {
      message: 'Avatar berhasil diunggah ke Cloudinary',
      data,
    };
  }

  @Delete('avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hapus foto avatar profil dari Cloudinary dan database',
  })
  @ApiResponse({ status: 200, description: 'Avatar berhasil dihapus' })
  async deleteAvatar(@CurrentUser() user: any) {
    const data = await this.usersService.deleteAvatar(user.id);
    return {
      message: 'Avatar berhasil dihapus',
      data,
    };
  }
}
