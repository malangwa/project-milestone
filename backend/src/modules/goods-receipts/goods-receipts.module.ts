import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from '../projects/projects.module';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { MaterialRequest } from '../material-requests/entities/material-request.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { GoodsReceipt } from './entities/goods-receipt.entity';
import { GoodsReceiptItem } from './entities/goods-receipt-item.entity';
import { GoodsReceiptsController } from './goods-receipts.controller';
import { GoodsReceiptsService } from './goods-receipts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GoodsReceipt,
      GoodsReceiptItem,
      PurchaseOrder,
      MaterialRequest,
    ]),
    ProjectsModule,
    InventoryModule,
  ],
  controllers: [GoodsReceiptsController],
  providers: [GoodsReceiptsService],
  exports: [GoodsReceiptsService],
})
export class GoodsReceiptsModule {}
