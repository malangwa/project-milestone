import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from '../projects/projects.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { MaterialRequestsController } from './material-requests.controller';
import { MaterialRequestsService } from './material-requests.service';
import { MaterialRequest } from './entities/material-request.entity';
import { MaterialRequestItem } from './entities/material-request-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MaterialRequest, MaterialRequestItem]),
    ProjectsModule,
    AuditLogsModule,
  ],
  controllers: [MaterialRequestsController],
  providers: [MaterialRequestsService],
  exports: [MaterialRequestsService],
})
export class MaterialRequestsModule {}
