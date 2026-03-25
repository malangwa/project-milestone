import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
  ) {}

  async create(data: Partial<Task>): Promise<Task> {
    return this.repo.save(this.repo.create(data));
  }

  async findByProject(projectId: string): Promise<Task[]> {
    return this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
  }

  async findByMilestone(milestoneId: string): Promise<Task[]> {
    return this.repo.find({ where: { milestoneId }, order: { priority: 'DESC' } });
  }

  async findOne(id: string): Promise<Task> {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Task not found');
    return t;
  }

  async update(id: string, data: Partial<Task>): Promise<Task> {
    await this.findOne(id);
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const t = await this.findOne(id);
    await this.repo.remove(t);
  }
}
