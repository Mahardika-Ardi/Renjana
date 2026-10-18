import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateConsultationDto {
  @ApiProperty({
    description: 'Pesan curhat atau pertanyaan awal kepada konselor hubungan AI',
    example: 'Kok hari ini pasanganku kelihatan bad mood dan cuek ya? Aku harus bagaimana?',
  })
  @IsString()
  @IsNotEmpty({ message: 'Pesan konsultasi tidak boleh kosong' })
  @MaxLength(2000, { message: 'Pesan tidak boleh melebihi 2000 karakter' })
  firstMessage: string;

  @ApiPropertyOptional({
    description: 'Judul sesi konsultasi (opsional, jika kosong akan digenerate otomatis)',
    example: 'Pasangan Bad Mood Hari Ini',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Judul tidak boleh melebihi 100 karakter' })
  title?: string;
}
