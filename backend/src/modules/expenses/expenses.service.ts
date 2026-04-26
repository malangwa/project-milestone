import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, ExpenseStatus } from './entities/expense.entity';
import { Project } from '../projects/entities/project.entity';
import { UserRole } from '../users/entities/user.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AgentClient } from '../ai-agent/agent-client';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly repo: Repository<Expense>,
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
    private readonly auditLogsService: AuditLogsService,
    @Optional() private readonly agentClient?: AgentClient,
  ) {}

  async create(data: any): Promise<Expense> {
    const created = await this.repo.save(
      this.repo.create(data) as unknown as Expense,
    );
    await this.auditLogsService.log({
      userId: created.submittedById,
      action: 'create',
      entityType: 'expense',
      entityId: created.id,
      after: created as unknown as object,
    });
    return created;
  }

  async findByProject(projectId: string): Promise<Expense[]> {
    return this.repo.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Expense> {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Expense not found');
    return e;
  }

  private async isProjectOwner(
    expenseId: string,
    userId: string,
  ): Promise<boolean> {
    const expense = await this.findOne(expenseId);
    const project = await this.projectsRepo.findOne({
      where: { id: expense.projectId },
    });
    return project?.ownerId === userId;
  }

  async approve(
    id: string,
    approverId: string,
    role: UserRole,
  ): Promise<Expense> {
    const allowed =
      role === UserRole.ADMIN ||
      role === UserRole.MANAGER ||
      (await this.isProjectOwner(id, approverId));
    if (!allowed)
      throw new ForbiddenException('Not authorized to approve expenses');
    const before = await this.findOne(id);
    await this.repo.update(id, {
      status: ExpenseStatus.APPROVED,
      approvedById: approverId,
    });
    const updated = await this.findOne(id);
    await this.auditLogsService.log({
      userId: approverId,
      action: 'approve',
      entityType: 'expense',
      entityId: id,
      before: before as unknown as object,
      after: updated as unknown as object,
    });

    const agentToken = process.env.AI_AGENT_TOKEN;
    const room = process.env.AI_AGENT_ROOM || 'main-room';
    if (this.agentClient && agentToken) {
      this.agentClient.init(agentToken, room);
      this.agentClient.event({
        event_type: 'expense_approved',
        invoice_id: updated.id,
        amount: Number(updated.amount),
        payment_method: 'Mobile',
        title: updated.title,
        category: updated.category,
        project_id: updated.projectId,
        approved_by: approverId,
      }).catch(() => {});
    }

    return updated;
  }

  async reject(
    id: string,
    approverId: string,
    role: UserRole,
  ): Promise<Expense> {
    const allowed =
      role === UserRole.ADMIN ||
      role === UserRole.MANAGER ||
      (await this.isProjectOwner(id, approverId));
    if (!allowed)
      throw new ForbiddenException('Not authorized to reject expenses');
    const before = await this.findOne(id);
    await this.repo.update(id, {
      status: ExpenseStatus.REJECTED,
      approvedById: approverId,
    });
    const updated = await this.findOne(id);
    await this.auditLogsService.log({
      userId: approverId,
      action: 'reject',
      entityType: 'expense',
      entityId: id,
      before: before as unknown as object,
      after: updated as unknown as object,
    });
    return updated;
  }

  async update(id: string, data: any, userId?: string, role?: UserRole): Promise<Expense> {
    const expense = await this.findOne(id);
    const isAdminOrManager = role === UserRole.ADMIN || role === UserRole.MANAGER;
    const isOwnPending = expense.submittedById === userId && expense.status === ExpenseStatus.PENDING;
    if (!isAdminOrManager && !isOwnPending) {
      throw new ForbiddenException('Not authorized to update this expense');
    }
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string, userId?: string, role?: UserRole): Promise<void> {
    const e = await this.findOne(id);
    const isAdminOrManager = role === UserRole.ADMIN || role === UserRole.MANAGER;
    const isOwnPending = e.submittedById === userId && e.status === ExpenseStatus.PENDING;
    if (!isAdminOrManager && !isOwnPending) {
      throw new ForbiddenException('Not authorized to delete this expense');
    }
    await this.repo.remove(e);
  }
}
