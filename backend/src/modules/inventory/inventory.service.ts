import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectsService } from '../projects/projects.service';
import { Project } from '../projects/entities/project.entity';
import { UserRole } from '../users/entities/user.entity';
import {
  GoodsReceipt,
  GoodsReceiptDestinationType,
} from '../goods-receipts/entities/goods-receipt.entity';
import { GoodsReceiptItem } from '../goods-receipts/entities/goods-receipt-item.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { StockItem, StockStatus } from './entities/stock-item.entity';
import {
  StockMovement,
  StockMovementType,
} from './entities/stock-movement.entity';
import { InventoryGateway } from './inventory.gateway';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(StockItem)
    private readonly stockRepo: Repository<StockItem>,
    @InjectRepository(StockMovement)
    private readonly movementsRepo: Repository<StockMovement>,
    private readonly projectsService: ProjectsService,
    private readonly auditLogsService: AuditLogsService,
    private readonly inventoryGateway: InventoryGateway,
  ) {}

  private canManageProject(
    project: Project,
    userId: string,
    role: UserRole,
  ): boolean {
    return (
      role === UserRole.ADMIN ||
      role === UserRole.MANAGER ||
      project.ownerId === userId
    );
  }

  private getStatusLabel(stockStatus: StockStatus): string {
    return stockStatus.replace(/_/g, ' ');
  }

  async findByProject(
    projectId: string,
    userId: string,
    role: UserRole,
  ): Promise<StockItem[]> {
    await this.projectsService.findOne(projectId, userId, role);
    return this.stockRepo.find({
      where: { projectId },
      order: { name: 'ASC' },
    });
  }

  async getMovements(
    projectId: string,
    userId: string,
    role: UserRole,
  ): Promise<StockMovement[]> {
    await this.projectsService.findOne(projectId, userId, role);
    return this.movementsRepo
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.stockItem', 'stockItem')
      .where('stockItem.projectId = :projectId', { projectId })
      .orderBy('movement.createdAt', 'DESC')
      .take(100)
      .getMany();
  }

  async findGlobalInventory(
    userId: string,
    role: UserRole,
  ): Promise<{
    items: (StockItem & { projectName: string })[];
    projects: { id: string; name: string }[];
  }> {
    const projects = await this.projectsService.findAll(userId, role);

    if (projects.length === 0) {
      return { items: [], projects: [] };
    }

    const projectMap = new Map(projects.map((p) => [p.id, p.name]));

    const items = await this.stockRepo
      .createQueryBuilder('stockItem')
      .where('stockItem.projectId IN (:...projectIds)', {
        projectIds: projects.map((p) => p.id),
      })
      .orderBy('stockItem.name', 'ASC')
      .getMany();

    const itemsWithProjectName = items.map((item) => ({
      ...item,
      projectName: projectMap.get(item.projectId) || 'Unknown Project',
    }));

    return {
      items: itemsWithProjectName,
      projects: projects.map((p) => ({ id: p.id, name: p.name })),
    };
  }

  async adjust(
    projectId: string,
    dto: AdjustStockDto,
    userId: string,
    role: UserRole,
  ): Promise<StockItem> {
    const project = await this.projectsService.findOne(projectId, userId, role);
    if (!this.canManageProject(project, userId, role)) {
      throw new ForbiddenException('Not authorized to adjust stock');
    }

    const quantity = Number(dto.quantity);
    const existingStock = (await this.stockRepo.findOne({
      where: { projectId, name: dto.name.trim(), unit: dto.unit.trim() },
    })) as unknown as StockItem | null;
    const stock =
      existingStock ??
      ({
        projectId,
        name: dto.name.trim(),
        unit: dto.unit.trim(),
        currentQuantity: 0,
        reorderLevel: Number(dto.reorderLevel ?? 0),
        location: dto.location?.trim() || null,
        stockStatus: StockStatus.AVAILABLE_IN_STORE,
        allocationTarget: null,
        notes: dto.notes?.trim() || null,
      } as StockItem);

    const oldQuantity = Number(stock.currentQuantity);
    stock.currentQuantity = Number(stock.currentQuantity) + quantity;

    if (dto.reorderLevel !== undefined) {
      stock.reorderLevel = Number(dto.reorderLevel);
    }
    if (dto.location !== undefined) {
      stock.location = dto.location?.trim() || null;
    }
    if (dto.notes !== undefined) {
      stock.notes = dto.notes?.trim() || null;
    }
    if (!stock.stockStatus) {
      stock.stockStatus = StockStatus.AVAILABLE_IN_STORE;
    }
    if (stock.stockStatus === StockStatus.AVAILABLE_IN_STORE) {
      stock.allocationTarget = null;
    }

    const saved = await this.stockRepo.save(stock as unknown as StockItem);
    const movement = await this.movementsRepo.save(
      this.movementsRepo.create({
        stockItemId: saved.id,
        type: StockMovementType.ADJUSTMENT,
        quantity,
        referenceType: 'manual_adjustment',
        referenceId: null,
        notes: dto.notes?.trim() || null,
        createdById: userId,
      } as any) as any,
    );

    // Emit WebSocket events
    this.inventoryGateway.broadcastInventoryUpdate(projectId, {
      type: 'stock_adjustment',
      item: saved,
      movement,
      oldQuantity,
      newQuantity: stock.currentQuantity,
      projectId,
    });

    // Check for low stock alert
    if (stock.currentQuantity <= stock.reorderLevel) {
      this.inventoryGateway.broadcastLowStockAlert({
        type: 'low_stock',
        item: saved,
        projectId,
        currentQuantity: stock.currentQuantity,
        reorderLevel: stock.reorderLevel,
      });
    }

    await this.auditLogsService.log({
      userId,
      action: 'adjust',
      entityType: 'stock_item',
      entityId: saved.id,
      before: {
        projectId,
        name: saved.name,
        unit: saved.unit,
        currentQuantity: oldQuantity,
      },
      after: {
        projectId,
        name: saved.name,
        unit: saved.unit,
        currentQuantity: saved.currentQuantity,
        reorderLevel: saved.reorderLevel,
        stockStatus: saved.stockStatus,
        allocationTarget: saved.allocationTarget,
        location: saved.location,
        notes: saved.notes,
      },
    });

    return saved;
  }

  async transfer(
    projectId: string,
    stockItemId: string,
    dto: TransferStockDto,
    userId: string,
    role: UserRole,
  ): Promise<StockItem> {
    const project = await this.projectsService.findOne(projectId, userId, role);
    if (!this.canManageProject(project, userId, role)) {
      throw new ForbiddenException('Not authorized to transfer stock');
    }

    const stock = await this.stockRepo.findOne({
      where: { id: stockItemId, projectId },
    });
    if (!stock) {
      throw new NotFoundException('Stock item not found');
    }

    const before = {
      stockStatus: stock.stockStatus,
      location: stock.location,
      allocationTarget: stock.allocationTarget,
    };

    stock.stockStatus = dto.stockStatus;
    stock.location = dto.location?.trim() || null;
    stock.allocationTarget =
      dto.stockStatus === StockStatus.AVAILABLE_IN_STORE
        ? null
        : dto.allocationTarget?.trim() || null;
    if (dto.notes !== undefined) {
      stock.notes = dto.notes?.trim() || null;
    }

    const saved = await this.stockRepo.save(stock);
    const movement = await this.movementsRepo.save(
      this.movementsRepo.create({
        stockItemId: saved.id,
        type: StockMovementType.TRANSFER,
        quantity: 0,
        referenceType: 'stock_transfer',
        referenceId: null,
        notes:
          dto.notes?.trim() ||
          `Moved to ${this.getStatusLabel(saved.stockStatus)}${
            saved.location ? ` (${saved.location})` : ''
          }`,
        createdById: userId,
      } as any) as any,
    );

    this.inventoryGateway.broadcastInventoryUpdate(projectId, {
      type: 'stock_transfer',
      item: saved,
      movement,
      projectId,
    });

    this.inventoryGateway.broadcastStockMovement(projectId, {
      type: 'stock_transfer',
      item: saved,
      movement,
      quantity: 0,
      projectId,
    });

    await this.auditLogsService.log({
      userId,
      action: 'transfer',
      entityType: 'stock_item',
      entityId: saved.id,
      before,
      after: {
        stockStatus: saved.stockStatus,
        location: saved.location,
        allocationTarget: saved.allocationTarget,
      },
    });

    return saved;
  }

  async applyReceipt(receipt: GoodsReceipt, userId: string): Promise<void> {
    for (const item of receipt.items ?? []) {
      await this.applyReceiptItem(
        receipt.purchaseOrder.projectId,
        item,
        receipt.id,
        receipt.destinationType,
        receipt.destinationLabel,
        userId,
      );
    }

    await this.auditLogsService.log({
      userId,
      action: 'receive',
      entityType: 'goods_receipt',
      entityId: receipt.id,
      after: receipt as unknown as object,
    });
  }

  private async applyReceiptItem(
    projectId: string,
    item: GoodsReceiptItem,
    receiptId: string,
    destinationType: GoodsReceiptDestinationType,
    destinationLabel: string | null,
    userId: string,
  ): Promise<void> {
    const normalizedDestinationLabel = destinationLabel?.trim() || null;
    const targetStatus =
      destinationType === GoodsReceiptDestinationType.SITE
        ? StockStatus.ALLOCATED_TO_SITE
        : StockStatus.AVAILABLE_IN_STORE;
    const targetLocation =
      destinationType === GoodsReceiptDestinationType.SITE
        ? normalizedDestinationLabel || 'Site'
        : normalizedDestinationLabel || 'Main Store';
    const targetAllocation =
      destinationType === GoodsReceiptDestinationType.SITE
        ? normalizedDestinationLabel
        : null;
    const existingStock = (await this.stockRepo.findOne({
      where: {
        projectId,
        name: item.name,
        unit: item.unit,
        stockStatus: targetStatus,
        location: targetLocation,
        allocationTarget: targetAllocation ?? undefined,
      },
    })) as unknown as StockItem | null;
    const stock =
      existingStock ??
      ({
        projectId,
        name: item.name,
        unit: item.unit,
        currentQuantity: 0,
        reorderLevel: 0,
        location: null,
        stockStatus: StockStatus.AVAILABLE_IN_STORE,
        allocationTarget: null,
        notes: null,
      } as StockItem);

    const acceptedQuantity = Number(item.acceptedQuantity);
    const oldQuantity = Number(stock.currentQuantity);
    stock.currentQuantity = Number(stock.currentQuantity) + acceptedQuantity;
    stock.stockStatus = targetStatus;
    stock.location = targetLocation;
    stock.allocationTarget = targetAllocation;
    const saved = await this.stockRepo.save(stock);

    const movement = await this.movementsRepo.save(
      this.movementsRepo.create({
        stockItemId: saved.id,
        type: StockMovementType.IN,
        quantity: acceptedQuantity,
        referenceType: 'goods_receipt',
        referenceId: receiptId,
        notes:
          item.notes ??
          `Received into ${destinationType}${
            targetLocation ? `: ${targetLocation}` : ''
          }`,
        createdById: userId,
      } as any) as any,
    );

    // Emit WebSocket events
    this.inventoryGateway.broadcastInventoryUpdate(projectId, {
      type: 'goods_receipt',
      item: saved,
      movement,
      oldQuantity,
      newQuantity: stock.currentQuantity,
      projectId,
      receiptId,
    });

    this.inventoryGateway.broadcastStockMovement(projectId, {
      type: 'stock_in',
      item: saved,
      movement,
      quantity: acceptedQuantity,
      projectId,
    });

    // Check for stock level changes
    const wasLowStock = oldQuantity <= stock.reorderLevel;
    const isLowStock = stock.currentQuantity <= stock.reorderLevel;

    if (!wasLowStock && isLowStock) {
      this.inventoryGateway.broadcastLowStockAlert({
        type: 'low_stock',
        item: saved,
        projectId,
        currentQuantity: stock.currentQuantity,
        reorderLevel: stock.reorderLevel,
      });
    }
  }
}
