import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEmotionDumpDto {
  @ApiProperty({
    description: 'Emosi mentah atau isi pikiran bebas yang dirasakan user',
    example: 'Hari ini aku merasa agak diabaikan pas lagi ngobrol tentang rencana akhir pekan...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Isi emotion dump tidak boleh kosong' })
  rawContent: string;
}
