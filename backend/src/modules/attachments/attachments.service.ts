import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from './entities/attachment.entity';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly repo: Repository<Attachment>,
  ) {}

  async create(data: Partial<Attachment>): Promise<Attachment> {
    return this.repo.save(this.repo.create(data));
  }

  async findByEntity(entityType: string, entityId: string): Promise<Attachment[]> {
    return this.repo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Attachment> {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Attachment not found');
    return a;
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
