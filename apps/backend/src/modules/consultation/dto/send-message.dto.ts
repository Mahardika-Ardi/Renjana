import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'Pesan kelanjutan atau tanggapan user untuk konselor hubungan AI',
    example: 'Tadi aku coba tanya baik-baik, tapi dia malah diam dan menghela nafas panjang...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Isi pesan tidak boleh kosong' })
  @MaxLength(2000, { message: 'Pesan tidak boleh melebihi 2000 karakter' })
  content: string;
}
