import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { TodoCategory } from '@prisma/client';

export class CreateTodoDto {
  @ApiProperty({
    description: 'Judul tugas bersama pasangan',
    example: 'Beli bahan makanan untuk kencan masak malam ini',
  })
  @IsString()
  @IsNotEmpty({ message: 'Judul tugas tidak boleh kosong' })
  title: string;

  @ApiPropertyOptional({
    description: 'Deskripsi tambahan tugas',
    example: 'Pasar segar / supermarket terdekat',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Kategori tugas',
    enum: TodoCategory,
    default: TodoCategory.OTHER,
  })
  @IsOptional()
  @IsEnum(TodoCategory, { message: 'Kategori tugas tidak valid' })
  category?: TodoCategory = TodoCategory.OTHER;

  @ApiPropertyOptional({
    description: 'Tenggat waktu pengerjaan (format YYYY-MM-DD)',
    example: '2026-08-10',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Format dueDate harus tanggal YYYY-MM-DD' })
  dueDate?: string;
}
