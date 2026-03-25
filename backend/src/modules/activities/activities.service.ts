import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly repo: Repository<Activity>,
  ) {}

  async log(data: Partial<Activity>): Promise<Activity> {
    return this.repo.save(this.repo.create(data));
  }

  async findByProject(projectId: string, limit = 50): Promise<Activity[]> {
    return this.repo.find({
      where: { projectId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
