import { Module } from '@nestjs/common';
import { HabitService } from './habit.service';
import { HabitController } from './habit.controller';
import { StreakModule } from '../streak';

@Module({
  imports: [StreakModule],
  providers: [HabitService],
  controllers: [HabitController],
  exports: [HabitService],
})
export class HabitModule {}