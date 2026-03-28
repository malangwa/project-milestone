import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { StockItem } from './entities/stock-item.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryGateway } from './inventory.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockItem, StockMovement]),
    ProjectsModule,
    UsersModule,
    AuditLogsModule,
    JwtModule.register({}),
  ],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryGateway],
  exports: [InventoryService],
})
export class InventoryModule {}
