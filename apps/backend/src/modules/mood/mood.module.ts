import { Module } from '@nestjs/common';
import { MoodService } from './mood.service';
import { MoodController } from './mood.controller';
import { StreakModule } from '../streak';

@Module({
  imports: [StreakModule],
  providers: [MoodService],
  controllers: [MoodController],
  exports: [MoodService],
})
export class MoodModule {}