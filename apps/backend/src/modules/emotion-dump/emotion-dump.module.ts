import { Module } from '@nestjs/common';
import { EmotionDumpService } from './emotion-dump.service';
import { EmotionDumpController } from './emotion-dump.controller';
import { EmotionDumpCronService } from './emotion-dump.cron';
import { StreakModule } from '../streak';

@Module({
  imports: [StreakModule],
  controllers: [EmotionDumpController],
  providers: [EmotionDumpService, EmotionDumpCronService],
  exports: [EmotionDumpService],
})
export class EmotionDumpModule {}
