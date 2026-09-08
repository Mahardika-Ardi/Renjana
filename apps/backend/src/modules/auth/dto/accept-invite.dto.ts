import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AcceptInviteDto {
  @ApiProperty({
    description: 'Token tautan undangan (URL-based single-use, 24 jam)',
    example: 'f30bac92d2154a6aa9aa9392a0fcd81153e8086f254f4b1697edaf47fb842344',
  })
  @IsString({ message: 'Token undangan harus berupa string' })
  @IsNotEmpty({ message: 'Token undangan tidak boleh kosong' })
  token!: string;

  @ApiPropertyOptional({
    description: 'Email akun (opsional jika belum login)',
    example: 'partner@email.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Password akun (opsional jika belum login)',
    example: 'Partner1234!',
  })
  @IsOptional()
  @IsString()
  password?: string;
}
