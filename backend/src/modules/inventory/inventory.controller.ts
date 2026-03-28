import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('projects/:projectId/inventory')
  @ApiOperation({ summary: 'Get inventory items for a project' })
  findByProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
  ) {
    return this.inventoryService.findByProject(projectId, user.id, user.role);
  }

  @Get('projects/:projectId/inventory/movements')
  @ApiOperation({ summary: 'Get stock movements for a project' })
  getMovements(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
  ) {
    return this.inventoryService.getMovements(projectId, user.id, user.role);
  }

  @Get('inventory/global')
  @ApiOperation({ summary: 'Get all inventory across accessible projects' })
  findGlobalInventory(@CurrentUser() user: User) {
    return this.inventoryService.findGlobalInventory(user.id, user.role);
  }

  @Post('projects/:projectId/inventory/adjust')
  @ApiOperation({ summary: 'Adjust inventory for a project' })
  adjust(
    @Param('projectId') projectId: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser() user: User,
  ) {
    return this.inventoryService.adjust(projectId, dto, user.id, user.role);
  }
}
