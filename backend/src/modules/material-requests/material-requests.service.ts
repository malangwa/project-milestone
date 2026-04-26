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
import { CreateMaterialRequestDto } from './dto/create-material-request.dto';
import {
  MaterialRequest,
  MaterialRequestStatus,
} from './entities/material-request.entity';
import { Project } from '../projects/entities/project.entity';
import { UserRole } from '../users/entities/user.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class MaterialRequestsService {
  constructor(
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

  private async getRequestOrThrow(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<MaterialRequest> {
    const request = await this.requestsRepo.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Material request not found');
    await this.projectsService.findOne(request.projectId, userId, role);
    return request;
  }

  async create(
    projectId: string,
    dto: CreateMaterialRequestDto,
    userId: string,
    role: UserRole,
  ): Promise<MaterialRequest> {
    const project = await this.projectsService.findOne(projectId, userId, role);
    const allowedRoles = [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.ENGINEER,
    ];
    if (!allowedRoles.includes(role) && project.ownerId !== userId) {
      throw new ForbiddenException(
        'Not authorized to create material requests',
      );
    }
    if (!dto.items?.length) {
      throw new BadRequestException('At least one material item is required');
    }

    const items = dto.items.map((item) => ({
      name: item.name.trim(),
      quantity: Number(item.quantity),
      unit: item.unit.trim(),
      estimatedCost: Number(item.estimatedCost),
      notes: item.notes?.trim() || null,
    }));

    const requestedAmount = items.reduce(
      (sum, item) => sum + Number(item.estimatedCost),
      0,
    );

    const request = this.requestsRepo.create({
      projectId,
      requestedById: userId,
      title: dto.title.trim(),
      purpose: dto.purpose?.trim() || null,
      notes: dto.notes?.trim() || null,
      status: MaterialRequestStatus.PENDING,
      requestedAmount,
      items: items as any,
    } as any);

    const created = await this.requestsRepo.save(request as any);
    await this.auditLogsService.log({
      userId,
      action: 'create',
      entityType: 'material_request',
      entityId: created.id,
      after: created as unknown as object,
    });
    return created;
  }

  async findByProject(
    projectId: string,
    userId: string,
    role: UserRole,
  ): Promise<MaterialRequest[]> {
    await this.projectsService.findOne(projectId, userId, role);
    return this.requestsRepo.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<MaterialRequest> {
    const request = await this.requestsRepo.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Material request not found');
    await this.projectsService.findOne(request.projectId, userId, role);
    return request;
  }

  async approve(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<MaterialRequest> {
    const request = await this.getRequestOrThrow(id, userId, role);
    const project = await this.projectsService.findOne(
      request.projectId,
      userId,
      role,
    );
    if (!this.canManageProject(project, userId, role)) {
      throw new ForbiddenException(
        'Not authorized to approve material requests',
      );
    }
    if (request.requestedById === userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('You cannot approve your own request');
    }
    if (request.status !== MaterialRequestStatus.PENDING) {
      throw new ConflictException('Only pending requests can be approved');
    }

    await this.requestsRepo.update(id, {
      status: MaterialRequestStatus.APPROVED,
      reviewedById: userId,
      reviewedAt: new Date(),
    });
    const updated = await this.findOne(id, userId, role);
    await this.auditLogsService.log({
      userId,
      action: 'approve',
      entityType: 'material_request',
      entityId: id,
      before: request as unknown as object,
      after: updated as unknown as object,
    });
    return updated;
  }

  async reject(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<MaterialRequest> {
    const request = await this.getRequestOrThrow(id, userId, role);
    const project = await this.projectsService.findOne(
      request.projectId,
      userId,
      role,
    );
    if (!this.canManageProject(project, userId, role)) {
      throw new ForbiddenException(
        'Not authorized to reject material requests',
      );
    }
    if (request.requestedById === userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('You cannot reject your own request');
    }
    if (request.status !== MaterialRequestStatus.PENDING) {
      throw new ConflictException('Only pending requests can be rejected');
    }

    await this.requestsRepo.update(id, {
      status: MaterialRequestStatus.REJECTED,
      reviewedById: userId,
      reviewedAt: new Date(),
    });
    const updated = await this.findOne(id, userId, role);
    await this.auditLogsService.log({
      userId,
      action: 'reject',
      entityType: 'material_request',
      entityId: id,
      before: request as unknown as object,
      after: updated as unknown as object,
    });
    return updated;
  }
}
