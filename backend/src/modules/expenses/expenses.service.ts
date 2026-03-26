import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, ExpenseStatus } from './entities/expense.entity';
import { Project } from '../projects/entities/project.entity';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly repo: Repository<Expense>,
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
  ) {}

  async create(data: any): Promise<Expense> {
    return this.repo.save(this.repo.create(data as any) as unknown as Expense);
  }

  async findByProject(projectId: string): Promise<Expense[]> {
    return this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Expense> {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Expense not found');
    return e;
  }

  private async isProjectOwner(expenseId: string, userId: string): Promise<boolean> {
    const expense = await this.findOne(expenseId);
    const project = await this.projectsRepo.findOne({ where: { id: expense.projectId } });
    return project?.ownerId === userId;
  }

  async approve(id: string, approverId: string, role: UserRole): Promise<Expense> {
    const allowed = role === UserRole.ADMIN || role === UserRole.MANAGER || await this.isProjectOwner(id, approverId);
    if (!allowed) throw new ForbiddenException('Not authorized to approve expenses');
    await this.repo.update(id, { status: ExpenseStatus.APPROVED, approvedById: approverId });
    return this.findOne(id);
  }

  async reject(id: string, approverId: string, role: UserRole): Promise<Expense> {
    const allowed = role === UserRole.ADMIN || role === UserRole.MANAGER || await this.isProjectOwner(id, approverId);
    if (!allowed) throw new ForbiddenException('Not authorized to reject expenses');
    await this.repo.update(id, { status: ExpenseStatus.REJECTED, approvedById: approverId });
    return this.findOne(id);
  }

  async update(id: string, data: any): Promise<Expense> {
    await this.findOne(id);
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const e = await this.findOne(id);
    await this.repo.remove(e);
  }
}
