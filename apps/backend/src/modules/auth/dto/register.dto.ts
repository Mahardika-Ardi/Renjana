import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Budi Santoso', description: 'Nama lengkap' })
  @IsString()
  @MinLength(2, { message: 'Nama minimal 2 karakter' })
  @MaxLength(100, { message: 'Nama maksimal 100 karakter' })
  name: string;

  @ApiProperty({ example: 'budi@email.com', description: 'Alamat email' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @ApiProperty({
    example: 'Budi1234!',
    description: 'Password min 8 karakter, harus ada huruf besar, kecil, dan angka',
  })
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(100, { message: 'Password maksimal 100 karakter' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password harus mengandung huruf besar, huruf kecil, dan angka',
  })
  password: string;

  @ApiPropertyOptional({
    example: 'd9b2d8a5f4c34821a8f9c1e2d3b4a5f6',
    description: 'Token tautan undangan dari partner (URL-based single-use)',
  })
  @IsOptional()
  @IsString()
  inviteToken?: string;
}
