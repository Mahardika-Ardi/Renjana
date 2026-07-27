import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum DeleteAccountMode {
  HARD = 'HARD',
  SOFT = 'SOFT',
}

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Password user untuk verifikasi keamanan sebelum hapus akun',
    example: 'Password123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi untuk mengonfirmasi penghapusan akun' })
  password: string;

  @ApiPropertyOptional({
    description: 'Mode penghapusan: HARD (hapus total permanen) atau SOFT (deaktivasi)',
    enum: DeleteAccountMode,
    default: DeleteAccountMode.HARD,
  })
  @IsOptional()
  @IsEnum(DeleteAccountMode, { message: 'Mode hapus akun harus HARD atau SOFT' })
  mode?: DeleteAccountMode = DeleteAccountMode.HARD;
}
