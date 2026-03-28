import {
  BadRequestException,
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
import { MaterialRequest } from '../material-requests/entities/material-request.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly ordersRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly orderItemsRepo: Repository<PurchaseOrderItem>,
    @InjectRepository(Supplier)
    private readonly suppliersRepo: Repository<Supplier>,
    @InjectRepository(MaterialRequest)
    private readonly requestsRepo: Repository<MaterialRequest>,
    private readonly projectsService: ProjectsService,
    private readonly auditLogsService: AuditLogsService,
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

  private async getOrderOrThrow(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<PurchaseOrder> {
    const order = await this.ordersRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Purchase order not found');
    await this.projectsService.findOne(order.projectId, userId, role);
    return order;
  }

  private generateOrderNumber(): string {
    return `PO-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
  }

  private normalizeItems(items: CreatePurchaseOrderDto['items']) {
    return items.map((item) => ({
      name: item.name.trim(),
      description: item.description?.trim() || null,
      quantity: Number(item.quantity),
      unit: item.unit.trim(),
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.quantity) * Number(item.unitPrice),
      notes: item.notes?.trim() || null,
    }));
  }

  async create(
    projectId: string,
    dto: CreatePurchaseOrderDto,
    userId: string,
    role: UserRole,
  ): Promise<PurchaseOrder> {
    await this.projectsService.findOne(projectId, userId, role);

    const supplier = await this.suppliersRepo.findOne({
      where: { id: dto.supplierId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    if (!dto.items?.length) {
      throw new BadRequestException('At least one order item is required');
    }

    if (dto.materialRequestId) {
      const request = await this.requestsRepo.findOne({
        where: { id: dto.materialRequestId },
      });
      if (!request) throw new NotFoundException('Material request not found');
      if (request.projectId !== projectId) {
        throw new ConflictException(
          'Material request does not belong to this project',
        );
      }
    }

    const items = this.normalizeItems(dto.items);
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.lineTotal),
      0,
    );
    const taxAmount = Number(dto.taxAmount ?? 0);

    const order = this.ordersRepo.create({
      projectId,
      supplierId: dto.supplierId,
      materialRequestId: dto.materialRequestId ?? null,
      orderNumber: this.generateOrderNumber(),
      title: dto.title?.trim() || null,
      notes: dto.notes?.trim() || null,
      status: PurchaseOrderStatus.PENDING_APPROVAL,
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
      requestedById: userId,
      items: items as any,
    } as any);

    const created = await this.ordersRepo.save(order as any);
    await this.auditLogsService.log({
      userId,
      action: 'create',
      entityType: 'purchase_order',
      entityId: created.id,
      after: created as unknown as object,
    });
    return created;
  }

  async findByProject(
    projectId: string,
    userId: string,
    role: UserRole,
  ): Promise<PurchaseOrder[]> {
    await this.projectsService.findOne(projectId, userId, role);
    return this.ordersRepo.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<PurchaseOrder> {
    const order = await this.ordersRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Purchase order not found');
    await this.projectsService.findOne(order.projectId, userId, role);
    return order;
  }

  async approve(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<PurchaseOrder> {
    const order = await this.getOrderOrThrow(id, userId, role);
    const project = await this.projectsService.findOne(
      order.projectId,
      userId,
      role,
    );
    if (!this.canManageProject(project, userId, role)) {
      throw new ForbiddenException('Not authorized to approve purchase orders');
    }
    if (
      order.status !== PurchaseOrderStatus.PENDING_APPROVAL &&
      order.status !== PurchaseOrderStatus.DRAFT
    ) {
      throw new ConflictException(
        'Only draft or pending approval orders can be approved',
      );
    }

    await this.ordersRepo.update(id, {
      status: PurchaseOrderStatus.APPROVED,
      approvedById: userId,
    });
    const updated = await this.findOne(id, userId, role);
    await this.auditLogsService.log({
      userId,
      action: 'approve',
      entityType: 'purchase_order',
      entityId: id,
      before: order as unknown as object,
      after: updated as unknown as object,
    });
    return updated;
  }

  async send(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<PurchaseOrder> {
    const order = await this.getOrderOrThrow(id, userId, role);
    const project = await this.projectsService.findOne(
      order.projectId,
      userId,
      role,
    );
    if (!this.canManageProject(project, userId, role)) {
      throw new ForbiddenException('Not authorized to send purchase orders');
    }
    if (order.status !== PurchaseOrderStatus.APPROVED) {
      throw new ConflictException(
        'Only approved orders can be sent to suppliers',
      );
    }

    await this.ordersRepo.update(id, {
      status: PurchaseOrderStatus.SENT,
      sentAt: new Date(),
    });
    const updated = await this.findOne(id, userId, role);
    await this.auditLogsService.log({
      userId,
      action: 'send',
      entityType: 'purchase_order',
      entityId: id,
      before: order as unknown as object,
      after: updated as unknown as object,
    });
    return updated;
  }

  async cancel(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<PurchaseOrder> {
    const order = await this.getOrderOrThrow(id, userId, role);
    const project = await this.projectsService.findOne(
      order.projectId,
      userId,
      role,
    );
    if (!this.canManageProject(project, userId, role)) {
      throw new ForbiddenException('Not authorized to cancel purchase orders');
    }
    if (
      [PurchaseOrderStatus.RECEIVED, PurchaseOrderStatus.CLOSED].includes(
        order.status,
      )
    ) {
      throw new ConflictException('Completed orders cannot be cancelled');
    }

    await this.ordersRepo.update(id, { status: PurchaseOrderStatus.CANCELLED });
    const updated = await this.findOne(id, userId, role);
    await this.auditLogsService.log({
      userId,
      action: 'cancel',
      entityType: 'purchase_order',
      entityId: id,
      before: order as unknown as object,
      after: updated as unknown as object,
    });
    return updated;
  }
}
