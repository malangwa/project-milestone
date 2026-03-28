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
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import {
  SupplierInvoice,
  SupplierInvoiceStatus,
} from './entities/supplier-invoice.entity';
import { CreateSupplierInvoiceDto } from './dto/create-supplier-invoice.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class SupplierInvoicesService {
  constructor(
    @InjectRepository(SupplierInvoice)
    private readonly invoicesRepo: Repository<SupplierInvoice>,
    @InjectRepository(PurchaseOrder)
    private readonly ordersRepo: Repository<PurchaseOrder>,
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

  private async getInvoiceOrThrow(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<SupplierInvoice> {
    const invoice = await this.invoicesRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Supplier invoice not found');
    await this.projectsService.findOne(
      invoice.purchaseOrder.projectId,
      userId,
      role,
    );
    return invoice;
  }

  async create(
    purchaseOrderId: string,
    dto: CreateSupplierInvoiceDto,
    userId: string,
    role: UserRole,
  ): Promise<SupplierInvoice> {
    const order = await this.ordersRepo.findOne({
      where: { id: purchaseOrderId },
    });
    if (!order) throw new NotFoundException('Purchase order not found');
    await this.projectsService.findOne(order.projectId, userId, role);

    const subtotal = Number(dto.subtotal);
    const taxAmount = Number(dto.taxAmount ?? 0);
    const totalAmount = Number(dto.totalAmount ?? subtotal + taxAmount);

    const created = await this.invoicesRepo.save(
      this.invoicesRepo.create({
        purchaseOrderId,
        supplierId: order.supplierId,
        invoiceNumber: dto.invoiceNumber.trim(),
        invoiceDate: dto.invoiceDate,
        dueDate: dto.dueDate ?? null,
        subtotal,
        taxAmount,
        totalAmount,
        notes: dto.notes?.trim() || null,
        fileUrl: dto.fileUrl?.trim() || null,
        status: SupplierInvoiceStatus.RECEIVED,
      } as any) as any,
    );
    await this.auditLogsService.log({
      userId,
      action: 'create',
      entityType: 'supplier_invoice',
      entityId: created.id,
      after: created as unknown as object,
    });
    return created;
  }

  async findByPurchaseOrder(
    purchaseOrderId: string,
    userId: string,
    role: UserRole,
  ): Promise<SupplierInvoice[]> {
    const order = await this.ordersRepo.findOne({
      where: { id: purchaseOrderId },
    });
    if (!order) throw new NotFoundException('Purchase order not found');
    await this.projectsService.findOne(order.projectId, userId, role);
    return this.invoicesRepo.find({
      where: { purchaseOrderId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<SupplierInvoice> {
    const invoice = await this.invoicesRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Supplier invoice not found');
    await this.projectsService.findOne(
      invoice.purchaseOrder.projectId,
      userId,
      role,
    );
    return invoice;
  }

  async verify(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<SupplierInvoice> {
    const invoice = await this.getInvoiceOrThrow(id, userId, role);
    const project = await this.projectsService.findOne(
      invoice.purchaseOrder.projectId,
      userId,
      role,
    );
    if (!this.canManageProject(project, userId, role)) {
      throw new ForbiddenException('Not authorized to verify invoices');
    }
    if (invoice.status !== SupplierInvoiceStatus.RECEIVED) {
      throw new ConflictException('Only received invoices can be verified');
    }
    await this.invoicesRepo.update(id, {
      status: SupplierInvoiceStatus.VERIFIED,
      verifiedById: userId,
    });
    const updated = await this.findOne(id, userId, role);
    await this.auditLogsService.log({
      userId,
      action: 'verify',
      entityType: 'supplier_invoice',
      entityId: id,
      before: invoice as unknown as object,
      after: updated as unknown as object,
    });
    return updated;
  }

  async approve(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<SupplierInvoice> {
    const invoice = await this.getInvoiceOrThrow(id, userId, role);
    const project = await this.projectsService.findOne(
      invoice.purchaseOrder.projectId,
      userId,
      role,
    );
    if (!this.canManageProject(project, userId, role)) {
      throw new ForbiddenException('Not authorized to approve invoices');
    }
    if (
      invoice.status !== SupplierInvoiceStatus.VERIFIED &&
      invoice.status !== SupplierInvoiceStatus.RECEIVED
    ) {
      throw new ConflictException(
        'Only received or verified invoices can be approved',
      );
    }
    await this.invoicesRepo.update(id, {
      status: SupplierInvoiceStatus.APPROVED,
      approvedById: userId,
    });
    const updated = await this.findOne(id, userId, role);
    await this.auditLogsService.log({
      userId,
      action: 'approve',
      entityType: 'supplier_invoice',
      entityId: id,
      before: invoice as unknown as object,
      after: updated as unknown as object,
    });
    return updated;
  }

  async pay(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<SupplierInvoice> {
    const invoice = await this.getInvoiceOrThrow(id, userId, role);
    const project = await this.projectsService.findOne(
      invoice.purchaseOrder.projectId,
      userId,
      role,
    );
    if (!this.canManageProject(project, userId, role)) {
      throw new ForbiddenException('Not authorized to mark invoices as paid');
    }
    if (invoice.status !== SupplierInvoiceStatus.APPROVED) {
      throw new ConflictException('Only approved invoices can be paid');
    }
    await this.invoicesRepo.update(id, {
      status: SupplierInvoiceStatus.PAID,
      paidAt: new Date(),
    });
    const updated = await this.findOne(id, userId, role);
    await this.auditLogsService.log({
      userId,
      action: 'pay',
      entityType: 'supplier_invoice',
      entityId: id,
      before: invoice as unknown as object,
      after: updated as unknown as object,
    });
    return updated;
  }

  async reject(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<SupplierInvoice> {
    const invoice = await this.getInvoiceOrThrow(id, userId, role);
    const project = await this.projectsService.findOne(
      invoice.purchaseOrder.projectId,
      userId,
      role,
    );
    if (!this.canManageProject(project, userId, role)) {
      throw new ForbiddenException('Not authorized to reject invoices');
    }
    if (invoice.status === SupplierInvoiceStatus.PAID) {
      throw new ConflictException('Paid invoices cannot be rejected');
    }
    await this.invoicesRepo.update(id, {
      status: SupplierInvoiceStatus.REJECTED,
    });
    const updated = await this.findOne(id, userId, role);
    await this.auditLogsService.log({
      userId,
      action: 'reject',
      entityType: 'supplier_invoice',
      entityId: id,
      before: invoice as unknown as object,
      after: updated as unknown as object,
    });
    return updated;
  }
}
