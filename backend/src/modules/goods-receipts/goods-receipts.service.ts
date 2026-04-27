import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectsService } from '../projects/projects.service';
import { Project } from '../projects/entities/project.entity';
import { UserRole } from '../users/entities/user.entity';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from '../purchase-orders/entities/purchase-order.entity';
import { InventoryService } from '../inventory/inventory.service';
import {
  MaterialRequest,
  MaterialRequestStatus,
} from '../material-requests/entities/material-request.entity';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import {
  GoodsReceipt,
  GoodsReceiptDestinationType,
  GoodsReceiptStatus,
} from './entities/goods-receipt.entity';
import { GoodsReceiptItem } from './entities/goods-receipt-item.entity';

@Injectable()
export class GoodsReceiptsService {
  constructor(
    @InjectRepository(GoodsReceipt)
    private readonly receiptsRepo: Repository<GoodsReceipt>,
    @InjectRepository(GoodsReceiptItem)
    private readonly receiptItemsRepo: Repository<GoodsReceiptItem>,
    @InjectRepository(PurchaseOrder)
    private readonly ordersRepo: Repository<PurchaseOrder>,
    @InjectRepository(MaterialRequest)
    private readonly requestsRepo: Repository<MaterialRequest>,
    private readonly projectsService: ProjectsService,
    private readonly inventoryService: InventoryService,
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

  private async getReceiptOrThrow(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<GoodsReceipt> {
    const receipt = await this.receiptsRepo.findOne({ where: { id } });
    if (!receipt) throw new NotFoundException('Goods receipt not found');
    await this.projectsService.findOne(
      receipt.purchaseOrder.projectId,
      userId,
      role,
    );
    return receipt;
  }

  async create(
    purchaseOrderId: string,
    dto: CreateGoodsReceiptDto,
    userId: string,
    role: UserRole,
  ): Promise<GoodsReceipt> {
    const order = await this.ordersRepo.findOne({
      where: { id: purchaseOrderId },
    });
    if (!order) throw new NotFoundException('Purchase order not found');
    const project = await this.projectsService.findOne(
      order.projectId,
      userId,
      role,
    );
    if (!this.canManageProject(project, userId, role)) {
      throw new ForbiddenException('Not authorized to receive goods');
    }
    if (
      ![
        PurchaseOrderStatus.APPROVED,
        PurchaseOrderStatus.SENT,
        PurchaseOrderStatus.PARTIALLY_RECEIVED,
      ].includes(order.status)
    ) {
      throw new ConflictException(
        'Purchase order must be approved before receiving goods',
      );
    }

    const items = dto.items.map((item) => {
      const receivedQuantity = Number(item.receivedQuantity);
      const damagedQuantity = Number(item.damagedQuantity ?? 0);
      const acceptedQuantity = Math.max(receivedQuantity - damagedQuantity, 0);
      const orderedQuantity = Number(item.orderedQuantity ?? receivedQuantity);
      return {
        purchaseOrderItemId: item.purchaseOrderItemId ?? null,
        name: item.name.trim(),
        unit: item.unit.trim(),
        orderedQuantity,
        receivedQuantity,
        damagedQuantity,
        acceptedQuantity,
        notes: item.notes?.trim() || null,
      };
    });

    const receipt = this.receiptsRepo.create({
      purchaseOrderId,
      receivedById: userId,
      notes: dto.notes?.trim() || null,
      destinationType:
        dto.destinationType ?? GoodsReceiptDestinationType.STORE,
      destinationLabel: dto.destinationLabel?.trim() || null,
      status: items.some((item) => item.acceptedQuantity < item.orderedQuantity)
        ? GoodsReceiptStatus.PARTIAL
        : GoodsReceiptStatus.COMPLETED,
      items: items as any,
    } as any);

    const saved = (await this.receiptsRepo.save(
      receipt as any,
    )) as GoodsReceipt;
    await this.inventoryService.applyReceipt(saved, userId);

    await this.ordersRepo.update(order.id, {
      status:
        saved.status === GoodsReceiptStatus.COMPLETED
          ? PurchaseOrderStatus.RECEIVED
          : PurchaseOrderStatus.PARTIALLY_RECEIVED,
    });

    // Cascade: if this PO is linked to a material request and the order is now
    // fully received, mark the request as RECEIVED.
    if (
      order.materialRequestId &&
      saved.status === GoodsReceiptStatus.COMPLETED
    ) {
      await this.requestsRepo.update(order.materialRequestId, {
        status: MaterialRequestStatus.RECEIVED,
      });
    }

    return this.findOne(saved.id, userId, role);
  }

  async findByPurchaseOrder(
    purchaseOrderId: string,
    userId: string,
    role: UserRole,
  ): Promise<GoodsReceipt[]> {
    const order = await this.ordersRepo.findOne({
      where: { id: purchaseOrderId },
    });
    if (!order) throw new NotFoundException('Purchase order not found');
    await this.projectsService.findOne(order.projectId, userId, role);
    return this.receiptsRepo.find({
      where: { purchaseOrderId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<GoodsReceipt> {
    const receipt = await this.receiptsRepo.findOne({ where: { id } });
    if (!receipt) throw new NotFoundException('Goods receipt not found');
    await this.projectsService.findOne(
      receipt.purchaseOrder.projectId,
      userId,
      role,
    );
    return receipt;
  }
}
