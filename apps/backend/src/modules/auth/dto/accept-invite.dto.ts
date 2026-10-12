import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInviteDto {
  @ApiProperty({
    description: 'Token/code undangan atau full URL undangan dari dashboard',
    example: 'f30bac92d2154a6aa9aa9392a0fcd81153e8086f254f4b1697edaf47fb842344',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token undangan tidak boleh kosong' })
  token: string;
}
