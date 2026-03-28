import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Milestone } from './entities/milestone.entity';

@Injectable()
export class MilestonesService {
  constructor(
    @InjectRepository(Milestone)
    private readonly repo: Repository<Milestone>,
  ) {}

  async create(data: any): Promise<Milestone> {
    return this.repo.save(this.repo.create(data) as unknown as Milestone);
  }

  async findByProject(projectId: string): Promise<Milestone[]> {
    return this.repo.find({ where: { projectId }, order: { dueDate: 'ASC' } });
  }

  async findOne(id: string): Promise<Milestone> {
    const m = await this.repo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Milestone not found');
    return m;
  }

  async update(id: string, data: any): Promise<Milestone> {
    await this.findOne(id);
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const m = await this.findOne(id);
    await this.repo.remove(m);
  }
}
