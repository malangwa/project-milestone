import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { Expense } from './entities/expense.entity';
import { Project } from '../projects/entities/project.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AiAgentModule } from '../ai-agent/ai-agent.module';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, Project]), AuditLogsModule, AiAgentModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
