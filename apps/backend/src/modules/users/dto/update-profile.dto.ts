import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Gender } from '@prisma/client';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Nama lengkap pengguna',
    example: 'Arka Dewanto',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Bio singkat profil',
    example: 'Menikmati setiap langkah perjalanan bersama.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Jenis kelamin',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Tanggal lahir (format YYYY-MM-DD)',
    example: '1998-05-20',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({
    description: 'Zona waktu pengguna',
    example: 'Asia/Jakarta',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;
}
