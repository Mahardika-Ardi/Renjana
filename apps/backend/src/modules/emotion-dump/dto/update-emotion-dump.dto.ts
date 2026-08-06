import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { EmotionDumpStatus } from '@prisma/client';

export class UpdateEmotionDumpDto {
  @ApiPropertyOptional({
    description: 'Status baru emotion dump: SHARED (bagikan ke pasangan) atau PRIVATE (kembalikan ke pribadi). Hanya boleh dari REFINED.',
    enum: [EmotionDumpStatus.SHARED, EmotionDumpStatus.PRIVATE],
    example: EmotionDumpStatus.SHARED,
  })
  @IsOptional()
  @IsEnum([EmotionDumpStatus.SHARED, EmotionDumpStatus.PRIVATE], {
    message: 'Status hanya boleh SHARED atau PRIVATE (dari REFINED)',
  })
  status?: EmotionDumpStatus;
}
