import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { StockItem } from '../inventory/entities/stock-item.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';
import { AiAgentModule } from '../ai-agent/ai-agent.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task, StockItem, StockMovement]), AiAgentModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
