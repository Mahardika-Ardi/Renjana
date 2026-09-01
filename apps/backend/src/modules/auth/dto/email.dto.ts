import {
  IsEmail,
  IsString,
  Length,
  Matches,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Token verifikasi dari email',
    example: 'abc123...',
  })
  @IsString()
  @Length(32, 2048)
  token: string;
}

export class RequestResetCodeDto {
  @ApiProperty({
    example: 'budi@email.com',
    description: 'Alamat email akun pengguna',
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;
}

export class ForgotPasswordDto extends RequestResetCodeDto {}

export class VerifyResetCodeDto {
  @ApiProperty({
    example: 'budi@email.com',
    description: 'Alamat email akun pengguna',
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Kode verifikasi 6 digit yang dikirim ke email',
  })
  @IsString()
  @Length(6, 6, { message: 'Kode verifikasi harus tepat 6 digit' })
  @Matches(/^\d{6}$/, { message: 'Kode verifikasi harus berupa 6 angka' })
  code: string;
}

export class ResetPasswordFinalDto {
  @ApiProperty({
    example: 'budi@email.com',
    description: 'Alamat email akun pengguna',
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @ApiProperty({
    example: 'f47ac10b58cc4372a5670e02b2c3d479...',
    description: 'Single-use reset token dari step verify-reset-code',
  })
  @IsString()
  @IsNotEmpty({ message: 'Reset token tidak boleh kosong' })
  resetToken: string;

  @ApiProperty({
    example: 'BudiNew1234!',
    description: 'Password baru minimal 8 karakter dengan kombinasi huruf besar, kecil, dan angka',
  })
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(100, { message: 'Password maksimal 100 karakter' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password harus mengandung huruf besar, huruf kecil, dan angka',
  })
  newPassword: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token dari email / step reset password' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'BudiNew1234!' })
  @IsString()
  @Length(8, 100)
  newPassword: string;
}
