import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from './entities/unit.entity';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(Unit)
    private readonly repo: Repository<Unit>,
  ) {}

  async create(data: Partial<Unit>): Promise<Unit> {
    return this.repo.save(this.repo.create(data));
  }

  async findAll(): Promise<Unit[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Unit> {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('Unit not found');
    return u;
  }

  async update(id: string, data: Partial<Unit>): Promise<Unit> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
