import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
  IsDateString,
} from 'class-validator';

// Explicit optional fields with NO defaults. UpdateJournalDto must never
// inject `isShared: false` for payloads that omit it — otherwise every
// content-only PATCH would silently unshare the entry (see updateForUser).
export class UpdateJournalDto {
  @ApiPropertyOptional({
    description: 'Isi utama jurnal pribadi',
    example:
      'Hari ini merasa bersyukur bisa diskusi terbuka dengan pasangan...',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Isi jurnal tidak boleh kosong' })
  content?: string;

  @ApiPropertyOptional({
    description: 'Tag atau kategori jurnal',
    example: ['gratitude', 'reflection'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Tanggal jurnal (format YYYY-MM-DD)',
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
  isShared?: boolean;
}
