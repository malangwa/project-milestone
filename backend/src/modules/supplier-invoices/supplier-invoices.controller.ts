import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateSupplierInvoiceDto } from './dto/create-supplier-invoice.dto';
import { SupplierInvoicesService } from './supplier-invoices.service';

@ApiTags('supplier-invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SupplierInvoicesController {
  constructor(
    private readonly supplierInvoicesService: SupplierInvoicesService,
  ) {}

  @Get('purchase-orders/:purchaseOrderId/invoices')
  @ApiOperation({ summary: 'Get invoices for a purchase order' })
  findByPurchaseOrder(
    @Param('purchaseOrderId') purchaseOrderId: string,
    @CurrentUser() user: User,
  ) {
    return this.supplierInvoicesService.findByPurchaseOrder(
      purchaseOrderId,
      user.id,
      user.role,
    );
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by id' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.supplierInvoicesService.findOne(id, user.id, user.role);
  }

  @Post('purchase-orders/:purchaseOrderId/invoices')
  @ApiOperation({ summary: 'Create invoice for purchase order' })
  create(
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Body() dto: CreateSupplierInvoiceDto,
    @CurrentUser() user: User,
  ) {
    return this.supplierInvoicesService.create(
      purchaseOrderId,
      dto,
      user.id,
      user.role,
    );
  }

  @Patch('invoices/:id/verify')
  @ApiOperation({ summary: 'Verify invoice' })
  verify(@Param('id') id: string, @CurrentUser() user: User) {
    return this.supplierInvoicesService.verify(id, user.id, user.role);
  }

  @Patch('invoices/:id/approve')
  @ApiOperation({ summary: 'Approve invoice' })
  approve(@Param('id') id: string, @CurrentUser() user: User) {
    return this.supplierInvoicesService.approve(id, user.id, user.role);
  }

  @Patch('invoices/:id/pay')
  @ApiOperation({ summary: 'Mark invoice as paid' })
  pay(@Param('id') id: string, @CurrentUser() user: User) {
    return this.supplierInvoicesService.pay(id, user.id, user.role);
  }

  @Patch('invoices/:id/reject')
  @ApiOperation({ summary: 'Reject invoice' })
  reject(@Param('id') id: string, @CurrentUser() user: User) {
    return this.supplierInvoicesService.reject(id, user.id, user.role);
  }
}
