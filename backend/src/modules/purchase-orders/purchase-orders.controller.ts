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
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

@ApiTags('purchase-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get('projects/:projectId/purchase-orders')
  @ApiOperation({ summary: 'Get purchase orders for a project' })
  findByProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
  ) {
    return this.purchaseOrdersService.findByProject(
      projectId,
      user.id,
      user.role,
    );
  }

  @Get('purchase-orders/:id')
  @ApiOperation({ summary: 'Get a purchase order' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.purchaseOrdersService.findOne(id, user.id, user.role);
  }

  @Post('projects/:projectId/purchase-orders')
  @ApiOperation({ summary: 'Create a purchase order for a project' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser() user: User,
  ) {
    return this.purchaseOrdersService.create(
      projectId,
      dto,
      user.id,
      user.role,
    );
  }

  @Patch('purchase-orders/:id/approve')
  @ApiOperation({ summary: 'Approve a purchase order' })
  approve(@Param('id') id: string, @CurrentUser() user: User) {
    return this.purchaseOrdersService.approve(id, user.id, user.role);
  }

  @Patch('purchase-orders/:id/send')
  @ApiOperation({ summary: 'Send a purchase order to a supplier' })
  send(@Param('id') id: string, @CurrentUser() user: User) {
    return this.purchaseOrdersService.send(id, user.id, user.role);
  }

  @Patch('purchase-orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel a purchase order' })
  cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.purchaseOrdersService.cancel(id, user.id, user.role);
  }
}
