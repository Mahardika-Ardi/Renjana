import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Token verifikasi dari email', example: 'abc123...' })
  @IsString()
  @Length(32, 128)
  token: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'budi@email.com' })
  @IsString()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token dari email reset password' })
  @IsString()
  @Length(32, 128)
  token: string;

  @ApiProperty({ example: 'BudiNew1234!' })
  @IsString()
  @Length(8, 100)
  newPassword: string;
}
