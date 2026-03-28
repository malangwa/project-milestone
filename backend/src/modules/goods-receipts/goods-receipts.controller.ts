import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import { GoodsReceiptsService } from './goods-receipts.service';

@ApiTags('goods-receipts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class GoodsReceiptsController {
  constructor(private readonly goodsReceiptsService: GoodsReceiptsService) {}

  @Get('purchase-orders/:purchaseOrderId/receipts')
  @ApiOperation({ summary: 'Get receipts for a purchase order' })
  findByPurchaseOrder(
    @Param('purchaseOrderId') purchaseOrderId: string,
    @CurrentUser() user: User,
  ) {
    return this.goodsReceiptsService.findByPurchaseOrder(
      purchaseOrderId,
      user.id,
      user.role,
    );
  }

  @Get('receipts/:id')
  @ApiOperation({ summary: 'Get receipt by id' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.goodsReceiptsService.findOne(id, user.id, user.role);
  }

  @Post('purchase-orders/:purchaseOrderId/receipts')
  @ApiOperation({ summary: 'Create a goods receipt for a purchase order' })
  create(
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Body() dto: CreateGoodsReceiptDto,
    @CurrentUser() user: User,
  ) {
    return this.goodsReceiptsService.create(
      purchaseOrderId,
      dto,
      user.id,
      user.role,
    );
  }
}
