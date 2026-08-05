import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateJournalDto {
  @ApiProperty({
    description: 'Isi utama jurnal pribadi',
    example: 'Hari ini merasa bersyukur bisa diskusi terbuka dengan pasangan...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Isi jurnal tidak boleh kosong' })
  content: string;

  @ApiPropertyOptional({
    description: 'Tag atau kategori jurnal',
    example: ['gratitude', 'reflection'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Tanggal jurnal (format YYYY-MM-DD, default hari ini)',
    example: '2026-08-05',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Format entryDate harus tanggal YYYY-MM-DD' })
  entryDate?: string;

  @ApiPropertyOptional({
    description: 'Apakah jurnal ini dibagikan ke pasangan (shared)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isShared?: boolean = false;
}
