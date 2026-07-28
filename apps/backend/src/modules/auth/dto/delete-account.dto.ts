import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Password user untuk verifikasi keamanan sebelum hapus akun',
    example: 'Password123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi untuk mengonfirmasi penghapusan akun' })
  password: string;

  @ApiPropertyOptional({
    description: 'Alasan penghapusan akun (opsional untuk feedback)',
    example: 'Ingin istirahat dari aplikasi',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
