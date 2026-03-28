import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from '../projects/projects.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { SupplierInvoice } from './entities/supplier-invoice.entity';
import { SupplierInvoicesController } from './supplier-invoices.controller';
import { SupplierInvoicesService } from './supplier-invoices.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupplierInvoice, PurchaseOrder]),
    ProjectsModule,
    AuditLogsModule,
  ],
  controllers: [SupplierInvoicesController],
  providers: [SupplierInvoicesService],
  exports: [SupplierInvoicesService],
})
export class SupplierInvoicesModule {}
