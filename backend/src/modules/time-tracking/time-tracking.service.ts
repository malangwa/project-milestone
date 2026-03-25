import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeEntry } from './entities/time-entry.entity';

@Injectable()
export class TimeTrackingService {
  constructor(
    @InjectRepository(TimeEntry)
    private readonly repo: Repository<TimeEntry>,
  ) {}

  async create(data: any): Promise<TimeEntry> {
    return this.repo.save(this.repo.create(data as any) as unknown as TimeEntry);
  }

  async findByProject(projectId: string): Promise<TimeEntry[]> {
    return this.repo.find({
      where: { projectId },
      relations: ['user', 'task'],
      order: { date: 'DESC' },
    });
  }

  async findByUser(userId: string): Promise<TimeEntry[]> {
    return this.repo.find({
      where: { userId },
      relations: ['project', 'task'],
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string): Promise<TimeEntry> {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Time entry not found');
    return e;
  }

  async update(id: string, data: any): Promise<TimeEntry> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async totalHoursByProject(projectId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('te')
      .select('SUM(te.hours)', 'total')
      .where('te.projectId = :projectId', { projectId })
      .getRawOne();
    return parseFloat(result?.total ?? '0');
  }
}
