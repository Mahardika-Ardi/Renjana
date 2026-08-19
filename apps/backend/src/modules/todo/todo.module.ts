import { Module } from '@nestjs/common';
import { TodoService } from './todo.service';
import { TodoController } from './todo.controller';
import { AuthModule } from '../auth';
import { StreakModule } from '../streak';

@Module({
  imports: [AuthModule, StreakModule],
  controllers: [TodoController],
  providers: [TodoService],
  exports: [TodoService],
})
export class TodoModule {}
