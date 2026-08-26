import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHabitTemplateDto {
  @ApiProperty({ description: 'Nama habit', example: 'Minum air putih pagi' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Emoji untuk habit', example: '💧' })
  @IsOptional()
  @IsString()
  emoji?: string;

  @ApiPropertyOptional({
    description: 'Aktif atau tidak',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Urutan tampilan', default: 0, example: 1 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateHabitTemplateDto {
  @ApiPropertyOptional({ description: 'Nama habit baru' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Emoji baru' })
  @IsOptional()
  @IsString()
  emoji?: string;

  @ApiPropertyOptional({ description: 'Aktif atau tidak baru' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Urutan tampilan baru' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateHabitLogDto {
  @ApiProperty({
    description: 'ID habit template',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  habitTemplateId: string;

  @ApiProperty({
    description: 'Tanggal log (YYYY-MM-DD)',
    example: '2026-08-19',
  })
  @IsString()
  logDate: string;

  @ApiPropertyOptional({
    description: 'Sudah selesai (true) atau belum (false)',
    default: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}

export class UpdateHabitLogDto {
  @ApiPropertyOptional({ description: 'Status completion baru' })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}