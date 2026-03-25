import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, ExpenseStatus } from './entities/expense.entity';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly repo: Repository<Expense>,
  ) {}

  async create(data: Partial<Expense>): Promise<Expense> {
    return this.repo.save(this.repo.create(data));
  }

  async findByProject(projectId: string): Promise<Expense[]> {
    return this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Expense> {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Expense not found');
    return e;
  }

  async approve(id: string, approverId: string, role: UserRole): Promise<Expense> {
    if (role !== UserRole.ADMIN && role !== UserRole.MANAGER) {
      throw new ForbiddenException('Only admins and managers can approve expenses');
    }
    await this.repo.update(id, { status: ExpenseStatus.APPROVED, approvedById: approverId });
    return this.findOne(id);
  }

  async reject(id: string, approverId: string, role: UserRole): Promise<Expense> {
    if (role !== UserRole.ADMIN && role !== UserRole.MANAGER) {
      throw new ForbiddenException('Only admins and managers can reject expenses');
    }
    await this.repo.update(id, { status: ExpenseStatus.REJECTED, approvedById: approverId });
    return this.findOne(id);
  }

  async update(id: string, data: Partial<Expense>): Promise<Expense> {
    await this.findOne(id);
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const e = await this.findOne(id);
    await this.repo.remove(e);
  }
}
