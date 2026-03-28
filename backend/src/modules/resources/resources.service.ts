import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resource } from './entities/resource.entity';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly repo: Repository<Resource>,
  ) {}

  async create(data: any): Promise<Resource> {
    return this.repo.save(this.repo.create(data) as unknown as Resource);
  }

  async findByProject(projectId: string): Promise<Resource[]> {
    return this.repo.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Resource> {
    const r = await this.repo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Resource not found');
    return r;
  }

  async update(id: string, data: any): Promise<Resource> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
